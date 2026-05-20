import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import { getCurrentPrincipal } from "../../auth/authorization";
import { getExternalProviderRuntimeConfigs } from "../../auth/providers";
import { getRequestTranslator, getSupportedLocaleOptions } from "../../i18n";
import { ActionButton, ActionLink, EmptyStateWithActions, Field, Panel, StatusPill, TextInput } from "../../components/ui/primitives";
import { PublicShell } from "../../components/public-shell";

export default async function AuthLandingPage({
  searchParams,
}: {
  searchParams?: Promise<{ locale?: string }>;
}): Promise<ReactElement> {
  const principal = await getCurrentPrincipal();
  if (principal) {
    redirect("/reporting");
  }

  const { locale, t } = await getRequestTranslator((await searchParams)?.locale);
  const providers = (await getExternalProviderRuntimeConfigs()).filter((provider) => provider.enabled);
  const localeOptions = getSupportedLocaleOptions(locale);

  return (
    <PublicShell
      locale={locale}
      localeLabel={t("common.locale.label")}
      applyLabel={t("common.actions.apply")}
      localeAction="/auth"
      localeOptions={localeOptions}
      brandLabel="LabSEC Logs"
      brandBadge="LabSEC"
      kicker={t("auth.landing.kicker")}
      title={t("auth.landing.title")}
      description={t("auth.landing.description")}
      asideText={t("auth.landing.asideText")}
      actions={[
        { href: `/auth/accept-invite?locale=${encodeURIComponent(locale)}`, label: t("auth.landing.acceptInvite"), tone: "primary" },
        { href: `/?locale=${encodeURIComponent(locale)}`, label: t("auth.landing.backToEntry") },
      ]}
    >
      <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <Panel title={t("auth.landing.loginTitle")} description={t("auth.landing.loginDescription")}>
          <form action="/api/auth/login" method="post" style={{ display: "grid", gap: "12px" }}>
            <Field label={t("auth.landing.loginEmail")}>
              <TextInput name="email" type="email" placeholder={t("auth.landing.loginEmail")} required />
            </Field>
            <Field label={t("auth.landing.loginPassword")}>
              <TextInput name="password" type="password" placeholder={t("auth.landing.loginPassword")} required />
            </Field>
            <input type="hidden" name="locale" value={locale} />
            <ActionButton>{t("auth.landing.loginButton")}</ActionButton>
          </form>
        </Panel>

        <Panel title={t("auth.entry.providerTitle")} description={t("auth.landing.providerHelp")}>
          {providers.length > 0 ? (
            <div style={{ display: "grid", gap: "12px" }}>
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  style={{
                    display: "grid",
                    gap: "10px",
                    padding: "14px",
                    borderRadius: "14px",
                    border: "1px solid var(--panel-border)",
                    background: "var(--subtle-bg)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <strong>{t(`auth.provider.${provider.id}`)}</strong>
                    <StatusPill tone="success">{t("auth.landing.providerConfigured")}</StatusPill>
                  </div>
                  <ActionLink href={`/auth/accept-invite?locale=${encodeURIComponent(locale)}#provider-${provider.id}`} tone="context">
                    {t("auth.landing.providerAction", { provider: t(`auth.provider.${provider.id}`) })}
                  </ActionLink>
                </div>
              ))}
            </div>
          ) : (
            <EmptyStateWithActions
              title={t("auth.entry.providerUnavailable")}
              message={t("auth.entry.noEnabledProviders")}
              primaryHref={`/auth?locale=${encodeURIComponent(locale)}`}
              primaryLabel={t("common.ui.tryAgain")}
              recoveryHref={`/auth/accept-invite?locale=${encodeURIComponent(locale)}`}
              recoveryLabel={t("common.ui.recovery")}
            />
          )}
        </Panel>
      </div>
    </PublicShell>
  );
}
