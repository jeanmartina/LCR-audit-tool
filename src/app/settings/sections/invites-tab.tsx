import type { ReactElement } from "react";
import type { GroupInviteRecord, GroupRecord } from "../../../storage/runtime-store";
import { ActionButton, EmptyState, Field, Panel, SelectInput, TextInput, stackStyle, StatusPill } from "../../../components/ui/primitives";

type TranslationValues = Record<string, string | number | boolean | null | undefined>;
type SettingsTranslator = (key: string, values?: TranslationValues) => string;

function formatDate(value: Date): string {
  return value.toISOString().slice(0, 16);
}

export function InvitesTab({
  t,
  groups,
  invitesByGroupId,
}: {
  t: SettingsTranslator;
  groups: GroupRecord[];
  invitesByGroupId: Record<string, GroupInviteRecord[]>;
}): ReactElement {
  return (
    <Panel title={t("settings.invites.title")} description={t("settings.invites.description")}>
      {groups.length > 0 ? (
        <div style={stackStyle()}>
          {groups.map((group) => {
            const invites = invitesByGroupId[group.id] ?? [];
            return (
              <Panel key={group.id} compact>
                <div style={stackStyle()}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", alignItems: "flex-start" }}>
                    <div style={stackStyle("4px")}>
                      <h3 style={{ margin: 0 }}>{group.name}</h3>
                      <span style={{ color: "var(--muted-color)", fontSize: "13px" }}>{group.slug}</span>
                    </div>
                  </div>

                  <form action={`/api/auth/groups/${group.id}/invites`} method="post" style={stackStyle()}>
                    <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                      <Field label={t("auth.invite.email")} hint={t("settings.invites.email.hint")}>
                        <TextInput name="email" type="email" required />
                      </Field>
                      <Field label={t("settings.invites.role")} hint={t("settings.invites.role.hint")}>
                        <SelectInput name="role" defaultValue="viewer">
                          <option value="viewer">{t("settings.invites.role.viewer")}</option>
                          <option value="operator">{t("settings.invites.role.operator")}</option>
                          <option value="group-admin">{t("settings.invites.role.groupAdmin")}</option>
                        </SelectInput>
                      </Field>
                    </div>
                    <ActionButton>{t("settings.invites.create")}</ActionButton>
                  </form>

                  {invites.length > 0 ? (
                    <div style={stackStyle()}>
                      {invites.map((invite) => (
                        <Panel key={invite.id} compact>
                          <div style={stackStyle()}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
                              <div style={stackStyle("4px")}>
                                <strong>{invite.email}</strong>
                                <span style={{ color: "var(--muted-color)", fontSize: "13px" }}>{invite.code}</span>
                              </div>
                              <StatusPill tone={invite.status === "pending" ? "warning" : invite.status === "accepted" ? "success" : "neutral"}>
                                {t(`settings.invites.status.${invite.status}`)}
                              </StatusPill>
                            </div>

                            <div style={{ color: "var(--muted-color)", fontSize: "13px" }}>
                              {t("settings.invites.expiresAt")}: {formatDate(invite.expiresAt)}
                            </div>

                            {invite.status === "pending" ? (
                              <form action={`/api/auth/groups/${group.id}/invites/${invite.code}`} method="post" style={stackStyle()}>
                                <input type="hidden" name="_method" value="PATCH" />
                                <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                                  <Field label={t("auth.invite.email")} hint={t("settings.invites.email.hint")}>
                                    <TextInput name="email" type="email" defaultValue={invite.email} required />
                                  </Field>
                                  <Field label={t("settings.invites.role")} hint={t("settings.invites.role.hint")}>
                                    <SelectInput name="role" defaultValue={invite.role}>
                                      <option value="viewer">{t("settings.invites.role.viewer")}</option>
                                      <option value="operator">{t("settings.invites.role.operator")}</option>
                                      <option value="group-admin">{t("settings.invites.role.groupAdmin")}</option>
                                    </SelectInput>
                                  </Field>
                                  <Field label={t("settings.invites.expiresAt")} hint={t("settings.invites.expiresAt.hint")}>
                                    <TextInput name="expiresAt" type="datetime-local" defaultValue={formatDate(invite.expiresAt)} />
                                  </Field>
                                </div>
                                <ActionButton>{t("common.actions.edit")}</ActionButton>
                              </form>
                            ) : null}

                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                              <form action={`/api/auth/groups/${group.id}/invites/${invite.code}`} method="post">
                                <input type="hidden" name="_method" value="POST" />
                                <ActionButton>{t("common.actions.resend")}</ActionButton>
                              </form>
                              <form action={`/api/auth/groups/${group.id}/invites/${invite.code}`} method="post">
                                <input type="hidden" name="_method" value="DELETE" />
                                <ActionButton>{t("common.actions.revoke")}</ActionButton>
                              </form>
                            </div>
                          </div>
                        </Panel>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title={t("settings.invites.empty.title")}>{t("settings.invites.empty.body")}</EmptyState>
                  )}
                </div>
              </Panel>
            );
          })}
        </div>
      ) : (
        <EmptyState title={t("settings.invites.empty.title")}>{t("settings.invites.empty.body")}</EmptyState>
      )}
    </Panel>
  );
}
