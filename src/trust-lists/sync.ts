import { extractCertificateFingerprint, importCertificate } from "../inventory/certificate-admin";
import {
  completeTrustListSyncRun,
  createTrustListSnapshot,
  createTrustListSyncRun,
  listEnabledTrustListSources,
  recordTrustListExtractedCertificate,
  type TrustListSourceRecord,
} from "../storage/runtime-store";
import { parseTrustListXml } from "./parser";
import type { TrustListSyncSummary } from "./types";
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
        if (seen.has(fingerprint)) {
          skippedCount += 1;
          await recordTrustListExtractedCertificate({
            sourceId: source.id,
            snapshotId: snapshot.id,
            runId: run.id,
            fingerprint,
            subjectSummary: candidate.subjectSummary,
            pem: candidate.pem,
            importStatus: "skipped",
            failureReason: "duplicate-in-run",
          });
          continue;
        }
        seen.add(fingerprint);
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
          `${source.id}-${candidate.ordinal}.pem`
        );
        importedCount += 1;
        await recordTrustListExtractedCertificate({
          sourceId: source.id,
          snapshotId: snapshot.id,
          runId: run.id,
          fingerprint,
          subjectSummary: candidate.subjectSummary,
          pem: candidate.pem,
          importedCertificateId: result.certificateId,
          importStatus: result.result,
        });
      } catch (error) {
        failedCount += 1;
        await recordTrustListExtractedCertificate({
          sourceId: source.id,
          snapshotId: snapshot.id,
          runId: run.id,
          fingerprint,
          subjectSummary: candidate.subjectSummary,
          pem: candidate.pem,
          importStatus: "failed",
          failureReason: error instanceof Error ? error.message : "certificate-import-failed",
        });
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
