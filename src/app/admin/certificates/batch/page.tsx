import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import { assertAuthenticated } from "../../../../auth/authorization";
import { getPrincipalTranslator } from "../../../../i18n";
import {
  Notice,
  PageHeader,
  PageShell,
  Panel,
} from "../../../../components/ui/primitives";
import { BatchReviewForm } from "./batch-review-form";

export default async function BatchCertificatePage(): Promise<ReactElement> {
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
        backHref="/admin/certificates"
        backLabel={t("admin.certificates.new.back")}
        kicker={t("admin.certificates.title")}
        title={t("admin.certificates.batch.title")}
        description={t("admin.certificates.batch.description")}
      />

      <Panel title={t("admin.certificates.batch.behavior")} description={t("admin.certificates.batch.behaviorText")}>
        <Notice tone="info" title={t("admin.certificates.batch.partialTitle")}>
          {t("admin.certificates.batch.partialBody")}
        </Notice>
        <BatchReviewForm
          copy={{
            archive: t("admin.certificates.batch.archive"),
            archiveHint: t("admin.certificates.batch.archiveHint"),
            sharedTags: t("admin.certificates.batch.sharedTags"),
            sharedTagsHint: t("admin.certificates.batch.sharedTagsHint"),
            groupIds: t("admin.certificates.new.groupIds"),
            groupIdsHint: t("admin.certificates.new.groupIds.hint"),
            ignoredUrls: t("admin.certificates.new.ignoredUrls"),
            ignoredUrlsHint: t("admin.certificates.new.ignoredUrls.hint"),
            groupOverrides: t("admin.certificates.new.groupOverrides"),
            groupOverridesHint: t("admin.certificates.new.groupOverrides.hint"),
            acceptedEntries: t("admin.certificates.batch.acceptedEntries"),
            acceptedEntriesHint: t("admin.certificates.batch.acceptedEntriesHint"),
            previewButton: t("admin.certificates.batch.review.previewButton"),
            previewLoading: t("admin.certificates.batch.review.previewLoading"),
            errorTitle: t("admin.certificates.batch.review.errorTitle"),
          }}
        />
      </Panel>
    </PageShell>
  );
}
