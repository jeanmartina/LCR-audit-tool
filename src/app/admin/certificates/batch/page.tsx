import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import { assertAuthenticated } from "../../../../auth/authorization";
import { getPrincipalTranslator } from "../../../../i18n";
import {
  ActionButton,
  Field,
  Notice,
  PageHeader,
  PageShell,
  Panel,
  TextAreaInput,
  TextInput,
  stackStyle,
} from "../../../../components/ui/primitives";

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
        <form
          action="/api/admin/certificates/import-zip"
          method="post"
          encType="multipart/form-data"
          style={{ ...stackStyle(), marginTop: "16px" }}
        >
          <Field label={t("admin.certificates.batch.archive")} hint={t("admin.certificates.batch.archiveHint")} example="certificates.zip">
            <TextInput type="file" name="archive" required accept=".zip,application/zip" />
          </Field>
          <Field label={t("admin.certificates.batch.sharedTags")} hint={t("admin.certificates.batch.sharedTagsHint")} example="qualified, imported-batch">
            <TextInput name="tags" />
          </Field>
          <Field label={t("admin.certificates.new.groupIds")} hint={t("admin.certificates.new.groupIds.hint")} example="group-1, group-2">
            <TextInput name="groupIds" required />
          </Field>
          <Field label={t("admin.certificates.new.ignoredUrls")} hint={t("admin.certificates.new.ignoredUrls.hint")}>
            <TextAreaInput name="ignoredUrls" rows={3} />
          </Field>
          <Field label={t("admin.certificates.new.groupOverrides")} hint={t("admin.certificates.new.groupOverrides.hint")}>
            <TextAreaInput name="groupOverrides" rows={8} />
          </Field>
          <Panel compact title={t("admin.certificates.batch.acceptedEntries")} description={t("admin.certificates.batch.acceptedEntriesHint")}>
            <span />
          </Panel>
          <ActionButton>{t("admin.certificates.batch.submit")}</ActionButton>
        </form>
      </Panel>
    </PageShell>
  );
}
