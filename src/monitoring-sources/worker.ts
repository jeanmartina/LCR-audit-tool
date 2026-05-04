import { checkPolicyDocumentSource } from "./documents";
import { checkOcspSource } from "./ocsp";
import { listMonitoringSourceRecords } from "../storage/runtime-store";

const DEFAULT_DOCUMENT_INTERVAL_SECONDS = 3600;
const DEFAULT_OCSP_INTERVAL_SECONDS = 3600;
const lastDocumentCheckAtBySourceId = new Map<string, number>();
const lastOcspCheckAtBySourceId = new Map<string, number>();

function envNumber(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

export function getMonitoringSourceDocumentIntervalSeconds(): number {
  return envNumber("MONITORING_SOURCE_DOCUMENT_INTERVAL_SECONDS", DEFAULT_DOCUMENT_INTERVAL_SECONDS);
}

export function getOcspCheckIntervalSeconds(): number {
  return envNumber("OCSP_CHECK_INTERVAL_SECONDS", DEFAULT_OCSP_INTERVAL_SECONDS);
}

function isDue(
  lastCheckAtBySourceId: Map<string, number>,
  sourceId: string,
  now: number,
  intervalMs: number
): boolean {
  const lastCheckAt = lastCheckAtBySourceId.get(sourceId);
  return lastCheckAt === undefined || now - lastCheckAt >= intervalMs;
}

export async function runScheduledDocumentSourceChecks(): Promise<void> {
  const intervalMs = getMonitoringSourceDocumentIntervalSeconds() * 1000;
  const now = Date.now();
  const sources = await listMonitoringSourceRecords();
  const dueSources = sources.filter(
    (source) =>
      source.sourceType === "policy-document" &&
      source.state === "discovered" &&
      Boolean(source.sourceUrl) &&
      isDue(lastDocumentCheckAtBySourceId, source.id, now, intervalMs)
  );

  for (const source of dueSources) {
    try {
      await checkPolicyDocumentSource(source);
    } catch (error) {
      const message = error instanceof Error ? error.stack ?? error.message : String(error);
      console.error(`[worker] document source check failed: ${message}`);
    } finally {
      lastDocumentCheckAtBySourceId.set(source.id, Date.now());
    }
  }
}

export async function runScheduledOcspSourceChecks(): Promise<void> {
  const intervalMs = getOcspCheckIntervalSeconds() * 1000;
  const now = Date.now();
  const sources = await listMonitoringSourceRecords();
  const dueSources = sources.filter(
    (source) =>
      source.sourceType === "ocsp" &&
      source.state === "discovered" &&
      Boolean(source.sourceUrl) &&
      isDue(lastOcspCheckAtBySourceId, source.id, now, intervalMs)
  );

  for (const source of dueSources) {
    try {
      await checkOcspSource(source);
    } catch (error) {
      const message = error instanceof Error ? error.stack ?? error.message : String(error);
      console.error(`[worker] ocsp source check failed: ${message}`);
    } finally {
      lastOcspCheckAtBySourceId.set(source.id, Date.now());
    }
  }
}
