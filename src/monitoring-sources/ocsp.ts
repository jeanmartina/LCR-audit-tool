import { createHash, webcrypto, X509Certificate } from "node:crypto";
import * as asn1js from "asn1js";
import * as pkijs from "pkijs";
import { fetchOcspResponseBytes } from "./fetch-safety";
import type { OcspCheckEventStatus, OcspParseStatus } from "./ocsp-types";
import type { MonitoringSourceRecord } from "./types";
import {
  findCertificateById,
  listCertificateRecords,
  recordOcspCheckEvent,
  recordOcspResponseEvidence,
  type CertificateRecord,
} from "../storage/runtime-store";

export interface CheckOcspSourceResult {
  eventId: string;
  evidenceId: string | null;
  status: OcspCheckEventStatus;
  responseSha256: string | null;
}

let pkijsConfigured = false;

export function configurePkijsEngine(): void {
  if (pkijsConfigured) return;
  const crypto = webcrypto as unknown as Crypto;
  pkijs.setEngine("node-webcrypto", crypto, crypto.subtle);
  pkijsConfigured = true;
}

function toExactArrayBuffer(body: Buffer): ArrayBuffer {
  return new Uint8Array(body).slice().buffer;
}

function sha256(body: Buffer): string {
  return createHash("sha256").update(body).digest("hex");
}

function parsePkijsCertificate(pemText: string): pkijs.Certificate {
  const certificate = new X509Certificate(pemText);
  const asn1 = asn1js.fromBER(toExactArrayBuffer(certificate.raw));
  if (asn1.offset === -1) {
    throw new Error("certificate-asn1-parse-failed");
  }
  return new pkijs.Certificate({ schema: asn1.result });
}

async function findIssuerContextForSource(
  source: MonitoringSourceRecord
): Promise<{ certificate: CertificateRecord; issuer: CertificateRecord } | null> {
  const certificate = await findCertificateById(source.certificateId);
  if (!certificate) return null;

  const targetX509 = new X509Certificate(certificate.pemText);
  const candidates = await listCertificateRecords();
  for (const candidate of candidates) {
    if (candidate.id === certificate.id) continue;
    try {
      const candidateX509 = new X509Certificate(candidate.pemText);
      if (candidateX509.subject === targetX509.issuer && candidateX509.checkIssued(targetX509)) {
        return { certificate, issuer: candidate };
      }
    } catch {
      // Ignore malformed inventory entries; import validation owns their diagnosis.
    }
  }

  return null;
}

async function buildOcspRequestDer(certificatePem: string, issuerPem: string): Promise<Buffer> {
  configurePkijsEngine();
  const certificate = parsePkijsCertificate(certificatePem);
  const issuerCertificate = parsePkijsCertificate(issuerPem);
  const request = new pkijs.OCSPRequest();
  await request.createForCertificate(certificate, {
    hashAlgorithm: "SHA-256",
    issuerCertificate,
  });
  return Buffer.from(request.toSchema(true).toBER(false));
}

function parseOcspResponseMetadata(body: Buffer): {
  parseStatus: Extract<OcspParseStatus, "parsed" | "failed">;
  parseFailureReason: string | null;
  metadataJson: Record<string, unknown>;
} {
  try {
    const asn1 = asn1js.fromBER(toExactArrayBuffer(body));
    if (asn1.offset === -1) {
      throw new Error("ocsp-response-asn1-parse-failed");
    }
    const response = new pkijs.OCSPResponse({ schema: asn1.result });
    return {
      parseStatus: "parsed",
      parseFailureReason: null,
      metadataJson: {
        responseStatusCode: response.responseStatus.valueBlock.valueDec,
        responseBytesPresent: Boolean(response.responseBytes),
        responseType: response.responseBytes?.responseType ?? null,
      },
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      parseStatus: "failed",
      parseFailureReason: `ocsp-response-parse-failed:${reason}`,
      metadataJson: {
        parser: "pkijs",
      },
    };
  }
}

async function recordOcspEvent(input: {
  source: MonitoringSourceRecord;
  status: OcspCheckEventStatus;
  statusLabel?: string | null;
  durationMs: number;
  httpStatus?: number | null;
  contentType?: string | null;
  responseSizeBytes?: number | null;
  responseSha256?: string | null;
  failureReason?: string | null;
  evidenceId?: string | null;
}): Promise<CheckOcspSourceResult> {
  const event = await recordOcspCheckEvent({
    sourceId: input.source.id,
    sourceKey: input.source.sourceKey,
    status: input.status,
    statusLabel: input.statusLabel ?? input.status,
    durationMs: input.durationMs,
    httpStatus: input.httpStatus ?? null,
    contentType: input.contentType ?? null,
    responseSizeBytes: input.responseSizeBytes ?? null,
    responseSha256: input.responseSha256 ?? null,
    failureReason: input.failureReason ?? null,
    evidenceId: input.evidenceId ?? null,
  });
  return {
    eventId: event.id,
    evidenceId: event.evidenceId,
    status: event.status,
    responseSha256: event.responseSha256,
  };
}

function classifyOcspFailure(error: unknown): OcspCheckEventStatus {
  const message = error instanceof Error ? error.message : String(error);
  if (
    message.includes("ocsp-url-private-address-blocked") ||
    message.includes("ocsp-url-invalid-scheme")
  ) {
    return "blocked";
  }
  if (message.includes("ocsp-response-too-large")) {
    return "oversized";
  }
  return "unavailable";
}

export async function checkOcspSource(
  source: MonitoringSourceRecord
): Promise<CheckOcspSourceResult> {
  if (source.sourceType !== "ocsp") {
    return recordOcspEvent({
      source,
      status: "not_checkable",
      durationMs: 0,
      failureReason: "source-not-ocsp",
    });
  }

  if (source.state !== "discovered" || !source.sourceUrl) {
    return recordOcspEvent({
      source,
      status: "not_checkable",
      durationMs: 0,
      failureReason: "ocsp-source-not-discovered",
    });
  }

  const certificate = await findCertificateById(source.certificateId);
  if (!certificate) {
    return recordOcspEvent({
      source,
      status: "not_checkable",
      durationMs: 0,
      failureReason: "certificate-not-found",
    });
  }

  const context = await findIssuerContextForSource(source);
  if (!context) {
    return recordOcspEvent({
      source,
      status: "not_checkable",
      durationMs: 0,
      failureReason: "issuer-certificate-not-found",
    });
  }

  const startedAt = Date.now();
  let requestDer: Buffer;
  try {
    requestDer = await buildOcspRequestDer(context.certificate.pemText, context.issuer.pemText);
  } catch (error) {
    const failureReason = error instanceof Error ? error.message : String(error);
    return recordOcspEvent({
      source,
      status: "not_checkable",
      durationMs: Date.now() - startedAt,
      failureReason: `ocsp-request-generation-failed:${failureReason}`,
    });
  }

  const requestSha256 = sha256(requestDer);
  try {
    const fetched = await fetchOcspResponseBytes(source.sourceUrl, requestDer);
    const responseSha256 = sha256(fetched.body);
    const parsed = parseOcspResponseMetadata(fetched.body);
    const evidence = await recordOcspResponseEvidence({
      sourceId: source.id,
      sourceKey: source.sourceKey,
      certificateId: context.certificate.id,
      certificateFingerprint: context.certificate.fingerprint,
      issuerCertificateId: context.issuer.id,
      issuerFingerprint: context.issuer.fingerprint,
      responderUrl: source.sourceUrl,
      finalUrl: fetched.finalUrl,
      requestBodyBase64: requestDer.toString("base64"),
      requestSha256,
      requestSizeBytes: requestDer.byteLength,
      responseBodyBase64: fetched.body.toString("base64"),
      responseSha256,
      responseSizeBytes: fetched.contentLength,
      httpStatus: fetched.status,
      contentType: fetched.contentType,
      parseStatus: parsed.parseStatus,
      parseFailureReason: parsed.parseFailureReason,
      metadataJson: {
        ...parsed.metadataJson,
        requestContentType: "application/ocsp-request",
        responseAccept: "application/ocsp-response",
        requestHashAlgorithm: "SHA-256",
      },
    });
    const status: OcspCheckEventStatus = parsed.parseStatus === "parsed" ? "available" : "malformed";
    return recordOcspEvent({
      source,
      status,
      durationMs: fetched.durationMs,
      httpStatus: fetched.status,
      contentType: fetched.contentType,
      responseSizeBytes: fetched.contentLength,
      responseSha256,
      failureReason: parsed.parseFailureReason,
      evidenceId: evidence.id,
    });
  } catch (error) {
    const failureReason = error instanceof Error ? error.message : String(error);
    return recordOcspEvent({
      source,
      status: classifyOcspFailure(error),
      durationMs: Date.now() - startedAt,
      failureReason,
    });
  }
}
