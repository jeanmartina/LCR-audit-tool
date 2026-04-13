import { AuthenticatedPrincipal } from "../auth/authorization";
import {
  findGroupSettingsByGroupId,
  findProviderVerificationStatus,
  findUserSettingsByUserId,
  getPlatformSettingsRecord,
  listGroupMembershipsByUser,
  listProviderVerificationStatuses,
  upsertGroupSettingsRecord,
  upsertPlatformSettingsRecord,
  upsertProviderVerificationStatusRecord,
  upsertUserSettingsRecord,
  updateUserRecord,
  type GroupSettingsRecord,
  type PlatformSettingsRecord,
  type ProviderVerificationStatusRecord,
  type UserSettingsRecord,
} from "../storage/runtime-store";
import type { AppLocale } from "../i18n";

export async function getUserSettings(userId: string): Promise<UserSettingsRecord> {
  const settings = await findUserSettingsByUserId(userId);
  if (!settings) {
    throw new Error("user-not-found");
  }
  return settings;
}

export async function saveUserSettings(input: {
  userId: string;
  preferredLocale: AppLocale;
  preferredTheme: "light" | "dark";
  predictiveEnabled: boolean;
  predictiveGroupIds: string[];
  predictiveSeverities: Array<"warning" | "critical">;
  predictiveTypes: Array<"upcoming-expiration" | "publication-delayed">;
}): Promise<UserSettingsRecord> {
  await updateUserRecord(input.userId, { preferredLocale: input.preferredLocale });
  return upsertUserSettingsRecord({
    userId: input.userId,
    preferredTheme: input.preferredTheme,
    predictiveEnabled: input.predictiveEnabled,
    predictiveGroupIds: input.predictiveGroupIds,
    predictiveSeverities: input.predictiveSeverities,
    predictiveTypes: input.predictiveTypes,
  });
}

export async function listUserGroupIds(userId: string): Promise<string[]> {
  const memberships = await listGroupMembershipsByUser(userId);
  return memberships.map((membership) => membership.groupId);
}

export async function getManageableGroupSettings(
  principal: AuthenticatedPrincipal
): Promise<GroupSettingsRecord[]> {
  const groupIds = principal.isPlatformAdmin
    ? principal.groupRoles.map((item) => item.groupId)
    : principal.groupRoles
        .filter((item) => item.role === "group-admin")
        .map((item) => item.groupId);

  const settings = await Promise.all(groupIds.map((groupId) => findGroupSettingsByGroupId(groupId)));
  return groupIds.map((groupId, index) => {
    const current = settings[index];
    return (
      current ?? {
        groupId,
        defaultTrustSource: null,
        defaultPki: null,
        defaultJurisdiction: null,
        predictiveEnabled: true,
        predictiveWindowDays: 3,
        updatedAt: new Date(),
      }
    );
  });
}

export async function saveGroupSettings(input: {
  groupId: string;
  defaultTrustSource?: string | null;
  defaultPki?: string | null;
  defaultJurisdiction?: string | null;
  predictiveEnabled?: boolean;
  predictiveWindowDays?: number;
}): Promise<GroupSettingsRecord> {
  return upsertGroupSettingsRecord(input);
}

export async function getPlatformSettings(): Promise<PlatformSettingsRecord> {
  return getPlatformSettingsRecord();
}

export async function savePlatformSettings(input: {
  predictiveEnabled?: boolean;
  predictiveWindowDays?: number;
}): Promise<PlatformSettingsRecord> {
  return upsertPlatformSettingsRecord(input);
}

export async function listProviderVerificationSettings(): Promise<
  ProviderVerificationStatusRecord[]
> {
  return listProviderVerificationStatuses();
}

export async function getProviderVerificationSetting(
  provider: ProviderVerificationStatusRecord["provider"]
): Promise<ProviderVerificationStatusRecord | null> {
  return findProviderVerificationStatus(provider);
}

export async function saveProviderVerificationSetting(input: {
  provider: ProviderVerificationStatusRecord["provider"];
  configured: boolean;
  verified: boolean;
  verifiedByUserId: string | null;
  notes?: string | null;
}): Promise<ProviderVerificationStatusRecord> {
  return upsertProviderVerificationStatusRecord(input);
}
