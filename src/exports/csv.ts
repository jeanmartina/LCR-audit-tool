import { buildDashboardRows, buildDetailEvidence, ReportFilters } from "../reporting/read-models";
import { serializeReportFilters } from "../reporting/query-state";

export interface CsvExportResult {
  fileName: string;
  generatedAt: string;
  filtersApplied: Record<string, string>;
  content: string;
}

function toCsv(headers: string[], rows: Array<Array<string | number | null>>): string {
  const encoded = [headers, ...rows].map((row) =>
    row
      .map((value) => `"${String(value ?? "").replaceAll("\"", "\"\"")}"`)
      .join(",")
  );
  return encoded.join("\n");
}

export async function exportDashboardCsv(filters: ReportFilters = {}): Promise<CsvExportResult> {
  const rows = await buildDashboardRows(filters);
  return {
    fileName: "dashboard.csv",
    generatedAt: new Date().toISOString(),
    filtersApplied: serializeReportFilters(filters),
    content: toCsv(
      [
        "targetId",
        "slug",
        "type",
        "source",
        "issuer",
        "owner",
        "criticality",
        "currentStatus",
        "latestUnavailabilityAt",
        "slaPercent",
        "nextExpiration",
        "openAlerts",
        "recentAlerts",
      ],
      rows.map((row) => [
        row.targetId,
        row.slug,
        row.type,
        row.source,
        row.issuer,
        row.owner,
        row.criticality,
        row.currentStatus,
        row.latestUnavailabilityAt?.toISOString() ?? null,
        row.slaPercent.toFixed(2),
        row.nextExpiration,
        row.openAlerts,
        row.recentAlerts,
      ])
    ),
  };
}

export async function exportTargetEvidenceCsv(
  targetId: string,
  filters: ReportFilters = {}
): Promise<CsvExportResult> {
  const detail = await buildDetailEvidence(targetId, filters);
  const rows = detail?.pollHistory ?? [];
  return {
    fileName: `${targetId}-evidence.csv`,
    generatedAt: new Date().toISOString(),
    filtersApplied: serializeReportFilters(filters),
    content: toCsv(
      ["occurredAt", "httpStatus", "timedOut", "durationMs", "coverageLost", "hash"],
      rows.map((row) => [
        row.occurredAt.toISOString(),
        row.httpStatus,
        String(row.timedOut),
        row.durationMs,
        String(row.coverageLost),
        row.hash,
      ])
    ),
  };
}

export async function exportCoverageGapsCsv(
  targetId: string,
  filters: ReportFilters = {}
): Promise<CsvExportResult> {
  const detail = await buildDetailEvidence(targetId, filters);
  return {
    fileName: `${targetId}-coverage-gaps.csv`,
    generatedAt: new Date().toISOString(),
    filtersApplied: serializeReportFilters(filters),
    content: toCsv(
      ["startTs", "endTs", "durationMs"],
      (detail?.coverageWindows ?? []).map((gap) => [
        gap.startTs.toISOString(),
        gap.endTs?.toISOString() ?? null,
        gap.durationMs,
      ])
    ),
  };
}

export async function exportAlertHistoryCsv(
  targetId: string,
  filters: ReportFilters = {}
): Promise<CsvExportResult> {
  const detail = await buildDetailEvidence(targetId, filters);
  return {
    fileName: `${targetId}-alerts.csv`,
    generatedAt: new Date().toISOString(),
    filtersApplied: serializeReportFilters(filters),
    content: toCsv(
      ["sentAt", "severity", "recipients", "resolvedAt"],
      (detail?.alertHistory ?? []).map((alert) => [
        alert.sentAt.toISOString(),
        alert.severity,
        alert.recipients.join(";"),
        alert.resolvedAt?.toISOString() ?? null,
      ])
    ),
  };
}

export async function exportSnapshotsCsv(
  targetId: string,
  filters: ReportFilters = {}
): Promise<CsvExportResult> {
  const detail = await buildDetailEvidence(targetId, filters);
  return {
    fileName: `${targetId}-snapshots.csv`,
    generatedAt: new Date().toISOString(),
    filtersApplied: serializeReportFilters(filters),
    content: toCsv(
      ["occurredAt", "hash", "issuer", "thisUpdate", "nextUpdate", "statusLabel"],
      (detail?.snapshots ?? []).map((snapshot) => [
        snapshot.occurredAt.toISOString(),
        snapshot.hash,
        snapshot.issuer,
        snapshot.thisUpdate,
        snapshot.nextUpdate,
        snapshot.statusLabel,
      ])
    ),
  };
}
