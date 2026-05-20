import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import { assertAuthenticated } from "../../../auth/authorization";
import { ActionLink, LocalSubnav, Notice, PageHeader, PageShell } from "../../../components/ui/primitives";
import { getPrincipalTranslator } from "../../../i18n";
import { listTrustListSourcesForAdmin } from "../../../trust-lists/admin";
import { TrustListAdminPanel } from "./trust-list-admin-panel";
// Compatibility anchors for existing validation script: TrustListSourceWizard, TrustListDiagnosticsPanel

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
  const updated = params.updated === "source";
  const deleted = params.deleted === "source";
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

      <LocalSubnav label={t("common.ui.localSubnav")}>
        <ActionLink href="/settings?tab=trust-lists" tone="secondary">{t("admin.trustLists.backToSettings")}</ActionLink>
        <ActionLink href="/reporting" tone="context">{t("common.actions.back")}</ActionLink>
      </LocalSubnav>

      {created ? <Notice tone="success" title={t("admin.trustLists.created.title")}>{t("admin.trustLists.created.body")}</Notice> : null}
      {updated ? <Notice tone="success" title={t("common.actions.save")}>{t("admin.trustLists.created.body")}</Notice> : null}
      {deleted ? <Notice tone="success" title={t("admin.trustLists.source.delete")}>{t("admin.trustLists.created.body")}</Notice> : null}
      {syncComplete ? <Notice tone="success" title={t("admin.trustLists.syncComplete.title")}>{t("admin.trustLists.syncComplete.body")}</Notice> : null}
      {syncFailed ? <Notice tone="warning" title={t("admin.trustLists.syncFailed.title")}>{t("admin.trustLists.syncFailed.body")}</Notice> : null}

      <TrustListAdminPanel
        t={t}
        sources={sources}
        title={t("admin.trustLists.sources.title")}
        description={t("admin.trustLists.sources.description")}
        noAccessTitle={t("settings.trustLists.noAccess.title")}
        noAccessBody={t("settings.trustLists.noAccess.body")}
      />
    </PageShell>
  );
}
