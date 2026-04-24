import type { ReactElement } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { assertAuthenticated } from "../../../auth/authorization";
import { PageHeader, PageShell, Panel, StatusPill, stackStyle } from "../../../components/ui/primitives";
import { getPrincipalTranslator } from "../../../i18n";
import { buildExecutiveSummary } from "../../../reporting/read-models";
import { parseReportFilters, type SearchParamLike, withFilter } from "../../../reporting/query-state";
import { ExecutivePrintButton } from "./print-button";

const cardGridStyle = {
  display: "grid",
  gap: "16px",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
};

function statusTone(status: "healthy" | "degraded" | "offline"): "success" | "warning" | "neutral" {
  return status === "healthy" ? "success" : status === "offline" ? "warning" : "neutral";
}

function formatMaybeDate(value: string | Date | null | undefined): string {
  if (!value) return "-";
  if (value instanceof Date) return value.toISOString();
  return value;
}

export default async function ExecutiveReportingPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamLike>;
}): Promise<ReactElement> {
  let principal;
  try {
    principal = await assertAuthenticated();
  } catch {
    redirect("/auth");
  }

  const filters = parseReportFilters((await searchParams) ?? {});
  const [summary, { t }] = await Promise.all([
    buildExecutiveSummary(filters, principal),
    getPrincipalTranslator(principal),
  ]);
  const query = withFilter(filters, {});

  return (
    <PageShell>
      <style>{`
        @media print {
          [data-no-print="true"] { display: none !important; }
          main { max-width: none !important; padding: 0 !important; }
          section { break-inside: avoid; box-shadow: none !important; }
        }
      `}</style>

      <div data-no-print="true">
        <PageHeader
          backHref="/reporting"
          backLabel={t("reporting.executive.backToReporting")}
          kicker={t("reporting.executive.kicker")}
          title={t("reporting.executive.title")}
          description={t("reporting.executive.description")}
        />
      </div>

      <div data-no-print="true" style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <Link href={`/reporting?${query}`} style={{ color: "var(--link-color)" }}>
          {t("reporting.executive.openOperational")}
        </Link>
        <a href={`/reporting/export/executive.pdf?${query}`} style={{ color: "var(--link-color)" }}>
          {t("reporting.exportExecutivePdf")}
        </a>
        <ExecutivePrintButton label={t("reporting.executive.print")} />
      </div>

      <Panel title={t("reporting.executive.scopeTitle")} description={t("reporting.executive.scopeBody")} compact>
        <div style={stackStyle("6px")}>
          <span>{t("reporting.executive.period")}: {summary.dateRange.from.toISOString()} {"->"} {summary.dateRange.to.toISOString()}</span>
          <span>{t("reporting.executive.mode")}: {summary.mode}</span>
        </div>
      </Panel>

      <section style={cardGridStyle}>
        {[
          [t("reporting.summary.healthy"), summary.healthyRows],
          [t("reporting.summary.degraded"), summary.degradedRows],
          [t("reporting.summary.offline"), summary.offlineRows],
          [t("reporting.executive.summary.atRisk"), summary.atRiskRows],
          [t("reporting.summary.openAlerts"), summary.openAlerts],
          [t("reporting.summary.averageSla"), `${summary.averageSlaPercent.toFixed(2)}%`],
        ].map(([label, value]) => (
          <Panel key={String(label)} compact>
            <div style={{ color: "var(--muted-color)", fontSize: "12px" }}>{label}</div>
            <strong style={{ fontSize: "28px" }}>{value}</strong>
          </Panel>
        ))}
      </section>

      <section style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <Panel title={t("reporting.executive.topRisks.title")} description={t("reporting.executive.topRisks.description")}>
          <div style={stackStyle("12px")}>
            {summary.topRisks.map((item) => (
              <article key={item.id} style={{ borderTop: "1px solid var(--panel-border)", paddingTop: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                  <strong>{item.name}</strong>
                  <StatusPill tone={statusTone(item.currentStatus)}>{t(`common.status.${item.currentStatus}`)}</StatusPill>
                </div>
                <div style={stackStyle("4px")}>
                  <span>{t("reporting.table.openAlerts")}: {item.openAlerts}</span>
                  <span>{t("reporting.table.slaPercent")}: {item.slaPercent.toFixed(2)}</span>
                  <span>{t("reporting.table.nextExpiration")}: {formatMaybeDate(item.nextExpiration)}</span>
                  <Link href={item.evidenceHref} style={{ color: "var(--link-color)" }}>{t("reporting.executive.evidenceLink")}</Link>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title={t("reporting.executive.upcoming.title")} description={t("reporting.executive.upcoming.description")}>
          <div style={stackStyle("12px")}>
            {summary.upcomingRisks.map((item) => (
              <article key={item.id} style={{ borderTop: "1px solid var(--panel-border)", paddingTop: "12px" }}>
                <strong>{item.name}</strong>
                <div style={stackStyle("4px")}>
                  <span>{t("reporting.table.nextExpiration")}: {formatMaybeDate(item.nextExpiration)}</span>
                  <span>{t("reporting.table.predictive")}: {item.predictiveType ?? "-"}</span>
                  <Link href={item.evidenceHref} style={{ color: "var(--link-color)" }}>{t("reporting.executive.evidenceLink")}</Link>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </section>

      <section style={{ display: "grid", gap: "16px", gridTemplateColumns: "2fr 1fr" }}>
        <Panel title={t("reporting.executive.trend.title")} description={t("reporting.executive.trend.description")}>
          <div style={{ display: "grid", gap: "12px" }}>
            {summary.trend.map((point) => (
              <div key={point.label} style={{ display: "grid", gap: "6px" }}>
                <strong>{point.label}</strong>
                <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
                  <span>{t("reporting.summary.healthy")}: {point.healthy}</span>
                  <span>{t("reporting.summary.degraded")}: {point.degraded}</span>
                  <span>{t("reporting.summary.offline")}: {point.offline}</span>
                  <span>{t("reporting.executive.summary.atRisk")}: {point.atRisk}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={t("reporting.executive.breakdowns.title")} description={t("reporting.executive.breakdowns.description")}>
          <div style={stackStyle("12px")}>
            {(
              [
                { label: t("reporting.filter.trustSource"), buckets: summary.breakdowns.trustSources },
                { label: t("reporting.filter.pki"), buckets: summary.breakdowns.pkis },
                { label: t("reporting.filter.jurisdiction"), buckets: summary.breakdowns.jurisdictions },
              ] as Array<{ label: string; buckets: typeof summary.breakdowns.trustSources }>
            ).map((section) => (
              <div key={section.label}>
                <strong>{section.label}</strong>
                <ul>
                  {section.buckets.map((bucket) => (
                    <li key={bucket.label}>{bucket.label}: {bucket.atRisk}/{bucket.total}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </PageShell>
  );
}
