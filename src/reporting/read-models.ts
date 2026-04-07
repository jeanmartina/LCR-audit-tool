import { listAlertEvents } from "../alerting/alert-policy";
import { calculateErrorBudget } from "../metrics/sla-metrics";
import {
  CoverageGap,
  listCoverageGaps,
  listPollRows,
  listSnapshotMetadata,
  listValidationEvents,
  PollRow,
  SnapshotMetadata,
  ValidationEvent,
} from "../storage/coverage-records";
import { loadTargets, resolveRetentionPolicy, Target } from "../inventory/targets";
import { ReportFilters } from "./query-state";

export type { ReportFilters } from "./query-state";

export interface DashboardRow {
  targetId: string;
  slug: string;
  type: Target["type"];
  source: string;
  issuer: string | null;
  owner: string | null;
  criticality: string;
  currentStatus: "healthy" | "degraded" | "offline";
  latestUnavailabilityAt: Date | null;
  slaPercent: number;
  errorBudgetUsed: number;
  nextExpiration: string | null;
  openAlerts: number;
  recentAlerts: number;
  retentionDays: {
    polls: number;
    alerts: number;
    coverageGaps: number;
  };
}

export interface DashboardSummary {
  totalTargets: number;
  healthyTargets: number;
  degradedTargets: number;
  offlineTargets: number;
  averageSlaPercent: number;
  openAlerts: number;
  warningTargets: number;
  upcomingExpirations: number;
  dateRange: {
    from: Date;
    to: Date;
  };
}

export interface DashboardFilterOptions {
  sources: string[];
  issuers: string[];
  criticalities: string[];
  owners: string[];
  statuses: Array<DashboardRow["currentStatus"]>;
}

export interface DetailSummary {
  currentStatus: DashboardRow["currentStatus"];
  latestIncidentAt: Date | null;
  slaPercent: number;
  openAlerts: number;
  nextExpiration: string | null;
}

export interface DetailEvidence {
  target: Target;
  summary: DetailSummary;
  pollHistory: Array<{
    occurredAt: Date;
    httpStatus: number;
    timedOut: boolean;
    durationMs: number;
    coverageLost: boolean;
    hash: string | null;
  }>;
  coverageWindows: Array<{
    startTs: Date;
    endTs: Date | null;
    durationMs: number;
  }>;
  alertHistory: ReturnType<typeof listAlertEvents>;
  validationFailures: Array<{
    occurredAt: Date;
    reason: string;
    hash: string | null;
  }>;
  snapshots: SnapshotMetadata[];
}

export interface DetailFilterOptions {
  httpStatuses: number[];
  severities: string[];
  eventTypes: string[];
  snapshotHashes: string[];
}

function inRange(date: Date, filters: ReportFilters): boolean {
  if (filters.dateFrom && date < filters.dateFrom) {
    return false;
  }
  if (filters.dateTo && date > filters.dateTo) {
    return false;
  }
  return true;
}

function matchesTargetFilters(target: Target, filters: ReportFilters): boolean {
  if (filters.source && target.source !== filters.source) {
    return false;
  }
  if (filters.issuer && target.issuer !== filters.issuer) {
    return false;
  }
  if (filters.criticality && target.criticality !== filters.criticality) {
    return false;
  }
  if (filters.owner && target.owner !== filters.owner) {
    return false;
  }
  return true;
}

function getTargetPolls(targetId: string, filters: ReportFilters): PollRow[] {
  return listPollRows(targetId).filter((row) => {
    if (!inRange(row.occurredAt, filters)) {
      return false;
    }
    if (filters.httpStatus !== undefined && row.status !== filters.httpStatus) {
      return false;
    }
    if (filters.snapshotHash && row.hash !== filters.snapshotHash) {
      return false;
    }
    return true;
  });
}

function getTargetCoverageGaps(targetId: string, filters: ReportFilters): CoverageGap[] {
  return listCoverageGaps(targetId).filter((gap) => {
    if (!gap.targetIds.includes(targetId)) {
      return false;
    }
    return inRange(gap.startTs, filters);
  });
}

function getTargetAlerts(targetId: string, filters: ReportFilters) {
  return listAlertEvents(targetId).filter((alert) => {
    if (!inRange(alert.sentAt, filters)) {
      return false;
    }
    if (filters.severity && alert.severity !== filters.severity) {
      return false;
    }
    return true;
  });
}

function getTargetValidationEvents(targetId: string, filters: ReportFilters): ValidationEvent[] {
  return listValidationEvents(targetId).filter((event) => {
    if (!inRange(event.occurredAt, filters)) {
      return false;
    }
    if (filters.snapshotHash && event.hash !== filters.snapshotHash) {
      return false;
    }
    return true;
  });
}

function getTargetSnapshots(targetId: string, filters: ReportFilters): SnapshotMetadata[] {
  return listSnapshotMetadata(targetId).filter((snapshot) => {
    if (!inRange(snapshot.occurredAt, filters)) {
      return false;
    }
    if (filters.snapshotHash && snapshot.hash !== filters.snapshotHash) {
      return false;
    }
    return true;
  });
}

function getCurrentStatus(polls: PollRow[]): DashboardRow["currentStatus"] {
  const latest = polls.at(-1);
  if (!latest) {
    return "degraded";
  }
  if (latest.coverageLost) {
    return "offline";
  }
  return latest.status === 200 ? "healthy" : "degraded";
}

function getWindowMs(filters: ReportFilters): number {
  const from = filters.dateFrom?.getTime();
  const to = filters.dateTo?.getTime();
  if (!from || !to) {
    return 30 * 24 * 60 * 60 * 1000;
  }
  return Math.max(1, to - from);
}

function mapRow(target: Target, filters: ReportFilters): DashboardRow {
  const polls = getTargetPolls(target.id, filters);
  const gaps = getTargetCoverageGaps(target.id, filters);
  const alerts = getTargetAlerts(target.id, filters);
  const latestUnavailability = [...polls].reverse().find((row) => row.coverageLost);
  const errorBudgetUsed = calculateErrorBudget(gaps, getWindowMs(filters));
  const retention = resolveRetentionPolicy(target);

  return {
    targetId: target.id,
    slug: target.slug,
    type: target.type,
    source: target.source ?? "manual",
    issuer: target.issuer ?? null,
    owner: target.owner ?? null,
    criticality: target.criticality ?? "medium",
    currentStatus: getCurrentStatus(polls),
    latestUnavailabilityAt: latestUnavailability?.occurredAt ?? null,
    slaPercent: Math.max(0, 100 - errorBudgetUsed * 100),
    errorBudgetUsed,
    nextExpiration: [...polls].reverse().find((row) => row.nextUpdate)?.nextUpdate ?? null,
    openAlerts: alerts.filter((alert) => !alert.resolvedAt).length,
    recentAlerts: alerts.length,
    retentionDays: {
      polls: retention.pollsDays,
      alerts: retention.alertsDays,
      coverageGaps: retention.coverageGapsDays,
    },
  };
}

export async function buildDashboardRows(filters: ReportFilters = {}): Promise<DashboardRow[]> {
  return (await loadTargets())
    .filter((target) => target.enabled && matchesTargetFilters(target, filters))
    .map((target) => mapRow(target, filters))
    .filter((row) => !filters.status || row.currentStatus === filters.status);
}

export async function buildDashboardSummary(
  filters: ReportFilters = {}
): Promise<DashboardSummary> {
  const rows = await buildDashboardRows(filters);
  const averageSlaPercent = rows.length
    ? rows.reduce((sum, row) => sum + row.slaPercent, 0) / rows.length
    : 0;

  return {
    totalTargets: rows.length,
    healthyTargets: rows.filter((row) => row.currentStatus === "healthy").length,
    degradedTargets: rows.filter((row) => row.currentStatus === "degraded").length,
    offlineTargets: rows.filter((row) => row.currentStatus === "offline").length,
    averageSlaPercent,
    openAlerts: rows.reduce((sum, row) => sum + row.openAlerts, 0),
    warningTargets: rows.filter((row) => row.errorBudgetUsed >= 0.5).length,
    upcomingExpirations: rows.filter((row) => row.nextExpiration).length,
    dateRange: {
      from: filters.dateFrom ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: filters.dateTo ?? new Date(),
    },
  };
}

export async function buildDashboardFilterOptions(): Promise<DashboardFilterOptions> {
  const targets = (await loadTargets()).filter((target) => target.enabled);
  return {
    sources: [...new Set(targets.map((target) => target.source ?? "manual"))].sort(),
    issuers: [...new Set(targets.map((target) => target.issuer).filter(Boolean) as string[])].sort(),
    criticalities: [
      ...new Set(targets.map((target) => target.criticality ?? "medium")),
    ].sort(),
    owners: [...new Set(targets.map((target) => target.owner).filter(Boolean) as string[])].sort(),
    statuses: ["healthy", "degraded", "offline"],
  };
}

export async function buildDetailEvidence(
  targetId: string,
  filters: ReportFilters = {}
): Promise<DetailEvidence | null> {
  const target = (await loadTargets()).find((item) => item.id === targetId);
  if (!target) {
    return null;
  }

  const row = mapRow(target, filters);
  const pollHistory = getTargetPolls(targetId, filters).map((poll) => ({
    occurredAt: poll.occurredAt,
    httpStatus: poll.status,
    timedOut: poll.coverageLost && poll.status === 0,
    durationMs: poll.durationMs,
    coverageLost: poll.coverageLost,
    hash: poll.hash ?? null,
  }));
  const coverageWindows = getTargetCoverageGaps(targetId, filters).map((gap) => ({
    startTs: gap.startTs,
    endTs: gap.endTs,
    durationMs: (gap.endTs ?? new Date()).getTime() - gap.startTs.getTime(),
  }));
  const alertHistory = getTargetAlerts(targetId, filters);
  const validationFailures = getTargetValidationEvents(targetId, filters)
    .filter((event) => !event.valid)
    .map((event) => ({
      occurredAt: event.occurredAt,
      reason: event.reason ?? "invalid-lcr",
      hash: event.hash ?? null,
    }));
  const snapshots = getTargetSnapshots(targetId, filters);

  return {
    target,
    summary: {
      currentStatus: row.currentStatus,
      latestIncidentAt: row.latestUnavailabilityAt,
      slaPercent: row.slaPercent,
      openAlerts: row.openAlerts,
      nextExpiration: row.nextExpiration,
    },
    pollHistory,
    coverageWindows,
    alertHistory,
    validationFailures,
    snapshots,
  };
}

export async function buildDetailFilterOptions(
  targetId: string
): Promise<DetailFilterOptions | null> {
  const detail = await buildDetailEvidence(targetId, {});
  if (!detail) {
    return null;
  }

  return {
    httpStatuses: [...new Set(detail.pollHistory.map((poll) => poll.httpStatus))].sort(
      (left, right) => left - right
    ),
    severities: [...new Set(detail.alertHistory.map((alert) => alert.severity))].sort(),
    eventTypes: ["poll", "alert", "validation", "expiration", "recovery", "coverage-gap"],
    snapshotHashes: [
      ...new Set(detail.snapshots.map((snapshot) => snapshot.hash).filter(Boolean) as string[]),
    ].sort(),
  };
}
