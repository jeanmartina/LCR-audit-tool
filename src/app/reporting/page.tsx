import type { ReactElement } from "react";
import Link from "next/link";
import {
  buildDashboardFilterOptions,
  buildDashboardRows,
  buildDashboardSummary,
  DashboardRow,
} from "../../reporting/read-models";
import {
  formatDateInputValue,
  parseReportFilters,
  PeriodPreset,
  ReportFilters,
  SearchParamLike,
  withFilter,
} from "../../reporting/query-state";

const PAGE_STYLES = {
  panel: {
    background: "#1e293b",
    borderRadius: "16px",
    border: "1px solid #334155",
    padding: "16px",
  } as const,
  label: {
    color: "#94a3b8",
    fontSize: "12px",
    marginBottom: "6px",
  } as const,
  chip: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "999px",
    border: "1px solid #475569",
    color: "#cbd5e1",
    textDecoration: "none",
    fontSize: "13px",
    marginRight: "8px",
    marginBottom: "8px",
  } as const,
};

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
  filters: ReportFilters,
  key: keyof ReportFilters,
  label: string,
  values: string[]
): ReactElement {
  return (
    <div>
      <div style={PAGE_STYLES.label}>{label}</div>
      <Link href={`/reporting?${withFilter(filters, { [key]: undefined })}`} style={PAGE_STYLES.chip}>
        todos
      </Link>
      {values.map((value) => (
        <Link
          key={value}
          href={`/reporting?${withFilter(filters, { [key]: value })}`}
          style={{
            ...PAGE_STYLES.chip,
            background: filters[key] === value ? "#2563eb" : "transparent",
            borderColor: filters[key] === value ? "#2563eb" : "#475569",
          }}
        >
          {value}
        </Link>
      ))}
    </div>
  );
}

function renderPresetLinks(filters: ReportFilters): ReactElement {
  const presets: PeriodPreset[] = ["24h", "7d", "30d", "90d", "custom"];

  return (
    <div>
      <div style={PAGE_STYLES.label}>periodo</div>
      {presets.map((preset) => (
        <Link
          key={preset}
          href={`/reporting?${withFilter(filters, preset === "custom" ? { preset } : { preset, dateFrom: undefined, dateTo: undefined })}`}
          style={{
            ...PAGE_STYLES.chip,
            background: filters.preset === preset ? "#2563eb" : "transparent",
            borderColor: filters.preset === preset ? "#2563eb" : "#475569",
          }}
        >
          {preset}
        </Link>
      ))}
    </div>
  );
}

function renderCustomDateForm(filters: ReportFilters): ReactElement {
  return (
    <form action="/reporting" method="get" style={{ ...PAGE_STYLES.panel, display: "grid", gap: "12px" }}>
      <input type="hidden" name="preset" value="custom" />
      {filters.source ? <input type="hidden" name="source" value={filters.source} /> : null}
      {filters.issuer ? <input type="hidden" name="issuer" value={filters.issuer} /> : null}
      {filters.criticality ? <input type="hidden" name="criticality" value={filters.criticality} /> : null}
      {filters.owner ? <input type="hidden" name="owner" value={filters.owner} /> : null}
      {filters.status ? <input type="hidden" name="status" value={filters.status} /> : null}
      <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <label>
          <div style={PAGE_STYLES.label}>de</div>
          <input
            type="date"
            name="dateFrom"
            defaultValue={formatDateInputValue(filters.dateFrom)}
            style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0" }}
          />
        </label>
        <label>
          <div style={PAGE_STYLES.label}>ate</div>
          <input
            type="date"
            name="dateTo"
            defaultValue={formatDateInputValue(filters.dateTo)}
            style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0" }}
          />
        </label>
      </div>
      <button type="submit" style={{ padding: "10px 14px", borderRadius: "10px", border: 0, background: "#2563eb", color: "#eff6ff" }}>
        aplicar periodo custom
      </button>
    </form>
  );
}

function renderExportLinks(filters: ReportFilters): ReactElement {
  const query = withFilter(filters, {});
  return (
    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
      <a href={`/reporting/export/dashboard.csv?${query}`} style={{ ...PAGE_STYLES.chip, marginBottom: 0 }}>
        exportar CSV filtrado
      </a>
      <a href={`/reporting/export/executive.pdf?${query}`} style={{ ...PAGE_STYLES.chip, marginBottom: 0 }}>
        PDF executivo
      </a>
    </div>
  );
}

function renderSummaryCard(label: string, value: string | number): ReactElement {
  return (
    <article style={PAGE_STYLES.panel}>
      <div style={PAGE_STYLES.label}>{label}</div>
      <strong style={{ fontSize: "28px" }}>{value}</strong>
    </article>
  );
}

export default async function ReportingPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamLike>;
}): Promise<ReactElement> {
  const filters = parseReportFilters((await searchParams) ?? {});
  const [rows, summary, options] = await Promise.all([
    buildDashboardRows(filters),
    buildDashboardSummary(filters),
    buildDashboardFilterOptions(),
  ]);

  return (
    <main style={{ padding: "32px", display: "grid", gap: "24px" }}>
      <header style={{ display: "grid", gap: "12px" }}>
        <p style={{ margin: 0, color: "#94a3b8" }}>Reporting & Compliance Governance</p>
        <h1 style={{ margin: 0, fontSize: "32px" }}>Dashboard de disponibilidade e auditoria</h1>
        <p style={{ margin: 0, maxWidth: "960px", color: "#cbd5e1" }}>
          O dashboard usa o mesmo contrato de filtros da exportacao e da auditoria. SLA, janelas de cobertura e alertas refletem o periodo selecionado.
        </p>
        {renderExportLinks(filters)}
      </header>

      <section style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}>
        {renderSummaryCard("alvos no periodo", summary.totalTargets)}
        {renderSummaryCard("healthy", summary.healthyTargets)}
        {renderSummaryCard("degraded", summary.degradedTargets)}
        {renderSummaryCard("offline", summary.offlineTargets)}
        {renderSummaryCard("SLA medio", `${summary.averageSlaPercent.toFixed(2)}%`)}
        {renderSummaryCard("alertas abertos", summary.openAlerts)}
      </section>

      <section style={{ display: "grid", gap: "16px", gridTemplateColumns: "2fr 1fr" }}>
        <div style={{ ...PAGE_STYLES.panel, display: "grid", gap: "16px" }}>
          <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
            {renderChipGroup(filters, "source", "origem", options.sources)}
            {renderChipGroup(filters, "issuer", "emissor", options.issuers)}
            {renderChipGroup(filters, "criticality", "criticidade", options.criticalities)}
            {renderChipGroup(filters, "owner", "responsavel", options.owners)}
            {renderChipGroup(filters, "status", "status", options.statuses)}
            {renderPresetLinks(filters)}
          </div>
        </div>
        {renderCustomDateForm(filters)}
      </section>

      <section style={{ overflowX: "auto", border: "1px solid #334155", borderRadius: "16px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#1e293b" }}>
            <tr>
              {[
                "Target",
                "Tipo",
                "Origem",
                "Emissor",
                "Criticidade",
                "Status",
                "Ultima indisponibilidade",
                "SLA (%)",
                "Error budget",
                "Proximo vencimento",
                "Alertas abertos",
                "Ultimos alertas",
              ].map((label) => (
                <th key={label} style={{ textAlign: "left", padding: "12px", borderBottom: "1px solid #334155" }}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.targetId} style={{ background: "#0f172a" }}>
                <td style={{ padding: "12px", borderBottom: "1px solid #1e293b" }}>
                  <Link href={`/reporting/${row.targetId}?${withFilter(filters, { tab: "timeline" })}`} style={{ color: "#93c5fd" }}>
                    {row.slug}
                  </Link>
                </td>
                <td style={{ padding: "12px", borderBottom: "1px solid #1e293b" }}>{row.type}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid #1e293b" }}>{row.source}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid #1e293b" }}>{row.issuer ?? "-"}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid #1e293b" }}>{row.criticality}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid #1e293b", color: getStatusColor(row.currentStatus) }}>{row.currentStatus}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid #1e293b" }}>{formatDate(row.latestUnavailabilityAt)}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid #1e293b" }}>{row.slaPercent.toFixed(2)}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid #1e293b" }}>{(row.errorBudgetUsed * 100).toFixed(2)}%</td>
                <td style={{ padding: "12px", borderBottom: "1px solid #1e293b" }}>{row.nextExpiration ?? "-"}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid #1e293b" }}>{row.openAlerts}</td>
                <td style={{ padding: "12px", borderBottom: "1px solid #1e293b" }}>{row.recentAlerts}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>
                  Nenhum alvo corresponde aos filtros atuais.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </main>
  );
}
