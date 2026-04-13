import type { ReactElement } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { assertAuthenticated } from "../../auth/authorization";
import { listProviderStatusEntries } from "../../auth/providers";
import { getPrincipalTranslator, getSupportedLocaleOptions } from "../../i18n";
import {
  getManageableGroupSettings,
  getPlatformSettings,
  getUserSettings,
  listUserGroupIds,
} from "../../settings/preferences";

const PANEL = {
  border: "1px solid var(--panel-border)",
  borderRadius: "16px",
  padding: "16px",
  background: "var(--panel-bg)",
} as const;

export default async function SettingsPage(): Promise<ReactElement> {
  let principal;
  try {
    principal = await assertAuthenticated();
  } catch {
    redirect("/auth");
  }

  const [userSettings, groupIds, groupSettings, platformSettings] = await Promise.all([
    getUserSettings(principal.userId),
    listUserGroupIds(principal.userId),
    getManageableGroupSettings(principal),
    principal.isPlatformAdmin ? getPlatformSettings() : Promise.resolve(null),
  ]);
  const providerStatuses = principal.isPlatformAdmin
    ? await listProviderStatusEntries()
    : [];
  const { locale, t } = await getPrincipalTranslator(principal);
  const localeOptions = getSupportedLocaleOptions(locale);

  return (
    <main style={{ padding: "32px", display: "grid", gap: "24px" }}>
      <header style={{ display: "grid", gap: "8px" }}>
        <Link href="/reporting" style={{ color: "var(--link-color)" }}>
          {t("settings.backToReporting")}
        </Link>
        <p style={{ margin: 0, color: "var(--muted-color)" }}>{t("settings.kicker")}</p>
        <h1 style={{ margin: 0 }}>{t("settings.title")}</h1>
        <p style={{ margin: 0, color: "var(--muted-color)", maxWidth: "780px" }}>
          {t("settings.description")}
        </p>
      </header>

      <section style={PANEL}>
        <h2 style={{ marginTop: 0 }}>{t("settings.myPreferences")}</h2>
        <form action="/api/settings/profile" method="post" style={{ display: "grid", gap: "16px" }}>
          <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
            <label>
              <div>{t("settings.theme")}</div>
              <select name="preferredTheme" defaultValue={userSettings.preferredTheme} style={{ width: "100%", padding: "10px" }}>
                <option value="dark">{t("settings.theme.dark")}</option>
                <option value="light">{t("settings.theme.light")}</option>
              </select>
            </label>
            <label>
              <div>{t("settings.locale")}</div>
              <select name="preferredLocale" defaultValue={locale} style={{ width: "100%", padding: "10px" }}>
                {localeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "grid", alignContent: "end" }}>
              <span>
                <input type="checkbox" name="predictiveEnabled" defaultChecked={userSettings.predictiveEnabled} /> {t("settings.predictiveEnabled")}
              </span>
            </label>
          </div>

          <div style={{ display: "grid", gap: "8px" }}>
            <strong>{t("settings.groups")}</strong>
            {groupIds.map((groupId) => (
              <label key={groupId}>
                <input
                  type="checkbox"
                  name="predictiveGroupIds"
                  value={groupId}
                  defaultChecked={userSettings.predictiveGroupIds.includes(groupId)}
                />{" "}
                {groupId}
              </label>
            ))}
          </div>

          <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            <div style={{ display: "grid", gap: "8px" }}>
              <strong>{t("settings.severities")}</strong>
              {["warning", "critical"].map((severity) => (
                <label key={severity}>
                  <input
                    type="checkbox"
                    name="predictiveSeverities"
                    value={severity}
                    defaultChecked={userSettings.predictiveSeverities.includes(severity as "warning" | "critical")}
                  />{" "}
                  {severity}
                </label>
              ))}
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              <strong>{t("settings.predictiveTypes")}</strong>
              {[
                { value: "upcoming-expiration", label: t("settings.predictiveType.upcoming-expiration") },
                { value: "publication-delayed", label: t("settings.predictiveType.publication-delayed") },
              ].map((item) => (
                <label key={item.value}>
                  <input
                    type="checkbox"
                    name="predictiveTypes"
                    value={item.value}
                    defaultChecked={userSettings.predictiveTypes.includes(item.value as "upcoming-expiration" | "publication-delayed")}
                  />{" "}
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" style={{ padding: "10px 14px" }}>
            {t("settings.savePreferences")}
          </button>
        </form>
      </section>

      {groupSettings.length > 0 ? (
        <section style={{ display: "grid", gap: "16px" }}>
          <h2 style={{ margin: 0 }}>{t("settings.groupDefaults")}</h2>
          {groupSettings.map((groupSetting) => (
            <form
              key={groupSetting.groupId}
              action={`/api/settings/groups/${groupSetting.groupId}`}
              method="post"
              style={PANEL}
            >
              <h3 style={{ marginTop: 0 }}>{groupSetting.groupId}</h3>
              <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                <label>
                  <div>{t("settings.group.trustSource")}</div>
                  <input name="defaultTrustSource" defaultValue={groupSetting.defaultTrustSource ?? ""} style={{ width: "100%", padding: "10px" }} />
                </label>
                <label>
                  <div>{t("settings.group.pki")}</div>
                  <input name="defaultPki" defaultValue={groupSetting.defaultPki ?? ""} style={{ width: "100%", padding: "10px" }} />
                </label>
                <label>
                  <div>{t("settings.group.jurisdiction")}</div>
                  <input name="defaultJurisdiction" defaultValue={groupSetting.defaultJurisdiction ?? ""} style={{ width: "100%", padding: "10px" }} />
                </label>
              </div>
              <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", marginTop: "12px" }}>
                <label>
                  <div>{t("settings.group.windowDays")}</div>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    name="predictiveWindowDays"
                    defaultValue={groupSetting.predictiveWindowDays}
                    style={{ width: "100%", padding: "10px" }}
                  />
                </label>
                <label style={{ display: "grid", alignContent: "end" }}>
                  <span>
                    <input
                      type="checkbox"
                      name="predictiveEnabled"
                      defaultChecked={groupSetting.predictiveEnabled}
                    />{" "}
                    {t("settings.group.enabled")}
                  </span>
                </label>
              </div>
              <button type="submit" style={{ padding: "10px 14px", marginTop: "12px" }}>
                {t("settings.group.save")}
              </button>
            </form>
          ))}
        </section>
      ) : null}

      {platformSettings ? (
        <section style={{ display: "grid", gap: "16px" }}>
          <section style={PANEL}>
            <h2 style={{ marginTop: 0 }}>{t("settings.platformTitle")}</h2>
            <form action="/api/settings/platform" method="post" style={{ display: "grid", gap: "12px" }}>
              <label>
                <div>{t("settings.platform.windowDays")}</div>
                <input
                  type="number"
                  min={1}
                  max={30}
                  name="predictiveWindowDays"
                  defaultValue={platformSettings.predictiveWindowDays}
                  style={{ width: "100%", padding: "10px" }}
                />
              </label>
              <label>
                <input
                  type="checkbox"
                  name="predictiveEnabled"
                  defaultChecked={platformSettings.predictiveEnabled}
                />{" "}
                {t("settings.platform.enabled")}
              </label>
              <button type="submit" style={{ padding: "10px 14px" }}>
                {t("settings.platform.save")}
              </button>
            </form>
          </section>

          <section style={PANEL}>
            <h2 style={{ marginTop: 0 }}>{t("settings.providers.title")}</h2>
            <p style={{ marginTop: 0, color: "var(--muted-color)" }}>
              {t("settings.providers.description")}
            </p>
            <div style={{ display: "grid", gap: "16px" }}>
              {providerStatuses.map((provider) => (
                <form
                  key={provider.id}
                  action={`/api/settings/platform/providers/${provider.id}`}
                  method="post"
                  style={{
                    display: "grid",
                    gap: "12px",
                    padding: "16px",
                    borderRadius: "12px",
                    border: "1px solid var(--panel-border)",
                  }}
                >
                  <div style={{ display: "grid", gap: "4px" }}>
                    <strong>{provider.label}</strong>
                    <span style={{ color: "var(--muted-color)", fontSize: "14px" }}>
                      {t("settings.providers.callbackUrl")}: {provider.callbackUrl}
                    </span>
                    <span style={{ color: "var(--muted-color)", fontSize: "14px" }}>
                      {t("settings.providers.configured")}:{" "}
                      {provider.configured ? t("common.yes") : t("common.no")}
                    </span>
                    <span style={{ color: "var(--muted-color)", fontSize: "14px" }}>
                      {t("settings.providers.currentStatus")}:{" "}
                      {provider.verification?.verified
                        ? t("settings.providers.verified")
                        : t("settings.providers.unverified")}
                    </span>
                  </div>
                  <label>
                    <input
                      type="checkbox"
                      name="verified"
                      defaultChecked={provider.verification?.verified ?? false}
                    />{" "}
                    {t("settings.providers.markVerified")}
                  </label>
                  <label style={{ display: "grid", gap: "6px" }}>
                    <span>{t("settings.providers.notes")}</span>
                    <textarea
                      name="notes"
                      defaultValue={provider.verification?.notes ?? ""}
                      rows={3}
                      style={{ width: "100%", padding: "10px" }}
                    />
                  </label>
                  <div style={{ color: "var(--muted-color)", fontSize: "14px" }}>
                    {provider.verification?.verifiedAt
                      ? t("settings.providers.lastVerifiedAt", {
                          verifiedAt: provider.verification.verifiedAt.toISOString(),
                          userId: provider.verification.verifiedByUserId ?? t("common.none"),
                        })
                      : t("settings.providers.notVerifiedYet")}
                  </div>
                  <button type="submit" style={{ padding: "10px 14px" }}>
                    {t("settings.providers.save")}
                  </button>
                </form>
              ))}
            </div>
          </section>
        </section>
      ) : null}
    </main>
  );
}
