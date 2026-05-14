import type { ReactElement } from "react";
import {
  ActionButton,
  CheckboxField,
  EmptyState,
  Field,
  Notice,
  Panel,
  SelectInput,
  StatusPill,
  TextInput,
  stackStyle,
} from "../../../components/ui/primitives";
import { TrustListSourceWizard } from "./trust-list-source-wizard";
import type { TrustListSourceSummary } from "../../../trust-lists/admin";

type TranslationValues = Record<string, string | number | boolean | null | undefined>;
type SettingsTranslator = (key: string, values?: TranslationValues) => string;

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
] as const;

function formatDate(value: Date | null | undefined): string {
  return value ? value.toISOString() : "-";
}

function valueOrDash(value: string | number | null | undefined): string {
  return value === null || value === undefined || value === "" ? "-" : String(value);
}

function buildWizardCopy(t: SettingsTranslator): Record<string, string> {
  return Object.fromEntries(wizardCopyKeys.map((key) => [key, t(key)]));
}

function getParentLabel(
  sources: TrustListSourceSummary[],
  parentSourceId: string | null,
  t: SettingsTranslator,
): string {
  if (!parentSourceId) return t("common.none");
  return sources.find((item) => item.source.id === parentSourceId)?.source.label ?? parentSourceId;
}

export function TrustListAdminPanel({
  t,
  sources,
  title,
  description,
  noAccessTitle,
  noAccessBody,
}: {
  t: SettingsTranslator;
  sources: TrustListSourceSummary[] | null;
  title: string;
  description: string;
  noAccessTitle: string;
  noAccessBody: string;
}): ReactElement {
  const copy = buildWizardCopy(t);

  if (!sources) {
    return <Notice tone="info" title={noAccessTitle}>{noAccessBody}</Notice>;
  }

  return (
    <Panel title={title} description={description}>
      <div style={stackStyle()}>
        <TrustListSourceWizard copy={copy} />

        <Panel title={t("admin.trustLists.sources.title")} description={t("admin.trustLists.sources.description")}>
          {sources.length === 0 ? (
            <EmptyState title={t("admin.trustLists.empty.title")}>{t("admin.trustLists.empty.body")}</EmptyState>
          ) : (
            <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
              {sources.map((item) => {
                const source = item.source;
                const statusTone = item.lastRun?.status === "failed" ? "warning" : item.lastRun?.status === "succeeded" ? "success" : "neutral";
                const latestFailureReason = item.lastRun?.failureReason ?? item.latestProjectionFailureReason;
                const parentOptions = sources.filter((candidate) => candidate.source.id !== source.id);

                return (
                  <Panel key={source.id} compact title={source.label} description={source.url}>
                    <div style={stackStyle("12px")}>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <StatusPill tone={source.enabled ? "success" : "warning"}>
                          {source.enabled ? t("common.status.active") : t("common.status.disabled")}
                        </StatusPill>
                        <StatusPill tone={statusTone}>{item.lastRun?.status ?? t("common.none")}</StatusPill>
                      </div>

                      <div style={stackStyle("4px")}>
                        <strong>{t("admin.trustLists.timeline.title")}</strong>
                        <span>
                          {t("admin.trustLists.table.groups")}: {source.groupIds.join(", ")}
                        </span>
                        <span>
                          {t("admin.trustLists.source.parent")}: {getParentLabel(sources, source.parentSourceId, t)}
                        </span>
                        <span>
                          {t("admin.trustLists.timeline.lastRun")}: {formatDate(item.lastRun?.finishedAt ?? item.lastRun?.startedAt)}
                        </span>
                        <span>
                          {t("admin.trustLists.timeline.lastSuccess")}: {formatDate(item.lastSuccess?.finishedAt)}
                        </span>
                        <span>
                          {t("admin.trustLists.timeline.lastFailure")}: {formatDate(item.lastFailure?.finishedAt)}
                        </span>
                        <span>
                          {t("admin.trustLists.timeline.nextExpectedUpdate")}: {valueOrDash(item.lastSnapshot?.nextUpdate)}
                        </span>
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

                      <Panel compact title={t("common.actions.save")}>
                        <form action={`/api/admin/trust-lists/${source.id}`} method="post" style={stackStyle()}>
                          <input type="hidden" name="_method" value="PATCH" />
                          <Field label={t("admin.trustLists.label")} hint={t("admin.trustLists.label.hint")}>
                            <TextInput name="label" defaultValue={source.label} />
                          </Field>
                          <Field label={t("admin.trustLists.url")} hint={t("admin.trustLists.url.hint")}>
                            <TextInput name="url" defaultValue={source.url} />
                          </Field>
                          <Field label={t("admin.trustLists.groupIds")} hint={t("admin.trustLists.groupIds.hint")}>
                            <TextInput name="groupIds" defaultValue={source.groupIds.join(", ")} />
                          </Field>
                          <Field label={t("admin.trustLists.source.parent")} hint={t("admin.trustLists.source.parent")}>
                            <SelectInput name="parentSourceId" defaultValue={source.parentSourceId ?? ""}>
                              <option value="">{t("common.none")}</option>
                              {parentOptions.map((candidate) => (
                                <option key={candidate.source.id} value={candidate.source.id}>
                                  {candidate.source.label}
                                </option>
                              ))}
                            </SelectInput>
                          </Field>
                          <CheckboxField
                            name="enabled"
                            defaultChecked={source.enabled}
                            label={t("admin.trustLists.enabled")}
                            hint={t("admin.trustLists.enabled.hint")}
                          />
                          <ActionButton>{t("common.actions.save")}</ActionButton>
                        </form>
                      </Panel>

                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <form action={`/api/admin/trust-lists/${source.id}`} method="post">
                          <input type="hidden" name="_method" value="PATCH" />
                          <input type="hidden" name="label" value={source.label} />
                          <input type="hidden" name="url" value={source.url} />
                          <input type="hidden" name="groupIds" value={source.groupIds.join(",")} />
                          <input type="hidden" name="parentSourceId" value={source.parentSourceId ?? ""} />
                          <input type="hidden" name="enabled" value="false" />
                          <ActionButton>{t("admin.trustLists.source.archive")}</ActionButton>
                        </form>
                        <form action={`/api/admin/trust-lists/${source.id}`} method="post">
                          <input type="hidden" name="_method" value="DELETE" />
                          <ActionButton>{t("admin.trustLists.source.delete")}</ActionButton>
                        </form>
                      </div>
                      <form action={`/api/admin/trust-lists/${source.id}/sync`} method="post">
                        <ActionButton>{t("admin.trustLists.syncNow")}</ActionButton>
                      </form>
                    </div>
                  </Panel>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </Panel>
  );
}
