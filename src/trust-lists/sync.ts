import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { extractCertificateFingerprint, importCertificate } from "../inventory/certificate-admin";
import {
  completeTrustListSyncRun,
  createTrustListSnapshot,
  createTrustListSyncRun,
  findLatestTrustListProjection,
  listEnabledTrustListSources,
  recordTrustListCertificateProjection,
  recordTrustListExtractedCertificate,
  type TrustListCertificateProjectionRecord,
  type TrustListExtractedCertificateRecord,
  type TrustListSourceRecord,
} from "../storage/runtime-store";
import { parseTrustListXml } from "./parser";
import type {
  TrustListCertificateCandidate,
  TrustListRecoveryGuidance,
  TrustListSourcePreviewResult,
  TrustListSyncSummary,
} from "./types";
import { validateTrustListXmlSignature } from "./xmldsig";

const DEFAULT_FETCH_TIMEOUT_MS = 30000;
const DEFAULT_MAX_XML_BYTES = 25 * 1024 * 1024;
const MAX_TRUST_LIST_REDIRECTS = 3;

function getFetchTimeoutMs(): number {
  return Number(process.env.TRUST_LIST_FETCH_TIMEOUT_MS ?? DEFAULT_FETCH_TIMEOUT_MS);
}

function getMaxXmlBytes(): number {
  return Number(process.env.TRUST_LIST_MAX_XML_BYTES ?? DEFAULT_MAX_XML_BYTES);
}

function isLocalhostName(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function isPrivateAddress(address: string): boolean {
  if (address === "::1") return true;
  if (address.startsWith("fe80:") || address.startsWith("fc") || address.startsWith("fd")) return true;
  const parts = address.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a === 0
  );
}

async function assertPublicFetchTarget(parsed: URL): Promise<void> {
  if (isLocalhostName(parsed.hostname)) return;
  const records = isIP(parsed.hostname)
    ? [{ address: parsed.hostname }]
    : await lookup(parsed.hostname, { all: true, verbatim: true });
  if (records.some((record) => isPrivateAddress(record.address))) {
    throw new Error("trust-list-url-private-address-blocked");
  }
}

async function assertSyncUrl(url: string): Promise<URL> {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" && !isLocalhostName(parsed.hostname)) {
    throw new Error("trust-list-url-must-use-https");
  }
  await assertPublicFetchTarget(parsed);
  return parsed;
}

async function fetchTrustListXml(url: string): Promise<string> {
  let currentUrl = url;
  let response: Response | null = null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), getFetchTimeoutMs());
  try {
    for (let redirects = 0; redirects <= MAX_TRUST_LIST_REDIRECTS; redirects += 1) {
      const parsed = await assertSyncUrl(currentUrl);
      response = await fetch(parsed, { signal: controller.signal, redirect: "manual" });
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      const location = response.headers.get("location");
      if (!location) throw new Error("trust-list-redirect-missing-location");
      currentUrl = new URL(location, parsed).toString();
      if (redirects === MAX_TRUST_LIST_REDIRECTS) {
        throw new Error("trust-list-too-many-redirects");
      }
    }
    if (!response) {
      throw new Error("trust-list-fetch-failed");
    }
    if (!response.ok) {
      throw new Error(`trust-list-fetch-failed:${response.status}`);
    }
    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > getMaxXmlBytes()) {
      throw new Error("trust-list-xml-too-large");
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > getMaxXmlBytes()) {
      throw new Error("trust-list-xml-too-large");
    }
    return buffer.toString("utf8");
  } finally {
    clearTimeout(timer);
  }
}

function failureSummary(source: TrustListSourceRecord, runId: string, reason: string): TrustListSyncSummary {
  return {
    sourceId: source.id,
    runId,
    status: "failed",
    snapshotId: null,
    digestSha256: null,
    sequenceNumber: null,
    territory: null,
    issueDate: null,
    nextUpdate: null,
    importedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    failureReason: reason,
  };
}

function buildCandidateKey(source: TrustListSourceRecord, fingerprint: string, candidate: TrustListCertificateCandidate): string {
  return [source.id, fingerprint, candidate.sourcePath || `ordinal:${candidate.ordinal}`].join(":");
}

function buildCandidateDigest(input: {
  source: TrustListSourceRecord;
  candidate: TrustListCertificateCandidate;
  fingerprint: string;
  sequenceNumber: string | null;
  territory: string | null;
}): string {
  return createHash("sha256")
    .update(input.source.id)
    .update("\0")
    .update(input.fingerprint)
    .update("\0")
    .update(input.candidate.sourcePath)
    .update("\0")
    .update(String(input.candidate.ordinal))
    .update("\0")
    .update(input.sequenceNumber ?? "")
    .update("\0")
    .update(input.territory ?? "")
    .update("\0")
    .update(input.candidate.pem)
    .digest("hex");
}

async function recordProjection(input: {
  source: TrustListSourceRecord;
  snapshotId: string;
  runId: string;
  extracted: TrustListExtractedCertificateRecord;
  certificateId?: string | null;
  fingerprint: string;
  candidateKey: string;
  candidateDigest: string;
  sourcePath: string;
  sequenceNumber: string | null;
  territory: string | null;
  status: TrustListCertificateProjectionRecord["status"];
  changeReason: TrustListCertificateProjectionRecord["changeReason"];
  failureReason?: string | null;
}): Promise<void> {
  await recordTrustListCertificateProjection({
    sourceId: input.source.id,
    snapshotId: input.snapshotId,
    runId: input.runId,
    extractedCertificateId: input.extracted.id,
    certificateId: input.certificateId ?? null,
    fingerprint: input.fingerprint,
    candidateKey: input.candidateKey,
    candidateDigest: input.candidateDigest,
    sourcePath: input.sourcePath,
    sequenceNumber: input.sequenceNumber,
    territory: input.territory,
    status: input.status,
    changeReason: input.changeReason,
    failureReason: input.failureReason ?? null,
  });
}


export function getTrustListRecoveryGuidance(reason?: string | null): TrustListRecoveryGuidance | null {
  if (!reason) return null;
  const normalized = reason.toLowerCase();
  let code: TrustListRecoveryGuidance["code"] = "unknown";
  if (normalized.includes("trust-list-invalid-url") || normalized.includes("invalid url")) {
    code = "invalid-url";
  } else if (normalized.includes("trust-list-url-must-use-https")) {
    code = "https-required";
  } else if (normalized.includes("trust-list-xml-too-large")) {
    code = "xml-too-large";
  } else if (normalized.includes("trust-list-fetch-failed") || normalized.includes("fetch")) {
    code = "fetch-failed";
  } else if (normalized.includes("trust-list-no-certificates")) {
    code = "no-certificates";
  } else if (normalized.includes("signature") || normalized.includes("xmldsig")) {
    code = "xml-signature-invalid";
  } else if (normalized.includes("xml") || normalized.includes("parse")) {
    code = "parse-failed";
  }
  const severity: TrustListRecoveryGuidance["severity"] =
    code === "unknown" ? "warning" : code === "fetch-failed" ? "warning" : "critical";
  const key = code.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
  return {
    code,
    severity,
    titleKey: `admin.trustLists.recovery.${key}.title`,
    bodyKey: `admin.trustLists.recovery.${key}.body`,
    actionKey: `admin.trustLists.recovery.${key}.action`,
  };
}

export async function previewTrustListXmlSource(url: string): Promise<TrustListSourcePreviewResult> {
  const trimmedUrl = url.trim();
  try {
    if (!trimmedUrl) {
      throw new Error("trust-list-invalid-url");
    }
    const xml = await fetchTrustListXml(trimmedUrl);
    const parsed = parseTrustListXml(xml);
    if (parsed.certificates.length === 0) {
      throw new Error("trust-list-no-certificates");
    }
    const signature = validateTrustListXmlSignature(xml);
    const failureReason = signature.valid ? null : signature.reason ?? "xml-signature-invalid";
    return {
      ok: signature.valid,
      url: trimmedUrl,
      digestSha256: parsed.digestSha256,
      sequenceNumber: parsed.sequenceNumber,
      territory: parsed.territory,
      issueDate: parsed.issueDate,
      nextUpdate: parsed.nextUpdate,
      xmlSizeBytes: parsed.xmlSizeBytes,
      certificateCount: parsed.certificates.length,
      validationStatus: signature.valid ? "valid" : "invalid",
      failureReason,
      recovery: getTrustListRecoveryGuidance(failureReason),
    };
  } catch (error) {
    const failureReason = error instanceof Error ? error.message : "trust-list-preview-failed";
    return {
      ok: false,
      url: trimmedUrl,
      digestSha256: null,
      sequenceNumber: null,
      territory: null,
      issueDate: null,
      nextUpdate: null,
      xmlSizeBytes: null,
      certificateCount: null,
      validationStatus: "invalid",
      failureReason,
      recovery: getTrustListRecoveryGuidance(failureReason),
    };
  }
}

export async function syncTrustListSource(source: TrustListSourceRecord): Promise<TrustListSyncSummary> {
  const run = await createTrustListSyncRun({ sourceId: source.id });
  try {
    const xml = await fetchTrustListXml(source.url);
    const parsed = parseTrustListXml(xml);
    const signature = validateTrustListXmlSignature(xml);
    if (!signature.valid) {
      const reason = signature.reason ?? "xml-signature-invalid";
      await completeTrustListSyncRun(run.id, {
        status: "failed",
        digestSha256: parsed.digestSha256,
        sequenceNumber: parsed.sequenceNumber,
        territory: parsed.territory,
        issueDate: parsed.issueDate,
        nextUpdate: parsed.nextUpdate,
        failureReason: reason,
      });
      return { ...failureSummary(source, run.id, reason), digestSha256: parsed.digestSha256 };
    }

    const snapshot = await createTrustListSnapshot({
      sourceId: source.id,
      digestSha256: parsed.digestSha256,
      sequenceNumber: parsed.sequenceNumber,
      territory: parsed.territory,
      issueDate: parsed.issueDate,
      nextUpdate: parsed.nextUpdate,
      xmlSizeBytes: parsed.xmlSizeBytes,
      certificateCount: parsed.certificates.length,
    });

    let importedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const seen = new Set<string>();
    const actor = {
      userId: source.createdByUserId,
      email: "trust-list-sync@local",
      isPlatformAdmin: true,
      groupRoles: [],
    };

    for (const candidate of parsed.certificates) {
      let fingerprint: string | null = null;
      try {
        fingerprint = extractCertificateFingerprint(candidate.pem);
        const candidateKey = buildCandidateKey(source, fingerprint, candidate);
        const candidateDigest = buildCandidateDigest({
          source,
          candidate,
          fingerprint,
          sequenceNumber: parsed.sequenceNumber,
          territory: parsed.territory,
        });
        const sourcePath = candidate.sourcePath || `ordinal:${candidate.ordinal}`;

        if (seen.has(fingerprint)) {
          skippedCount += 1;
          const extracted = await recordTrustListExtractedCertificate({
            sourceId: source.id,
            snapshotId: snapshot.id,
            runId: run.id,
            fingerprint,
            subjectSummary: candidate.subjectSummary,
            pem: candidate.pem,
            importStatus: "skipped",
            failureReason: "duplicate-in-run",
          });
          await recordProjection({
            source,
            snapshotId: snapshot.id,
            runId: run.id,
            extracted,
            fingerprint,
            candidateKey,
            candidateDigest,
            sourcePath,
            sequenceNumber: parsed.sequenceNumber,
            territory: parsed.territory,
            status: "skipped",
            changeReason: "duplicate-in-run",
            failureReason: "duplicate-in-run",
          });
          continue;
        }
        seen.add(fingerprint);

        const previousProjection = await findLatestTrustListProjection({
          sourceId: source.id,
          fingerprint,
          candidateKey,
        });
        if (previousProjection?.candidateDigest === candidateDigest && previousProjection.certificateId) {
          skippedCount += 1;
          const extracted = await recordTrustListExtractedCertificate({
            sourceId: source.id,
            snapshotId: snapshot.id,
            runId: run.id,
            fingerprint,
            subjectSummary: candidate.subjectSummary,
            pem: candidate.pem,
            importedCertificateId: previousProjection.certificateId,
            importStatus: "skipped",
            failureReason: "unchanged",
          });
          await recordProjection({
            source,
            snapshotId: snapshot.id,
            runId: run.id,
            extracted,
            certificateId: previousProjection.certificateId,
            fingerprint,
            candidateKey,
            candidateDigest,
            sourcePath,
            sequenceNumber: parsed.sequenceNumber,
            territory: parsed.territory,
            status: "skipped",
            changeReason: "unchanged",
          });
          continue;
        }

        const changeReason: TrustListCertificateProjectionRecord["changeReason"] = previousProjection
          ? "changed-candidate"
          : "new-fingerprint";
        const result = await importCertificate(
          actor,
          {
            displayName: `${source.label} certificate ${candidate.ordinal}`,
            pemText: candidate.pem,
            tags: ["trust-list", source.id],
            groupIds: source.groupIds,
            ignoredUrls: [],
            status: "active",
            groupOverrides: [],
          },
          "trust-list",
          `${source.id}-${candidate.ordinal}.pem`,
        );
        importedCount += 1;
        const extracted = await recordTrustListExtractedCertificate({
          sourceId: source.id,
          snapshotId: snapshot.id,
          runId: run.id,
          fingerprint,
          subjectSummary: candidate.subjectSummary,
          pem: candidate.pem,
          importedCertificateId: result.certificateId,
          importStatus: result.result,
        });
        await recordProjection({
          source,
          snapshotId: snapshot.id,
          runId: run.id,
          extracted,
          certificateId: result.certificateId,
          fingerprint,
          candidateKey,
          candidateDigest,
          sourcePath,
          sequenceNumber: parsed.sequenceNumber,
          territory: parsed.territory,
          status: result.result,
          changeReason,
        });
      } catch (error) {
        failedCount += 1;
        const failureReason = error instanceof Error ? error.message : "certificate-import-failed";
        const extracted = await recordTrustListExtractedCertificate({
          sourceId: source.id,
          snapshotId: snapshot.id,
          runId: run.id,
          fingerprint,
          subjectSummary: candidate.subjectSummary,
          pem: candidate.pem,
          importStatus: "failed",
          failureReason,
        });
        if (fingerprint) {
          const candidateKey = buildCandidateKey(source, fingerprint, candidate);
          const candidateDigest = buildCandidateDigest({
            source,
            candidate,
            fingerprint,
            sequenceNumber: parsed.sequenceNumber,
            territory: parsed.territory,
          });
          await recordProjection({
            source,
            snapshotId: snapshot.id,
            runId: run.id,
            extracted,
            fingerprint,
            candidateKey,
            candidateDigest,
            sourcePath: candidate.sourcePath || `ordinal:${candidate.ordinal}`,
            sequenceNumber: parsed.sequenceNumber,
            territory: parsed.territory,
            status: "failed",
            changeReason: "import-failed",
            failureReason,
          });
        }
      }
    }

    await completeTrustListSyncRun(run.id, {
      status: "succeeded",
      digestSha256: parsed.digestSha256,
      sequenceNumber: parsed.sequenceNumber,
      territory: parsed.territory,
      issueDate: parsed.issueDate,
      nextUpdate: parsed.nextUpdate,
      snapshotId: snapshot.id,
      importedCount,
      skippedCount,
      failedCount,
    });

    return {
      sourceId: source.id,
      runId: run.id,
      status: "succeeded",
      snapshotId: snapshot.id,
      digestSha256: parsed.digestSha256,
      sequenceNumber: parsed.sequenceNumber,
      territory: parsed.territory,
      issueDate: parsed.issueDate,
      nextUpdate: parsed.nextUpdate,
      importedCount,
      skippedCount,
      failedCount,
      failureReason: null,
    };
  } catch (error) {
    const failureReason = error instanceof Error ? error.message : "trust-list-sync-failed";
    await completeTrustListSyncRun(run.id, { status: "failed", failureReason });
    return failureSummary(source, run.id, failureReason);
  }
}

export async function syncEnabledTrustListSources(): Promise<TrustListSyncSummary[]> {
  const sources = await listEnabledTrustListSources();
  const results: TrustListSyncSummary[] = [];
  for (const source of sources) {
    results.push(await syncTrustListSource(source));
  }
  return results;
}
