import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import { assertAuthenticated } from "../../../../auth/authorization";
import { getPrincipalTranslator } from "../../../../i18n";
import { PageHeader, PageShell, Panel } from "../../../../components/ui/primitives";
import { CertificatePreviewForm } from "./certificate-preview-form";

export default async function NewCertificatePage(): Promise<ReactElement> {
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
        title={t("admin.certificates.new.title")}
        description={t("admin.certificates.new.description")}
      />

      <Panel title={t("admin.certificates.new.previewConfig")} description={t("admin.certificates.new.previewConfigText")}>
        {/* action="/api/admin/certificates/import" lives in CertificatePreviewForm. */}
        <CertificatePreviewForm
          copy={{
            displayName: t("admin.certificates.new.displayName"),
            displayNameHint: t("admin.certificates.new.displayName.hint"),
            file: t("admin.certificates.new.file"),
            fileHint: t("admin.certificates.new.file.hint"),
            tags: t("admin.certificates.new.tags"),
            tagsHint: t("admin.certificates.new.tags.hint"),
            groupIds: t("admin.certificates.new.groupIds"),
            groupIdsHint: t("admin.certificates.new.groupIds.hint"),
            ignoredUrls: t("admin.certificates.new.ignoredUrls"),
            ignoredUrlsHint: t("admin.certificates.new.ignoredUrls.hint"),
            groupOverrides: t("admin.certificates.new.groupOverrides"),
            groupOverridesHint: t("admin.certificates.new.groupOverrides.hint"),
            previewButton: t("admin.certificates.new.previewButton"),
            previewLoading: t("admin.certificates.new.previewLoading"),
            previewErrorTitle: t("admin.certificates.new.previewErrorTitle"),
            previewConfig: t("admin.certificates.new.previewConfig"),
            previewConfigText: t("admin.certificates.new.previewConfigText"),
            previewFingerprint: t("admin.certificates.new.previewFingerprint"),
            previewDerivedCrls: t("admin.certificates.new.previewDerivedCrls"),
            previewTrackedCrls: t("admin.certificates.new.previewTrackedCrls"),
            previewIgnoredCrls: t("admin.certificates.new.previewIgnoredCrls"),
            previewEffectiveDefaults: t("admin.certificates.new.previewEffectiveDefaults"),
            previewWarnings: t("admin.certificates.new.previewWarnings"),
            previewEmpty: t("admin.certificates.new.previewEmpty"),
            reviewTitle: t("admin.certificates.new.reviewTitle"),
            reviewDescription: t("admin.certificates.new.reviewDescription"),
            reviewDecisionLabel: t("admin.certificates.new.reviewDecisionLabel"),
            "reviewDecision.accept": t("admin.certificates.new.reviewDecision.accept"),
            "reviewDecision.edit": t("admin.certificates.new.reviewDecision.edit"),
            "reviewDecision.ignore": t("admin.certificates.new.reviewDecision.ignore"),
            "reviewDecision.reject": t("admin.certificates.new.reviewDecision.reject"),
            "reviewDecision.duplicate": t("admin.certificates.new.reviewDecision.duplicate"),
            "reviewDecision.pending": t("admin.certificates.new.reviewDecision.pending"),
            reviewStatusLabel: t("admin.certificates.new.reviewStatusLabel"),
            reviewJustificationLabel: t("admin.certificates.new.reviewJustificationLabel"),
            reviewJustificationHint: t("admin.certificates.new.reviewJustificationHint"),
            reviewMissingJustification: t("admin.certificates.new.reviewMissingJustification"),
            reviewSaveButton: t("admin.certificates.new.reviewSaveButton"),
            reviewSaving: t("admin.certificates.new.reviewSaving"),
            reviewServerGuardrail: t("admin.certificates.new.reviewServerGuardrail"),
            reviewSaveFailed: t("admin.certificates.new.reviewSaveFailed"),
            submit: t("admin.certificates.new.submit"),
          }}
        />
      </Panel>
    </PageShell>
  );
}
