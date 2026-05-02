import { checkPolicyDocumentSource } from "./documents";
import { listMonitoringSourceRecords } from "../storage/runtime-store";

const DEFAULT_DOCUMENT_INTERVAL_SECONDS = 3600;
const lastDocumentCheckAtBySourceId = new Map<string, number>();

function envNumber(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

export function getMonitoringSourceDocumentIntervalSeconds(): number {
  return envNumber("MONITORING_SOURCE_DOCUMENT_INTERVAL_SECONDS", DEFAULT_DOCUMENT_INTERVAL_SECONDS);
}

function isDue(sourceId: string, now: number, intervalMs: number): boolean {
  const lastCheckAt = lastDocumentCheckAtBySourceId.get(sourceId);
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
      isDue(source.id, now, intervalMs)
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
