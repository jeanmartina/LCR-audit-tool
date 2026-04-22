import type { ReactElement } from "react";
import Link from "next/link";
import { hasPlatformAdmin } from "../../auth/models";
import { getRequestTranslator, getSupportedLocaleOptions } from "../../i18n";
import {
  ActionButton,
  Field,
  Notice,
  PageHeader,
  PageShell,
  Panel,
  SelectInput,
  TextInput,
  stackStyle,
} from "../../components/ui/primitives";

export default async function FirstRunSetupPage({
  searchParams,
}: {
  searchParams?: Promise<{ locale?: string; error?: string }>;
}): Promise<ReactElement> {
  const params = (await searchParams) ?? {};
  const { locale, t } = await getRequestTranslator(params.locale);
  const localeOptions = getSupportedLocaleOptions(locale);
  const complete = await hasPlatformAdmin();

  return (
    <PageShell>
      <PageHeader
        kicker={t("setup.kicker")}
        title={t("setup.title")}
        description={t("setup.description")}
      />

      {complete ? (
        <Notice tone="success" title={t("setup.complete.title")}>
          {t("setup.complete.body")} <Link href="/auth">{t("setup.complete.signIn")}</Link>
        </Notice>
      ) : (
        <Panel title={t("setup.form.title")} description={t("setup.form.description")}>
          {params.error ? (
            <Notice tone="warning" title={t("setup.error.title")}>
              {t(`setup.error.${params.error}`)}
            </Notice>
          ) : null}
          <form action="/api/setup/platform-admin" method="post" style={stackStyle()}>
            <Field label={t("setup.email")} hint={t("setup.email.hint")}>
              <TextInput name="email" type="email" required placeholder="admin@example.org" />
            </Field>
            <Field label={t("setup.displayName")} hint={t("setup.displayName.hint")}>
              <TextInput name="displayName" placeholder="Platform Admin" />
            </Field>
            <Field label={t("setup.password")} hint={t("setup.password.hint")}>
              <TextInput name="password" type="password" required minLength={12} />
            </Field>
            <Field label={t("setup.confirmPassword")} hint={t("setup.confirmPassword.hint")}>
              <TextInput name="confirmPassword" type="password" required minLength={12} />
            </Field>
            <Field label={t("common.locale.label")} hint={t("settings.locale.hint")}>
              <SelectInput name="locale" defaultValue={locale}>
                {localeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <ActionButton>{t("setup.submit")}</ActionButton>
          </form>
        </Panel>
      )}
    </PageShell>
  );
}
