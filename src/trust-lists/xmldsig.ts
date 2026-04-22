import { DOMParser } from "@xmldom/xmldom";
import * as xpath from "xpath";
import { SignedXml } from "xml-crypto";
import type { XmlSignatureValidationResult } from "./types";

function ensurePemCertificate(value: string): string {
  const normalized = value.replace(/\s+/g, "");
  const lines = normalized.match(/.{1,64}/g) ?? [];
  return `-----BEGIN CERTIFICATE-----\n${lines.join("\n")}\n-----END CERTIFICATE-----\n`;
}

function firstCertificateFromSignature(signatureNode: Node): string | null {
  const certNode = xpath.select1(".//*[local-name()='X509Certificate']", signatureNode) as Node | null;
  const value = certNode?.textContent?.trim();
  return value ? ensurePemCertificate(value) : null;
}

export function validateTrustListXmlSignature(xml: string): XmlSignatureValidationResult {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const signature = xpath.select1(
    "//*[local-name()='Signature' and namespace-uri()='http://www.w3.org/2000/09/xmldsig#']",
    doc as unknown as Node
  ) as Node | null;

  if (!signature) {
    return { valid: false, reason: "xml-signature-missing" };
  }

  const signerCertificatePem = firstCertificateFromSignature(signature);
  const verifier = new SignedXml({ publicCert: signerCertificatePem ?? undefined });

  try {
    verifier.loadSignature(signature);
    const valid = verifier.checkSignature(xml);
    return valid
      ? { valid: true, signerCertificatePem }
      : { valid: false, reason: "xml-signature-invalid", signerCertificatePem };
  } catch (error) {
    return {
      valid: false,
      reason: `xml-signature-validation-error:${error instanceof Error ? error.message : String(error)}`,
      signerCertificatePem,
    };
  }
}
