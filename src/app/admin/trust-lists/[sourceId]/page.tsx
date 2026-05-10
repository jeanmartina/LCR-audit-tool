import type { ReactElement } from "react";
import { notFound, redirect } from "next/navigation";
import { assertAuthenticated } from "../../../../auth/authorization";
import { PageHeader, PageShell } from "../../../../components/ui/primitives";
import { getPrincipalTranslator } from "../../../../i18n";
import { listTrustListSourcesForAdmin } from "../../../../trust-lists/admin";
import { TrustListDiagnosticsPanel } from "../trust-list-diagnostics-panel";

type TrustListSourceParams = Promise<{ sourceId: string }>;

export default async function TrustListSourceDetailPage({
  params,
}: {
  params: TrustListSourceParams;
}): Promise<ReactElement> {
  let principal;
  try {
    principal = await assertAuthenticated();
  } catch {
    redirect("/auth");
  }

  const [{ t }, sources, { sourceId }] = await Promise.all([
    getPrincipalTranslator(principal),
    listTrustListSourcesForAdmin(principal),
    params,
  ]);

  const source = sources.find((item) => item.source.id === sourceId);
  if (!source) {
    notFound();
  }

  return (
    <PageShell>
      <PageHeader
        backHref="/admin/trust-lists"
        backLabel={t("common.actions.back")}
        kicker={t("admin.trustLists.kicker")}
        title={source.source.label}
        description={t("admin.trustLists.detail.description")}
      />

      <TrustListDiagnosticsPanel
        t={t}
        sources={sources}
        sourceId={sourceId}
        title={t("admin.trustLists.detail.title")}
        description={t("admin.trustLists.detail.description")}
        noAccessTitle={t("admin.trustLists.empty.title")}
        noAccessBody={t("admin.trustLists.empty.body")}
      />
    </PageShell>
  );
}
