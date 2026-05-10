import Link from "next/link";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { ActionButton, EmptyState, Notice, Panel, StatusPill, stackStyle } from "../../../components/ui/primitives";
import type { TrustListSourceSummary } from "../../../trust-lists/admin";

type TranslationValues = Record<string, string | number | boolean | null | undefined>;
type SettingsTranslator = (key: string, values?: TranslationValues) => string;

const failureLayerKeys = [
  "admin.trustLists.detail.failureLayers.downloadFetch",
  "admin.trustLists.detail.failureLayers.xmlParse",
  "admin.trustLists.detail.failureLayers.xmlDsig",
  "admin.trustLists.detail.failureLayers.projectionImport",
  "admin.trustLists.detail.failureLayers.hierarchyLotl",
] as const;

function formatDate(value: Date | null | undefined): string {
  return value ? value.toISOString() : "-";
}

function valueOrDash(value: string | number | null | undefined): string {
  return value === null || value === undefined || value === "" ? "-" : String(value);
}

function sortByLabel(sources: TrustListSourceSummary[]): TrustListSourceSummary[] {
  return [...sources].sort((left, right) => left.source.label.localeCompare(right.source.label));
}

function buildHierarchyRows(sources: TrustListSourceSummary[]): Array<{ source: TrustListSourceSummary; depth: number }> {
  const byId = new Map(sources.map((item) => [item.source.id, item] as const));
  const childrenByParent = new Map<string, TrustListSourceSummary[]>();
  const roots: TrustListSourceSummary[] = [];

  for (const source of sources) {
    const parentId = source.source.parentSourceId;
    if (parentId && byId.has(parentId)) {
      const children = childrenByParent.get(parentId) ?? [];
      children.push(source);
      childrenByParent.set(parentId, children);
      continue;
    }
    roots.push(source);
  }

  const rows: Array<{ source: TrustListSourceSummary; depth: number }> = [];
  const visit = (source: TrustListSourceSummary, depth: number): void => {
    rows.push({ source, depth });
    for (const child of sortByLabel(childrenByParent.get(source.source.id) ?? [])) {
      visit(child, depth + 1);
    }
  };

  for (const source of sortByLabel(roots)) {
    visit(source, 0);
  }

  return rows;
}

function getParentLabel(
  sources: TrustListSourceSummary[],
  parentSourceId: string | null,
  t: SettingsTranslator,
): string {
  if (!parentSourceId) {
    return t("admin.trustLists.hierarchy.lotl");
  }
  return sources.find((item) => item.source.id === parentSourceId)?.source.label ?? parentSourceId;
}

function getHierarchyBadge(source: TrustListSourceSummary, t: SettingsTranslator): string {
  return source.source.parentSourceId ? t("admin.trustLists.hierarchy.child") : t("admin.trustLists.hierarchy.lotl");
}

function getLatestFailureReason(source: TrustListSourceSummary): string | null {
  return source.lastRun?.failureReason ?? source.latestProjectionFailureReason;
}

function getFailureLayerText(
  source: TrustListSourceSummary,
  sources: TrustListSourceSummary[],
  layer: (typeof failureLayerKeys)[number],
  t: SettingsTranslator,
): string {
  const recovery = source.latestRecovery;
  const latestFailure = getLatestFailureReason(source);

  if (layer === "admin.trustLists.detail.failureLayers.downloadFetch") {
    if (recovery && (recovery.code === "fetch-failed" || recovery.code === "invalid-url" || recovery.code === "https-required")) {
      return t(recovery.bodyKey);
    }
    return latestFailure ?? t("common.none");
  }

  if (layer === "admin.trustLists.detail.failureLayers.xmlParse") {
    if (recovery && recovery.code === "parse-failed") {
      return t(recovery.bodyKey);
    }
    return latestFailure?.includes("parse") ? latestFailure : t("common.none");
  }

  if (layer === "admin.trustLists.detail.failureLayers.xmlDsig") {
    if (recovery && recovery.code === "xml-signature-invalid") {
      return t(recovery.bodyKey);
    }
    return latestFailure?.includes("signature") || latestFailure?.includes("xmldsig") ? latestFailure : t("common.none");
  }

  if (layer === "admin.trustLists.detail.failureLayers.projectionImport") {
    if (source.projectionCounts.failed > 0 || latestFailure?.includes("import")) {
      return latestFailure ?? t("admin.trustLists.projection.failed");
    }
    return t("common.none");
  }

  return source.source.parentSourceId
    ? getParentLabel(sources, source.source.parentSourceId, t)
    : t("admin.trustLists.hierarchy.lotl");
}

function actionButtonStyle(kind: "archive" | "delete" | "details"): CSSProperties {
  if (kind === "details") {
    return {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "fit-content",
      padding: "10px 14px",
      borderRadius: "10px",
      border: "1px solid var(--button-border)",
      background: "var(--button-bg)",
      color: "var(--button-fg)",
      fontWeight: 700,
      textDecoration: "none",
    };
  }

  if (kind === "archive") {
    return {
      width: "fit-content",
      padding: "10px 14px",
      borderRadius: "10px",
      border: "1px solid var(--button-border)",
      background: "transparent",
      color: "inherit",
      fontWeight: 700,
      cursor: "pointer",
    };
  }

  return {
    width: "fit-content",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #c53030",
    background: "rgba(197, 48, 48, 0.08)",
    color: "#c53030",
    fontWeight: 700,
    cursor: "pointer",
  };
}

function SourceActions({
  source,
  t,
  showDetailsLink,
}: {
  source: TrustListSourceSummary["source"];
  t: SettingsTranslator;
  showDetailsLink: boolean;
}): ReactElement {
  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
      {showDetailsLink ? (
        <Link href={`/admin/trust-lists/${source.id}`} style={actionButtonStyle("details")}>
          {t("admin.trustLists.openDetails")}
        </Link>
      ) : null}
      <form action={`/api/admin/trust-lists/${source.id}`} method="post">
        <input type="hidden" name="_method" value="PATCH" />
        <input type="hidden" name="label" value={source.label} />
        <input type="hidden" name="url" value={source.url} />
        <input type="hidden" name="groupIds" value={source.groupIds.join(",")} />
        <input type="hidden" name="parentSourceId" value={source.parentSourceId ?? ""} />
        <input type="hidden" name="enabled" value="false" />
        <button type="submit" style={actionButtonStyle("archive")}>
          {t("admin.trustLists.source.archive")}
        </button>
      </form>
      <form action={`/api/admin/trust-lists/${source.id}`} method="post">
        <input type="hidden" name="_method" value="DELETE" />
        <button type="submit" style={actionButtonStyle("delete")}>
          {t("admin.trustLists.source.delete")}
        </button>
      </form>
    </div>
  );
}

function CompactSourceCard({
  source,
  depth,
  sources,
  t,
}: {
  source: TrustListSourceSummary;
  depth: number;
  sources: TrustListSourceSummary[];
  t: SettingsTranslator;
}): ReactElement {
  const latestFailureReason = getLatestFailureReason(source);

  return (
    <Panel
      compact
      title={source.source.label}
      description={source.source.url}
    >
      <div
        style={{
          display: "grid",
          gap: "12px",
          paddingLeft: depth > 0 ? `${depth * 20}px` : 0,
          borderLeft: depth > 0 ? "3px solid var(--panel-border)" : "none",
        }}
      >
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <StatusPill tone={source.source.enabled ? "success" : "warning"}>
            {source.source.enabled ? t("common.status.active") : t("common.status.disabled")}
          </StatusPill>
          <StatusPill tone="neutral">{getHierarchyBadge(source, t)}</StatusPill>
          <StatusPill tone={source.lastRun?.status === "failed" ? "warning" : source.lastRun?.status === "succeeded" ? "success" : "neutral"}>
            {source.lastRun?.status ?? t("common.none")}
          </StatusPill>
        </div>

        <SourceActions source={source.source} t={t} showDetailsLink />

        <div style={stackStyle("4px")}>
          <span>
            {t("admin.trustLists.source.parent")}: {getParentLabel(sources, source.source.parentSourceId, t)}
          </span>
          <span>
            {t("admin.trustLists.timeline.lastSuccess")}: {formatDate(source.lastSuccess?.finishedAt)}
          </span>
          <span>
            {t("admin.trustLists.timeline.lastFailure")}: {formatDate(source.lastFailure?.finishedAt)}
          </span>
          <span>
            {t("admin.trustLists.timeline.nextExpectedUpdate")}: {valueOrDash(source.lastSnapshot?.nextUpdate)}
          </span>
        </div>

        <div style={stackStyle("4px")}>
          <strong>{t("admin.trustLists.table.metadata")}</strong>
          <span>
            {t("admin.trustLists.metadata.digest")}: {valueOrDash(source.lastSnapshot?.digestSha256)}
          </span>
          <span>
            {t("admin.trustLists.metadata.sequence")}: {valueOrDash(source.lastSnapshot?.sequenceNumber)}
          </span>
          <span>
            {t("admin.trustLists.metadata.territory")}: {valueOrDash(source.lastSnapshot?.territory)}
          </span>
          <span>
            {t("admin.trustLists.metadata.imported")}: {source.lastRun?.importedCount ?? 0} / {source.lastRun?.failedCount ?? 0}
          </span>
        </div>

        <div style={stackStyle("4px")}>
          <strong>{t("admin.trustLists.timeline.changeSummary")}</strong>
          <span>
            {t("admin.trustLists.projection.imported")}: {source.projectionCounts.imported}
          </span>
          <span>
            {t("admin.trustLists.projection.updated")}: {source.projectionCounts.updated}
          </span>
          <span>
            {t("admin.trustLists.projection.skippedUnchanged")}: {source.projectionCounts.skippedUnchanged}
          </span>
          <span>
            {t("admin.trustLists.projection.skippedDuplicate")}: {source.projectionCounts.skippedDuplicate}
          </span>
          <span>
            {t("admin.trustLists.projection.failed")}: {source.projectionCounts.failed}
          </span>
        </div>

        {source.latestRecovery ? (
          <Notice tone="warning" title={t(source.latestRecovery.titleKey)}>
            {t(source.latestRecovery.bodyKey)} {t("admin.trustLists.timeline.recommendedAction")}: {t(source.latestRecovery.actionKey)}
          </Notice>
        ) : latestFailureReason ? (
          <Notice tone="warning" title={t("admin.trustLists.timeline.rawFailure")}>
            {latestFailureReason}
          </Notice>
        ) : null}
      </div>
    </Panel>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): ReactElement {
  return (
    <Panel compact title={title}>
      {children}
    </Panel>
  );
}

function DetailActionRow({
  source,
  t,
}: {
  source: TrustListSourceSummary["source"];
  t: SettingsTranslator;
}): ReactElement {
  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
      {source.archivedAt ? (
        <Notice tone="warning" title={t("admin.trustLists.source.archive")}>
          {t("common.status.disabled")}
        </Notice>
      ) : (
        <form action={`/api/admin/trust-lists/${source.id}/sync`} method="post">
          <ActionButton>{t("admin.trustLists.syncNow")}</ActionButton>
        </form>
      )}
      <SourceActions source={source} t={t} showDetailsLink={false} />
    </div>
  );
}

function renderDetailFailureLayers(source: TrustListSourceSummary, sources: TrustListSourceSummary[], t: SettingsTranslator): ReactElement {
  return (
    <div style={{ display: "grid", gap: "12px" }}>
      {failureLayerKeys.map((key) => (
        <DetailSection key={key} title={t(key)}>
          <div style={stackStyle("4px")}>
            <span>{getFailureLayerText(source, sources, key, t)}</span>
          </div>
        </DetailSection>
      ))}
    </div>
  );
}

function renderSnapshotsSection(source: TrustListSourceSummary, t: SettingsTranslator): ReactElement {
  const snapshot = source.lastSnapshot;
  if (!snapshot) {
    return <EmptyState title={t("admin.trustLists.empty.title")}>{t("admin.trustLists.empty.body")}</EmptyState>;
  }

  return (
    <div style={stackStyle("6px")}>
      <span>
        {t("admin.trustLists.metadata.digest")}: {snapshot.digestSha256}
      </span>
      <span>
        {t("admin.trustLists.metadata.sequence")}: {valueOrDash(snapshot.sequenceNumber)}
      </span>
      <span>
        {t("admin.trustLists.metadata.territory")}: {valueOrDash(snapshot.territory)}
      </span>
      <span>
        {t("admin.trustLists.timeline.lastRun")}: {formatDate(source.lastRun?.finishedAt ?? source.lastRun?.startedAt)}
      </span>
      <span>
        {t("admin.trustLists.timeline.nextExpectedUpdate")}: {valueOrDash(snapshot.nextUpdate)}
      </span>
      <span>
        {t("admin.trustLists.metadata.imported")}: {snapshot.certificateCount}
      </span>
      <span>
        {t("admin.trustLists.timeline.changeSummary")}: {snapshot.acceptedAt.toISOString()} / {snapshot.xmlSizeBytes} bytes
      </span>
    </div>
  );
}

function renderSyncHistorySection(source: TrustListSourceSummary, t: SettingsTranslator): ReactElement {
  return (
    <div style={stackStyle("6px")}>
      <span>
        {t("admin.trustLists.timeline.lastRun")}: {formatDate(source.lastRun?.finishedAt ?? source.lastRun?.startedAt)}
      </span>
      <span>
        {t("admin.trustLists.timeline.lastSuccess")}: {formatDate(source.lastSuccess?.finishedAt)}
      </span>
      <span>
        {t("admin.trustLists.timeline.lastFailure")}: {formatDate(source.lastFailure?.finishedAt)}
      </span>
      <span>
        {t("admin.trustLists.timeline.rawFailure")}: {valueOrDash(source.lastRun?.failureReason)}
      </span>
      <span>
        {t("admin.trustLists.metadata.imported")}: {source.lastRun?.importedCount ?? 0} / {source.lastRun?.failedCount ?? 0}
      </span>
      <span>
        {t("admin.trustLists.projection.failed")}: {source.projectionCounts.failed}
      </span>
    </div>
  );
}

function renderProjectionCountsSection(source: TrustListSourceSummary, t: SettingsTranslator): ReactElement {
  return (
    <div style={stackStyle("6px")}>
      <span>
        {t("admin.trustLists.projection.imported")}: {source.projectionCounts.imported}
      </span>
      <span>
        {t("admin.trustLists.projection.updated")}: {source.projectionCounts.updated}
      </span>
      <span>
        {t("admin.trustLists.projection.skippedUnchanged")}: {source.projectionCounts.skippedUnchanged}
      </span>
      <span>
        {t("admin.trustLists.projection.skippedDuplicate")}: {source.projectionCounts.skippedDuplicate}
      </span>
      <span>
        {t("admin.trustLists.projection.failed")}: {source.projectionCounts.failed}
      </span>
      <span>
        {t("admin.trustLists.projection.latestFailure")}: {valueOrDash(source.latestProjectionFailureReason)}
      </span>
    </div>
  );
}

export function TrustListDiagnosticsPanel({
  t,
  sources,
  title,
  description,
  noAccessTitle,
  noAccessBody,
  sourceId,
}: {
  t: SettingsTranslator;
  sources: TrustListSourceSummary[] | null;
  title: string;
  description: string;
  noAccessTitle: string;
  noAccessBody: string;
  sourceId?: string;
}): ReactElement {
  if (!sources) {
    return <Notice tone="info" title={noAccessTitle}>{noAccessBody}</Notice>;
  }

  const selectedSource = sourceId ? sources.find((item) => item.source.id === sourceId) ?? null : null;

  if (sourceId && !selectedSource) {
    return <EmptyState title={noAccessTitle}>{noAccessBody}</EmptyState>;
  }

  if (selectedSource) {
    const source = selectedSource.source;

    return (
      <Panel title={title} description={description}>
        <div style={stackStyle("20px")}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <StatusPill tone={source.enabled ? "success" : "warning"}>
              {source.enabled ? t("common.status.active") : t("common.status.disabled")}
            </StatusPill>
            <StatusPill tone="neutral">{getHierarchyBadge(selectedSource, t)}</StatusPill>
            <StatusPill tone={selectedSource.lastRun?.status === "failed" ? "warning" : selectedSource.lastRun?.status === "succeeded" ? "success" : "neutral"}>
              {selectedSource.lastRun?.status ?? t("common.none")}
            </StatusPill>
          </div>

          <DetailActionRow source={source} t={t} />

          <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            <DetailSection title={t("admin.trustLists.hierarchy.title")}>
              <div style={stackStyle("6px")}>
                <span>
                  {t("admin.trustLists.source.parent")}: {getParentLabel(sources, source.parentSourceId, t)}
                </span>
                <span>
                  {t("admin.trustLists.hierarchy.title")}: {getHierarchyBadge(selectedSource, t)}
                </span>
                <span>
                  {t("admin.trustLists.table.groups")}: {source.groupIds.join(", ") || t("common.none")}
                </span>
                <span>
                  {t("admin.trustLists.metadata.sequence")}: {valueOrDash(selectedSource.lastSnapshot?.sequenceNumber)}
                </span>
                <span>
                  {t("admin.trustLists.metadata.territory")}: {valueOrDash(selectedSource.lastSnapshot?.territory)}
                </span>
              </div>
            </DetailSection>

            <DetailSection title={t("admin.trustLists.detail.metadata.title")}>
              <div style={stackStyle("6px")}>
                <span>{t("admin.trustLists.metadata.digest")}: {valueOrDash(selectedSource.lastSnapshot?.digestSha256)}</span>
                <span>{t("admin.trustLists.timeline.lastRun")}: {formatDate(selectedSource.lastRun?.finishedAt ?? selectedSource.lastRun?.startedAt)}</span>
                <span>{t("admin.trustLists.timeline.lastSuccess")}: {formatDate(selectedSource.lastSuccess?.finishedAt)}</span>
                <span>{t("admin.trustLists.timeline.lastFailure")}: {formatDate(selectedSource.lastFailure?.finishedAt)}</span>
                <span>{t("admin.trustLists.timeline.nextExpectedUpdate")}: {valueOrDash(selectedSource.lastSnapshot?.nextUpdate)}</span>
              </div>
            </DetailSection>

            <DetailSection title={t("admin.trustLists.detail.recovery.title")}>
              {selectedSource.latestRecovery ? (
                <Notice tone="warning" title={t(selectedSource.latestRecovery.titleKey)}>
                  {t(selectedSource.latestRecovery.bodyKey)} {t("admin.trustLists.timeline.recommendedAction")}: {t(selectedSource.latestRecovery.actionKey)}
                </Notice>
              ) : (
                <Notice tone="info" title={t("common.none")}>
                  {t("common.none")}
                </Notice>
              )}
            </DetailSection>

            <DetailSection title={t("admin.trustLists.detail.snapshots.title")}>
              {renderSnapshotsSection(selectedSource, t)}
            </DetailSection>

          <DetailSection title={t("admin.trustLists.detail.syncHistory.title")}>
            {renderSyncHistorySection(selectedSource, t)}
          </DetailSection>

          <DetailSection title={t("admin.trustLists.detail.projectionCounts.title")}>
            {renderProjectionCountsSection(selectedSource, t)}
          </DetailSection>
        </div>

          {renderDetailFailureLayers(selectedSource, sources, t)}
        </div>
      </Panel>
    );
  }

  const rows = buildHierarchyRows(sources);

  return (
    <Panel title={title} description={description}>
      {rows.length === 0 ? (
        <EmptyState title={noAccessTitle}>{noAccessBody}</EmptyState>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {rows.map(({ source, depth }) => (
            <CompactSourceCard
              key={source.source.id}
              source={source}
              depth={depth}
              sources={sources}
              t={t}
            />
          ))}
        </div>
      )}
    </Panel>
  );
}
