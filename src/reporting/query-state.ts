export interface SearchParamLike {
  [key: string]: string | string[] | undefined;
}

export type ReportMode = "certificate" | "crl";

export type ReportTab =
  | "timeline"
  | "polls"
  | "coverage-gaps"
  | "alerts"
  | "validation"
  | "snapshots";

export type TimelineFilterEventType =
  | "poll"
  | "alert"
  | "validation"
  | "expiration"
  | "recovery"
  | "coverage-gap"
  | "predictive";

export type PredictiveFilterType = "upcoming-expiration" | "publication-delayed";

export type PeriodPreset = "24h" | "7d" | "30d" | "90d" | "custom";

export interface ReportFilters {
  mode?: ReportMode;
  source?: string;
  issuer?: string;
  criticality?: string;
  owner?: string;
  status?: string;
  trustSource?: string;
  pki?: string;
  jurisdiction?: string;
  predictiveType?: PredictiveFilterType;
  dateFrom?: Date;
  dateTo?: Date;
  httpStatus?: number;
  severity?: string;
  eventType?: TimelineFilterEventType;
  snapshotHash?: string;
  tab?: ReportTab;
  preset?: PeriodPreset;
}

const PERIOD_PRESET_MS: Record<Exclude<PeriodPreset, "custom">, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
};

function takeFirst(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseDate(value: string | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function parseInteger(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function getDefaultReportWindow(now: Date = new Date()): {
  dateFrom: Date;
  dateTo: Date;
  preset: PeriodPreset;
} {
  return {
    dateFrom: new Date(now.getTime() - PERIOD_PRESET_MS["30d"]),
    dateTo: now,
    preset: "30d",
  };
}

export function parseReportFilters(searchParams: SearchParamLike = {}): ReportFilters {
  const presetValue = takeFirst(searchParams.preset);
  const preset =
    presetValue === "24h" ||
    presetValue === "7d" ||
    presetValue === "30d" ||
    presetValue === "90d" ||
    presetValue === "custom"
      ? presetValue
      : undefined;

  const defaults = getDefaultReportWindow();
  const dateFrom = parseDate(takeFirst(searchParams.dateFrom));
  const dateTo = parseDate(takeFirst(searchParams.dateTo));
  const resolvedPreset = preset ?? (dateFrom || dateTo ? "custom" : defaults.preset);

  let resolvedFrom = dateFrom;
  let resolvedTo = dateTo;

  if (!dateFrom && !dateTo && resolvedPreset !== "custom") {
    const now = new Date();
    resolvedTo = now;
    resolvedFrom = new Date(now.getTime() - PERIOD_PRESET_MS[resolvedPreset]);
  } else {
    resolvedFrom = dateFrom ?? defaults.dateFrom;
    resolvedTo = dateTo ?? defaults.dateTo;
  }

  const eventType = takeFirst(searchParams.eventType);
  const tab = takeFirst(searchParams.tab);
  const mode = takeFirst(searchParams.mode);
  const predictiveType = takeFirst(searchParams.predictiveType);

  return {
    mode: mode === "crl" ? "crl" : "certificate",
    source: takeFirst(searchParams.source) || undefined,
    issuer: takeFirst(searchParams.issuer) || undefined,
    criticality: takeFirst(searchParams.criticality) || undefined,
    owner: takeFirst(searchParams.owner) || undefined,
    status: takeFirst(searchParams.status) || undefined,
    trustSource: takeFirst(searchParams.trustSource) || undefined,
    pki: takeFirst(searchParams.pki) || undefined,
    jurisdiction: takeFirst(searchParams.jurisdiction) || undefined,
    predictiveType:
      predictiveType === "upcoming-expiration" || predictiveType === "publication-delayed"
        ? predictiveType
        : undefined,
    dateFrom: resolvedFrom,
    dateTo: resolvedTo,
    httpStatus: parseInteger(takeFirst(searchParams.httpStatus)),
    severity: takeFirst(searchParams.severity) || undefined,
    eventType:
      eventType === "poll" ||
      eventType === "alert" ||
      eventType === "validation" ||
      eventType === "expiration" ||
      eventType === "recovery" ||
      eventType === "coverage-gap" ||
      eventType === "predictive"
        ? eventType
        : undefined,
    snapshotHash: takeFirst(searchParams.snapshotHash) || undefined,
    tab:
      tab === "timeline" ||
      tab === "polls" ||
      tab === "coverage-gaps" ||
      tab === "alerts" ||
      tab === "validation" ||
      tab === "snapshots"
        ? tab
        : "timeline",
    preset: resolvedPreset,
  };
}

export function serializeReportFilters(filters: ReportFilters): Record<string, string> {
  return Object.fromEntries(
    Object.entries(filters).flatMap(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return [];
      }
      if (value instanceof Date) {
        return [[key, value.toISOString()]];
      }
      return [[key, String(value)]];
    })
  );
}

export function toSearchParams(filters: ReportFilters): URLSearchParams {
  return new URLSearchParams(serializeReportFilters(filters));
}

export function withFilter(filters: ReportFilters, patch: Partial<ReportFilters>): string {
  return toSearchParams({ ...filters, ...patch }).toString();
}

export function formatDateInputValue(value: Date | undefined): string {
  return value ? value.toISOString().slice(0, 10) : "";
}
