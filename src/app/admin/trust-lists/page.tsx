import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import { assertAuthenticated } from "../../../auth/authorization";
import {
  EmptyState,
  Notice,
  PageHeader,
  PageShell,
  Panel,
  stackStyle,
  StatusPill,
  ActionButton,
} from "../../../components/ui/primitives";
import { getPrincipalTranslator } from "../../../i18n";
import { listTrustListSourcesForAdmin } from "../../../trust-lists/admin";
import { TrustListSourceWizard, type TrustListWizardCopy } from "./trust-list-source-wizard";

const wizardCopyKeys = [
  "admin.trustLists.new.title",
  "admin.trustLists.new.description",
  "admin.trustLists.label",
  "admin.trustLists.label.hint",
  "admin.trustLists.label.example",
  "admin.trustLists.url",
  "admin.trustLists.url.hint",
  "admin.trustLists.url.example",
  "admin.trustLists.groupIds",
  "admin.trustLists.groupIds.hint",
  "admin.trustLists.groupIds.example",
  "admin.trustLists.enabled",
  "admin.trustLists.enabled.hint",
  "admin.trustLists.create",
  "admin.trustLists.wizard.step.details",
  "admin.trustLists.wizard.step.details.body",
  "admin.trustLists.wizard.step.test",
  "admin.trustLists.wizard.step.test.body",
  "admin.trustLists.wizard.step.save",
  "admin.trustLists.wizard.step.save.body",
  "admin.trustLists.wizard.testButton",
  "admin.trustLists.wizard.testing",
  "admin.trustLists.wizard.testErrorTitle",
  "admin.trustLists.wizard.testErrorFallback",
  "admin.trustLists.wizard.testResultTitle",
  "admin.trustLists.wizard.saveWithoutTest.title",
  "admin.trustLists.wizard.saveWithoutTest.body",
  "admin.trustLists.wizard.preview.digest",
  "admin.trustLists.wizard.preview.sequence",
  "admin.trustLists.wizard.preview.territory",
  "admin.trustLists.wizard.preview.xmlSize",
  "admin.trustLists.wizard.preview.certificateCount",
  "admin.trustLists.wizard.preview.validationStatus",
  "admin.trustLists.recovery.invalidUrl.title",
  "admin.trustLists.recovery.invalidUrl.body",
  "admin.trustLists.recovery.invalidUrl.action",
  "admin.trustLists.recovery.httpsRequired.title",
  "admin.trustLists.recovery.httpsRequired.body",
  "admin.trustLists.recovery.httpsRequired.action",
  "admin.trustLists.recovery.xmlSignatureInvalid.title",
  "admin.trustLists.recovery.xmlSignatureInvalid.body",
  "admin.trustLists.recovery.xmlSignatureInvalid.action",
  "admin.trustLists.recovery.xmlTooLarge.title",
  "admin.trustLists.recovery.xmlTooLarge.body",
  "admin.trustLists.recovery.xmlTooLarge.action",
  "admin.trustLists.recovery.fetchFailed.title",
  "admin.trustLists.recovery.fetchFailed.body",
  "admin.trustLists.recovery.fetchFailed.action",
  "admin.trustLists.recovery.noCertificates.title",
  "admin.trustLists.recovery.noCertificates.body",
  "admin.trustLists.recovery.noCertificates.action",
  "admin.trustLists.recovery.parseFailed.title",
  "admin.trustLists.recovery.parseFailed.body",
  "admin.trustLists.recovery.parseFailed.action",
  "admin.trustLists.recovery.unknown.title",
  "admin.trustLists.recovery.unknown.body",
  "admin.trustLists.recovery.unknown.action",
];

const cardGridStyle = {
  display: "grid",
  gap: "16px",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
};

type TrustListSearchParams = Promise<Record<string, string | string[] | undefined>>;

function formatDate(value: Date | null | undefined): string {
  return value ? value.toISOString() : "-";
}

function valueOrDash(value: string | number | null | undefined): string {
  return value === null || value === undefined || value === "" ? "-" : String(value);
}

export default async function TrustListsPage({
  searchParams,
}: {
  searchParams?: TrustListSearchParams;
}): Promise<ReactElement> {
  let principal;
  try {
    principal = await assertAuthenticated();
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
  const copy: TrustListWizardCopy = Object.fromEntries(wizardCopyKeys.map((key) => [key, t(key)]));

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

      <TrustListSourceWizard copy={copy} />

      <Panel title={t("admin.trustLists.sources.title")} description={t("admin.trustLists.sources.description")}>
        {sources.length === 0 ? (
          <EmptyState title={t("admin.trustLists.empty.title")}>{t("admin.trustLists.empty.body")}</EmptyState>
        ) : (
          <div style={cardGridStyle}>
            {sources.map((item) => {
              const statusTone = item.lastRun?.status === "failed" ? "warning" : item.lastRun?.status === "succeeded" ? "success" : "neutral";
              const latestFailureReason = item.lastRun?.failureReason ?? item.latestProjectionFailureReason;
              return (
                <Panel key={item.source.id} compact title={item.source.label} description={item.source.url}>
                  <div style={stackStyle("12px")}>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <StatusPill tone={item.source.enabled ? "success" : "warning"}>{item.source.enabled ? t("common.status.active") : t("common.status.disabled")}</StatusPill>
                      <StatusPill tone={statusTone}>{item.lastRun?.status ?? t("common.none")}</StatusPill>
                    </div>
                    <div style={stackStyle("4px")}>
                      <strong>{t("admin.trustLists.timeline.title")}</strong>
                      <span>{t("admin.trustLists.table.groups")}: {item.source.groupIds.join(", ")}</span>
                      <span>{t("admin.trustLists.timeline.lastRun")}: {formatDate(item.lastRun?.finishedAt ?? item.lastRun?.startedAt)}</span>
                      <span>{t("admin.trustLists.timeline.lastSuccess")}: {formatDate(item.lastSuccess?.finishedAt)}</span>
                      <span>{t("admin.trustLists.timeline.lastFailure")}: {formatDate(item.lastFailure?.finishedAt)}</span>
                      <span>{t("admin.trustLists.timeline.nextExpectedUpdate")}: {valueOrDash(item.lastSnapshot?.nextUpdate)}</span>
                    </div>
                    <div style={stackStyle("4px")}>
                      <strong>{t("admin.trustLists.table.metadata")}</strong>
                      <span>{t("admin.trustLists.metadata.digest")}: {valueOrDash(item.lastSnapshot?.digestSha256)}</span>
                      <span>{t("admin.trustLists.metadata.sequence")}: {valueOrDash(item.lastSnapshot?.sequenceNumber)}</span>
                      <span>{t("admin.trustLists.metadata.territory")}: {valueOrDash(item.lastSnapshot?.territory)}</span>
                      <span>{t("admin.trustLists.metadata.imported")}: {item.lastSuccess?.importedCount ?? 0} / {item.lastSuccess?.failedCount ?? 0}</span>
                    </div>
                    <div style={stackStyle("4px")}>
                      <strong>{t("admin.trustLists.timeline.changeSummary")}</strong>
                      <span>{t("admin.trustLists.projection.imported")}: {item.projectionCounts.imported}</span>
                      <span>{t("admin.trustLists.projection.updated")}: {item.projectionCounts.updated}</span>
                      <span>{t("admin.trustLists.projection.skippedUnchanged")}: {item.projectionCounts.skippedUnchanged}</span>
                      <span>{t("admin.trustLists.projection.skippedDuplicate")}: {item.projectionCounts.skippedDuplicate}</span>
                      <span>{t("admin.trustLists.projection.failed")}: {item.projectionCounts.failed}</span>
                    </div>
                    {item.latestRecovery ? (
                      <Notice tone="warning" title={t(item.latestRecovery.titleKey)}>
                        {t(item.latestRecovery.bodyKey)} {t("admin.trustLists.timeline.recommendedAction")}: {t(item.latestRecovery.actionKey)}
                      </Notice>
                    ) : latestFailureReason ? (
                      <Notice tone="warning" title={t("admin.trustLists.timeline.rawFailure")}>
                        {latestFailureReason}
                      </Notice>
                    ) : null}
                    <form action={`/api/admin/trust-lists/${item.source.id}/sync`} method="post">
                      <ActionButton>{t("admin.trustLists.syncNow")}</ActionButton>
                    </form>
                  </div>
                </Panel>
              );
            })}
          </div>
        )}
      </Panel>
    </PageShell>
  );
}
