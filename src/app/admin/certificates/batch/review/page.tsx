import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import { assertAuthenticated } from "../../../../../auth/authorization";
import { getPrincipalTranslator } from "../../../../../i18n";
import { PageHeader, PageShell, Panel } from "../../../../../components/ui/primitives";
import { BatchReviewPageClient } from "../batch-review-page-client";

export default async function BatchReviewPage(): Promise<ReactElement> {
  let principal;
  try {
    principal = await assertAuthenticated();
  } catch {
    redirect("/auth");
  }
  const { t } = await getPrincipalTranslator(principal);

  return (
    <PageShell>
      <PageHeader
        backHref="/admin/certificates/batch"
        backLabel={t("admin.certificates.new.back")}
        kicker={t("admin.certificates.title")}
        title={t("admin.certificates.batch.review.title")}
        description={t("admin.certificates.batch.review.description")}
      />
      <Panel title={t("admin.certificates.batch.review.panelTitle")} description={t("admin.certificates.batch.review.panelDescription")}>
        <BatchReviewPageClient
          copy={{
            missingState: t("admin.certificates.batch.review.missingState"),
            loadError: t("admin.certificates.batch.review.loadError"),
            decision: t("admin.certificates.new.reviewDecisionLabel"),
            save: t("admin.certificates.new.reviewSaveButton"),
            saving: t("admin.certificates.new.reviewSaving"),
            saveError: t("admin.certificates.batch.review.saveError"),
            successRedirect: t("admin.certificates.batch.review.successRedirect"),
            justification: t("admin.certificates.new.reviewJustificationLabel"),
            justificationHint: t("admin.certificates.new.reviewJustificationHint"),
            decisionAccept: t("admin.certificates.new.reviewDecision.accept"),
            decisionEdit: t("admin.certificates.new.reviewDecision.edit"),
            decisionIgnore: t("admin.certificates.new.reviewDecision.ignore"),
            decisionReject: t("admin.certificates.new.reviewDecision.reject"),
            decisionDuplicate: t("admin.certificates.new.reviewDecision.duplicate"),
            decisionPending: t("admin.certificates.new.reviewDecision.pending"),
            reviewMismatch: t("admin.certificates.batch.review.reviewMismatch"),
            revalidationTitle: t("admin.certificates.batch.review.revalidationTitle"),
          }}
        />
      </Panel>
    </PageShell>
  );
}
