import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import { assertAuthenticated } from "../../auth/authorization";
import { listProviderStatusEntries } from "../../auth/providers";
import {
  ActionButton,
  CheckboxField,
  EmptyState,
  Field,
  Notice,
  PageHeader,
  PageShell,
  Panel,
  SelectInput,
  stackStyle,
  StatusPill,
  TextAreaInput,
  TextInput,
} from "../../components/ui/primitives";
import { getPrincipalTranslator, getSupportedLocaleOptions } from "../../i18n";
import {
  getManageableGroupSettings,
  getPlatformSettings,
  getUserSettings,
  listUserGroupIds,
} from "../../settings/preferences";

type SettingsSearchParams = Promise<Record<string, string | string[] | undefined>>;

function getSavedNoticeKey(saved: string | null): string | null {
  if (saved === "profile") return "settings.saved.profile";
  if (saved === "group") return "settings.saved.group";
  if (saved === "platform") return "settings.saved.platform";
  if (saved === "provider") return "settings.saved.provider";
  return null;
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: SettingsSearchParams;
}): Promise<ReactElement> {
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
  const providerStatuses = principal.isPlatformAdmin ? await listProviderStatusEntries() : [];
  const { locale, t } = await getPrincipalTranslator(principal);
  const localeOptions = getSupportedLocaleOptions(locale);
  const params = searchParams ? await searchParams : {};
  const saved = typeof params.saved === "string" ? params.saved : null;
  const savedNoticeKey = getSavedNoticeKey(saved);
  const firstRunComplete = params.firstRun === "complete";

  return (
    <PageShell>
      <PageHeader
        backHref="/reporting"
        backLabel={t("settings.backToReporting")}
        kicker={t("settings.kicker")}
        title={t("settings.title")}
        description={t("settings.description")}
      />

      {savedNoticeKey ? (
        <Notice tone="success" title={t("settings.saved.title")}>
          {t(savedNoticeKey)}
        </Notice>
      ) : null}

      {firstRunComplete ? (
        <Notice tone="success" title={t("setup.complete.createdTitle")}>
          {t("setup.complete.createdBody")}
        </Notice>
      ) : null}

      <Panel title={t("settings.myPreferences")} description={t("settings.myPreferences.description")}>
        <form action="/api/settings/profile" method="post" style={stackStyle()}>
          <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <Field label={t("settings.theme")} hint={t("settings.theme.hint")}>
              <SelectInput name="preferredTheme" defaultValue={userSettings.preferredTheme}>
                <option value="dark">{t("settings.theme.dark")}</option>
                <option value="light">{t("settings.theme.light")}</option>
              </SelectInput>
            </Field>
            <Field label={t("settings.locale")} hint={t("settings.locale.hint")}>
              <SelectInput name="preferredLocale" defaultValue={locale}>
                {localeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </SelectInput>
            </Field>
            <CheckboxField name="predictiveEnabled" defaultChecked={userSettings.predictiveEnabled} label={t("settings.predictiveEnabled")} hint={t("settings.predictiveEnabled.hint")} />
          </div>

          <div style={stackStyle("8px")}>
            <strong>{t("settings.groups")}</strong>
            <span style={{ color: "var(--muted-color)", fontSize: "13px" }}>{t("settings.groups.hint")}</span>
            {groupIds.length > 0 ? (
              <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                {groupIds.map((groupId) => (
                  <CheckboxField key={groupId} name="predictiveGroupIds" value={groupId} defaultChecked={userSettings.predictiveGroupIds.includes(groupId)} label={groupId} />
                ))}
              </div>
            ) : (
              <EmptyState title={t("settings.empty.noGroups.title")}>{t("settings.empty.noGroups.body")}</EmptyState>
            )}
          </div>

          <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            <div style={stackStyle("8px")}>
              <strong>{t("settings.severities")}</strong>
              <span style={{ color: "var(--muted-color)", fontSize: "13px" }}>{t("settings.severities.hint")}</span>
              {["warning", "critical"].map((severity) => (
                <CheckboxField key={severity} name="predictiveSeverities" value={severity} defaultChecked={userSettings.predictiveSeverities.includes(severity as "warning" | "critical")} label={severity} />
              ))}
            </div>
            <div style={stackStyle("8px")}>
              <strong>{t("settings.predictiveTypes")}</strong>
              <span style={{ color: "var(--muted-color)", fontSize: "13px" }}>{t("settings.predictiveTypes.hint")}</span>
              {[
                { value: "upcoming-expiration", label: t("settings.predictiveType.upcoming-expiration") },
                { value: "publication-delayed", label: t("settings.predictiveType.publication-delayed") },
              ].map((item) => (
                <CheckboxField key={item.value} name="predictiveTypes" value={item.value} defaultChecked={userSettings.predictiveTypes.includes(item.value as "upcoming-expiration" | "publication-delayed")} label={item.label} />
              ))}
            </div>
          </div>

          <ActionButton>{t("settings.savePreferences")}</ActionButton>
        </form>
      </Panel>

      <section style={stackStyle()}>
        <h2 style={{ margin: 0 }}>{t("settings.groupDefaults")}</h2>
        <p style={{ margin: 0, color: "var(--muted-color)", lineHeight: 1.5 }}>{t("settings.groupDefaults.description")}</p>
        {groupSettings.length > 0 ? (
          groupSettings.map((groupSetting) => (
            <Panel key={groupSetting.groupId} compact>
              <form action={`/api/settings/groups/${groupSetting.groupId}`} method="post" style={stackStyle()}>
                <h3 style={{ margin: 0 }}>{groupSetting.groupId}</h3>
                <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                  <Field label={t("settings.group.trustSource")} hint={t("settings.group.trustSource.hint")} example={t("settings.group.trustSource.example")}>
                    <TextInput name="defaultTrustSource" defaultValue={groupSetting.defaultTrustSource ?? ""} />
                  </Field>
                  <Field label={t("settings.group.pki")} hint={t("settings.group.pki.hint")} example={t("settings.group.pki.example")}>
                    <TextInput name="defaultPki" defaultValue={groupSetting.defaultPki ?? ""} />
                  </Field>
                  <Field label={t("settings.group.jurisdiction")} hint={t("settings.group.jurisdiction.hint")} example={t("settings.group.jurisdiction.example")}>
                    <TextInput name="defaultJurisdiction" defaultValue={groupSetting.defaultJurisdiction ?? ""} />
                  </Field>
                </div>
                <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                  <Field label={t("settings.group.windowDays")} hint={t("settings.group.windowDays.hint")} example={t("settings.group.windowDays.example")}>
                    <TextInput type="number" min={1} max={30} name="predictiveWindowDays" defaultValue={groupSetting.predictiveWindowDays} />
                  </Field>
                  <CheckboxField name="predictiveEnabled" defaultChecked={groupSetting.predictiveEnabled} label={t("settings.group.enabled")} hint={t("settings.group.enabled.hint")} />
                </div>
                <ActionButton>{t("settings.group.save")}</ActionButton>
              </form>
            </Panel>
          ))
        ) : (
          <EmptyState title={t("settings.empty.noManageableGroups.title")}>{t("settings.empty.noManageableGroups.body")}</EmptyState>
        )}
      </section>

      {platformSettings ? (
        <section style={stackStyle()}>
          <Panel title={t("settings.platformTitle")} description={t("settings.platform.description")}>
            <form action="/api/settings/platform" method="post" style={stackStyle()}>
              <Field label={t("settings.platform.windowDays")} hint={t("settings.platform.windowDays.hint")} example={t("settings.platform.windowDays.example")}>
                <TextInput type="number" min={1} max={30} name="predictiveWindowDays" defaultValue={platformSettings.predictiveWindowDays} />
              </Field>
              <CheckboxField name="predictiveEnabled" defaultChecked={platformSettings.predictiveEnabled} label={t("settings.platform.enabled")} hint={t("settings.platform.enabled.hint")} />
              <ActionButton>{t("settings.platform.save")}</ActionButton>
            </form>
          </Panel>

          <Panel title={t("settings.trustLists.title")} description={t("settings.trustLists.description")}>
            <div style={stackStyle("10px")}>
              <p style={{ margin: 0, color: "var(--muted-color)", lineHeight: 1.5 }}>
                {t("settings.trustLists.body")}
              </p>
              <a href="/admin/trust-lists" style={{ color: "var(--link-color)", width: "fit-content" }}>
                {t("settings.trustLists.open")}
              </a>
            </div>
          </Panel>

          <Panel title={t("settings.providers.title")} description={t("settings.providers.description")}>
            {providerStatuses.length > 0 ? (
              <div style={stackStyle()}>
                {providerStatuses.map((provider) => (
                  <form key={provider.id} action={`/api/settings/platform/providers/${provider.id}`} method="post" style={{ display: "grid", gap: "14px", padding: "16px", borderRadius: "14px", border: "1px solid var(--panel-border)", background: "var(--subtle-bg)" }}>
                    <div style={stackStyle("8px")}>
                      <strong style={{ fontSize: "18px" }}>{provider.label}</strong>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <StatusPill tone={provider.configured ? "success" : "warning"}>{t("settings.providers.configured")}: {provider.configured ? t("common.yes") : t("common.no")}</StatusPill>
                        <StatusPill tone={provider.verification?.verified ? "success" : "warning"}>{t("settings.providers.currentStatus")}: {provider.verification?.verified ? t("settings.providers.verified") : t("settings.providers.unverified")}</StatusPill>
                      </div>
                    </div>
                    <Field label={t("settings.providers.callbackUrl")} hint={t("settings.providers.callbackUrl.hint")}>
                      <TextInput readOnly value={provider.callbackUrl} />
                    </Field>
                    <CheckboxField name="verified" defaultChecked={provider.verification?.verified ?? false} label={t("settings.providers.markVerified")} hint={t("settings.providers.markVerified.hint")} />
                    <Field label={t("settings.providers.notes")} hint={t("settings.providers.notes.hint")} example={t("settings.providers.notes.example")}>
                      <TextAreaInput name="notes" defaultValue={provider.verification?.notes ?? ""} rows={3} />
                    </Field>
                    <div style={{ color: "var(--muted-color)", fontSize: "14px" }}>
                      {provider.verification?.verifiedAt
                        ? t("settings.providers.lastVerifiedAt", { verifiedAt: provider.verification.verifiedAt.toISOString(), userId: provider.verification.verifiedByUserId ?? t("common.none") })
                        : t("settings.providers.notVerifiedYet")}
                    </div>
                    <ActionButton>{t("settings.providers.save")}</ActionButton>
                  </form>
                ))}
              </div>
            ) : (
              <EmptyState title={t("settings.providers.empty.title")}>{t("settings.providers.empty.body")}</EmptyState>
            )}
          </Panel>
        </section>
      ) : null}
    </PageShell>
  );
}
