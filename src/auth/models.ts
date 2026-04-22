import {
  createAuditEventRecord,
  createGroupMembershipRecord,
  createGroupRecord,
  createUserRecord,
  findGroupById,
  findMembership,
  findUserByEmail,
  listGroupMembershipsByUser,
  loadAuditEvents,
  loadGroups,
  loadUsers,
  recordAuthAccount,
  updateUserRecord,
  type AuthAccountRecord,
  type AuditEventRecord,
  type GroupMembershipRecord,
  type GroupRecord,
  type UserRecord,
} from "../storage/runtime-store";
import { GroupRole, PlatformRole } from "./config";
import { hashPassword } from "./session";

export interface UserIdentity {
  user: UserRecord;
  accounts: AuthAccountRecord[];
  memberships: GroupMembershipRecord[];
}

export async function ensureUser(input: {
  email: string;
  displayName?: string | null;
  passwordHash?: string | null;
  platformRole?: PlatformRole;
  preferredLocale?: string;
}): Promise<UserRecord> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    return existing;
  }

  return createUserRecord({
    email: input.email,
    displayName: input.displayName ?? null,
    passwordHash: input.passwordHash ?? null,
    platformRole: input.platformRole ?? null,
    preferredLocale: input.preferredLocale ?? "en",
  });
}


export async function hasPlatformAdmin(): Promise<boolean> {
  const users = await loadUsers();
  return users.some((item) => item.platformRole === "platform-admin");
}

export async function createFirstPlatformAdmin(input: {
  email: string;
  displayName: string | null;
  password: string;
  preferredLocale?: string;
}): Promise<UserRecord> {
  const normalizedEmail = input.email.trim().toLowerCase();
  if (await hasPlatformAdmin()) {
    throw new Error("bootstrap-already-complete");
  }

  const existing = await findUserByEmail(normalizedEmail);
  if (await hasPlatformAdmin()) {
    throw new Error("bootstrap-already-complete");
  }

  const passwordHash = hashPassword(input.password);
  const user = existing
    ? await updateUserRecord(existing.id, {
        email: normalizedEmail,
        displayName: input.displayName,
        passwordHash,
        platformRole: "platform-admin",
        preferredLocale: input.preferredLocale ?? existing.preferredLocale,
      })
    : await createUserRecord({
        email: normalizedEmail,
        displayName: input.displayName,
        passwordHash,
        platformRole: "platform-admin",
        preferredLocale: input.preferredLocale ?? "en",
      });

  await createAuditEventRecord({
    actorUserId: user.id,
    targetUserId: user.id,
    targetEmail: user.email,
    eventType: "platform-admin.bootstrap.created",
    details: { method: "first-run-web" },
  });

  return user;
}

export async function linkAuthAccount(input: {
  userId: string;
  provider: AuthAccountRecord["provider"];
  providerAccountId: string;
  providerEmail: string;
}): Promise<AuthAccountRecord> {
  return recordAuthAccount({
    userId: input.userId,
    provider: input.provider,
    providerAccountId: input.providerAccountId,
    providerEmail: input.providerEmail,
  });
}

export async function createGroup(input: {
  name: string;
  slug: string;
  createdByUserId: string;
}): Promise<GroupRecord> {
  const group = await createGroupRecord(input);
  await createAuditEventRecord({
    actorUserId: input.createdByUserId,
    eventType: "group.created",
    details: { groupId: group.id, slug: group.slug },
  });
  return group;
}

export async function assignGroupRole(input: {
  actorUserId: string;
  userId: string;
  groupId: string;
  role: GroupRole;
}): Promise<GroupMembershipRecord> {
  const membership = await createGroupMembershipRecord({
    userId: input.userId,
    groupId: input.groupId,
    role: input.role,
  });
  await createAuditEventRecord({
    actorUserId: input.actorUserId,
    targetUserId: input.userId,
    groupId: input.groupId,
    eventType: "role.changed",
    details: { role: input.role },
  });
  return membership;
}

export async function elevatePlatformAdmin(userId: string): Promise<UserRecord> {
  const users = await loadUsers();
  const user = users.find((item) => item.id === userId);
  if (!user) {
    throw new Error("user-not-found");
  }
  return updateUserRecord(userId, { platformRole: "platform-admin" });
}

export async function getUserIdentity(userId: string): Promise<UserIdentity | null> {
  const users = await loadUsers();
  const user = users.find((item) => item.id === userId);
  if (!user) {
    return null;
  }

  return {
    user,
    accounts: user.accounts,
    memberships: await listGroupMembershipsByUser(userId),
  };
}

export async function hasGroupRole(userId: string, groupId: string, role: GroupRole): Promise<boolean> {
  const membership = await findMembership(userId, groupId);
  return membership?.role === role;
}

export async function listAllGroups(): Promise<GroupRecord[]> {
  return loadGroups();
}

export async function getGroup(groupId: string): Promise<GroupRecord | null> {
  return findGroupById(groupId);
}

export async function listSecurityAuditEvents(): Promise<AuditEventRecord[]> {
  return loadAuditEvents();
}
