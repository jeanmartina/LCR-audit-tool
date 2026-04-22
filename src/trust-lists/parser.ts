import { createHash } from "node:crypto";
import { DOMParser } from "@xmldom/xmldom";
import * as xpath from "xpath";
import { normalizeCertificatePem } from "../inventory/certificate-admin";
import type { ParsedTrustListDocument, TrustListCertificateCandidate } from "./types";

function textContent(node: Node | null | undefined): string | null {
  const value = node?.textContent?.trim();
  return value ? value : null;
}

function selectOne(doc: ReturnType<DOMParser["parseFromString"]>, localNames: string[]): string | null {
  for (const localName of localNames) {
    const node = xpath.select1(`//*[local-name()='${localName}']`, doc as unknown as Node) as Node | null;
    const value = textContent(node);
    if (value) return value;
  }
  return null;
}

function normalizeBase64Certificate(value: string): string {
  return normalizeCertificatePem(Buffer.from(value.replace(/\s+/g, ""), "base64"));
}

function parseXml(xml: string): ReturnType<DOMParser["parseFromString"]> {
  const errors: string[] = [];
  const parser = new DOMParser({
    onError: (_level, message) => errors.push(String(message)),
  });
  const doc = parser.parseFromString(xml, "text/xml");
  const parserError = xpath.select1("//*[local-name()='parsererror']", doc as unknown as Node) as Node | null;
  if (errors.length > 0 || parserError) {
    throw new Error(`trust-list-xml-parse-failed:${errors[0] ?? textContent(parserError) ?? "invalid-xml"}`);
  }
  return doc;
}

function assertTrustedListShape(doc: ReturnType<DOMParser["parseFromString"]>): void {
  const rootName = doc.documentElement?.localName ?? doc.documentElement?.nodeName ?? "";
  const hasTrustServiceProviderList = Boolean(
    xpath.select1("//*[local-name()='TrustServiceProviderList']", doc as unknown as Node)
  );
  if (!/Trust/i.test(rootName) && !hasTrustServiceProviderList) {
    throw new Error("trust-list-root-not-supported");
  }
}

function extractCertificates(doc: ReturnType<DOMParser["parseFromString"]>): TrustListCertificateCandidate[] {
  const nodes = xpath.select("//*[local-name()='X509Certificate']", doc as unknown as Node) as Node[];
  const seen = new Set<string>();
  const certificates: TrustListCertificateCandidate[] = [];

  nodes.forEach((node, index) => {
    let parent = node.parentNode;
    while (parent) {
      if ((parent as Element).localName === "Signature") return;
      parent = parent.parentNode;
    }
    const raw = textContent(node);
    if (!raw) return;
    try {
      const pem = normalizeBase64Certificate(raw);
      const digest = createHash("sha256").update(pem).digest("hex");
      if (seen.has(digest)) return;
      seen.add(digest);
      certificates.push({
        ordinal: certificates.length + 1,
        pem,
        subjectSummary: null,
        sourcePath: `//*[local-name()='X509Certificate'][${index + 1}]`,
      });
    } catch {
      // Some signatures include non-importable cert payloads; sync records supported import results separately.
    }
  });

  return certificates;
}

export function parseTrustListXml(payload: string | Buffer | Uint8Array): ParsedTrustListDocument {
  const xml = Buffer.isBuffer(payload) ? payload.toString("utf8") : Buffer.from(payload).toString("utf8");
  if (!xml.trim()) throw new Error("trust-list-empty-xml");

  const doc = parseXml(xml);
  assertTrustedListShape(doc);
  const digestSha256 = createHash("sha256").update(xml).digest("hex");
  const sequenceNumber = selectOne(doc, ["TSLSequenceNumber", "SequenceNumber"]);
  const territory = selectOne(doc, ["SchemeTerritory", "Territory"]);
  const issueDate = selectOne(doc, ["ListIssueDateTime", "IssueDate", "IssueDateTime"]);
  const nextUpdate = selectOne(doc, ["NextUpdate", "NextUpdateDateTime"]);

  if (!sequenceNumber && !territory && !issueDate && !nextUpdate) {
    throw new Error("trust-list-metadata-not-found");
  }

  return {
    digestSha256,
    xmlSizeBytes: Buffer.byteLength(xml),
    sequenceNumber,
    territory,
    issueDate,
    nextUpdate,
    certificates: extractCertificates(doc),
  };
}
