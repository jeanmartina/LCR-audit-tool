import type { ReactElement } from "react";
import Link from "next/link";
import type { AuthenticatedPrincipal } from "../../../auth/authorization";
import type { PlatformSettingsRecord } from "../../../storage/runtime-store";
import { ActionButton, CheckboxField, Field, Notice, Panel, TextInput, stackStyle } from "../../../components/ui/primitives";
import { getAdministrationOverview } from "../../../settings/admin-overview";

type TranslationValues = Record<string, string | number | boolean | null | undefined>;
type SettingsTranslator = (key: string, values?: TranslationValues) => string;

export async function AdministrationTab({
  t,
  principal,
  platformSettings,
  isPlatformAdmin,
}: {
  t: SettingsTranslator;
  principal: AuthenticatedPrincipal;
  platformSettings: PlatformSettingsRecord | null;
  isPlatformAdmin: boolean;
}): Promise<ReactElement> {
  const overview = await getAdministrationOverview(principal, t);

  return (
    <section style={stackStyle()}>
      <Panel title={t("settings.admin.title")} description={t("settings.admin.description")}>
        {!overview.bootstrapComplete ? (
          <Notice tone="warning" title={t("settings.admin.bootstrap.pendingTitle")}>
            {t("settings.admin.bootstrap.pendingBody")} <Link href={overview.setupHref}>{t("settings.admin.bootstrap.openSetup")}</Link>
          </Notice>
        ) : null}

        <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <Panel compact title={t("settings.admin.bootstrap.title")}>
            <p style={{ margin: 0, color: "var(--muted-color)", lineHeight: 1.5 }}>
              {overview.bootstrapComplete ? t("settings.admin.bootstrap.completeBody") : t("settings.admin.bootstrap.pendingBody")}
            </p>
          </Panel>
          <Panel compact title={t("settings.admin.roles.title")}>
            <div style={stackStyle("6px")}>
              {overview.roles.length > 0 ? (
                overview.roles.map((item) => (
                  <div key={item.label} style={{ display: "grid", gap: "2px" }}>
                    <strong style={{ fontSize: "13px" }}>{item.label}</strong>
                    <span style={{ color: "var(--muted-color)", fontSize: "13px" }}>{item.value}</span>
                  </div>
                ))
              ) : (
                <p style={{ margin: 0, color: "var(--muted-color)", lineHeight: 1.5 }}>{t("settings.admin.roles.empty")}</p>
              )}
            </div>
          </Panel>
          <Panel compact title={t("settings.admin.audit.title")}>
            <div style={stackStyle("6px")}>
              {overview.auditEvents.length > 0 ? (
                overview.auditEvents.map((item) => (
                  <div key={`${item.label}-${item.value}`} style={{ display: "grid", gap: "2px" }}>
                    <strong style={{ fontSize: "13px" }}>{item.label}</strong>
                    <span style={{ color: "var(--muted-color)", fontSize: "13px" }}>{item.value}</span>
                  </div>
                ))
              ) : (
                <p style={{ margin: 0, color: "var(--muted-color)", lineHeight: 1.5 }}>{t("settings.admin.audit.empty")}</p>
              )}
            </div>
          </Panel>
          <Panel compact title={t("settings.admin.health.title")}>
            <div style={stackStyle("6px")}>
              {overview.health.length > 0 ? (
                overview.health.map((item) => (
                  <div key={item.label} style={{ display: "grid", gap: "2px" }}>
                    <strong style={{ fontSize: "13px" }}>{item.label}</strong>
                    <span style={{ color: "var(--muted-color)", fontSize: "13px" }}>
                      {item.enabled ? t("settings.admin.health.enabled") : t("settings.admin.health.disabled")} /{" "}
                      {item.verified ? t("settings.admin.health.verified") : t("settings.admin.health.unverified")}
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ margin: 0, color: "var(--muted-color)", lineHeight: 1.5 }}>{t("settings.admin.health.empty")}</p>
              )}
            </div>
          </Panel>
        </div>
      </Panel>

      {isPlatformAdmin && platformSettings ? (
        <Panel title={t("settings.platformTitle")} description={t("settings.platform.description")}>
          <form action="/api/settings/platform" method="post" style={stackStyle()}>
            <Field label={t("settings.platform.windowDays")} hint={t("settings.platform.windowDays.hint")} example={t("settings.platform.windowDays.example")}>
              <TextInput type="number" min={1} max={30} name="predictiveWindowDays" defaultValue={platformSettings.predictiveWindowDays} />
            </Field>
            <CheckboxField name="predictiveEnabled" defaultChecked={platformSettings.predictiveEnabled} label={t("settings.platform.enabled")} hint={t("settings.platform.enabled.hint")} />
            <ActionButton>{t("settings.platform.save")}</ActionButton>
          </form>
        </Panel>
      ) : (
        <Notice tone="info" title={t("settings.admin.platformOnly.title")}>{t("settings.admin.platformOnly.body")}</Notice>
      )}
    </section>
  );
}
