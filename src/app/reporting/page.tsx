import type { ReactElement } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { assertAuthenticated } from "../../auth/authorization";
import { getPrincipalTranslator } from "../../i18n";
import {
  buildDashboardFilterOptions,
  buildDashboardRows,
  buildDashboardSummary,
  type DashboardRow,
} from "../../reporting/read-models";
import {
  formatDateInputValue,
  parseReportFilters,
  type PeriodPreset,
  type ReportFilters,
  type SearchParamLike,
  withFilter,
} from "../../reporting/query-state";

const PANEL = {
  background: "var(--panel-bg)",
  borderRadius: "16px",
  border: "1px solid var(--panel-border)",
  padding: "16px",
} as const;

function formatDate(value: Date | null): string {
  return value ? value.toISOString() : "-";
}

function getStatusColor(status: DashboardRow["currentStatus"]): string {
  if (status === "healthy") {
    return "#22c55e";
  }
  if (status === "offline") {
    return "#ef4444";
  }
  return "#f59e0b";
}

function renderChipGroup(
  t: (key: string) => string,
  filters: ReportFilters,
  key: keyof ReportFilters,
  label: string,
  values: string[]
): ReactElement {
  return (
    <div>
      <div style={{ color: "var(--muted-color)", fontSize: "12px", marginBottom: "6px" }}>{label}</div>
      <Link href={`/reporting?${withFilter(filters, { [key]: undefined })}`} style={{ marginRight: "8px", color: "var(--link-color)" }}>
        {t("common.filters.all").toLowerCase()}
      </Link>
      {values.map((value) => (
        <Link
          key={value}
          href={`/reporting?${withFilter(filters, { [key]: value })}`}
          style={{
            marginRight: "8px",
            color: filters[key] === value ? "#fff" : "var(--link-color)",
            background: filters[key] === value ? "#2563eb" : "transparent",
            padding: "6px 10px",
            borderRadius: "999px",
            border: "1px solid var(--panel-border)",
            textDecoration: "none",
            display: "inline-block",
            marginBottom: "8px",
          }}
        >
          {key === "status" ? t(`common.status.${value}`) : value}
        </Link>
      ))}
    </div>
  );
}

function renderPresetLinks(
  t: (key: string) => string,
  filters: ReportFilters
): ReactElement {
  const presets: PeriodPreset[] = ["24h", "7d", "30d", "90d", "custom"];
  return (
    <div>
      <div style={{ color: "var(--muted-color)", fontSize: "12px", marginBottom: "6px" }}>{t("reporting.filter.period")}</div>
      {presets.map((preset) => (
        <Link
          key={preset}
          href={`/reporting?${withFilter(filters, preset === "custom" ? { preset } : { preset, dateFrom: undefined, dateTo: undefined })}`}
          style={{
            marginRight: "8px",
            color: filters.preset === preset ? "#fff" : "var(--link-color)",
            background: filters.preset === preset ? "#2563eb" : "transparent",
            padding: "6px 10px",
            borderRadius: "999px",
            border: "1px solid var(--panel-border)",
            textDecoration: "none",
            display: "inline-block",
            marginBottom: "8px",
          }}
        >
          {preset}
        </Link>
      ))}
    </div>
  );
}

function renderCustomDateForm(
  t: (key: string) => string,
  filters: ReportFilters
): ReactElement {
  return (
    <form action="/reporting" method="get" style={{ ...PANEL, display: "grid", gap: "12px" }}>
      <input type="hidden" name="preset" value="custom" />
      <input type="hidden" name="mode" value={filters.mode ?? "certificate"} />
      <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <label>
          <div style={{ color: "var(--muted-color)", fontSize: "12px" }}>{t("reporting.filter.from")}</div>
          <input type="date" name="dateFrom" defaultValue={formatDateInputValue(filters.dateFrom)} style={{ width: "100%", padding: "10px" }} />
        </label>
        <label>
          <div style={{ color: "var(--muted-color)", fontSize: "12px" }}>{t("reporting.filter.to")}</div>
          <input type="date" name="dateTo" defaultValue={formatDateInputValue(filters.dateTo)} style={{ width: "100%", padding: "10px" }} />
        </label>
      </div>
      <button type="submit" style={{ padding: "10px 14px" }}>
        {t("reporting.filter.applyCustomPeriod")}
      </button>
    </form>
  );
}

function renderSummaryCard(label: string, value: string | number): ReactElement {
  return (
    <article style={PANEL}>
      <div style={{ color: "var(--muted-color)", fontSize: "12px" }}>{label}</div>
      <strong style={{ fontSize: "28px" }}>{value}</strong>
    </article>
  );
}

export default async function ReportingPage({
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
  const [rows, summary, options] = await Promise.all([
    buildDashboardRows(filters, principal),
    buildDashboardSummary(filters, principal),
    buildDashboardFilterOptions(principal),
  ]);
  const { t } = await getPrincipalTranslator(principal);
  const query = withFilter(filters, {});

  return (
    <main style={{ padding: "32px", display: "grid", gap: "24px" }}>
      <header style={{ display: "grid", gap: "12px" }}>
        <p style={{ margin: 0, color: "var(--muted-color)" }}>{t("reporting.kicker")}</p>
        <h1 style={{ margin: 0, fontSize: "32px" }}>{t("reporting.title")}</h1>
        <p style={{ margin: 0, maxWidth: "960px", color: "var(--muted-color)" }}>
          {t("reporting.description")}
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <a href={`/reporting/export/dashboard.csv?${query}`} style={{ color: "var(--link-color)" }}>
            {t("common.actions.exportCsv")}
          </a>
          <a href={`/reporting/export/executive.pdf?${query}`} style={{ color: "var(--link-color)" }}>
            {t("reporting.exportExecutivePdf")}
          </a>
          <Link href="/settings" style={{ color: "var(--link-color)" }}>
            {t("reporting.settings")}
          </Link>
        </div>
      </header>

      <section style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}>
        {renderSummaryCard(t("reporting.summary.rows"), summary.totalRows)}
        {renderSummaryCard(t("reporting.summary.healthy"), summary.healthyRows)}
        {renderSummaryCard(t("reporting.summary.degraded"), summary.degradedRows)}
        {renderSummaryCard(t("reporting.summary.offline"), summary.offlineRows)}
        {renderSummaryCard(t("reporting.summary.averageSla"), `${summary.averageSlaPercent.toFixed(2)}%`)}
        {renderSummaryCard(t("reporting.summary.openAlerts"), summary.openAlerts)}
      </section>

      <section style={{ display: "grid", gap: "16px", gridTemplateColumns: "2fr 1fr" }}>
        <div style={{ ...PANEL, display: "grid", gap: "16px" }}>
          <div>
            <div style={{ color: "var(--muted-color)", fontSize: "12px", marginBottom: "6px" }}>{t("reporting.mode")}</div>
            <Link
              href={`/reporting?${withFilter(filters, { mode: "certificate" })}`}
              style={{ marginRight: "8px", color: filters.mode !== "crl" ? "#fff" : "var(--link-color)", background: filters.mode !== "crl" ? "#2563eb" : "transparent", padding: "6px 10px", borderRadius: "999px", border: "1px solid var(--panel-border)", textDecoration: "none" }}
            >
              {t("reporting.mode.certificate")}
            </Link>
            <Link
              href={`/reporting?${withFilter(filters, { mode: "crl" })}`}
              style={{ color: filters.mode === "crl" ? "#fff" : "var(--link-color)", background: filters.mode === "crl" ? "#2563eb" : "transparent", padding: "6px 10px", borderRadius: "999px", border: "1px solid var(--panel-border)", textDecoration: "none" }}
            >
              {t("reporting.mode.crl")}
            </Link>
          </div>
          <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
            {renderChipGroup(t, filters, "source", t("reporting.filter.source"), options.sources)}
            {renderChipGroup(t, filters, "issuer", t("reporting.filter.issuer"), options.issuers)}
            {renderChipGroup(t, filters, "criticality", t("reporting.filter.criticality"), options.criticalities)}
            {renderChipGroup(t, filters, "status", t("reporting.filter.status"), options.statuses)}
            {renderChipGroup(t, filters, "trustSource", t("reporting.filter.trustSource"), options.trustSources)}
            {renderChipGroup(t, filters, "pki", t("reporting.filter.pki"), options.pkis)}
            {renderChipGroup(t, filters, "jurisdiction", t("reporting.filter.jurisdiction"), options.jurisdictions)}
            {renderPresetLinks(t, filters)}
          </div>
        </div>
        {renderCustomDateForm(t, filters)}
      </section>

      <section style={{ overflowX: "auto", border: "1px solid var(--panel-border)", borderRadius: "16px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "var(--panel-bg)" }}>
            <tr>
              {[
                filters.mode === "crl" ? t("reporting.table.crl") : t("reporting.table.certificate"),
                t("reporting.table.source"),
                t("reporting.table.issuer"),
                t("reporting.table.criticality"),
                t("reporting.table.status"),
                t("reporting.table.predictive"),
                t("reporting.table.latestUnavailability"),
                t("reporting.table.slaPercent"),
                t("reporting.table.nextExpiration"),
                t("reporting.table.openAlerts"),
                t("reporting.table.trustSource"),
                t("reporting.table.pki"),
                t("reporting.table.jurisdiction"),
              ].map((label) => (
                <th key={label} style={{ textAlign: "left", padding: "12px", borderBottom: "1px solid var(--panel-border)" }}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.rowType}-${row.id}`}>
                <td style={{ padding: "12px", borderBottom: "1px solid var(--panel-border)" }}>
                  {row.rowType === "certificate" ? (
                    <Link href={`/reporting/${row.id}?${withFilter(filters, { tab: "timeline", mode: "certificate" })}`} style={{ color: "var(--link-color)" }}>
                      {row.name}
                    </Link>
                  ) : (
                    row.name
                  )}
                </td>
                <td style={{ padding: "12px", borderBottom: "1px solid var(--panel-border)" }}>{row.source}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid var(--panel-border)" }}>{row.issuer ?? "-"}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid var(--panel-border)" }}>{row.criticality}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid var(--panel-border)", color: getStatusColor(row.currentStatus) }}>{t(`common.status.${row.currentStatus}`)}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid var(--panel-border)" }}>
                  {row.predictiveSeverity
                    ? `${row.predictiveSeverity} / ${t(`settings.predictiveType.${row.predictiveType}`)}`
                    : "-"}
                </td>
                <td style={{ padding: "12px", borderBottom: "1px solid var(--panel-border)" }}>{formatDate(row.latestUnavailabilityAt)}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid var(--panel-border)" }}>{row.slaPercent.toFixed(2)}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid var(--panel-border)" }}>{row.nextExpiration ?? "-"}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid var(--panel-border)" }}>{row.openAlerts}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid var(--panel-border)" }}>{row.structuredTags.trustSource ?? "-"}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid var(--panel-border)" }}>{row.structuredTags.pki ?? "-"}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid var(--panel-border)" }}>{row.structuredTags.jurisdiction ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
