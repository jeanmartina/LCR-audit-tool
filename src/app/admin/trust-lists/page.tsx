import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import { assertPlatformAdmin } from "../../../auth/authorization";
import {
  ActionButton,
  CheckboxField,
  EmptyState,
  Field,
  Notice,
  PageHeader,
  PageShell,
  Panel,
  stackStyle,
  StatusPill,
  TextInput,
} from "../../../components/ui/primitives";
import { getPrincipalTranslator } from "../../../i18n";
import { listTrustListSourcesForAdmin } from "../../../trust-lists/admin";

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const cellStyle = {
  padding: "10px",
  borderBottom: "1px solid var(--panel-border)",
  textAlign: "left" as const,
  verticalAlign: "top" as const,
};

type TrustListSearchParams = Promise<Record<string, string | string[] | undefined>>;

function formatDate(value: Date | null | undefined): string {
  return value ? value.toISOString() : "-";
}

export default async function TrustListsPage({
  searchParams,
}: {
  searchParams?: TrustListSearchParams;
}): Promise<ReactElement> {
  let principal;
  try {
    principal = await assertPlatformAdmin();
  } catch {
    redirect("/auth");
  }

  const [{ t }, sources, params] = await Promise.all([
    getPrincipalTranslator(principal),
    listTrustListSourcesForAdmin(principal),
    searchParams ? searchParams : Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);
  const created = params.created === "source";
  const syncComplete = params.sync === "complete";
  const syncFailed = params.sync === "failed";

  return (
    <PageShell>
      <PageHeader
        backHref="/settings"
        backLabel={t("admin.trustLists.backToSettings")}
        kicker={t("admin.trustLists.kicker")}
        title={t("admin.trustLists.title")}
        description={t("admin.trustLists.description")}
      />

      {created ? <Notice tone="success" title={t("admin.trustLists.created.title")}>{t("admin.trustLists.created.body")}</Notice> : null}
      {syncComplete ? <Notice tone="success" title={t("admin.trustLists.syncComplete.title")}>{t("admin.trustLists.syncComplete.body")}</Notice> : null}
      {syncFailed ? <Notice tone="warning" title={t("admin.trustLists.syncFailed.title")}>{t("admin.trustLists.syncFailed.body")}</Notice> : null}

      <Panel title={t("admin.trustLists.new.title")} description={t("admin.trustLists.new.description")}>
        <form action="/api/admin/trust-lists" method="post" style={stackStyle()}>
          <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            <Field label={t("admin.trustLists.label")} hint={t("admin.trustLists.label.hint")} example={t("admin.trustLists.label.example")}>
              <TextInput name="label" required />
            </Field>
            <Field label={t("admin.trustLists.url")} hint={t("admin.trustLists.url.hint")} example={t("admin.trustLists.url.example")}>
              <TextInput name="url" type="url" required />
            </Field>
            <Field label={t("admin.trustLists.groupIds")} hint={t("admin.trustLists.groupIds.hint")} example={t("admin.trustLists.groupIds.example")}>
              <TextInput name="groupIds" required />
            </Field>
          </div>
          <CheckboxField name="enabled" defaultChecked label={t("admin.trustLists.enabled")} hint={t("admin.trustLists.enabled.hint")} />
          <Notice title={t("admin.trustLists.validation.title")}>
            {t("admin.trustLists.validation.body")} XMLDSig.
          </Notice>
          <ActionButton>{t("admin.trustLists.create")}</ActionButton>
        </form>
      </Panel>

      <Panel title={t("admin.trustLists.sources.title")} description={t("admin.trustLists.sources.description")}>
        {sources.length === 0 ? (
          <EmptyState title={t("admin.trustLists.empty.title")}>{t("admin.trustLists.empty.body")}</EmptyState>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={cellStyle}>{t("admin.trustLists.table.source")}</th>
                  <th style={cellStyle}>{t("admin.trustLists.table.status")}</th>
                  <th style={cellStyle}>{t("admin.trustLists.table.lastSuccess")}</th>
                  <th style={cellStyle}>{t("admin.trustLists.table.lastFailure")}</th>
                  <th style={cellStyle}>{t("admin.trustLists.table.metadata")}</th>
                  <th style={cellStyle}>{t("admin.trustLists.table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((item) => {
                  const statusTone = item.lastRun?.status === "failed" ? "warning" : item.lastRun?.status === "succeeded" ? "success" : "neutral";
                  return (
                    <tr key={item.source.id}>
                      <td style={cellStyle}>
                        <div style={stackStyle("6px")}>
                          <strong>{item.source.label}</strong>
                          <code>{item.source.url}</code>
                          <span>{t("admin.trustLists.table.groups")}: {item.source.groupIds.join(", ")}</span>
                        </div>
                      </td>
                      <td style={cellStyle}>
                        <div style={stackStyle("8px")}>
                          <StatusPill tone={item.source.enabled ? "success" : "warning"}>{item.source.enabled ? t("common.status.active") : t("common.status.disabled")}</StatusPill>
                          <StatusPill tone={statusTone}>{item.lastRun?.status ?? t("common.none")}</StatusPill>
                        </div>
                      </td>
                      <td style={cellStyle}>{formatDate(item.lastSuccess?.finishedAt)}</td>
                      <td style={cellStyle}>{item.lastFailure ? `${formatDate(item.lastFailure.finishedAt)} — ${item.lastFailure.failureReason ?? "-"}` : "-"}</td>
                      <td style={cellStyle}>
                        <div style={stackStyle("4px")}>
                          <span>{t("admin.trustLists.metadata.digest")}: {item.lastSnapshot?.digestSha256 ?? "-"}</span>
                          <span>{t("admin.trustLists.metadata.sequence")}: {item.lastSnapshot?.sequenceNumber ?? "-"}</span>
                          <span>{t("admin.trustLists.metadata.territory")}: {item.lastSnapshot?.territory ?? "-"}</span>
                          <span>{t("admin.trustLists.metadata.nextUpdate")}: {item.lastSnapshot?.nextUpdate ?? "-"}</span>
                          <span>{t("admin.trustLists.metadata.imported")}: {item.lastSuccess?.importedCount ?? 0} / {item.lastSuccess?.failedCount ?? 0}</span>
                          <span>{t("admin.trustLists.projection.imported")}: {item.projectionCounts.imported}</span>
                          <span>{t("admin.trustLists.projection.updated")}: {item.projectionCounts.updated}</span>
                          <span>{t("admin.trustLists.projection.skippedUnchanged")}: {item.projectionCounts.skippedUnchanged}</span>
                          <span>{t("admin.trustLists.projection.skippedDuplicate")}: {item.projectionCounts.skippedDuplicate}</span>
                          <span>{t("admin.trustLists.projection.failed")}: {item.projectionCounts.failed}</span>
                          <span>{t("admin.trustLists.projection.latestFailure")}: {item.latestProjectionFailureReason ?? "-"}</span>
                        </div>
                      </td>
                      <td style={cellStyle}>
                        <form action={`/api/admin/trust-lists/${item.source.id}/sync`} method="post">
                          <ActionButton>{t("admin.trustLists.syncNow")}</ActionButton>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </PageShell>
  );
}
