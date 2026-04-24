import { listAlertEvents } from "../alerting/alert-policy";
import { AuthenticatedPrincipal } from "../auth/authorization";
import { loadTargets, resolveRetentionPolicy, Target } from "../inventory/targets";
import { calculateErrorBudget } from "../metrics/sla-metrics";
import { evaluatePredictiveState, getEffectivePredictiveWindowDays, syncPredictiveState } from "./predictive";
import { ReportFilters } from "./query-state";
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
import {
  findGroupSettingsByGroupId,
  listCertificateCrlLinks,
  listCertificateGroupIds,
  listCertificateGroupOverrides,
  listCertificateRecords,
  listPredictiveEventsByCertificate,
  type CertificateRecord,
} from "../storage/runtime-store";

export type { ReportFilters } from "./query-state";

export interface StructuredTags {
  trustSource: string | null;
  pki: string | null;
  jurisdiction: string | null;
}

export interface DashboardRow {
  rowType: "certificate" | "crl";
  id: string;
  name: string;
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
  predictiveSeverity: "warning" | "critical" | null;
  predictiveType: "upcoming-expiration" | "publication-delayed" | null;
  structuredTags: StructuredTags;
  linkedCertificateCount: number;
  linkedCrlCount: number;
  retentionDays: {
    polls: number;
    alerts: number;
    coverageGaps: number;
  };
}

export interface DashboardSummary {
  totalRows: number;
  healthyRows: number;
  degradedRows: number;
  offlineRows: number;
  averageSlaPercent: number;
  openAlerts: number;
  warningRows: number;
  upcomingExpirations: number;
  dateRange: {
    from: Date;
    to: Date;
  };
  mode: "certificate" | "crl";
}

export interface ExecutiveRiskItem {
  id: string;
  name: string;
  currentStatus: DashboardRow["currentStatus"];
  predictiveSeverity: DashboardRow["predictiveSeverity"];
  predictiveType: DashboardRow["predictiveType"];
  openAlerts: number;
  slaPercent: number;
  nextExpiration: string | null;
  latestUnavailabilityAt: Date | null;
  structuredTags: StructuredTags;
  evidenceHref: string;
}

export interface ExecutiveTrendPoint {
  label: string;
  healthy: number;
  degraded: number;
  offline: number;
  atRisk: number;
}

export interface ExecutiveBreakdownBucket {
  label: string;
  total: number;
  healthy: number;
  degraded: number;
  offline: number;
  atRisk: number;
  openAlerts: number;
}

export interface ExecutiveSummary {
  mode: "certificate" | "crl";
  dateRange: {
    from: Date;
    to: Date;
  };
  totalRows: number;
  healthyRows: number;
  degradedRows: number;
  offlineRows: number;
  atRiskRows: number;
  averageSlaPercent: number;
  openAlerts: number;
  topRisks: ExecutiveRiskItem[];
  upcomingRisks: ExecutiveRiskItem[];
  trend: ExecutiveTrendPoint[];
  breakdowns: {
    trustSources: ExecutiveBreakdownBucket[];
    pkis: ExecutiveBreakdownBucket[];
    jurisdictions: ExecutiveBreakdownBucket[];
  };
}

export interface DashboardFilterOptions {
  sources: string[];
  issuers: string[];
  criticalities: string[];
  owners: string[];
  statuses: Array<DashboardRow["currentStatus"]>;
  trustSources: string[];
  pkis: string[];
  jurisdictions: string[];
}

export interface DetailSummary {
  currentStatus: DashboardRow["currentStatus"];
  latestIncidentAt: Date | null;
  slaPercent: number;
  openAlerts: number;
  nextExpiration: string | null;
  predictiveSeverity: "warning" | "critical" | null;
  predictiveType: "upcoming-expiration" | "publication-delayed" | null;
}

export interface DetailEvidence {
  certificate: CertificateRecord;
  summary: DetailSummary;
  structuredTags: StructuredTags;
  groupIds: string[];
  derivedCrls: Array<{
    url: string;
    ignored: boolean;
    targetId: string | null;
    currentStatus: DashboardRow["currentStatus"];
  }>;
  pollHistory: Array<{
    targetId: string;
    targetLabel: string;
    occurredAt: Date;
    httpStatus: number;
    timedOut: boolean;
    durationMs: number;
    coverageLost: boolean;
    hash: string | null;
  }>;
  coverageWindows: Array<{
    targetId: string;
    targetLabel: string;
    startTs: Date;
    endTs: Date | null;
    durationMs: number;
  }>;
  alertHistory: Array<ReturnType<typeof listAlertEvents>[number] & { targetLabel: string }>;
  validationFailures: Array<{
    targetId: string;
    targetLabel: string;
    occurredAt: Date;
    reason: string;
    hash: string | null;
  }>;
  snapshots: Array<SnapshotMetadata & { targetLabel: string }>;
  predictiveEvents: Awaited<ReturnType<typeof listPredictiveEventsByCertificate>>;
}

export interface DetailFilterOptions {
  httpStatuses: number[];
  severities: string[];
  eventTypes: string[];
  snapshotHashes: string[];
}

interface VisibleCertificate {
  certificate: CertificateRecord;
  visibleGroupIds: string[];
  effectiveTags: StructuredTags;
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

function matchesStructuredTags(tags: StructuredTags, filters: ReportFilters): boolean {
  if (filters.trustSource && tags.trustSource !== filters.trustSource) {
    return false;
  }
  if (filters.pki && tags.pki !== filters.pki) {
    return false;
  }
  if (filters.jurisdiction && tags.jurisdiction !== filters.jurisdiction) {
    return false;
  }
  return true;
}

function matchesCertificateFilters(certificate: CertificateRecord, filters: ReportFilters): boolean {
  if (filters.source && certificate.sourceType !== filters.source) {
    return false;
  }
  return true;
}

function getWindowMs(filters: ReportFilters): number {
  const from = filters.dateFrom?.getTime();
  const to = filters.dateTo?.getTime();
  if (!from || !to) {
    return 30 * 24 * 60 * 60 * 1000;
  }
  return Math.max(1, to - from);
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
  return listCoverageGaps(targetId).filter((gap) => gap.targetIds.includes(targetId) && inRange(gap.startTs, filters));
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

function worstStatus(statuses: DashboardRow["currentStatus"][]): DashboardRow["currentStatus"] {
  if (statuses.includes("offline")) {
    return "offline";
  }
  if (statuses.includes("degraded")) {
    return "degraded";
  }
  return "healthy";
}

function normalizeText(value: string | null | undefined): string | null {
  return value && value.trim() ? value.trim() : null;
}

async function isCertificateVisibleToPrincipal(
  principal: AuthenticatedPrincipal,
  certificateId: string
): Promise<boolean> {
  if (principal.isPlatformAdmin) {
    return true;
  }
  const groupIds = await listCertificateGroupIds(certificateId);
  return groupIds.some((groupId) =>
    principal.groupRoles.some((membership) => membership.groupId === groupId)
  );
}

async function getEffectiveStructuredTags(
  certificate: CertificateRecord,
  visibleGroupIds: string[]
): Promise<StructuredTags> {
  const overrides = await listCertificateGroupOverrides(certificate.id);
  const groupSettings = await Promise.all(visibleGroupIds.map((groupId) => findGroupSettingsByGroupId(groupId)));

  const trustSource =
    normalizeText(overrides.find((item) => visibleGroupIds.includes(item.groupId) && item.trustSource)?.trustSource) ??
    normalizeText(groupSettings.find((item) => item?.defaultTrustSource)?.defaultTrustSource) ??
    normalizeText(certificate.trustSource);
  const pki =
    normalizeText(overrides.find((item) => visibleGroupIds.includes(item.groupId) && item.pki)?.pki) ??
    normalizeText(groupSettings.find((item) => item?.defaultPki)?.defaultPki) ??
    normalizeText(certificate.pki);
  const jurisdiction =
    normalizeText(
      overrides.find((item) => visibleGroupIds.includes(item.groupId) && item.jurisdiction)?.jurisdiction
    ) ??
    normalizeText(groupSettings.find((item) => item?.defaultJurisdiction)?.defaultJurisdiction) ??
    normalizeText(certificate.jurisdiction);

  return { trustSource, pki, jurisdiction };
}

async function listVisibleCertificates(
  principal?: AuthenticatedPrincipal
): Promise<VisibleCertificate[]> {
  const certificates = await listCertificateRecords();
  const visible: VisibleCertificate[] = [];

  for (const certificate of certificates) {
    const allGroupIds = await listCertificateGroupIds(certificate.id);
    const visibleGroupIds = principal?.isPlatformAdmin
      ? allGroupIds
      : allGroupIds.filter((groupId) =>
          principal?.groupRoles.some((membership) => membership.groupId === groupId)
        );

    if (principal && visibleGroupIds.length === 0) {
      continue;
    }

    visible.push({
      certificate,
      visibleGroupIds: visibleGroupIds.length > 0 ? visibleGroupIds : allGroupIds,
      effectiveTags: await getEffectiveStructuredTags(certificate, visibleGroupIds.length > 0 ? visibleGroupIds : allGroupIds),
    });
  }

  return visible;
}

async function buildCertificateDashboardRow(
  visibleCertificate: VisibleCertificate,
  filters: ReportFilters,
  targetsById: Map<string, Target>
): Promise<DashboardRow | null> {
  const links = (await listCertificateCrlLinks(visibleCertificate.certificate.id)).filter((link) => !link.ignored);
  const targetIds = links.map((link) => link.runtimeTargetId).filter((item): item is string => Boolean(item));
  const targets = targetIds.map((targetId) => targetsById.get(targetId)).filter((item): item is Target => Boolean(item));
  const matchingTargets = targets.filter((target) => {
    if (filters.issuer && target.issuer !== filters.issuer) {
      return false;
    }
    if (filters.owner && target.owner !== filters.owner) {
      return false;
    }
    if (filters.criticality && target.criticality !== filters.criticality) {
      return false;
    }
    return true;
  });

  if (!matchesCertificateFilters(visibleCertificate.certificate, filters) || !matchesStructuredTags(visibleCertificate.effectiveTags, filters)) {
    return null;
  }

  const targetScope = matchingTargets.length > 0 ? matchingTargets : targets;
  const polls = targetScope.flatMap((target) => getTargetPolls(target.id, filters));
  const gaps = targetScope.flatMap((target) => getTargetCoverageGaps(target.id, filters));
  const alerts = targetScope.flatMap((target) => getTargetAlerts(target.id, filters));
  const snapshots = targetScope.flatMap((target) => getTargetSnapshots(target.id, filters));
  const latestUnavailability = [...polls]
    .filter((row) => row.coverageLost)
    .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime())[0];
  const statuses = targetScope.map((target) => getCurrentStatus(getTargetPolls(target.id, filters)));
  const errorBudgetUsed = calculateErrorBudget(gaps, getWindowMs(filters));
  const nextExpiration =
    [...snapshots]
      .filter((snapshot) => snapshot.nextUpdate)
      .sort((left, right) => new Date(left.nextUpdate ?? 0).getTime() - new Date(right.nextUpdate ?? 0).getTime())[0]
      ?.nextUpdate ?? null;
  const windowDays = await getEffectivePredictiveWindowDays(visibleCertificate.visibleGroupIds);
  const predictive = evaluatePredictiveState(nextExpiration, windowDays);
  if (links[0]?.runtimeTargetId) {
    await syncPredictiveState({
      certificateId: visibleCertificate.certificate.id,
      targetId: links[0].runtimeTargetId,
      groupId: visibleCertificate.visibleGroupIds[0] ?? null,
      nextUpdate: nextExpiration,
      windowDays,
    });
  }

  const retention = resolveRetentionPolicy(targetScope[0] ?? { retention: undefined });
  const row: DashboardRow = {
    rowType: "certificate",
    id: visibleCertificate.certificate.id,
    name: visibleCertificate.certificate.displayName,
    source: visibleCertificate.certificate.sourceType,
    issuer: targetScope.find((target) => target.issuer)?.issuer ?? snapshots.at(-1)?.issuer ?? null,
    owner: targetScope.find((target) => target.owner)?.owner ?? null,
    criticality: targetScope.find((target) => target.criticality)?.criticality ?? "medium",
    currentStatus: worstStatus(statuses.length > 0 ? statuses : ["degraded"]),
    latestUnavailabilityAt: latestUnavailability?.occurredAt ?? null,
    slaPercent: Math.max(0, 100 - errorBudgetUsed * 100),
    errorBudgetUsed,
    nextExpiration,
    openAlerts: alerts.filter((alert) => !alert.resolvedAt).length,
    recentAlerts: alerts.length,
    predictiveSeverity: predictive?.severity ?? null,
    predictiveType: predictive?.predictiveType ?? null,
    structuredTags: visibleCertificate.effectiveTags,
    linkedCertificateCount: 1,
    linkedCrlCount: links.length,
    retentionDays: {
      polls: retention.pollsDays,
      alerts: retention.alertsDays,
      coverageGaps: retention.coverageGapsDays,
    },
  };

  if (filters.status && row.currentStatus !== filters.status) {
    return null;
  }
  if (filters.predictiveType && row.predictiveType !== filters.predictiveType) {
    return null;
  }
  if (filters.severity && row.predictiveSeverity !== filters.severity) {
    return null;
  }
  return row;
}

async function buildCrlDashboardRows(
  filters: ReportFilters,
  principal?: AuthenticatedPrincipal
): Promise<DashboardRow[]> {
  const visibleCertificates = await listVisibleCertificates(principal);
  const targetsById = new Map((await loadTargets()).map((target) => [target.id, target]));
  const grouped = new Map<
    string,
    {
      visibleCertificates: VisibleCertificate[];
      targetIds: string[];
      links: Awaited<ReturnType<typeof listCertificateCrlLinks>>;
    }
  >();

  for (const visibleCertificate of visibleCertificates) {
    const links = await listCertificateCrlLinks(visibleCertificate.certificate.id);
    for (const link of links.filter((item) => !item.ignored)) {
      const current = grouped.get(link.crlUrl) ?? { visibleCertificates: [], targetIds: [], links: [] };
      current.visibleCertificates.push(visibleCertificate);
      if (link.runtimeTargetId) {
        current.targetIds.push(link.runtimeTargetId);
      }
      current.links.push(link);
      grouped.set(link.crlUrl, current);
    }
  }

  const rows: DashboardRow[] = [];
  for (const [crlUrl, group] of grouped.entries()) {
    const polls = group.targetIds.flatMap((targetId) => getTargetPolls(targetId, filters));
    const gaps = group.targetIds.flatMap((targetId) => getTargetCoverageGaps(targetId, filters));
    const alerts = group.targetIds.flatMap((targetId) => getTargetAlerts(targetId, filters));
    const snapshots = group.targetIds.flatMap((targetId) => getTargetSnapshots(targetId, filters));
    const statuses = group.targetIds.map((targetId) => getCurrentStatus(getTargetPolls(targetId, filters)));
    const latestUnavailability = [...polls]
      .filter((row) => row.coverageLost)
      .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime())[0];
    const nextExpiration =
      [...snapshots]
        .filter((snapshot) => snapshot.nextUpdate)
        .sort((left, right) => new Date(left.nextUpdate ?? 0).getTime() - new Date(right.nextUpdate ?? 0).getTime())[0]
        ?.nextUpdate ?? null;
    const tagValues = group.visibleCertificates.map((item) => item.effectiveTags);
    const effectiveTags: StructuredTags = {
      trustSource: tagValues.find((item) => item.trustSource)?.trustSource ?? null,
      pki: tagValues.find((item) => item.pki)?.pki ?? null,
      jurisdiction: tagValues.find((item) => item.jurisdiction)?.jurisdiction ?? null,
    };
    if (!matchesStructuredTags(effectiveTags, filters)) {
      continue;
    }
    const windowDays = await getEffectivePredictiveWindowDays(
      group.visibleCertificates.flatMap((item) => item.visibleGroupIds)
    );
    const predictive = evaluatePredictiveState(nextExpiration, windowDays);

    const firstTarget = group.targetIds.map((targetId) => targetsById.get(targetId)).find(Boolean);
    const retention = resolveRetentionPolicy(firstTarget ?? { retention: undefined });
    const row: DashboardRow = {
      rowType: "crl",
      id: crlUrl,
      name: crlUrl,
      source: "certificate-derived",
      issuer: snapshots.at(-1)?.issuer ?? null,
      owner: firstTarget?.owner ?? null,
      criticality: firstTarget?.criticality ?? "medium",
      currentStatus: worstStatus(statuses.length > 0 ? statuses : ["degraded"]),
      latestUnavailabilityAt: latestUnavailability?.occurredAt ?? null,
      slaPercent: Math.max(0, 100 - calculateErrorBudget(gaps, getWindowMs(filters)) * 100),
      errorBudgetUsed: calculateErrorBudget(gaps, getWindowMs(filters)),
      nextExpiration,
      openAlerts: alerts.filter((alert) => !alert.resolvedAt).length,
      recentAlerts: alerts.length,
      predictiveSeverity: predictive?.severity ?? null,
      predictiveType: predictive?.predictiveType ?? null,
      structuredTags: effectiveTags,
      linkedCertificateCount: new Set(group.visibleCertificates.map((item) => item.certificate.id)).size,
      linkedCrlCount: 1,
      retentionDays: {
        polls: retention.pollsDays,
        alerts: retention.alertsDays,
        coverageGaps: retention.coverageGapsDays,
      },
    };

    if (filters.status && row.currentStatus !== filters.status) {
      continue;
    }
    if (filters.predictiveType && row.predictiveType !== filters.predictiveType) {
      continue;
    }
    if (filters.severity && row.predictiveSeverity !== filters.severity) {
      continue;
    }
    rows.push(row);
  }

  return rows.sort((left, right) => left.name.localeCompare(right.name));
}

export async function buildDashboardRows(
  filters: ReportFilters = {},
  principal?: AuthenticatedPrincipal
): Promise<DashboardRow[]> {
  if ((filters.mode ?? "certificate") === "crl") {
    return buildCrlDashboardRows(filters, principal);
  }

  const visibleCertificates = await listVisibleCertificates(principal);
  const targetsById = new Map((await loadTargets()).map((target) => [target.id, target]));
  const rows = await Promise.all(
    visibleCertificates.map((visibleCertificate) =>
      buildCertificateDashboardRow(visibleCertificate, filters, targetsById)
    )
  );
  return rows.filter((row): row is DashboardRow => Boolean(row));
}

export async function buildDashboardSummary(
  filters: ReportFilters = {},
  principal?: AuthenticatedPrincipal
): Promise<DashboardSummary> {
  const rows = await buildDashboardRows(filters, principal);
  const averageSlaPercent = rows.length
    ? rows.reduce((sum, row) => sum + row.slaPercent, 0) / rows.length
    : 0;

  return {
    totalRows: rows.length,
    healthyRows: rows.filter((row) => row.currentStatus === "healthy").length,
    degradedRows: rows.filter((row) => row.currentStatus === "degraded").length,
    offlineRows: rows.filter((row) => row.currentStatus === "offline").length,
    averageSlaPercent,
    openAlerts: rows.reduce((sum, row) => sum + row.openAlerts, 0),
    warningRows: rows.filter((row) => row.predictiveSeverity === "warning").length,
    upcomingExpirations: rows.filter((row) => row.nextExpiration).length,
    dateRange: {
      from: filters.dateFrom ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: filters.dateTo ?? new Date(),
    },
    mode: filters.mode ?? "certificate",
  };
}

function buildEvidenceHref(row: DashboardRow): string {
  if (row.rowType === "certificate") {
    const params = new URLSearchParams({ tab: "timeline", mode: "certificate" });
    return `/reporting/${row.id}?${params.toString()}`;
  }
  const params = new URLSearchParams({ mode: "crl", snapshotHash: row.id });
  return `/reporting?${params.toString()}`;
}

function isAtRiskRow(row: DashboardRow): boolean {
  return row.currentStatus !== "healthy" || row.predictiveSeverity !== null || row.openAlerts > 0;
}

function getRiskPriority(row: DashboardRow): number {
  const statusScore = row.currentStatus === "offline" ? 300 : row.currentStatus === "degraded" ? 200 : 0;
  const predictiveScore = row.predictiveSeverity === "critical" ? 80 : row.predictiveSeverity === "warning" ? 40 : 0;
  const alertScore = Math.min(row.openAlerts, 10) * 5;
  const expirationScore = row.nextExpiration ? 20 : 0;
  const slaScore = Math.max(0, 100 - row.slaPercent);
  return statusScore + predictiveScore + alertScore + expirationScore + slaScore;
}

function toExecutiveRiskItem(row: DashboardRow): ExecutiveRiskItem {
  return {
    id: row.id,
    name: row.name,
    currentStatus: row.currentStatus,
    predictiveSeverity: row.predictiveSeverity,
    predictiveType: row.predictiveType,
    openAlerts: row.openAlerts,
    slaPercent: row.slaPercent,
    nextExpiration: row.nextExpiration,
    latestUnavailabilityAt: row.latestUnavailabilityAt,
    structuredTags: row.structuredTags,
    evidenceHref: buildEvidenceHref(row),
  };
}

function buildBreakdownBuckets(
  rows: DashboardRow[],
  key: keyof StructuredTags,
): ExecutiveBreakdownBucket[] {
  const grouped = new Map<string, DashboardRow[]>();
  for (const row of rows) {
    const label = row.structuredTags[key] ?? "unassigned";
    grouped.set(label, [...(grouped.get(label) ?? []), row]);
  }
  return [...grouped.entries()]
    .map(([label, bucketRows]) => ({
      label,
      total: bucketRows.length,
      healthy: bucketRows.filter((row) => row.currentStatus === "healthy").length,
      degraded: bucketRows.filter((row) => row.currentStatus === "degraded").length,
      offline: bucketRows.filter((row) => row.currentStatus === "offline").length,
      atRisk: bucketRows.filter(isAtRiskRow).length,
      openAlerts: bucketRows.reduce((sum, row) => sum + row.openAlerts, 0),
    }))
    .sort((left, right) => right.atRisk - left.atRisk || right.total - left.total || left.label.localeCompare(right.label))
    .slice(0, 5);
}

async function buildExecutiveTrend(
  filters: ReportFilters,
  principal?: AuthenticatedPrincipal,
): Promise<ExecutiveTrendPoint[]> {
  const baseFrom = filters.dateFrom ?? new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
  const baseTo = filters.dateTo ?? new Date();
  const totalWindowMs = Math.max(4, baseTo.getTime() - baseFrom.getTime());
  const bucketMs = Math.max(24 * 60 * 60 * 1000, Math.floor(totalWindowMs / 4));
  const points: ExecutiveTrendPoint[] = [];
  for (let index = 0; index < 4; index += 1) {
    const start = new Date(baseFrom.getTime() + bucketMs * index);
    const end = index === 3 ? baseTo : new Date(Math.min(baseTo.getTime(), start.getTime() + bucketMs));
    const rows = await buildDashboardRows({ ...filters, dateFrom: start, dateTo: end }, principal);
    points.push({
      label: `${start.toISOString().slice(5, 10)}-${end.toISOString().slice(5, 10)}`,
      healthy: rows.filter((row) => row.currentStatus === "healthy").length,
      degraded: rows.filter((row) => row.currentStatus === "degraded").length,
      offline: rows.filter((row) => row.currentStatus === "offline").length,
      atRisk: rows.filter(isAtRiskRow).length,
    });
  }
  return points;
}

export async function buildExecutiveSummary(
  filters: ReportFilters = {},
  principal?: AuthenticatedPrincipal,
): Promise<ExecutiveSummary> {
  const summary = await buildDashboardSummary(filters, principal);
  const rows = await buildDashboardRows(filters, principal);
  const certificateRows = rows.filter((row) => row.rowType === "certificate");
  const topRisks = [...certificateRows]
    .sort((left, right) => getRiskPriority(right) - getRiskPriority(left))
    .slice(0, 5)
    .map(toExecutiveRiskItem);
  const upcomingRisks = [...certificateRows]
    .filter((row) => row.nextExpiration || row.predictiveType === "publication-delayed")
    .sort((left, right) => {
      const leftTime = left.nextExpiration ? new Date(left.nextExpiration).getTime() : Number.MAX_SAFE_INTEGER;
      const rightTime = right.nextExpiration ? new Date(right.nextExpiration).getTime() : Number.MAX_SAFE_INTEGER;
      return leftTime - rightTime || getRiskPriority(right) - getRiskPriority(left);
    })
    .slice(0, 5)
    .map(toExecutiveRiskItem);

  return {
    mode: summary.mode,
    dateRange: summary.dateRange,
    totalRows: summary.totalRows,
    healthyRows: summary.healthyRows,
    degradedRows: summary.degradedRows,
    offlineRows: summary.offlineRows,
    atRiskRows: rows.filter(isAtRiskRow).length,
    averageSlaPercent: summary.averageSlaPercent,
    openAlerts: summary.openAlerts,
    topRisks,
    upcomingRisks,
    trend: await buildExecutiveTrend(filters, principal),
    breakdowns: {
      trustSources: buildBreakdownBuckets(rows, "trustSource"),
      pkis: buildBreakdownBuckets(rows, "pki"),
      jurisdictions: buildBreakdownBuckets(rows, "jurisdiction"),
    },
  };
}

export async function buildDashboardFilterOptions(
  principal?: AuthenticatedPrincipal
): Promise<DashboardFilterOptions> {
  const visibleCertificates = await listVisibleCertificates(principal);
  const targetsById = new Map((await loadTargets()).map((target) => [target.id, target]));
  const visibleTargets = new Map<string, Target>();

  for (const visibleCertificate of visibleCertificates) {
    const links = await listCertificateCrlLinks(visibleCertificate.certificate.id);
    for (const link of links) {
      if (link.runtimeTargetId) {
        const target = targetsById.get(link.runtimeTargetId);
        if (target) {
          visibleTargets.set(target.id, target);
        }
      }
    }
  }

  const targets = [...visibleTargets.values()];
  return {
    sources: [...new Set(visibleCertificates.map((item) => item.certificate.sourceType))].sort(),
    issuers: [...new Set(targets.map((target) => target.issuer).filter(Boolean) as string[])].sort(),
    criticalities: [...new Set(targets.map((target) => target.criticality ?? "medium"))].sort(),
    owners: [...new Set(targets.map((target) => target.owner).filter(Boolean) as string[])].sort(),
    statuses: ["healthy", "degraded", "offline"],
    trustSources: [...new Set(visibleCertificates.map((item) => item.effectiveTags.trustSource).filter(Boolean) as string[])].sort(),
    pkis: [...new Set(visibleCertificates.map((item) => item.effectiveTags.pki).filter(Boolean) as string[])].sort(),
    jurisdictions: [
      ...new Set(visibleCertificates.map((item) => item.effectiveTags.jurisdiction).filter(Boolean) as string[]),
    ].sort(),
  };
}

export async function buildDetailEvidence(
  certificateId: string,
  filters: ReportFilters = {},
  principal?: AuthenticatedPrincipal
): Promise<DetailEvidence | null> {
  if (principal && !(await isCertificateVisibleToPrincipal(principal, certificateId))) {
    return null;
  }

  const certificate = await listCertificateRecords().then((items) =>
    items.find((item) => item.id === certificateId)
  );
  if (!certificate) {
    return null;
  }

  const groupIds = await listCertificateGroupIds(certificateId);
  const visibleGroupIds = principal?.isPlatformAdmin
    ? groupIds
    : groupIds.filter((groupId) =>
        principal?.groupRoles.some((membership) => membership.groupId === groupId)
      );
  const effectiveTags = await getEffectiveStructuredTags(certificate, visibleGroupIds);
  if (!matchesStructuredTags(effectiveTags, filters)) {
    return null;
  }

  const targetsById = new Map((await loadTargets()).map((target) => [target.id, target]));
  const links = await listCertificateCrlLinks(certificateId);
  const targetLinks = links.filter((link) => link.runtimeTargetId);
  const targetIds = targetLinks.map((link) => link.runtimeTargetId as string);
  const pollHistory = targetIds.flatMap((targetId) =>
    getTargetPolls(targetId, filters).map((poll) => ({
      targetId,
      targetLabel: targetsById.get(targetId)?.slug ?? targetId,
      occurredAt: poll.occurredAt,
      httpStatus: poll.status,
      timedOut: poll.coverageLost && poll.status === 0,
      durationMs: poll.durationMs,
      coverageLost: poll.coverageLost,
      hash: poll.hash ?? null,
    }))
  );
  const coverageWindows = targetIds.flatMap((targetId) =>
    getTargetCoverageGaps(targetId, filters).map((gap) => ({
      targetId,
      targetLabel: targetsById.get(targetId)?.slug ?? targetId,
      startTs: gap.startTs,
      endTs: gap.endTs,
      durationMs: (gap.endTs ?? new Date()).getTime() - gap.startTs.getTime(),
    }))
  );
  const alertHistory = targetIds.flatMap((targetId) =>
    getTargetAlerts(targetId, filters).map((alert) => ({
      ...alert,
      targetLabel: targetsById.get(targetId)?.slug ?? targetId,
    }))
  );
  const validationFailures = targetIds.flatMap((targetId) =>
    getTargetValidationEvents(targetId, filters)
      .filter((event) => !event.valid)
      .map((event) => ({
        targetId,
        targetLabel: targetsById.get(targetId)?.slug ?? targetId,
        occurredAt: event.occurredAt,
        reason: event.reason ?? "invalid-lcr",
        hash: event.hash ?? null,
      }))
  );
  const snapshots = targetIds.flatMap((targetId) =>
    getTargetSnapshots(targetId, filters).map((snapshot) => ({
      ...snapshot,
      targetLabel: targetsById.get(targetId)?.slug ?? targetId,
    }))
  );
  const statuses = targetIds.map((targetId) => getCurrentStatus(getTargetPolls(targetId, filters)));
  const latestIncidentAt = [...pollHistory]
    .filter((poll) => poll.coverageLost)
    .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime())[0]?.occurredAt ?? null;
  const nextExpiration =
    [...snapshots]
      .filter((snapshot) => snapshot.nextUpdate)
      .sort((left, right) => new Date(left.nextUpdate ?? 0).getTime() - new Date(right.nextUpdate ?? 0).getTime())[0]
      ?.nextUpdate ?? null;
  const windowDays = await getEffectivePredictiveWindowDays(visibleGroupIds);
  const predictiveState = evaluatePredictiveState(nextExpiration, windowDays);
  for (const targetId of targetIds) {
    await syncPredictiveState({
      certificateId,
      targetId,
      groupId: visibleGroupIds[0] ?? null,
      nextUpdate: nextExpiration,
      windowDays,
    });
  }
  const predictiveEvents = (await listPredictiveEventsByCertificate(certificateId)).filter((event) => {
    if (event.resolvedAt) {
      return inRange(event.resolvedAt, filters);
    }
    return inRange(event.createdAt, filters);
  });
  if (filters.predictiveType) {
    if (!predictiveState || predictiveState.predictiveType !== filters.predictiveType) {
      return null;
    }
  }

  return {
    certificate,
    summary: {
      currentStatus: worstStatus(statuses.length > 0 ? statuses : ["degraded"]),
      latestIncidentAt,
      slaPercent: Math.max(
        0,
        100 -
          calculateErrorBudget(
            targetIds.flatMap((targetId) => getTargetCoverageGaps(targetId, filters)),
            getWindowMs(filters)
          ) *
            100
      ),
      openAlerts: alertHistory.filter((alert) => !alert.resolvedAt).length,
      nextExpiration,
      predictiveSeverity: predictiveState?.severity ?? null,
      predictiveType: predictiveState?.predictiveType ?? null,
    },
    structuredTags: effectiveTags,
    groupIds: visibleGroupIds,
    derivedCrls: links.map((link) => ({
      url: link.crlUrl,
      ignored: link.ignored,
      targetId: link.runtimeTargetId,
      currentStatus: link.runtimeTargetId
        ? getCurrentStatus(getTargetPolls(link.runtimeTargetId, filters))
        : "degraded",
    })),
    pollHistory: pollHistory.sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime()),
    coverageWindows: coverageWindows.sort((left, right) => left.startTs.getTime() - right.startTs.getTime()),
    alertHistory: alertHistory.sort((left, right) => left.sentAt.getTime() - right.sentAt.getTime()),
    validationFailures: validationFailures.sort(
      (left, right) => left.occurredAt.getTime() - right.occurredAt.getTime()
    ),
    snapshots: snapshots.sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime()),
    predictiveEvents,
  };
}

export async function buildDetailFilterOptions(
  certificateId: string,
  principal?: AuthenticatedPrincipal
): Promise<DetailFilterOptions | null> {
  const detail = await buildDetailEvidence(certificateId, {}, principal);
  if (!detail) {
    return null;
  }

  return {
    httpStatuses: [...new Set(detail.pollHistory.map((poll) => poll.httpStatus))].sort((left, right) => left - right),
    severities: [
      ...new Set([
        ...detail.alertHistory.map((alert) => alert.severity),
        ...detail.predictiveEvents.map((event) => event.severity),
      ]),
    ].sort(),
    eventTypes: ["poll", "alert", "validation", "expiration", "recovery", "coverage-gap", "predictive"],
    snapshotHashes: [
      ...new Set(detail.snapshots.map((snapshot) => snapshot.hash).filter(Boolean) as string[]),
    ].sort(),
  };
}
