import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import { assertAuthenticated } from "../../auth/authorization";
import { getProviderRuntimeConfigs, listProviderStatusEntries } from "../../auth/providers";
import { listAllGroups } from "../../auth/models";
import { listInvitesForGroup } from "../../auth/invitations";
import { listTrustListSourcesForAdmin } from "../../trust-lists/admin";
import {
  ActionLink,
  LocalSubnav,
  Notice,
  PageHeader,
  PageShell,
  stackStyle,
} from "../../components/ui/primitives";
import { getPrincipalTranslator, getSupportedLocaleOptions } from "../../i18n";
import {
  getManageableGroupSettings,
  getPlatformSettings,
  getUserSettings,
  listUserGroupIds,
} from "../../settings/preferences";
import { AdministrationTab } from "./sections/administration-tab";
import { GroupsTab } from "./sections/groups-tab";
import { InvitesTab } from "./sections/invites-tab";
import { PreferencesTab } from "./sections/preferences-tab";
import { ProvidersTab } from "./sections/providers-tab";
import { TrustListsTab } from "./sections/trust-lists-tab";

type SettingsSearchParams = Promise<Record<string, string | string[] | undefined>>;
type TranslationValues = Record<string, string | number | boolean | null | undefined>;
type SettingsTranslator = (key: string, values?: TranslationValues) => string;
type SettingsTabKey = "preferences" | "groups" | "providers" | "trust-lists" | "invites" | "administration";

const SETTINGS_TABS: Array<{ key: SettingsTabKey; labelKey: string }> = [
  { key: "preferences", labelKey: "settings.tabs.preferences" },
  { key: "groups", labelKey: "settings.tabs.groups" },
  { key: "providers", labelKey: "settings.tabs.providers" },
  { key: "trust-lists", labelKey: "settings.tabs.trustLists" },
  { key: "invites", labelKey: "settings.tabs.invites" },
  { key: "administration", labelKey: "settings.tabs.administration" },
];

function getSavedNoticeKey(saved: string | null): string | null {
  if (saved === "profile") return "settings.saved.profile";
  if (saved === "group") return "settings.saved.group";
  if (saved === "platform") return "settings.saved.platform";
  if (saved === "provider") return "settings.saved.provider";
  if (saved === "invite") return "settings.saved.invite";
  return null;
}

function getTabKey(value: string | null): SettingsTabKey {
  if (value === "groups" || value === "providers" || value === "trust-lists" || value === "invites" || value === "administration") {
    return value;
  }
  return "preferences";
}

function getTabHref(tab: SettingsTabKey): string {
  return `/settings?tab=${tab}`;
}

function SettingsTabNav({
  activeTab,
  t,
}: {
  activeTab: SettingsTabKey;
  t: SettingsTranslator;
}): ReactElement {
  return (
    <LocalSubnav label={t("settings.tabs.label")}>
      {SETTINGS_TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <ActionLink
            key={tab.key}
            href={getTabHref(tab.key)}
            tone={isActive ? "primary" : "secondary"}
          >
            {t(tab.labelKey)}
          </ActionLink>
        );
      })}
    </LocalSubnav>
  );
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
  const allGroups = await listAllGroups();
  const manageableGroupIds = new Set(groupSettings.map((item) => item.groupId));
  const manageableGroups = allGroups.filter((group) => manageableGroupIds.has(group.id));
  const groupInvitesByGroupId = Object.fromEntries(
    await Promise.all(
      manageableGroups.map(async (group) => [group.id, await listInvitesForGroup(group.id)] as const)
    )
  ) as Record<string, Awaited<ReturnType<typeof listInvitesForGroup>>>;
  const providerStatuses = principal.isPlatformAdmin ? await listProviderStatusEntries() : [];
  const providerRuntimeConfigs = principal.isPlatformAdmin ? await getProviderRuntimeConfigs() : [];
  const { locale, t } = await getPrincipalTranslator(principal);
  const localeOptions = getSupportedLocaleOptions(locale);
  const params = searchParams ? await searchParams : {};
  const saved = typeof params.saved === "string" ? params.saved : null;
  const savedNoticeKey = getSavedNoticeKey(saved);
  const firstRunComplete = params.firstRun === "complete";
  const activeTab = getTabKey(typeof params.tab === "string" ? params.tab : null);
  const trustListSources =
    activeTab === "trust-lists" ? await listTrustListSourcesForAdmin(principal).catch(() => null) : null;

  return (
    <PageShell>
      <PageHeader
        backHref="/reporting"
        backLabel={t("settings.backToReporting")}
        kicker={t("settings.kicker")}
        title={t("settings.title")}
        description={t("settings.description")}
      />

      <div style={stackStyle()}>
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
      </div>

      <SettingsTabNav activeTab={activeTab} t={t} />

      {activeTab === "preferences" ? (
        <PreferencesTab t={t} locale={locale} localeOptions={localeOptions} userSettings={userSettings} groupIds={groupIds} />
      ) : null}

      {activeTab === "groups" ? (
        <GroupsTab
          t={t}
          canCreateGroup={principal.isPlatformAdmin}
          groups={manageableGroups}
          groupSettings={groupSettings}
        />
      ) : null}

      {activeTab === "providers" ? (
        <ProvidersTab t={t} providerStatuses={providerStatuses} providerRuntimeConfigs={providerRuntimeConfigs} />
      ) : null}

      {activeTab === "trust-lists" ? (
        <TrustListsTab t={t} sources={trustListSources} />
      ) : null}

      {activeTab === "invites" ? (
        <InvitesTab t={t} groups={manageableGroups} invitesByGroupId={groupInvitesByGroupId} />
      ) : null}

      {activeTab === "administration" ? (
        <AdministrationTab
          t={t}
          principal={principal}
          platformSettings={platformSettings}
          isPlatformAdmin={principal.isPlatformAdmin}
        />
      ) : null}
    </PageShell>
  );
}
