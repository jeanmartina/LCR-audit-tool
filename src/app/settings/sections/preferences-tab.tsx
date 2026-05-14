import type { ReactElement } from "react";
import type { AppLocale } from "../../../i18n";
import type { UserSettingsRecord } from "../../../storage/runtime-store";
import {
  ActionButton,
  CheckboxField,
  EmptyState,
  Field,
  Panel,
  SelectInput,
  TextInput,
  stackStyle,
} from "../../../components/ui/primitives";

type TranslationValues = Record<string, string | number | boolean | null | undefined>;
type SettingsTranslator = (key: string, values?: TranslationValues) => string;

export function PreferencesTab({
  t,
  locale,
  localeOptions,
  userSettings,
  groupIds,
}: {
  t: SettingsTranslator;
  locale: AppLocale;
  localeOptions: Array<{ value: AppLocale; label: string }>;
  userSettings: UserSettingsRecord;
  groupIds: string[];
}): ReactElement {
  return (
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
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <CheckboxField
            name="predictiveEnabled"
            defaultChecked={userSettings.predictiveEnabled}
            label={t("settings.predictiveEnabled")}
            hint={t("settings.predictiveEnabled.hint")}
          />
        </div>

        <div style={stackStyle("8px")}>
          <strong>{t("settings.groups")}</strong>
          {groupIds.length > 0 ? (
            <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              {groupIds.map((groupId) => (
                <CheckboxField
                  key={groupId}
                  name="predictiveGroupIds"
                  value={groupId}
                  defaultChecked={userSettings.predictiveGroupIds.includes(groupId)}
                  label={groupId}
                  hint={t("settings.groups.hint")}
                />
              ))}
            </div>
          ) : (
            <EmptyState title={t("settings.empty.noGroups.title")}>{t("settings.empty.noGroups.body")}</EmptyState>
          )}
        </div>

        <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <div style={stackStyle("8px")}>
            <strong>{t("settings.severities")}</strong>
            {["warning", "critical"].map((severity) => (
              <CheckboxField
                key={severity}
                name="predictiveSeverities"
                value={severity}
                defaultChecked={userSettings.predictiveSeverities.includes(severity as "warning" | "critical")}
                label={severity}
                hint={t("settings.severities.hint")}
              />
            ))}
          </div>
          <div style={stackStyle("8px")}>
            <strong>{t("settings.predictiveTypes")}</strong>
            {[
              { value: "upcoming-expiration", label: t("settings.predictiveType.upcoming-expiration") },
              { value: "publication-delayed", label: t("settings.predictiveType.publication-delayed") },
            ].map((item) => (
              <CheckboxField
                key={item.value}
                name="predictiveTypes"
                value={item.value}
                defaultChecked={userSettings.predictiveTypes.includes(item.value as "upcoming-expiration" | "publication-delayed")}
                label={item.label}
                hint={t("settings.predictiveTypes.hint")}
              />
            ))}
          </div>
        </div>

        <ActionButton>{t("settings.savePreferences")}</ActionButton>
      </form>
    </Panel>
  );
}
