import type { ReactElement } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentPrincipal } from "../auth/authorization";
import { getExternalProviderRuntimeConfigs } from "../auth/providers";
import { getRequestTranslator, getSupportedLocaleOptions } from "../i18n";

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
  const providers = getExternalProviderRuntimeConfigs();

  return (
    <main style={{ padding: "32px", display: "grid", gap: "24px", maxWidth: "960px" }}>
      <header style={{ display: "grid", gap: "8px" }}>
        <p style={{ margin: 0, color: "#94a3b8" }}>{t("auth.entry.kicker")}</p>
        <h1 style={{ margin: 0 }}>{t("auth.entry.title")}</h1>
        <p style={{ margin: 0, color: "#cbd5e1", maxWidth: "760px" }}>
          {t("auth.entry.description")}
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gap: "16px",
          border: "1px solid #334155",
          borderRadius: "16px",
          padding: "20px",
          background: "rgba(15, 23, 42, 0.45)",
        }}
      >
        <div style={{ display: "grid", gap: "6px" }}>
          <strong>{t("auth.entry.primaryTitle")}</strong>
          <p style={{ margin: 0, color: "#cbd5e1" }}>{t("auth.entry.primaryDescription")}</p>
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link
            href={`/auth?locale=${encodeURIComponent(locale)}`}
            style={{
              padding: "10px 14px",
              borderRadius: "999px",
              background: "#2563eb",
              color: "#eff6ff",
              textDecoration: "none",
            }}
          >
            {t("auth.entry.primaryAction")}
          </Link>
          <Link
            href={`/auth/accept-invite?locale=${encodeURIComponent(locale)}`}
            style={{ padding: "10px 14px", borderRadius: "999px", border: "1px solid #475569", color: "#bfdbfe", textDecoration: "none" }}
          >
            {t("auth.entry.secondaryAction")}
          </Link>
        </div>
      </section>

      <section style={{ display: "grid", gap: "12px" }}>
        <div style={{ display: "grid", gap: "6px" }}>
          <strong>{t("auth.entry.providerTitle")}</strong>
          <p style={{ margin: 0, color: "#94a3b8" }}>{t("auth.entry.providerDescription")}</p>
        </div>
        <div style={{ display: "grid", gap: "12px" }}>
          {providers.map((provider) => (
            <div
              key={provider.id}
              style={{
                display: "grid",
                gap: "6px",
                border: "1px solid #334155",
                borderRadius: "12px",
                padding: "14px",
              }}
            >
              <strong>{t(`auth.provider.${provider.id}`)}</strong>
              <span style={{ color: provider.enabled ? "#86efac" : "#fca5a5" }}>
                {provider.enabled ? t("auth.landing.providerConfigured") : t("auth.landing.providerMissing")}
              </span>
              <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                {t("auth.landing.providerCallback")}: {provider.callbackUrl}
              </span>
              {provider.enabled ? (
                <Link
                  href={`/auth/accept-invite?locale=${encodeURIComponent(locale)}#provider-${provider.id}`}
                  style={{ color: "#93c5fd", width: "fit-content" }}
                >
                  {t("auth.entry.providerAction", { provider: t(`auth.provider.${provider.id}`) })}
                </Link>
              ) : (
                <span style={{ color: "#94a3b8" }}>{t("auth.entry.providerUnavailable")}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: "grid", gap: "12px" }}>
        <strong>{t("auth.entry.localeTitle")}</strong>
        <form action="/" method="get" style={{ display: "flex", gap: "12px", alignItems: "end", flexWrap: "wrap" }}>
          <label style={{ display: "grid", gap: "6px", minWidth: "220px" }}>
            <span>{t("common.locale.label")}</span>
            <select name="locale" defaultValue={locale} style={{ padding: "10px" }}>
              {localeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" style={{ padding: "10px 14px" }}>
            {t("common.actions.apply")}
          </button>
        </form>
      </section>
    </main>
  );
}
