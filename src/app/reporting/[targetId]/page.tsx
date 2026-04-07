import type { ReactElement } from "react";
import Link from "next/link";
import {
  buildDetailEvidence,
  buildDetailFilterOptions,
} from "../../../reporting/read-models";
import { buildAuditTimeline } from "../../../reporting/timeline";
import {
  formatDateInputValue,
  parseReportFilters,
  SearchParamLike,
  withFilter,
} from "../../../reporting/query-state";

const TABS = [
  { key: "timeline", label: "Timeline" },
  { key: "polls", label: "Polls" },
  { key: "coverage-gaps", label: "Coverage gaps" },
  { key: "alerts", label: "Alerts" },
  { key: "validation", label: "Validation" },
  { key: "snapshots", label: "Snapshots" },
] as const;

const BOX_STYLE = {
  background: "#1e293b",
  borderRadius: "16px",
  border: "1px solid #334155",
  padding: "16px",
} as const;

function renderTabContent(
  tab: string,
  detail: NonNullable<Awaited<ReturnType<typeof buildDetailEvidence>>>,
  timeline: Awaited<ReturnType<typeof buildAuditTimeline>>
): ReactElement {
  if (tab === "polls") {
    return (
      <ul>
        {detail.pollHistory.map((poll) => (
          <li key={`${poll.occurredAt.toISOString()}-${poll.httpStatus}`}>
            {poll.occurredAt.toISOString()} - HTTP {poll.httpStatus} - timeout {String(poll.timedOut)} - coverage lost {String(poll.coverageLost)} - hash {poll.hash ?? "-"}
          </li>
        ))}
      </ul>
    );
  }

  if (tab === "coverage-gaps") {
    return (
      <ul>
        {detail.coverageWindows.map((gap) => (
          <li key={`${gap.startTs.toISOString()}-${gap.endTs?.toISOString() ?? "open"}`}>
            start {gap.startTs.toISOString()} - end {gap.endTs?.toISOString() ?? "open"} - duration {gap.durationMs}ms
          </li>
        ))}
      </ul>
    );
  }

  if (tab === "alerts") {
    return (
      <ul>
        {detail.alertHistory.map((alert) => (
          <li key={`${alert.sentAt.toISOString()}-${alert.severity}`}>
            {alert.sentAt.toISOString()} - {alert.severity} - recipients {alert.recipients.join(", ") || "none"} - delivery {alert.deliveryState}
          </li>
        ))}
      </ul>
    );
  }

  if (tab === "validation") {
    return (
      <ul>
        {detail.validationFailures.map((failure) => (
          <li key={`${failure.occurredAt.toISOString()}-${failure.reason}-${failure.hash ?? "no-hash"}`}>
            {failure.occurredAt.toISOString()} - {failure.reason} - hash {failure.hash ?? "-"}
          </li>
        ))}
      </ul>
    );
  }

  if (tab === "snapshots") {
    return (
      <ul>
        {detail.snapshots.map((snapshot) => (
          <li key={`${snapshot.occurredAt.toISOString()}-${snapshot.hash ?? "no-hash"}`}>
            {snapshot.occurredAt.toISOString()} - hash {snapshot.hash ?? "-"} - issuer {snapshot.issuer ?? "-"} - thisUpdate {snapshot.thisUpdate ?? "-"} - nextUpdate {snapshot.nextUpdate ?? "-"} - status {snapshot.statusLabel ?? "-"}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul>
      {timeline.map((event) => (
        <li key={`${event.type}-${event.at.toISOString()}-${event.title}`}>
          {event.at.toISOString()} - {event.type} - {event.title} - {event.detail}
        </li>
      ))}
    </ul>
  );
}

export default async function ReportingTargetPage({
  params,
  searchParams,
}: {
  params: Promise<{ targetId: string }>;
  searchParams?: Promise<SearchParamLike>;
}): Promise<ReactElement> {
  const { targetId } = await params;
  const filters = parseReportFilters((await searchParams) ?? {});
  const [detail, filterOptions, timeline] = await Promise.all([
    buildDetailEvidence(targetId, filters),
    buildDetailFilterOptions(targetId),
    buildAuditTimeline(targetId, filters),
  ]);

  if (!detail || !filterOptions) {
    return (
      <main style={{ padding: "32px" }}>
        <p>Target nao encontrado.</p>
        <Link href="/reporting" style={{ color: "#93c5fd" }}>
          Voltar
        </Link>
      </main>
    );
  }

  const currentTab = filters.tab ?? "timeline";
  const exportQuery = withFilter(filters, {});

  return (
    <main style={{ padding: "32px", display: "grid", gap: "24px" }}>
      <header style={{ display: "grid", gap: "12px" }}>
        <Link href={`/reporting?${withFilter(filters, { tab: undefined, httpStatus: undefined, severity: undefined, eventType: undefined, snapshotHash: undefined })}`} style={{ color: "#93c5fd" }}>
          Voltar para dashboard
        </Link>
        <h1 style={{ margin: 0 }}>{detail.target.slug}</h1>
        <p style={{ margin: 0, color: "#94a3b8" }}>
          Auditoria detalhada orientada por filtros reproduziveis. Timeline e exports usam o mesmo estado da URL.
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <a href={`/reporting/${targetId}/export/polls.csv?${exportQuery}`} style={{ color: "#93c5fd" }}>
            CSV polls
          </a>
          <a href={`/reporting/${targetId}/export/coverage-gaps.csv?${exportQuery}`} style={{ color: "#93c5fd" }}>
            CSV coverage gaps
          </a>
          <a href={`/reporting/${targetId}/export/alerts.csv?${exportQuery}`} style={{ color: "#93c5fd" }}>
            CSV alerts
          </a>
          <a href={`/reporting/${targetId}/export/snapshots.csv?${exportQuery}`} style={{ color: "#93c5fd" }}>
            CSV snapshots
          </a>
          <a href={`/reporting/${targetId}/export/operational.pdf?${exportQuery}`} style={{ color: "#93c5fd" }}>
            PDF operacional
          </a>
        </div>
      </header>

      <section style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
        <article style={BOX_STYLE}>
          <div style={{ color: "#94a3b8", fontSize: "12px" }}>status atual</div>
          <strong>{detail.summary.currentStatus}</strong>
        </article>
        <article style={BOX_STYLE}>
          <div style={{ color: "#94a3b8", fontSize: "12px" }}>ultimo incidente</div>
          <strong>{detail.summary.latestIncidentAt?.toISOString() ?? "-"}</strong>
        </article>
        <article style={BOX_STYLE}>
          <div style={{ color: "#94a3b8", fontSize: "12px" }}>SLA no periodo</div>
          <strong>{detail.summary.slaPercent.toFixed(2)}%</strong>
        </article>
        <article style={BOX_STYLE}>
          <div style={{ color: "#94a3b8", fontSize: "12px" }}>proxima expiracao</div>
          <strong>{detail.summary.nextExpiration ?? "-"}</strong>
        </article>
        <article style={BOX_STYLE}>
          <div style={{ color: "#94a3b8", fontSize: "12px" }}>alertas abertos</div>
          <strong>{detail.summary.openAlerts}</strong>
        </article>
      </section>

      <form action={`/reporting/${targetId}`} method="get" style={{ ...BOX_STYLE, display: "grid", gap: "12px" }}>
        <input type="hidden" name="tab" value={currentTab} />
        <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
          <label>
            <div style={{ color: "#94a3b8", fontSize: "12px" }}>de</div>
            <input type="date" name="dateFrom" defaultValue={formatDateInputValue(filters.dateFrom)} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0" }} />
          </label>
          <label>
            <div style={{ color: "#94a3b8", fontSize: "12px" }}>ate</div>
            <input type="date" name="dateTo" defaultValue={formatDateInputValue(filters.dateTo)} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0" }} />
          </label>
          <label>
            <div style={{ color: "#94a3b8", fontSize: "12px" }}>HTTP status</div>
            <select name="httpStatus" defaultValue={filters.httpStatus?.toString() ?? ""} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0" }}>
              <option value="">todos</option>
              {filterOptions.httpStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            <div style={{ color: "#94a3b8", fontSize: "12px" }}>severity</div>
            <select name="severity" defaultValue={filters.severity ?? ""} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0" }}>
              <option value="">todas</option>
              {filterOptions.severities.map((severity) => (
                <option key={severity} value={severity}>
                  {severity}
                </option>
              ))}
            </select>
          </label>
          <label>
            <div style={{ color: "#94a3b8", fontSize: "12px" }}>event type</div>
            <select name="eventType" defaultValue={filters.eventType ?? ""} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0" }}>
              <option value="">todos</option>
              {filterOptions.eventTypes.map((eventType) => (
                <option key={eventType} value={eventType}>
                  {eventType}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "2fr auto auto" }}>
          <label>
            <div style={{ color: "#94a3b8", fontSize: "12px" }}>hash/snapshot</div>
            <select name="snapshotHash" defaultValue={filters.snapshotHash ?? ""} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0" }}>
              <option value="">todos</option>
              {filterOptions.snapshotHashes.map((hash) => (
                <option key={hash} value={hash}>
                  {hash}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" style={{ padding: "10px 14px", borderRadius: "10px", border: 0, background: "#2563eb", color: "#eff6ff", alignSelf: "end" }}>
            Apply
          </button>
          <Link href={`/reporting/${targetId}?tab=${currentTab}`} style={{ padding: "10px 14px", borderRadius: "10px", background: "#334155", color: "#e2e8f0", textDecoration: "none", alignSelf: "end", textAlign: "center" }}>
            Clear
          </Link>
        </div>
      </form>

      <nav style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/reporting/${targetId}?${withFilter(filters, { tab: tab.key })}`}
            style={{
              padding: "8px 12px",
              borderRadius: "999px",
              textDecoration: "none",
              color: "#e2e8f0",
              border: "1px solid #475569",
              background: currentTab === tab.key ? "#2563eb" : "transparent",
            }}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <section style={BOX_STYLE}>
        <h2 style={{ marginTop: 0 }}>{TABS.find((tab) => tab.key === currentTab)?.label ?? "Timeline"}</h2>
        {renderTabContent(currentTab, detail, timeline)}
      </section>
    </main>
  );
}
