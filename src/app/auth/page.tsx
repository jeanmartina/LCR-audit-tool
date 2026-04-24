import type { ReactElement } from "react";
import Link from "next/link";
import { getExternalProviderRuntimeConfigs } from "../../auth/providers";
import { getRequestTranslator, getSupportedLocaleOptions } from "../../i18n";

export default async function AuthLandingPage({
  searchParams,
}: {
  searchParams?: Promise<{ locale?: string }>;
}): Promise<ReactElement> {
  const { locale, t } = await getRequestTranslator((await searchParams)?.locale);
  const providers = getExternalProviderRuntimeConfigs();
  const localeOptions = getSupportedLocaleOptions(locale);

  return (
    <main style={{ padding: "32px", display: "grid", gap: "20px" }}>
      <header style={{ display: "grid", gap: "8px" }}>
        <p style={{ margin: 0, color: "#94a3b8" }}>{t("auth.landing.kicker")}</p>
        <h1 style={{ margin: 0 }}>{t("auth.landing.title")}</h1>
        <p style={{ margin: 0, color: "#cbd5e1", maxWidth: "720px" }}>
          {t("auth.landing.description")}
        </p>
        <p style={{ margin: 0, color: "#94a3b8", maxWidth: "720px" }}>
          {t("auth.landing.providerHelp")}
        </p>
      </header>

      <section style={{ display: "grid", gap: "12px" }}>
        <form action="/auth" method="get" style={{ display: "flex", gap: "12px", alignItems: "end", flexWrap: "wrap" }}>
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

        <section
          style={{
            border: "1px solid #334155",
            borderRadius: "12px",
            padding: "12px",
            display: "grid",
            gap: "12px",
            maxWidth: "560px",
          }}
        >
          <strong>{t("auth.landing.loginTitle")}</strong>
          <p style={{ margin: 0, color: "#94a3b8" }}>{t("auth.landing.loginDescription")}</p>
          <form action="/api/auth/login" method="post" style={{ display: "grid", gap: "8px" }}>
            <input name="email" type="email" placeholder={t("auth.landing.loginEmail")} required style={{ padding: "10px" }} />
            <input name="password" type="password" placeholder={t("auth.landing.loginPassword")} required style={{ padding: "10px" }} />
            <input type="hidden" name="locale" value={locale} />
            <button type="submit" style={{ padding: "10px 14px", width: "fit-content" }}>
              {t("auth.landing.loginButton")}
            </button>
          </form>
        </section>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href={`/auth/accept-invite?locale=${encodeURIComponent(locale)}`} style={{ color: "#93c5fd" }}>
            {t("auth.landing.acceptInvite")}
          </Link>
          <Link href={`/?locale=${encodeURIComponent(locale)}`} style={{ color: "#93c5fd" }}>
            {t("auth.landing.backToEntry")}
          </Link>
        </div>
        {providers.map((provider) => (
          <div key={provider.id} style={{ border: "1px solid #334155", borderRadius: "12px", padding: "12px" }}>
            <strong>{t(`auth.provider.${provider.id}`)}</strong>
            <div style={{ color: provider.enabled ? "#86efac" : "#fca5a5" }}>
              {provider.enabled ? t("auth.landing.providerConfigured") : t("auth.landing.providerMissing")}
            </div>
            <div style={{ color: "#94a3b8", fontSize: "12px" }}>
              {t("auth.landing.providerCallback")}: {provider.callbackUrl}
            </div>
            {provider.enabled ? (
              <Link href={`/auth/accept-invite?locale=${encodeURIComponent(locale)}#provider-${provider.id}`} style={{ color: "#93c5fd" }}>
                {t("auth.landing.providerAction", { provider: t(`auth.provider.${provider.id}`) })}
              </Link>
            ) : (
              <div style={{ color: "#94a3b8" }}>{t("auth.entry.providerUnavailable")}</div>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}
