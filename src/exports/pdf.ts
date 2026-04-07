import { buildDashboardSummary, buildDetailEvidence, ReportFilters } from "../reporting/read-models";
import { buildAuditTimeline } from "../reporting/timeline";
import { serializeReportFilters } from "../reporting/query-state";
import { createPdfBytesFromHtml, stripHtmlToText } from "./pdf-engine.js";
import { renderExecutiveReportHtml, renderOperationalReportHtml } from "./pdf-templates.js";

export interface PdfExportResult {
  variant: "operational" | "executive";
  fileName: string;
  generatedAt: string;
  filtersApplied: Record<string, string>;
  html: string;
  text: string;
  bytes: Uint8Array;
}

export async function buildOperationalPdf(
  targetId: string,
  filters: ReportFilters = {}
): Promise<PdfExportResult> {
  const detail = await buildDetailEvidence(targetId, filters);
  const timeline = await buildAuditTimeline(targetId, filters);
  const generatedAt = new Date().toISOString();
  const filtersApplied = serializeReportFilters(filters);
  const html = renderOperationalReportHtml({
    generatedAt,
    filtersApplied,
    target: detail?.target.slug ?? targetId,
    summary: {
      currentStatus: detail?.summary.currentStatus ?? "unknown",
      latestIncidentAt: detail?.summary.latestIncidentAt?.toISOString() ?? "-",
      slaPercent: detail?.summary.slaPercent.toFixed(2) ?? "0.00",
      nextExpiration: detail?.summary.nextExpiration ?? "-",
      openAlerts: detail?.summary.openAlerts ?? 0,
    },
    timeline: timeline.map((event) => `${event.at.toISOString()} - ${event.type} - ${event.title} - ${event.detail}`),
    coverageWindows: (detail?.coverageWindows ?? []).map(
      (window) =>
        `${window.startTs.toISOString()} -> ${window.endTs?.toISOString() ?? "open"} (${window.durationMs}ms)`
    ),
    alertHistory: (detail?.alertHistory ?? []).map(
      (alert) => `${alert.sentAt.toISOString()} - ${alert.severity} - ${alert.recipients.join(", ")}`
    ),
    validationFailures: (detail?.validationFailures ?? []).map(
      (failure) => `${failure.occurredAt.toISOString()} - ${failure.reason} - ${failure.hash ?? "-"}`
    ),
    snapshots: (detail?.snapshots ?? []).map(
      (snapshot) =>
        `${snapshot.occurredAt.toISOString()} - ${snapshot.hash ?? "-"} - ${snapshot.statusLabel ?? "-"}`
    ),
  });
  const bytes = createPdfBytesFromHtml(html);
  const text = stripHtmlToText(html);

  return {
    variant: "operational",
    fileName: `${targetId}-operational.pdf`,
    generatedAt,
    filtersApplied,
    html,
    text,
    bytes,
  };
}

export async function buildExecutivePdf(filters: ReportFilters = {}): Promise<PdfExportResult> {
  const summary = await buildDashboardSummary(filters);
  const generatedAt = new Date().toISOString();
  const filtersApplied = serializeReportFilters(filters);
  const html = renderExecutiveReportHtml({
    generatedAt,
    filtersApplied,
    summary: {
      totalTargets: summary.totalTargets,
      healthyTargets: summary.healthyTargets,
      degradedTargets: summary.degradedTargets,
      offlineTargets: summary.offlineTargets,
      averageSlaPercent: summary.averageSlaPercent.toFixed(2),
      openAlerts: summary.openAlerts,
      upcomingExpirations: summary.upcomingExpirations,
      dateRange: {
        from: summary.dateRange.from.toISOString(),
        to: summary.dateRange.to.toISOString(),
      },
    },
  });
  const bytes = createPdfBytesFromHtml(html);
  const text = stripHtmlToText(html);

  return {
    variant: "executive",
    fileName: "executive-report.pdf",
    generatedAt,
    filtersApplied,
    html,
    text,
    bytes,
  };
}
