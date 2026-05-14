import type { ReactElement } from "react";
import type { GroupRecord, GroupSettingsRecord } from "../../../storage/runtime-store";
import { ActionButton, CheckboxField, EmptyState, Field, Panel, TextInput, stackStyle } from "../../../components/ui/primitives";

type TranslationValues = Record<string, string | number | boolean | null | undefined>;
type SettingsTranslator = (key: string, values?: TranslationValues) => string;

export function GroupsTab({
  t,
  groups,
  groupSettings,
  canCreateGroup,
}: {
  t: SettingsTranslator;
  groups: GroupRecord[];
  groupSettings: GroupSettingsRecord[];
  canCreateGroup: boolean;
}): ReactElement {
  const settingsByGroupId = new Map(groupSettings.map((item) => [item.groupId, item] as const));

  return (
    <section style={stackStyle()}>
      <Panel title={t("settings.groups.title")} description={t("settings.groups.description")}>
        {canCreateGroup ? (
          <form action="/api/auth/groups" method="post" style={stackStyle()}>
            <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <Field label={t("settings.groups.create.name")} hint={t("settings.groups.create.name.hint")}>
                <TextInput name="name" required />
              </Field>
              <Field label={t("settings.groups.create.slug")} hint={t("settings.groups.create.slug.hint")}>
                <TextInput name="slug" required />
              </Field>
            </div>
            <ActionButton>{t("settings.groups.create.submit")}</ActionButton>
          </form>
        ) : null}
      </Panel>

      <h2 style={{ margin: 0 }}>{t("settings.groupDefaults")}</h2>
      <p style={{ margin: 0, color: "var(--muted-color)", lineHeight: 1.5 }}>{t("settings.groupDefaults.description")}</p>
      {groups.length > 0 ? (
        groups.map((group) => {
          const groupSetting = settingsByGroupId.get(group.id);
          return (
            <Panel key={group.id} compact>
              <div style={stackStyle()}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", alignItems: "flex-start" }}>
                  <div style={stackStyle("4px")}>
                    <h3 style={{ margin: 0 }}>{group.name}</h3>
                    <span style={{ color: "var(--muted-color)", fontSize: "13px" }}>{group.slug}</span>
                  </div>
                  <form action={`/api/auth/groups/${group.id}`} method="post">
                    <input type="hidden" name="_method" value="DELETE" />
                    <ActionButton>{t("common.actions.delete")}</ActionButton>
                  </form>
                </div>

                <form action={`/api/auth/groups/${group.id}`} method="post" style={stackStyle()}>
                  <input type="hidden" name="_method" value="PATCH" />
                  <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                    <Field label={t("settings.groups.create.name")} hint={t("settings.groups.create.name.hint")}>
                      <TextInput name="name" defaultValue={group.name} required />
                    </Field>
                    <Field label={t("settings.groups.create.slug")} hint={t("settings.groups.create.slug.hint")}>
                      <TextInput name="slug" defaultValue={group.slug} required />
                    </Field>
                  </div>
                  <ActionButton>{t("common.actions.edit")}</ActionButton>
                </form>

                {groupSetting ? (
                  <form action={`/api/settings/groups/${group.id}`} method="post" style={stackStyle()}>
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
                ) : null}
              </div>
            </Panel>
          );
        })
      ) : (
        <EmptyState title={t("settings.empty.noManageableGroups.title")}>{t("settings.empty.noManageableGroups.body")}</EmptyState>
      )}
    </section>
  );
}
