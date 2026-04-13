import { AuthenticatedPrincipal } from "../auth/authorization";
import { getPrincipalTranslator } from "../i18n";
import { buildDashboardRows, buildDetailEvidence, ReportFilters } from "../reporting/read-models";

export interface CsvExportResult {
  fileName: string;
  content: string;
}

function toCsv(rows: Array<Array<string | number | null>>): string {
  return rows
    .map((columns) =>
      columns
        .map((value) => `"${String(value ?? "").replaceAll("\"", "\"\"")}"`)
        .join(",")
    )
    .join("\n");
}

export async function exportDashboardCsv(
  filters: ReportFilters = {},
  principal?: AuthenticatedPrincipal
): Promise<CsvExportResult> {
  const { t } = await getPrincipalTranslator(principal);
  const rows = await buildDashboardRows(filters, principal);
  const header = [
    t("exports.csv.dashboard.rowType"),
    t("exports.csv.dashboard.id"),
    t("exports.csv.dashboard.name"),
    t("exports.csv.dashboard.source"),
    t("exports.csv.dashboard.issuer"),
    t("exports.csv.dashboard.owner"),
    t("exports.csv.dashboard.criticality"),
    t("exports.csv.dashboard.currentStatus"),
    t("exports.csv.dashboard.latestUnavailabilityAt"),
    t("exports.csv.dashboard.slaPercent"),
    t("exports.csv.dashboard.errorBudgetUsed"),
    t("exports.csv.dashboard.nextExpiration"),
    t("exports.csv.dashboard.openAlerts"),
    t("exports.csv.dashboard.recentAlerts"),
    t("exports.csv.dashboard.predictiveSeverity"),
    t("exports.csv.dashboard.predictiveType"),
    t("exports.csv.dashboard.trustSource"),
    t("exports.csv.dashboard.pki"),
    t("exports.csv.dashboard.jurisdiction"),
    t("exports.csv.dashboard.linkedCertificateCount"),
    t("exports.csv.dashboard.linkedCrlCount"),
  ];

  return {
    fileName: `${filters.mode ?? "certificate"}-dashboard.csv`,
    content: toCsv([
      header,
      ...rows.map((row) => [
        row.rowType,
        row.id,
        row.name,
        row.source,
        row.issuer,
        row.owner,
        row.criticality,
        t(`common.status.${row.currentStatus}`),
        row.latestUnavailabilityAt?.toISOString() ?? null,
        row.slaPercent.toFixed(2),
        row.errorBudgetUsed.toFixed(4),
        row.nextExpiration,
        row.openAlerts,
        row.recentAlerts,
        row.predictiveSeverity,
        row.predictiveType ? t(`settings.predictiveType.${row.predictiveType}`) : null,
        row.structuredTags.trustSource,
        row.structuredTags.pki,
        row.structuredTags.jurisdiction,
        row.linkedCertificateCount,
        row.linkedCrlCount,
      ]),
    ]),
  };
}

export async function exportTargetEvidenceCsv(
  certificateId: string,
  filters: ReportFilters = {},
  principal?: AuthenticatedPrincipal
): Promise<CsvExportResult> {
  const { t } = await getPrincipalTranslator(principal);
  const detail = await buildDetailEvidence(certificateId, filters, principal);
  return {
    fileName: `${certificateId}-polls.csv`,
    content: toCsv([
      [
        t("exports.csv.polls.targetLabel"),
        t("exports.csv.polls.occurredAt"),
        t("exports.csv.polls.httpStatus"),
        t("exports.csv.polls.timedOut"),
        t("exports.csv.polls.durationMs"),
        t("exports.csv.polls.coverageLost"),
        t("exports.csv.polls.hash"),
      ],
      ...(detail?.pollHistory ?? []).map((poll) => [
        poll.targetLabel,
        poll.occurredAt.toISOString(),
        poll.httpStatus,
        String(poll.timedOut),
        poll.durationMs,
        String(poll.coverageLost),
        poll.hash,
      ]),
    ]),
  };
}

export async function exportCoverageGapsCsv(
  certificateId: string,
  filters: ReportFilters = {},
  principal?: AuthenticatedPrincipal
): Promise<CsvExportResult> {
  const { t } = await getPrincipalTranslator(principal);
  const detail = await buildDetailEvidence(certificateId, filters, principal);
  return {
    fileName: `${certificateId}-coverage-gaps.csv`,
    content: toCsv([
      [
        t("exports.csv.polls.targetLabel"),
        t("exports.csv.coverage.startTs"),
        t("exports.csv.coverage.endTs"),
        t("exports.csv.coverage.durationMs"),
      ],
      ...(detail?.coverageWindows ?? []).map((gap) => [
        gap.targetLabel,
        gap.startTs.toISOString(),
        gap.endTs?.toISOString() ?? null,
        gap.durationMs,
      ]),
    ]),
  };
}

export async function exportAlertHistoryCsv(
  certificateId: string,
  filters: ReportFilters = {},
  principal?: AuthenticatedPrincipal
): Promise<CsvExportResult> {
  const { t } = await getPrincipalTranslator(principal);
  const detail = await buildDetailEvidence(certificateId, filters, principal);
  return {
    fileName: `${certificateId}-alerts.csv`,
    content: toCsv([
      [
        t("exports.csv.polls.targetLabel"),
        t("exports.csv.alerts.sentAt"),
        t("exports.csv.alerts.severity"),
        t("exports.csv.alerts.recipients"),
        t("exports.csv.alerts.deliveryState"),
        t("exports.csv.alerts.resolvedAt"),
      ],
      ...(detail?.alertHistory ?? []).map((alert) => [
        alert.targetLabel,
        alert.sentAt.toISOString(),
        alert.severity,
        alert.recipients.join(";"),
        alert.deliveryState,
        alert.resolvedAt?.toISOString() ?? null,
      ]),
    ]),
  };
}

export async function exportSnapshotsCsv(
  certificateId: string,
  filters: ReportFilters = {},
  principal?: AuthenticatedPrincipal
): Promise<CsvExportResult> {
  const { t } = await getPrincipalTranslator(principal);
  const detail = await buildDetailEvidence(certificateId, filters, principal);
  return {
    fileName: `${certificateId}-snapshots.csv`,
    content: toCsv([
      [
        t("exports.csv.polls.targetLabel"),
        t("exports.csv.polls.occurredAt"),
        t("exports.csv.polls.hash"),
        t("exports.csv.snapshots.issuer"),
        t("exports.csv.snapshots.thisUpdate"),
        t("exports.csv.snapshots.nextUpdate"),
        t("exports.csv.snapshots.statusLabel"),
      ],
      ...(detail?.snapshots ?? []).map((snapshot) => [
        snapshot.targetLabel,
        snapshot.occurredAt.toISOString(),
        snapshot.hash,
        snapshot.issuer,
        snapshot.thisUpdate,
        snapshot.nextUpdate,
        snapshot.statusLabel,
      ]),
    ]),
  };
}
