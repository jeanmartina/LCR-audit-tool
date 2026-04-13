import type { ReactElement } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { assertCertificatePermission } from "../../../auth/authorization";
import { getPrincipalTranslator } from "../../../i18n";
import {
  buildDetailEvidence,
  buildDetailFilterOptions,
} from "../../../reporting/read-models";
import { buildAuditTimeline } from "../../../reporting/timeline";
import {
  formatDateInputValue,
  parseReportFilters,
  type SearchParamLike,
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

const BOX = {
  background: "var(--panel-bg)",
  borderRadius: "16px",
  border: "1px solid var(--panel-border)",
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
          <li key={`${poll.targetId}-${poll.occurredAt.toISOString()}-${poll.httpStatus}`}>
            {poll.occurredAt.toISOString()} - {poll.targetLabel} - HTTP {poll.httpStatus} - timeout {String(poll.timedOut)} - coverage lost {String(poll.coverageLost)} - hash {poll.hash ?? "-"}
          </li>
        ))}
      </ul>
    );
  }

  if (tab === "coverage-gaps") {
    return (
      <ul>
        {detail.coverageWindows.map((gap) => (
          <li key={`${gap.targetId}-${gap.startTs.toISOString()}-${gap.endTs?.toISOString() ?? "open"}`}>
            {gap.targetLabel} - start {gap.startTs.toISOString()} - end {gap.endTs?.toISOString() ?? "open"} - duration {gap.durationMs}ms
          </li>
        ))}
      </ul>
    );
  }

  if (tab === "alerts") {
    return (
      <ul>
        {detail.alertHistory.map((alert) => (
          <li key={`${alert.targetLabel}-${alert.sentAt.toISOString()}-${alert.severity}`}>
            {alert.sentAt.toISOString()} - {alert.targetLabel} - {alert.severity} - recipients {alert.recipients.join(", ") || "none"} - delivery {alert.deliveryState}
          </li>
        ))}
        {detail.predictiveEvents.map((event) => (
          <li key={event.id}>
            {event.createdAt.toISOString()} - predictive - {event.severity} - {event.predictiveType} - {event.message}
          </li>
        ))}
      </ul>
    );
  }

  if (tab === "validation") {
    return (
      <ul>
        {detail.validationFailures.map((failure) => (
          <li key={`${failure.targetId}-${failure.occurredAt.toISOString()}-${failure.reason}`}>
            {failure.occurredAt.toISOString()} - {failure.targetLabel} - {failure.reason} - hash {failure.hash ?? "-"}
          </li>
        ))}
      </ul>
    );
  }

  if (tab === "snapshots") {
    return (
      <ul>
        {detail.snapshots.map((snapshot) => (
          <li key={`${snapshot.targetLabel}-${snapshot.occurredAt.toISOString()}-${snapshot.hash ?? "no-hash"}`}>
            {snapshot.occurredAt.toISOString()} - {snapshot.targetLabel} - hash {snapshot.hash ?? "-"} - issuer {snapshot.issuer ?? "-"} - thisUpdate {snapshot.thisUpdate ?? "-"} - nextUpdate {snapshot.nextUpdate ?? "-"} - status {snapshot.statusLabel ?? "-"}
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
  let principal;
  try {
    principal = await assertCertificatePermission("detail.view", targetId);
  } catch {
    redirect("/auth");
  }

  const filters = parseReportFilters((await searchParams) ?? {});
  const [detail, filterOptions, timeline] = await Promise.all([
    buildDetailEvidence(targetId, filters, principal),
    buildDetailFilterOptions(targetId, principal),
    buildAuditTimeline(targetId, filters),
  ]);
  const { t } = await getPrincipalTranslator(principal);

  if (!detail || !filterOptions) {
    return (
      <main style={{ padding: "32px" }}>
        <p>{t("reporting.detail.notFound")}</p>
        <Link href="/reporting" style={{ color: "var(--link-color)" }}>
          {t("common.actions.back")}
        </Link>
      </main>
    );
  }

  const currentTab = filters.tab ?? "timeline";
  const exportQuery = withFilter(filters, {});

  return (
    <main style={{ padding: "32px", display: "grid", gap: "24px" }}>
      <header style={{ display: "grid", gap: "12px" }}>
        <Link href={`/reporting?${withFilter(filters, { tab: undefined, httpStatus: undefined, severity: undefined, eventType: undefined, snapshotHash: undefined })}`} style={{ color: "var(--link-color)" }}>
          {t("reporting.detail.back")}
        </Link>
        <h1 style={{ margin: 0 }}>{detail.certificate.displayName}</h1>
        <p style={{ margin: 0, color: "var(--muted-color)" }}>
          {t("reporting.detail.description")}
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <a href={`/reporting/${targetId}/export/polls.csv?${exportQuery}`} style={{ color: "var(--link-color)" }}>
            {t("reporting.detail.export.polls")}
          </a>
          <a href={`/reporting/${targetId}/export/coverage-gaps.csv?${exportQuery}`} style={{ color: "var(--link-color)" }}>
            {t("reporting.detail.export.coverage")}
          </a>
          <a href={`/reporting/${targetId}/export/alerts.csv?${exportQuery}`} style={{ color: "var(--link-color)" }}>
            {t("reporting.detail.export.alerts")}
          </a>
          <a href={`/reporting/${targetId}/export/snapshots.csv?${exportQuery}`} style={{ color: "var(--link-color)" }}>
            {t("reporting.detail.export.snapshots")}
          </a>
          <a href={`/reporting/${targetId}/export/operational.pdf?${exportQuery}`} style={{ color: "var(--link-color)" }}>
            {t("reporting.detail.export.pdf")}
          </a>
        </div>
      </header>

      <section style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
        <article style={BOX}>
          <div style={{ color: "var(--muted-color)", fontSize: "12px" }}>{t("reporting.detail.currentStatus")}</div>
          <strong>{t(`common.status.${detail.summary.currentStatus}`)}</strong>
        </article>
        <article style={BOX}>
          <div style={{ color: "var(--muted-color)", fontSize: "12px" }}>{t("reporting.detail.lastIncident")}</div>
          <strong>{detail.summary.latestIncidentAt?.toISOString() ?? "-"}</strong>
        </article>
        <article style={BOX}>
          <div style={{ color: "var(--muted-color)", fontSize: "12px" }}>{t("reporting.detail.sla")}</div>
          <strong>{detail.summary.slaPercent.toFixed(2)}%</strong>
        </article>
        <article style={BOX}>
          <div style={{ color: "var(--muted-color)", fontSize: "12px" }}>{t("reporting.detail.nextExpiration")}</div>
          <strong>{detail.summary.nextExpiration ?? "-"}</strong>
        </article>
        <article style={BOX}>
          <div style={{ color: "var(--muted-color)", fontSize: "12px" }}>{t("reporting.detail.openAlerts")}</div>
          <strong>{detail.summary.openAlerts}</strong>
        </article>
        <article style={BOX}>
          <div style={{ color: "var(--muted-color)", fontSize: "12px" }}>{t("reporting.detail.predictiveState")}</div>
          <strong>{detail.summary.predictiveSeverity ? `${detail.summary.predictiveSeverity} / ${t(`settings.predictiveType.${detail.summary.predictiveType}`)}` : "-"}</strong>
        </article>
        <article style={BOX}>
          <div style={{ color: "var(--muted-color)", fontSize: "12px" }}>{t("reporting.detail.structuredTags")}</div>
          <strong>{[detail.structuredTags.trustSource, detail.structuredTags.pki, detail.structuredTags.jurisdiction].filter(Boolean).join(" / ") || "-"}</strong>
        </article>
      </section>

      <section style={BOX}>
        <div style={{ display: "grid", gap: "8px" }}>
          <strong>{t("reporting.detail.derivedCrls")}</strong>
          <ul style={{ margin: 0 }}>
            {detail.derivedCrls.map((crl) => (
              <li key={crl.url}>
                {crl.url} - {t("reporting.detail.derivedIgnored")} {String(crl.ignored)} - {t("reporting.detail.derivedStatus")} {t(`common.status.${crl.currentStatus}`)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <form action={`/reporting/${targetId}`} method="get" style={{ ...BOX, display: "grid", gap: "12px" }}>
        <input type="hidden" name="tab" value={currentTab} />
        <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
          <label>
            <div style={{ color: "var(--muted-color)", fontSize: "12px" }}>{t("reporting.filter.from")}</div>
            <input type="date" name="dateFrom" defaultValue={formatDateInputValue(filters.dateFrom)} style={{ width: "100%", padding: "10px" }} />
          </label>
          <label>
            <div style={{ color: "var(--muted-color)", fontSize: "12px" }}>{t("reporting.filter.to")}</div>
            <input type="date" name="dateTo" defaultValue={formatDateInputValue(filters.dateTo)} style={{ width: "100%", padding: "10px" }} />
          </label>
          <label>
            <div style={{ color: "var(--muted-color)", fontSize: "12px" }}>{t("reporting.filter.httpStatus")}</div>
            <select name="httpStatus" defaultValue={filters.httpStatus?.toString() ?? ""} style={{ width: "100%", padding: "10px" }}>
              <option value="">{t("common.filters.all").toLowerCase()}</option>
              {filterOptions.httpStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            <div style={{ color: "var(--muted-color)", fontSize: "12px" }}>{t("reporting.filter.severity")}</div>
            <select name="severity" defaultValue={filters.severity ?? ""} style={{ width: "100%", padding: "10px" }}>
              <option value="">{t("common.filters.all").toLowerCase()}</option>
              {filterOptions.severities.map((severity) => (
                <option key={severity} value={severity}>
                  {severity}
                </option>
              ))}
            </select>
          </label>
          <label>
            <div style={{ color: "var(--muted-color)", fontSize: "12px" }}>{t("reporting.filter.eventType")}</div>
            <select name="eventType" defaultValue={filters.eventType ?? ""} style={{ width: "100%", padding: "10px" }}>
              <option value="">{t("common.filters.all").toLowerCase()}</option>
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
            <div style={{ color: "var(--muted-color)", fontSize: "12px" }}>{t("reporting.filter.snapshotHash")}</div>
            <select name="snapshotHash" defaultValue={filters.snapshotHash ?? ""} style={{ width: "100%", padding: "10px" }}>
              <option value="">{t("common.filters.all").toLowerCase()}</option>
              {filterOptions.snapshotHashes.map((hash) => (
                <option key={hash} value={hash}>
                  {hash}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" style={{ padding: "10px 14px" }}>
            {t("common.actions.apply")}
          </button>
          <Link href={`/reporting/${targetId}?tab=${currentTab}`} style={{ padding: "10px 14px", textDecoration: "none", border: "1px solid var(--panel-border)", borderRadius: "10px", textAlign: "center", color: "inherit" }}>
            {t("common.actions.clear")}
          </Link>
        </div>
      </form>

      <nav style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/reporting/${targetId}?${withFilter(filters, { tab: tab.key })}`}
            style={{
              padding: "8px 12px",
              borderRadius: "999px",
              border: "1px solid var(--panel-border)",
              textDecoration: "none",
              color: currentTab === tab.key ? "#fff" : "var(--link-color)",
              background: currentTab === tab.key ? "#2563eb" : "transparent",
            }}
          >
            {t(`reporting.tab.${tab.key}`)}
          </Link>
        ))}
      </nav>

      <section style={BOX}>{renderTabContent(currentTab, detail, timeline)}</section>
    </main>
  );
}
