import { AuthenticatedPrincipal } from "../auth/authorization";
import { getPrincipalTranslator } from "../i18n";
import { buildDetailEvidence, buildExecutiveSummary, ReportFilters } from "../reporting/read-models";
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
  certificateId: string,
  filters: ReportFilters = {},
  principal?: AuthenticatedPrincipal
): Promise<PdfExportResult> {
  const { t } = await getPrincipalTranslator(principal);
  const detail = await buildDetailEvidence(certificateId, filters, principal);
  const timeline = await buildAuditTimeline(certificateId, filters);
  const generatedAt = new Date().toISOString();
  const filtersApplied = serializeReportFilters(filters);
  const html = renderOperationalReportHtml({
    generatedAt,
    filtersApplied,
    target: detail?.certificate.displayName ?? certificateId,
    summary: {
      currentStatus: detail?.summary.currentStatus
        ? t(`common.status.${detail.summary.currentStatus}`)
        : "unknown",
      latestIncidentAt: detail?.summary.latestIncidentAt?.toISOString() ?? "-",
      slaPercent: detail?.summary.slaPercent.toFixed(2) ?? "0.00",
      nextExpiration: detail?.summary.nextExpiration ?? "-",
      openAlerts: detail?.summary.openAlerts ?? 0,
    },
    timeline: timeline.map((event) => `${event.at.toISOString()} - ${event.type} - ${event.title} - ${event.detail}`),
    coverageWindows: (detail?.coverageWindows ?? []).map(
      (window) =>
        `${window.targetLabel}: ${window.startTs.toISOString()} -> ${window.endTs?.toISOString() ?? "open"} (${window.durationMs}ms)`
    ),
    alertHistory: (detail?.alertHistory ?? []).map(
      (alert) => `${alert.targetLabel}: ${alert.sentAt.toISOString()} - ${alert.severity} - ${alert.recipients.join(", ")}`
    ),
    validationFailures: (detail?.validationFailures ?? []).map(
      (failure) => `${failure.targetLabel}: ${failure.occurredAt.toISOString()} - ${failure.reason} - ${failure.hash ?? "-"}`
    ),
    snapshots: (detail?.snapshots ?? []).map(
      (snapshot) =>
        `${snapshot.targetLabel}: ${snapshot.occurredAt.toISOString()} - ${snapshot.hash ?? "-"} - ${snapshot.statusLabel ?? "-"}`
    ),
    labels: {
      title: t("exports.pdf.operational.title"),
      generatedAt: t("exports.pdf.operational.generatedAt"),
      target: t("exports.pdf.operational.target"),
      scope: t("exports.pdf.operational.scope"),
      noFilters: t("exports.pdf.noFilters"),
      filterLabels: {
        mode: t("reporting.mode"),
        source: t("reporting.filter.source"),
        issuer: t("reporting.filter.issuer"),
        criticality: t("reporting.filter.criticality"),
        status: t("reporting.filter.status"),
        trustSource: t("reporting.filter.trustSource"),
        pki: t("reporting.filter.pki"),
        jurisdiction: t("reporting.filter.jurisdiction"),
        dateFrom: t("reporting.filter.from"),
        dateTo: t("reporting.filter.to"),
        severity: t("reporting.filter.severity"),
        eventType: t("reporting.filter.eventType"),
        snapshotHash: t("reporting.filter.snapshotHash"),
      },
      sections: {
        filters: t("exports.pdf.section.filters"),
        summary: t("exports.pdf.section.targetSummary"),
        timeline: t("exports.pdf.section.timeline"),
        coverage: t("exports.pdf.section.coverage"),
        alerts: t("exports.pdf.section.alerts"),
        validation: t("exports.pdf.section.validation"),
        snapshots: t("exports.pdf.section.snapshots"),
      },
      metrics: {
        status: t("exports.pdf.target.status"),
        latestIncident: t("exports.pdf.target.latestIncident"),
        sla: t("exports.pdf.target.sla"),
        nextExpiration: t("exports.pdf.target.nextExpiration"),
        openAlerts: t("exports.pdf.target.openAlerts"),
      },
    },
  });
  const bytes = createPdfBytesFromHtml(html);
  const text = stripHtmlToText(html);

  return {
    variant: "operational",
    fileName: `${certificateId}-operational.pdf`,
    generatedAt,
    filtersApplied,
    html,
    text,
    bytes,
  };
}

export async function buildExecutivePdf(
  filters: ReportFilters = {},
  principal?: AuthenticatedPrincipal
): Promise<PdfExportResult> {
  const { t } = await getPrincipalTranslator(principal);
  const summary = await buildExecutiveSummary(filters, principal);
  const generatedAt = new Date().toISOString();
  const filtersApplied = serializeReportFilters(filters);
  const html = renderExecutiveReportHtml({
    generatedAt,
    filtersApplied,
    summary: {
      totalTargets: summary.totalRows,
      healthyTargets: summary.healthyRows,
      degradedTargets: summary.degradedRows,
      offlineTargets: summary.offlineRows,
      atRiskTargets: summary.atRiskRows,
      averageSlaPercent: summary.averageSlaPercent.toFixed(2),
      openAlerts: summary.openAlerts,
      upcomingExpirations: summary.upcomingRisks.length,
      dateRange: {
        from: summary.dateRange.from.toISOString(),
        to: summary.dateRange.to.toISOString(),
      },
      topRisks: summary.topRisks.map((item) => `${item.name} | ${item.currentStatus} | alerts:${item.openAlerts} | sla:${item.slaPercent.toFixed(2)}`),
      upcomingRisks: summary.upcomingRisks.map((item) => `${item.name} | ${item.nextExpiration ?? "-"} | ${item.predictiveType ?? "none"}`),
      trend: summary.trend.map((point) => `${point.label} | H:${point.healthy} D:${point.degraded} O:${point.offline} R:${point.atRisk}`),
      breakdowns: {
        trustSources: summary.breakdowns.trustSources.map((item) => `${item.label} | total:${item.total} | risk:${item.atRisk}`),
        pkis: summary.breakdowns.pkis.map((item) => `${item.label} | total:${item.total} | risk:${item.atRisk}`),
        jurisdictions: summary.breakdowns.jurisdictions.map((item) => `${item.label} | total:${item.total} | risk:${item.atRisk}`),
      },
    },
    labels: {
      title: t("exports.pdf.executive.title"),
      generatedAt: t("exports.pdf.executive.generatedAt"),
      scope: t("exports.pdf.executive.scope"),
      period: t("exports.pdf.executive.period"),
      noFilters: t("exports.pdf.noFilters"),
      filterLabels: {
        mode: t("reporting.mode"),
        source: t("reporting.filter.source"),
        issuer: t("reporting.filter.issuer"),
        criticality: t("reporting.filter.criticality"),
        status: t("reporting.filter.status"),
        trustSource: t("reporting.filter.trustSource"),
        pki: t("reporting.filter.pki"),
        jurisdiction: t("reporting.filter.jurisdiction"),
        dateFrom: t("reporting.filter.from"),
        dateTo: t("reporting.filter.to"),
        preset: t("reporting.filter.period"),
      },
      sections: {
        filters: t("exports.pdf.section.filters"),
        summary: t("exports.pdf.section.summary"),
        posture: t("exports.pdf.section.posture"),
        topRisks: t("exports.pdf.section.topRisks"),
        upcomingRisks: t("exports.pdf.section.upcomingRisks"),
        trend: t("exports.pdf.section.trend"),
        breakdowns: t("exports.pdf.section.breakdowns"),
        trustSources: t("exports.pdf.section.trustSources"),
        pkis: t("exports.pdf.section.pkis"),
        jurisdictions: t("exports.pdf.section.jurisdictions"),
      },
      metrics: {
        targets: t("exports.pdf.summary.targets"),
        healthy: t("exports.pdf.summary.healthy"),
        degraded: t("exports.pdf.summary.degraded"),
        offline: t("exports.pdf.summary.offline"),
        atRisk: t("exports.pdf.summary.atRisk"),
        averageSla: t("exports.pdf.summary.averageSla"),
        openAlerts: t("exports.pdf.summary.openAlerts"),
        upcomingExpirations: t("exports.pdf.summary.upcomingExpirations"),
      },
    },
  });
  const bytes = createPdfBytesFromHtml(html);
  const text = stripHtmlToText(html);

  return {
    variant: "executive",
    fileName: `${summary.mode}-executive-report.pdf`,
    generatedAt,
    filtersApplied,
    html,
    text,
    bytes,
  };
}
