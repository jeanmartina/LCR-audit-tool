import {
  findMembership,
  findTargetGroupIdsByTargetId,
  findUserById,
  listCertificateGroupIds,
  listGroupMembershipsByUser,
} from "../storage/runtime-store";
import { GroupRole } from "./config";
import { getCurrentSessionFromCookies } from "./session";

export interface AuthenticatedPrincipal {
  userId: string;
  email: string;
  isPlatformAdmin: boolean;
  groupRoles: Array<{ groupId: string; role: GroupRole }>;
}

export type Permission =
  | "dashboard.view"
  | "detail.view"
  | "export.view"
  | "target.manage"
  | "alerts.manage"
  | "members.manage"
  | "auth.manage";

const rolePermissions: Record<GroupRole, Permission[]> = {
  viewer: ["dashboard.view", "detail.view", "export.view"],
  operator: ["dashboard.view", "detail.view", "export.view", "target.manage", "alerts.manage"],
  "group-admin": [
    "dashboard.view",
    "detail.view",
    "export.view",
    "target.manage",
    "alerts.manage",
    "members.manage",
  ],
};

export async function getCurrentPrincipal(): Promise<AuthenticatedPrincipal | null> {
  const session = await getCurrentSessionFromCookies();
  if (!session) {
    return null;
  }

  const user = await findUserById(session.userId);
  if (!user) {
    return null;
  }

  const memberships = await listGroupMembershipsByUser(user.id);
  return {
    userId: user.id,
    email: user.email,
    isPlatformAdmin: user.platformRole === "platform-admin",
    groupRoles: memberships.map((membership) => ({ groupId: membership.groupId, role: membership.role })),
  };
}

export async function assertAuthenticated(): Promise<AuthenticatedPrincipal> {
  const principal = await getCurrentPrincipal();
  if (!principal) {
    throw new Error("authentication-required");
  }
  return principal;
}

export async function assertPlatformAdmin(): Promise<AuthenticatedPrincipal> {
  const principal = await assertAuthenticated();
  if (!principal.isPlatformAdmin) {
    throw new Error("platform-admin-required");
  }
  return principal;
}

export async function assertPermission(permission: Permission, groupId?: string): Promise<AuthenticatedPrincipal> {
  const principal = await assertAuthenticated();
  if (principal.isPlatformAdmin) {
    return principal;
  }

  if (permission === "auth.manage") {
    throw new Error("platform-admin-required");
  }

  if (!groupId) {
    throw new Error("group-context-required");
  }

  const membership = principal.groupRoles.find((item) => item.groupId === groupId);
  if (!membership || !rolePermissions[membership.role].includes(permission)) {
    throw new Error("forbidden");
  }

  return principal;
}

export async function assertTargetPermission(permission: Permission, targetId: string): Promise<AuthenticatedPrincipal> {
  const principal = await assertAuthenticated();
  if (principal.isPlatformAdmin) {
    return principal;
  }

  const groupIds = await findTargetGroupIdsByTargetId(targetId);
  if (groupIds.length === 0) {
    throw new Error("forbidden");
  }

  for (const groupId of groupIds) {
    const membership = await findMembership(principal.userId, groupId);
    if (membership && rolePermissions[membership.role].includes(permission)) {
      return principal;
    }
  }

  throw new Error("forbidden");
}

export async function assertCertificatePermission(
  permission: Permission,
  certificateId: string
): Promise<AuthenticatedPrincipal> {
  const principal = await assertAuthenticated();
  if (principal.isPlatformAdmin) {
    return principal;
  }

  const groupIds = await listCertificateGroupIds(certificateId);
  if (groupIds.length === 0) {
    throw new Error("forbidden");
  }

  for (const groupId of groupIds) {
    const membership = await findMembership(principal.userId, groupId);
    if (membership && rolePermissions[membership.role].includes(permission)) {
      return principal;
    }
  }

  throw new Error("forbidden");
}
