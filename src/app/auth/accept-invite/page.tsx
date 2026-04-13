import type { ReactElement } from "react";
import { getRequestTranslator, getSupportedLocaleOptions } from "../../../i18n";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams?: Promise<{ locale?: string }>;
}): Promise<ReactElement> {
  const { locale, t } = await getRequestTranslator((await searchParams)?.locale);
  const localeOptions = getSupportedLocaleOptions(locale);

  return (
    <main style={{ padding: "32px", display: "grid", gap: "16px", maxWidth: "640px" }}>
      <h1 style={{ margin: 0 }}>{t("auth.invite.title")}</h1>
      <p style={{ margin: 0, color: "#cbd5e1" }}>
        {t("auth.invite.description")}
      </p>
      <form action="/auth/accept-invite" method="get" style={{ display: "flex", gap: "12px", alignItems: "end", flexWrap: "wrap" }}>
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
      <form action="/api/auth/invite/accept" method="post" style={{ display: "grid", gap: "12px" }}>
        <input type="hidden" name="locale" value={locale} />
        <input name="inviteCode" placeholder={t("auth.invite.code")} required style={{ padding: "10px" }} />
        <input name="email" type="email" placeholder={t("auth.invite.email")} required style={{ padding: "10px" }} />
        <input name="displayName" placeholder={t("auth.invite.displayName")} style={{ padding: "10px" }} />
        <input name="password" type="password" placeholder={t("auth.invite.password")} style={{ padding: "10px" }} />
        <button type="submit" style={{ padding: "10px 14px" }}>{t("auth.invite.submit")}</button>
      </form>
      <section style={{ display: "grid", gap: "12px" }}>
        <h2 style={{ margin: 0, fontSize: "18px" }}>{t("auth.invite.providerTitle")}</h2>
        <p style={{ margin: 0, color: "#94a3b8" }}>
          {t("auth.invite.providerDescription")}
        </p>
        {[
          { id: "google" },
          { id: "entra-id" },
          { id: "oidc" },
        ].map((provider) => (
          <form
            key={provider.id}
            action={`/api/auth/provider/start/${provider.id}`}
            method="post"
            style={{ display: "grid", gap: "8px", border: "1px solid #334155", borderRadius: "12px", padding: "12px" }}
          >
            <strong>{t(`auth.provider.${provider.id}`)}</strong>
            <input type="hidden" name="locale" value={locale} />
            <input name="inviteCode" placeholder={t("auth.invite.code")} required style={{ padding: "10px" }} />
            <input name="email" type="email" placeholder={t("auth.invite.providerEmail")} required style={{ padding: "10px" }} />
            <input name="displayName" placeholder={t("auth.invite.displayName")} style={{ padding: "10px" }} />
            <button type="submit" style={{ padding: "10px 14px" }}>
              {t("auth.invite.providerStart", { provider: t(`auth.provider.${provider.id}`) })}
            </button>
          </form>
        ))}
      </section>
    </main>
  );
}
