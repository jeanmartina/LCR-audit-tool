import type { ReactElement } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { assertCertificatePermission } from "../../../auth/authorization";
import { StatusPill } from "../../../components/ui/primitives";
import { getPrincipalTranslator } from "../../../i18n";
import {
  buildDetailEvidence,
  buildDetailFilterOptions,
  type DerivedSourceDisplayStatus,
} from "../../../reporting/read-models";
import {
  getDerivedOperationalLabel,
  getDerivedOperationalTone,
  toDerivedOperationalState,
} from "../../../reporting/derived-state";
import { buildAuditTimeline, type TimelineEvent } from "../../../reporting/timeline";
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
  { key: "sources", label: "Sources" },
] as const;

const BOX = {
  background: "var(--panel-bg)",
  borderRadius: "16px",
  border: "1px solid var(--panel-border)",
  padding: "16px",
} as const;

function getDerivedTone(status: DerivedSourceDisplayStatus): "success" | "warning" | "neutral" {
  return getDerivedOperationalTone(toDerivedOperationalState(status));
}

function formatMaybeDate(value: Date | string | null | undefined): string {
  if (!value) {
    return "-";
  }
  return value instanceof Date ? value.toISOString() : value;
}

function isOcspEvidence(
  evidence: NonNullable<Awaited<ReturnType<typeof buildDetailEvidence>>>["derivedSources"][number]["latestEvidence"]
): evidence is Extract<
  NonNullable<Awaited<ReturnType<typeof buildDetailEvidence>>>["derivedSources"][number]["latestEvidence"],
  { requestSha256: string }
> {
  return Boolean(evidence && "requestSha256" in evidence);
}

function isDocumentEvidence(
  evidence: NonNullable<Awaited<ReturnType<typeof buildDetailEvidence>>>["derivedSources"][number]["latestEvidence"]
): evidence is Extract<
  NonNullable<Awaited<ReturnType<typeof buildDetailEvidence>>>["derivedSources"][number]["latestEvidence"],
  { sha256: string }
> {
  return Boolean(evidence && "sha256" in evidence);
}

function getDerivedStatusLabel(status: DerivedSourceDisplayStatus, t: (key: string) => string): string {
  return t(`reporting.derived.status.${status}`);
}

function getDerivedOperationalStatusLabel(status: DerivedSourceDisplayStatus): string {
  return getDerivedOperationalLabel(toDerivedOperationalState(status));
}

function renderDerivedEvidence(
  detailItem: NonNullable<Awaited<ReturnType<typeof buildDetailEvidence>>>["derivedSources"][number],
  t: (key: string) => string
): ReactElement {
  if (detailItem.source.sourceType === "ocsp") {
    const evidence = detailItem.latestEvidence;
    return (
      <div style={{ display: "grid", gap: "4px" }}>
        <div>{t("reporting.derived.rawEvidence")}</div>
        <div style={{ color: "var(--muted-color)" }}>
          {isOcspEvidence(evidence)
            ? [
                `request ${evidence.requestSha256}`,
                `response ${evidence.responseSha256 ?? "-"}`,
                `bytes ${evidence.responseSizeBytes ?? evidence.requestSizeBytes}`,
              ].join(" · ")
            : "-"}
        </div>
      </div>
    );
  }

  const evidence = detailItem.latestEvidence;
  return (
    <div style={{ display: "grid", gap: "4px" }}>
      <div>{t("reporting.derived.rawEvidence")}</div>
      <div style={{ color: "var(--muted-color)" }}>
        {isDocumentEvidence(evidence)
          ? [
              `sha ${evidence.sha256}`,
              `bytes ${evidence.sizeBytes}`,
              `capture ${evidence.capturedAt.toISOString()}`,
            ].join(" · ")
          : "-"}
      </div>
    </div>
  );
}

function renderDerivedSourceList(
  detailItem: NonNullable<Awaited<ReturnType<typeof buildDetailEvidence>>>["derivedSources"][number],
  t: (key: string) => string
): ReactElement {
  const latestEvent = detailItem.latestEvent;
  const sourceTypeLabel =
    detailItem.source.sourceType === "ocsp"
      ? t("reporting.derived.type.ocsp")
      : t("reporting.derived.type.policyDocument");
  return (
    <article key={detailItem.source.id} id={detailItem.source.sourceKey} style={{ borderTop: "1px solid var(--panel-border)", paddingTop: "12px", display: "grid", gap: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <strong>{sourceTypeLabel}</strong>
        <StatusPill tone={getDerivedTone(detailItem.displayStatus)}>{getDerivedOperationalStatusLabel(detailItem.displayStatus)}</StatusPill>
        <span style={{ color: "var(--muted-color)", fontSize: "12px" }}>{getDerivedStatusLabel(detailItem.displayStatus, t)}</span>
      </div>
      <div style={{ display: "grid", gap: "4px" }}>
        <span>
          {t("reporting.derived.url")}: {detailItem.source.sourceUrl ?? detailItem.source.normalizedUrl ?? "-"}
        </span>
        <span>
          {t("reporting.derived.lastChecked")}: {formatMaybeDate(latestEvent?.checkedAt ?? detailItem.source.updatedAt)}
        </span>
        <span>
          {t("reporting.derived.failureReason")}: {latestEvent && "failureReason" in latestEvent ? latestEvent.failureReason ?? "-" : detailItem.source.derivationReason ?? "-"}
        </span>
        {renderDerivedEvidence(detailItem, t)}
      </div>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        {detailItem.historyEnabled ? (
          <Link href={detailItem.historyHref} style={{ color: "var(--link-color)" }}>
            {t("reporting.derived.history")}
          </Link>
        ) : (
          <span style={{ color: "var(--muted-color)", pointerEvents: "none" }}>{t("reporting.derived.historyDisabled")}</span>
        )}
      </div>
    </article>
  );
}

function renderDerivedSourceHistory(
  detailItem: NonNullable<Awaited<ReturnType<typeof buildDetailEvidence>>>["derivedSources"][number],
  t: (key: string) => string
): ReactElement {
  const sourceTypeLabel =
    detailItem.source.sourceType === "ocsp"
      ? t("reporting.derived.type.ocsp")
      : t("reporting.derived.type.policyDocument");
  return (
    <article key={detailItem.source.id} id={detailItem.source.sourceKey} style={{ borderTop: "1px solid var(--panel-border)", paddingTop: "12px", display: "grid", gap: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <strong>{sourceTypeLabel}</strong>
        <StatusPill tone={getDerivedTone(detailItem.displayStatus)}>{getDerivedOperationalStatusLabel(detailItem.displayStatus)}</StatusPill>
        <span style={{ color: "var(--muted-color)", fontSize: "12px" }}>{getDerivedStatusLabel(detailItem.displayStatus, t)}</span>
      </div>
      <div style={{ display: "grid", gap: "8px" }}>
        <div>
          <strong>{t("reporting.derived.history")}</strong>
          <ul style={{ margin: "8px 0 0" }}>
            {detailItem.historyEvents.length > 0 ? (
              detailItem.historyEvents.map((event) => (
                <li key={`${detailItem.source.id}-${event.id}`}>
                  {"requestSha256" in event
                    ? `${event.checkedAt.toISOString()} - ${event.status} - ${event.httpStatus ?? "-"} - ${event.failureReason ?? "-"}`
                    : `${event.checkedAt.toISOString()} - ${event.status} - ${event.httpStatus ?? "-"} - ${event.failureReason ?? "-"}`}
                </li>
              ))
            ) : (
              <li>{t("reporting.derived.historyEmpty")}</li>
            )}
          </ul>
        </div>
        <div>
          <strong>{t("reporting.derived.evidenceHistory")}</strong>
          <ul style={{ margin: "8px 0 0" }}>
            {detailItem.historyEvidence.length > 0 ? (
              detailItem.historyEvidence.map((evidence) => (
                <li key={`${detailItem.source.id}-${evidence.id}`}>
                  {"sha256" in evidence
                    ? `${evidence.capturedAt.toISOString()} - ${evidence.sha256} - ${evidence.sizeBytes}`
                    : `${evidence.checkedAt.toISOString()} - ${evidence.requestSha256} - ${evidence.responseSha256 ?? "-"}`}
                </li>
              ))
            ) : (
              <li>{t("reporting.derived.historyEmpty")}</li>
            )}
          </ul>
        </div>
      </div>
    </article>
  );
}


function getTimelineHeadline(event: TimelineEvent, t: (key: string) => string): string {
  if (event.type === "alert") {
    return t("reporting.timeline.headline.alert");
  }
  if (event.type === "validation") {
    return t("reporting.timeline.headline.validation");
  }
  if (event.type === "coverage-gap") {
    return t("reporting.timeline.headline.coverageGap");
  }
  if (event.type === "expiration") {
    return t("reporting.timeline.headline.expiration");
  }
  if (event.type === "predictive") {
    return t("reporting.timeline.headline.predictive");
  }
  if (event.type === "recovery") {
    return t("reporting.timeline.headline.recovery");
  }
  return t("reporting.timeline.headline.poll");
}

function renderTimelineEvent(event: TimelineEvent, t: (key: string) => string): ReactElement {
  return (
    <article key={`${event.type}-${event.at.toISOString()}-${event.title}`} style={{ borderTop: "1px solid var(--panel-border)", paddingTop: "12px", display: "grid", gap: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <strong>{getTimelineHeadline(event, t)}</strong>
        <span style={{ color: "var(--muted-color)", fontSize: "12px" }}>{event.at.toISOString()}</span>
      </div>
      <p style={{ margin: 0 }}>{event.title}</p>
      <details>
        <summary style={{ cursor: "pointer", color: "var(--link-color)" }}>{t("reporting.timeline.technicalDetails")}</summary>
        <div style={{ marginTop: "8px", color: "var(--muted-color)", fontSize: "12px" }}>
          <div>{t("reporting.timeline.type")}: {event.type}</div>
          <div>{t("reporting.timeline.rawTitle")}: {event.title}</div>
          <div>{t("reporting.timeline.rawDetail")}: {event.detail}</div>
        </div>
      </details>
    </article>
  );
}
function renderTabContent(
  tab: string,
  detail: NonNullable<Awaited<ReturnType<typeof buildDetailEvidence>>>,
  timeline: Awaited<ReturnType<typeof buildAuditTimeline>>,
  t: (key: string) => string
): ReactElement {
  if (tab === "sources") {
    return (
      <div style={{ display: "grid", gap: "16px" }}>
        <strong>{t("reporting.tab.sources")}</strong>
        {detail.derivedSources.map((item) => renderDerivedSourceHistory(item, t))}
      </div>
    );
  }

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
    <div style={{ display: "grid", gap: "12px" }}>
      {timeline.length > 0 ? (
        timeline.map((event) => renderTimelineEvent(event, t))
      ) : (
        <p style={{ margin: 0, color: "var(--muted-color)" }}>{t("reporting.timeline.empty")}</p>
      )}
    </div>
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
  const [detail, timeline] = await Promise.all([
    buildDetailEvidence(targetId, filters, principal),
    buildAuditTimeline(targetId, filters),
  ]);
  const filterOptions = await buildDetailFilterOptions(targetId, principal, detail);
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

      <section style={BOX}>
        <div style={{ display: "grid", gap: "8px" }}>
          <strong>{t("reporting.detail.derivedSources")}</strong>
          <p style={{ margin: 0, color: "var(--muted-color)" }}>{t("reporting.detail.derivedSourcesDescription")}</p>
          <div style={{ display: "grid", gap: "12px" }}>
            {detail.derivedSources.length > 0 ? (
              detail.derivedSources.map((item) => renderDerivedSourceList(item, t))
            ) : (
              <p style={{ margin: 0, color: "var(--muted-color)" }}>{t("reporting.detail.derivedSourcesEmpty")}</p>
            )}
          </div>
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

      <section style={BOX}>{renderTabContent(currentTab, detail, timeline, t)}</section>
    </main>
  );
}
