import { X509Certificate } from "node:crypto";
import { buildMonitoringSourceKey, normalizeMonitoringSourceUrl } from "./model";
import { upsertMonitoringSourceRecord } from "../storage/runtime-store";
import type { MonitoringSourceProvenanceInput, MonitoringSourceRecord } from "./types";

export interface MonitoringSourceDerivationInput {
  certificateId: string;
  fingerprint: string;
  pemText: string;
  trustListSourceId?: string | null;
  trustListSnapshotId?: string | null;
  trustListRunId?: string | null;
}

export interface MonitoringSourceUpsertSummary {
  discovered: number;
  notDiscovered: number;
  notCheckable: number;
  disabled: number;
}

interface Asn1Node {
  tag: number;
  value: Uint8Array;
  children: Asn1Node[];
}

const OID_AUTHORITY_INFO_ACCESS = "1.3.6.1.5.5.7.1.1";
const OID_AD_OCSP = "1.3.6.1.5.5.7.48.1";
const OID_CERTIFICATE_POLICIES = "2.5.29.32";
const OID_CPS_QUALIFIER = "1.3.6.1.5.5.7.2.1";

function readLength(data: Uint8Array, offset: number): { length: number; offset: number } {
  const first = data[offset];
  if (first === undefined) throw new Error("truncated-asn1-length");
  if ((first & 0x80) === 0) return { length: first, offset: offset + 1 };
  const count = first & 0x7f;
  if (count === 0 || count > 4) throw new Error("unsupported-asn1-length");
  let length = 0;
  for (let index = 0; index < count; index += 1) {
    const byte = data[offset + 1 + index];
    if (byte === undefined) throw new Error("truncated-asn1-length");
    length = (length << 8) | byte;
  }
  return { length, offset: offset + 1 + count };
}

function parseNode(data: Uint8Array, offset: number): { node: Asn1Node; offset: number } {
  const tag = data[offset];
  if (tag === undefined) throw new Error("truncated-asn1-tag");
  const lengthResult = readLength(data, offset + 1);
  const valueStart = lengthResult.offset;
  const valueEnd = valueStart + lengthResult.length;
  if (valueEnd > data.length) throw new Error("truncated-asn1-value");
  const value = data.slice(valueStart, valueEnd);
  const constructed = (tag & 0x20) === 0x20;
  return {
    node: {
      tag,
      value,
      children: constructed ? parseChildren(value) : [],
    },
    offset: valueEnd,
  };
}

function parseChildren(data: Uint8Array): Asn1Node[] {
  const nodes: Asn1Node[] = [];
  let offset = 0;
  while (offset < data.length) {
    const parsed = parseNode(data, offset);
    nodes.push(parsed.node);
    offset = parsed.offset;
  }
  return nodes;
}

function decodeOid(value: Uint8Array): string {
  if (value.length === 0) throw new Error("empty-oid");
  const parts = [Math.floor(value[0] / 40), value[0] % 40];
  let current = 0;
  for (let index = 1; index < value.length; index += 1) {
    current = (current << 7) | (value[index] & 0x7f);
    if ((value[index] & 0x80) === 0) {
      parts.push(current);
      current = 0;
    }
  }
  return parts.join(".");
}

function decodeAscii(value: Uint8Array): string {
  return Buffer.from(value).toString("ascii");
}

function findCertificateExtensions(der: Uint8Array): Asn1Node[] {
  const certificate = parseNode(der, 0).node;
  const tbsCertificate = certificate.children[0];
  if (!tbsCertificate) return [];
  const extensionsWrapper = tbsCertificate.children.find((child) => child.tag === 0xa3);
  const extensions = extensionsWrapper?.children.find((child) => child.tag === 0x30);
  return extensions?.children.filter((child) => child.tag === 0x30) ?? [];
}

function extractExtensionValues(der: Uint8Array): Map<string, Uint8Array[]> {
  const values = new Map<string, Uint8Array[]>();
  for (const extension of findCertificateExtensions(der)) {
    const oidNode = extension.children.find((child) => child.tag === 0x06);
    const valueNode = extension.children.find((child) => child.tag === 0x04);
    if (!oidNode || !valueNode) continue;
    const oid = decodeOid(oidNode.value);
    const current = values.get(oid) ?? [];
    current.push(valueNode.value);
    values.set(oid, current);
  }
  return values;
}

function extractOcspUrls(extensionValues: Uint8Array[]): string[] {
  const urls: string[] = [];
  for (const value of extensionValues) {
    const accessDescriptions = parseNode(value, 0).node.children;
    for (const description of accessDescriptions) {
      const [method, location] = description.children;
      if (!method || !location || method.tag !== 0x06) continue;
      if (decodeOid(method.value) === OID_AD_OCSP && location.tag === 0x86) {
        urls.push(decodeAscii(location.value));
      }
    }
  }
  return [...new Set(urls)];
}

function extractCpsUrls(extensionValues: Uint8Array[]): Array<{ policyOid: string | null; url: string }> {
  const documents: Array<{ policyOid: string | null; url: string }> = [];
  for (const value of extensionValues) {
    const policyNodes = parseNode(value, 0).node.children;
    for (const policyNode of policyNodes) {
      const policyOidNode = policyNode.children.find((child) => child.tag === 0x06);
      const qualifiers = policyNode.children.find((child) => child.tag === 0x30);
      if (!qualifiers) continue;
      const policyOid = policyOidNode ? decodeOid(policyOidNode.value) : null;
      for (const qualifier of qualifiers.children) {
        const [qualifierOidNode, qualifierValueNode] = qualifier.children;
        if (!qualifierOidNode || !qualifierValueNode || qualifierOidNode.tag !== 0x06) continue;
        if (decodeOid(qualifierOidNode.value) === OID_CPS_QUALIFIER && qualifierValueNode.tag === 0x16) {
          documents.push({ policyOid, url: decodeAscii(qualifierValueNode.value) });
        }
      }
    }
  }
  const seen = new Set<string>();
  return documents.filter((item) => {
    const key = `${item.policyOid ?? ""}\0${item.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function baseCandidate(
  input: MonitoringSourceDerivationInput
): Pick<
  MonitoringSourceProvenanceInput,
  "certificateId" | "fingerprint" | "trustListSourceId" | "trustListSnapshotId" | "trustListRunId"
> {
  return {
    certificateId: input.certificateId,
    fingerprint: input.fingerprint,
    trustListSourceId: input.trustListSourceId ?? null,
    trustListSnapshotId: input.trustListSnapshotId ?? null,
    trustListRunId: input.trustListRunId ?? null,
  };
}

function dedupeCandidates(
  candidates: MonitoringSourceProvenanceInput[]
): MonitoringSourceProvenanceInput[] {
  const deduped = new Map<string, MonitoringSourceProvenanceInput>();
  for (const candidate of candidates) {
    const key = buildMonitoringSourceKey({
      fingerprint: candidate.fingerprint,
      sourceType: candidate.sourceType,
      normalizedUrl: candidate.normalizedUrl,
      documentRole: candidate.documentRole,
      policyOid: candidate.policyOid,
    });
    deduped.set(key, candidate);
  }
  return [...deduped.values()];
}

function notCheckableCandidates(
  input: MonitoringSourceDerivationInput,
  reason: string
): MonitoringSourceProvenanceInput[] {
  const common = baseCandidate(input);
  const derivationReason = `certificate-extension-parse-failed:${reason}`;
  return [
    {
      ...common,
      sourceType: "ocsp",
      sourceUrl: null,
      normalizedUrl: null,
      documentRole: null,
      policyOid: null,
      state: "not_checkable",
      derivationReason,
    },
    {
      ...common,
      sourceType: "policy-document",
      sourceUrl: null,
      normalizedUrl: null,
      documentRole: "unknown-policy-document",
      policyOid: null,
      state: "not_checkable",
      derivationReason,
    },
  ];
}

export function deriveMonitoringSourceCandidatesFromCertificate(
  input: MonitoringSourceDerivationInput
): MonitoringSourceProvenanceInput[] {
  try {
    const certificate = new X509Certificate(input.pemText);
    const extensions = extractExtensionValues(certificate.raw);
    const common = baseCandidate(input);
    const candidates: MonitoringSourceProvenanceInput[] = [];

    const ocspUrls = extractOcspUrls(extensions.get(OID_AUTHORITY_INFO_ACCESS) ?? []);
    if (ocspUrls.length === 0) {
      candidates.push({
        ...common,
        sourceType: "ocsp",
        sourceUrl: null,
        normalizedUrl: null,
        documentRole: null,
        policyOid: null,
        state: "not_discovered",
        derivationReason: "aia-ocsp-missing",
      });
    } else {
      for (const url of ocspUrls) {
        candidates.push({
          ...common,
          sourceType: "ocsp",
          sourceUrl: url,
          normalizedUrl: normalizeMonitoringSourceUrl(url),
          documentRole: null,
          policyOid: null,
          state: "discovered",
          derivationReason: "aia-ocsp",
        });
      }
    }

    const cpsUrls = extractCpsUrls(extensions.get(OID_CERTIFICATE_POLICIES) ?? []);
    if (cpsUrls.length === 0) {
      candidates.push({
        ...common,
        sourceType: "policy-document",
        sourceUrl: null,
        normalizedUrl: null,
        documentRole: "unknown-policy-document",
        policyOid: null,
        state: "not_discovered",
        derivationReason: "policy-document-url-missing",
      });
    } else {
      for (const document of cpsUrls) {
        candidates.push({
          ...common,
          sourceType: "policy-document",
          sourceUrl: document.url,
          normalizedUrl: normalizeMonitoringSourceUrl(document.url),
          documentRole: "cps",
          policyOid: document.policyOid,
          state: "discovered",
          derivationReason: "certificate-policies-cps-uri",
        });
      }
    }

    return dedupeCandidates(candidates);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown";
    return notCheckableCandidates(input, reason);
  }
}

export async function deriveAndUpsertMonitoringSourcesForCertificate(
  input: MonitoringSourceDerivationInput
): Promise<MonitoringSourceUpsertSummary> {
  const summary: MonitoringSourceUpsertSummary = {
    discovered: 0,
    notDiscovered: 0,
    notCheckable: 0,
    disabled: 0,
  };
  const candidates = deriveMonitoringSourceCandidatesFromCertificate(input);
  for (const candidate of candidates) {
    const record: MonitoringSourceRecord = await upsertMonitoringSourceRecord(candidate);
    if (record.state === "discovered") summary.discovered += 1;
    if (record.state === "not_discovered") summary.notDiscovered += 1;
    if (record.state === "not_checkable") summary.notCheckable += 1;
    if (record.state === "disabled") summary.disabled += 1;
  }
  return summary;
}
