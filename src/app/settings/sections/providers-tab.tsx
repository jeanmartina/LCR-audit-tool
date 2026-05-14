import type { ReactElement } from "react";
import type { ProviderRuntimeConfig, ProviderStatusEntry } from "../../../auth/providers";
import { ActionButton, CheckboxField, EmptyState, Field, Panel, StatusPill, TextAreaInput, TextInput, stackStyle } from "../../../components/ui/primitives";

type TranslationValues = Record<string, string | number | boolean | null | undefined>;
type SettingsTranslator = (key: string, values?: TranslationValues) => string;

export function ProvidersTab({
  t,
  providerStatuses,
  providerRuntimeConfigs,
}: {
  t: SettingsTranslator;
  providerStatuses: ProviderStatusEntry[];
  providerRuntimeConfigs: ProviderRuntimeConfig[];
}): ReactElement {
  const runtimeById = new Map(providerRuntimeConfigs.map((item) => [item.id, item] as const));
  return (
    <Panel title={t("settings.providers.title")} description={t("settings.providers.description")}>
      {providerStatuses.length > 0 ? (
        <div style={stackStyle()}>
          {providerStatuses.map((provider) => {
            const runtime = runtimeById.get(provider.id);
            return (
            <form
              key={provider.id}
              action={`/api/settings/platform/providers/${provider.id}`}
              method="post"
              style={{
                display: "grid",
                gap: "14px",
                padding: "16px",
                borderRadius: "14px",
                border: "1px solid var(--panel-border)",
                background: "var(--subtle-bg)",
              }}
            >
              <div style={stackStyle("8px")}>
                <strong style={{ fontSize: "18px" }}>{provider.label}</strong>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <StatusPill tone={provider.configured ? "success" : "warning"}>
                    {t("settings.providers.configured")}: {provider.configured ? t("common.yes") : t("common.no")}
                  </StatusPill>
                  <StatusPill tone={runtime?.enabled ? "success" : "warning"}>
                    {t("settings.providers.enabled")}: {runtime?.enabled ? t("common.yes") : t("common.no")}
                  </StatusPill>
                  <StatusPill tone={provider.verification?.verified ? "success" : "warning"}>
                    {t("settings.providers.currentStatus")}: {provider.verification?.verified ? t("settings.providers.verified") : t("settings.providers.unverified")}
                  </StatusPill>
                </div>
              </div>
              <Field label={t("settings.providers.callbackUrl")} hint={t("settings.providers.callbackUrl.hint")}>
                <TextInput readOnly value={provider.callbackUrl} />
              </Field>
              <CheckboxField
                name="enabled"
                defaultChecked={runtime?.enabled ?? false}
                label={t("settings.providers.enabled")}
                hint={t("settings.providers.enabled.hint")}
              />
              <CheckboxField
                name="verified"
                defaultChecked={provider.verification?.verified ?? false}
                label={t("settings.providers.markVerified")}
                hint={t("settings.providers.markVerified.hint")}
              />
              <Field label={t("settings.providers.notes")} hint={t("settings.providers.notes.hint")} example={t("settings.providers.notes.example")}>
                <TextAreaInput name="notes" defaultValue={provider.verification?.notes ?? ""} rows={3} />
              </Field>
              <div style={{ color: "var(--muted-color)", fontSize: "14px" }}>
                {provider.verification?.verifiedAt
                  ? t("settings.providers.lastVerifiedAt", {
                      verifiedAt: provider.verification.verifiedAt.toISOString(),
                      userId: provider.verification.verifiedByUserId ?? t("common.none"),
                    })
                  : t("settings.providers.notVerifiedYet")}
              </div>
              <ActionButton>{t("settings.providers.save")}</ActionButton>
            </form>
            );
          })}
        </div>
      ) : (
        <EmptyState title={t("settings.providers.empty.title")}>{t("settings.providers.empty.body")}</EmptyState>
      )}
    </Panel>
  );
}
