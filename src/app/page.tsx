import type { ReactElement } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentPrincipal } from "../auth/authorization";
import { getExternalProviderRuntimeConfigs } from "../auth/providers";
import { getRequestTranslator, getSupportedLocaleOptions } from "../i18n";
import { EmptyState, Panel, StatusPill } from "../components/ui/primitives";
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
  const providers = getExternalProviderRuntimeConfigs().filter((provider) => provider.enabled);

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
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link
                href={`/auth?locale=${encodeURIComponent(locale)}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "42px",
                  padding: "0 16px",
                  borderRadius: "999px",
                  background: "var(--button-bg)",
                  border: "1px solid var(--button-border)",
                  color: "var(--button-fg)",
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                {t("auth.entry.primaryAction")}
              </Link>
              <Link
                href={`/auth/accept-invite?locale=${encodeURIComponent(locale)}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "42px",
                  padding: "0 16px",
                  borderRadius: "999px",
                  border: "1px solid var(--panel-border)",
                  background: "var(--subtle-bg)",
                  color: "inherit",
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                {t("auth.entry.secondaryAction")}
              </Link>
            </div>
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
                  <Link
                    href={`/auth/accept-invite?locale=${encodeURIComponent(locale)}#provider-${provider.id}`}
                    style={{
                      width: "fit-content",
                      color: "var(--link-color)",
                      textDecoration: "none",
                      fontWeight: 700,
                    }}
                  >
                    {t("auth.entry.providerAction", { provider: t(`auth.provider.${provider.id}`) })}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title={t("auth.entry.providerUnavailable")}>
              {t("auth.entry.noEnabledProviders")}
            </EmptyState>
          )}
        </Panel>
      </div>
    </PublicShell>
  );
}
