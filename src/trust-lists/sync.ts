import { createHash } from "node:crypto";
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
import type { TrustListCertificateCandidate, TrustListSyncSummary } from "./types";
import { validateTrustListXmlSignature } from "./xmldsig";

const DEFAULT_FETCH_TIMEOUT_MS = 30000;
const DEFAULT_MAX_XML_BYTES = 25 * 1024 * 1024;

function getFetchTimeoutMs(): number {
  return Number(process.env.TRUST_LIST_FETCH_TIMEOUT_MS ?? DEFAULT_FETCH_TIMEOUT_MS);
}

function getMaxXmlBytes(): number {
  return Number(process.env.TRUST_LIST_MAX_XML_BYTES ?? DEFAULT_MAX_XML_BYTES);
}

function assertSyncUrl(url: string): void {
  const parsed = new URL(url);
  const isLocalhost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (parsed.protocol !== "https:" && !isLocalhost) {
    throw new Error("trust-list-url-must-use-https");
  }
}

async function fetchTrustListXml(url: string): Promise<string> {
  assertSyncUrl(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), getFetchTimeoutMs());
  try {
    const response = await fetch(url, { signal: controller.signal });
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
