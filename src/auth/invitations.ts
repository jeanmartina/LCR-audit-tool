import {
  createAuditEventRecord,
  createGroupMembershipRecord,
  createGroupInviteRecord,
  createUserRecord,
  findGroupInviteByCode,
  findAuthAccountByProviderAccount,
  findUserByEmail,
  listGroupMembershipsByUser,
  markInviteAccepted,
  markInviteRevoked,
  upsertPasswordResetRecord,
  updateGroupInviteRecord,
  updateUserRecord,
  type AuthAccountRecord,
  type GroupInviteRecord,
  type UserRecord,
} from "../storage/runtime-store";
import { getInviteExpiry, getPasswordResetExpiry, GroupRole } from "./config";

export async function issueInvite(input: {
  actorUserId: string;
  email: string;
  groupId: string;
  role: GroupRole;
}): Promise<GroupInviteRecord> {
  const invite = await createGroupInviteRecord({
    email: input.email,
    groupId: input.groupId,
    role: input.role,
    expiresAt: getInviteExpiry(),
    invitedByUserId: input.actorUserId,
  });

  await createAuditEventRecord({
    actorUserId: input.actorUserId,
    groupId: input.groupId,
    targetEmail: input.email,
    eventType: "invite.created",
    details: { role: input.role, inviteCode: invite.code },
  });

  return invite;
}

export async function resendInvite(input: {
  actorUserId: string;
  inviteCode: string;
}): Promise<GroupInviteRecord> {
  const invite = await findInviteByCodeOrThrow(input.inviteCode);
  const updated = await updateGroupInviteRecord(invite.id, {
    expiresAt: getInviteExpiry(),
    status: "pending",
  });
  await createAuditEventRecord({
    actorUserId: input.actorUserId,
    groupId: invite.groupId,
    targetEmail: invite.email,
    eventType: "invite.resent",
    details: { inviteCode: updated.code },
  });
  return updated;
}

export async function revokeInvite(input: {
  actorUserId: string;
  inviteCode: string;
}): Promise<GroupInviteRecord> {
  const invite = await findInviteByCodeOrThrow(input.inviteCode);
  const updated = await markInviteRevoked(invite.id);
  await createAuditEventRecord({
    actorUserId: input.actorUserId,
    groupId: invite.groupId,
    targetEmail: invite.email,
    eventType: "invite.revoked",
    details: { inviteCode: updated.code },
  });
  return updated;
}

export async function acceptInvite(input: {
  inviteCode: string;
  email: string;
  passwordHash?: string | null;
  displayName?: string | null;
  preferredLocale?: string | null;
}): Promise<{ invite: GroupInviteRecord; user: UserRecord }> {
  const invite = await findInviteByCodeOrThrow(input.inviteCode);

  if (invite.status !== "pending") {
    throw new Error("invite-not-pending");
  }

  if (invite.expiresAt.getTime() <= Date.now()) {
    throw new Error("invite-expired");
  }

  if (invite.email.toLowerCase() !== input.email.toLowerCase()) {
    throw new Error("invite-email-mismatch");
  }

  const existing = await findUserByEmail(input.email);
  const user =
    existing ??
    (await createUserRecord({
      email: input.email,
      displayName: input.displayName ?? null,
      passwordHash: input.passwordHash ?? null,
      platformRole: null,
      preferredLocale: input.preferredLocale ?? "en",
    }));

  if (input.passwordHash || input.preferredLocale) {
    await updateUserRecord(user.id, {
      passwordHash: input.passwordHash ?? user.passwordHash,
      preferredLocale: input.preferredLocale ?? user.preferredLocale,
    });
  }

  await createGroupMembershipRecord({
    userId: user.id,
    groupId: invite.groupId,
    role: invite.role,
  });

  const accepted = await markInviteAccepted(invite.id, user.id);
  await createAuditEventRecord({
    actorUserId: user.id,
    groupId: invite.groupId,
    targetEmail: invite.email,
    eventType: "invite.accepted",
    details: { inviteCode: accepted.code, role: invite.role },
  });

  return { invite: accepted, user };
}

export async function getValidatedPendingInvite(
  inviteCode: string,
  email: string
): Promise<GroupInviteRecord> {
  const invite = await findInviteByCodeOrThrow(inviteCode);

  if (invite.status !== "pending") {
    throw new Error("invite-not-pending");
  }

  if (invite.expiresAt.getTime() <= Date.now()) {
    throw new Error("invite-expired");
  }

  if (invite.email.toLowerCase() !== email.toLowerCase()) {
    throw new Error("invite-email-mismatch");
  }

  return invite;
}

export async function acceptInviteWithProvider(input: {
  inviteCode: string;
  email: string;
  provider: AuthAccountRecord["provider"];
  providerAccountId: string;
  displayName?: string | null;
  preferredLocale?: string | null;
}): Promise<{ invite: GroupInviteRecord; user: UserRecord }> {
  const invite = await getValidatedPendingInvite(input.inviteCode, input.email);

  const existingAccount = await findAuthAccountByProviderAccount(
    input.provider,
    input.providerAccountId
  );
  if (existingAccount && existingAccount.userId) {
    throw new Error("provider-account-already-linked");
  }

  const existing = await findUserByEmail(input.email);
  if (existing) {
    const memberships = await listGroupMembershipsByUser(existing.id);
    if (memberships.length > 0) {
      throw new Error("invite-existing-user-resolution-required");
    }
  }

  return acceptInvite({
    inviteCode: input.inviteCode,
    email: input.email,
    passwordHash: null,
    displayName: input.displayName ?? null,
    preferredLocale: input.preferredLocale ?? "en",
  });
}

export async function recordFailedInviteAcceptance(input: {
  inviteCode: string;
  email?: string | null;
  reason: string;
}): Promise<void> {
  await createAuditEventRecord({
    actorUserId: null,
    groupId: null,
    targetEmail: input.email ?? null,
    eventType: "invite.accept-failed",
    details: { inviteCode: input.inviteCode, reason: input.reason },
  });
}

export async function issuePasswordReset(input: {
  actorUserId: string | null;
  userId: string;
  email: string;
}): Promise<string> {
  const reset = await upsertPasswordResetRecord({
    userId: input.userId,
    token: `reset-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    expiresAt: getPasswordResetExpiry(),
    usedAt: null,
  });

  await createAuditEventRecord({
    actorUserId: input.actorUserId,
    targetUserId: input.userId,
    targetEmail: input.email,
    eventType: "password-reset.requested",
    details: { token: reset.token },
  });

  return reset.token;
}

async function findInviteByCodeOrThrow(inviteCode: string): Promise<GroupInviteRecord> {
  const invite = await findGroupInviteByCode(inviteCode);
  if (!invite) {
    throw new Error("invite-not-found");
  }
  return invite;
}
