import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import { getCurrentPrincipal } from "../auth/authorization";
import { getExternalProviderRuntimeConfigs } from "../auth/providers";
import { getRequestTranslator, getSupportedLocaleOptions } from "../i18n";
import { ActionGroup, ActionLink, EmptyStateWithActions, Panel, StatusPill } from "../components/ui/primitives";
import { PublicShell } from "../components/public-shell";

export default async function PublicEntryPage({
  searchParams,
}: {
  searchParams?: Promise<{ locale?: string }>;
}): Promise<ReactElement> {
  const principal = await getCurrentPrincipal();
  if (principal) {
    redirect("/reporting");
  }

  const { locale, t } = await getRequestTranslator((await searchParams)?.locale);
  const localeOptions = getSupportedLocaleOptions(locale);
  const providers = (await getExternalProviderRuntimeConfigs()).filter((provider) => provider.enabled);

  return (
    <PublicShell
      locale={locale}
      localeLabel={t("common.locale.label")}
      applyLabel={t("common.actions.apply")}
      localeAction="/"
      localeOptions={localeOptions}
      brandLabel="LabSEC Logs"
      brandBadge="LabSEC"
      kicker={t("auth.entry.kicker")}
      title={t("auth.entry.title")}
      description={t("auth.entry.description")}
      asideText={t("auth.entry.asideText")}
      actions={[
        { href: `/auth?locale=${encodeURIComponent(locale)}`, label: t("auth.entry.primaryAction"), tone: "primary" },
        { href: `/auth/accept-invite?locale=${encodeURIComponent(locale)}`, label: t("auth.entry.secondaryAction") },
      ]}
    >
      <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        <Panel title={t("auth.entry.primaryTitle")} description={t("auth.entry.primaryDescription")} compact>
          <div style={{ display: "grid", gap: "12px" }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <StatusPill tone="success">{t("auth.landing.providerConfigured")}</StatusPill>
              <StatusPill tone="neutral">{t("auth.entry.enabledProviders", { count: providers.length })}</StatusPill>
            </div>
            <p style={{ margin: 0, color: "var(--muted-color)", lineHeight: 1.55 }}>
              {t("auth.entry.publicNote")}
            </p>
            <ActionGroup>
              <ActionLink href={`/auth?locale=${encodeURIComponent(locale)}`} tone="primary">
                {t("auth.entry.primaryAction")}
              </ActionLink>
              <ActionLink href={`/auth/accept-invite?locale=${encodeURIComponent(locale)}`}>
                {t("auth.entry.secondaryAction")}
              </ActionLink>
            </ActionGroup>
          </div>
        </Panel>

        <Panel title={t("auth.entry.providerTitle")} description={t("auth.entry.providerDescription")} compact>
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
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                    <strong>{t(`auth.provider.${provider.id}`)}</strong>
                    <StatusPill tone="success">{t("auth.landing.providerConfigured")}</StatusPill>
                  </div>
                  <ActionLink href={`/auth/accept-invite?locale=${encodeURIComponent(locale)}#provider-${provider.id}`} tone="context">
                    {t("auth.entry.providerAction", { provider: t(`auth.provider.${provider.id}`) })}
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
