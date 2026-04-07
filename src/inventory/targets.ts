export type TargetType = "lcr" | "certificate";

import { loadTargetRecords, upsertTargetRecord } from "../storage/runtime-store";

export interface RetentionPolicy {
  pollsDays: number;
  alertsDays: number;
  coverageGapsDays: number;
  snapshotRetention: "permanent";
}

export interface Target {
  id: string;
  slug: string;
  url: string;
  type: TargetType;
  intervalSeconds: number;
  timeoutSeconds: number;
  alertEmail?: string;
  issuer?: string;
  owner?: string;
  criticality?: "low" | "medium" | "high";
  source?: string;
  retention?: Partial<RetentionPolicy>;
  enabled: boolean;
}

const DEFAULT_INTERVAL_SECONDS = 600; // 10 minutes default when unspecified
const DEFAULT_TIMEOUT_SECONDS = 5;
export const DEFAULT_RETENTION_DAYS = 180;

export function getDefaultRetentionPolicy(): RetentionPolicy {
  return {
    pollsDays: DEFAULT_RETENTION_DAYS,
    alertsDays: DEFAULT_RETENTION_DAYS,
    coverageGapsDays: DEFAULT_RETENTION_DAYS,
    snapshotRetention: "permanent",
  };
}

export function resolveRetentionPolicy(target: Partial<Target>): RetentionPolicy {
  const defaults = getDefaultRetentionPolicy();
  return {
    pollsDays: target.retention?.pollsDays ?? defaults.pollsDays,
    alertsDays: target.retention?.alertsDays ?? defaults.alertsDays,
    coverageGapsDays: target.retention?.coverageGapsDays ?? defaults.coverageGapsDays,
    snapshotRetention: "permanent",
  };
}

export function normalizeTarget(target: Partial<Target>): Target {
  const intervalSeconds = target.intervalSeconds ?? DEFAULT_INTERVAL_SECONDS;
  const timeoutSeconds = target.timeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS;

  if (!target.id || !target.slug || !target.url || !target.type) {
    throw new Error("Target must include id, slug, url, and type");
  }

  return {
    id: target.id,
    slug: target.slug,
    url: target.url,
    type: target.type,
    intervalSeconds,
    timeoutSeconds,
    alertEmail: target.alertEmail,
    issuer: target.issuer,
    owner: target.owner,
    criticality: target.criticality ?? "medium",
    source: target.source ?? "manual",
    retention: resolveRetentionPolicy(target),
    enabled: target.enabled ?? true,
  };
}

export async function loadTargets(): Promise<Target[]> {
  const records = await loadTargetRecords();
  return records.map((record) =>
    normalizeTarget({
      id: record.id,
      slug: record.slug,
      url: record.url,
      type: record.type,
      intervalSeconds: record.interval_seconds,
      timeoutSeconds: record.timeout_seconds,
      alertEmail: record.alert_email ?? undefined,
      issuer: record.issuer ?? undefined,
      owner: record.owner ?? undefined,
      criticality: record.criticality,
      source: record.source,
      retention: {
        pollsDays: record.retention_polls_days,
        alertsDays: record.retention_alerts_days,
        coverageGapsDays: record.retention_coverage_gaps_days,
      },
      enabled: record.enabled,
    })
  );
}

export function upsertTarget(targets: Target[], target: Partial<Target>): Target[] {
  const normalized = normalizeTarget(target);
  const index = targets.findIndex((t) => t.id === normalized.id);
  if (index === -1) {
    return [...targets, normalized];
  }

  const updated = targets.slice();
  updated[index] = normalized;
  return updated;
}

export async function persistTarget(target: Partial<Target>): Promise<Target> {
  const normalized = normalizeTarget(target);
  await upsertTargetRecord({
    id: normalized.id,
    slug: normalized.slug,
    url: normalized.url,
    type: normalized.type,
    interval_seconds: normalized.intervalSeconds,
    timeout_seconds: normalized.timeoutSeconds,
    alert_email: normalized.alertEmail ?? null,
    issuer: normalized.issuer ?? null,
    owner: normalized.owner ?? null,
    criticality: normalized.criticality ?? "medium",
    source: normalized.source ?? "manual",
    retention_polls_days: normalized.retention?.pollsDays ?? DEFAULT_RETENTION_DAYS,
    retention_alerts_days: normalized.retention?.alertsDays ?? DEFAULT_RETENTION_DAYS,
    retention_coverage_gaps_days:
      normalized.retention?.coverageGapsDays ?? DEFAULT_RETENTION_DAYS,
    enabled: normalized.enabled,
  });
  return normalized;
}
