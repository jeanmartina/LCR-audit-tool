import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import { assertAuthenticated } from "../../../auth/authorization";
import { Notice, PageHeader, PageShell } from "../../../components/ui/primitives";
import { getPrincipalTranslator } from "../../../i18n";
import { listTrustListSourcesForAdmin } from "../../../trust-lists/admin";
import { TrustListSourceWizard } from "./trust-list-source-wizard";
import { TrustListDiagnosticsPanel } from "./trust-list-diagnostics-panel";

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

type TranslationValues = Record<string, string | number | boolean | null | undefined>;
type SettingsTranslator = (key: string, values?: TranslationValues) => string;

function buildWizardCopy(t: SettingsTranslator): Record<string, string> {
  return Object.fromEntries(wizardCopyKeys.map((key) => [key, t(key)]));
}

type TrustListSearchParams = Promise<Record<string, string | string[] | undefined>>;

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
  const wizardCopy = buildWizardCopy(t);
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

      <TrustListSourceWizard copy={wizardCopy} />

      <TrustListDiagnosticsPanel
        t={t}
        sources={sources}
        title={t("admin.trustLists.sources.title")}
        description={t("admin.trustLists.sources.description")}
        noAccessTitle={t("admin.trustLists.empty.title")}
        noAccessBody={t("admin.trustLists.empty.body")}
      />
    </PageShell>
  );
}
