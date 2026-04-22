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
            submit: t("admin.certificates.new.submit"),
          }}
        />
      </Panel>
    </PageShell>
  );
}
