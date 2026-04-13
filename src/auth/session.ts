import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import {
  createAuditEventRecord,
  createAuthSessionRecord,
  findAuthSessionByToken,
  findPasswordResetByToken,
  findUserByEmail,
  markPasswordResetUsed,
  revokeAllSessionsForUser,
  revokeAuthSession,
  updateAuthSessionLastSeen,
  updateUserRecord,
  type AuthSessionRecord,
  type UserRecord,
} from "../storage/runtime-store";
import { PASSWORD_RESET_TTL_MS, SESSION_INACTIVITY_TIMEOUT_MS } from "./config";

export const SESSION_COOKIE_NAME = "lcr_session_token";

function hashPasswordValue(password: string, salt = randomBytes(16).toString("hex")): string {
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function hashPassword(password: string): string {
  return hashPasswordValue(password);
}

export function verifyPassword(password: string, passwordHash: string | null | undefined): boolean {
  if (!passwordHash) {
    return false;
  }

  const [salt, stored] = passwordHash.split(":");
  if (!salt || !stored) {
    return false;
  }

  const candidate = scryptSync(password, salt, 64);
  const known = Buffer.from(stored, "hex");
  return candidate.length === known.length && timingSafeEqual(candidate, known);
}

export async function createSession(user: UserRecord): Promise<AuthSessionRecord> {
  return createAuthSessionRecord({
    userId: user.id,
    token: randomBytes(24).toString("hex"),
    expiresAt: new Date(Date.now() + SESSION_INACTIVITY_TIMEOUT_MS),
    lastSeenAt: new Date(),
    revokedAt: null,
  });
}

export async function authenticateWithPassword(email: string, password: string): Promise<UserRecord> {
  const user = await findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new Error("invalid-credentials");
  }

  await createAuditEventRecord({
    actorUserId: user.id,
    targetUserId: user.id,
    targetEmail: user.email,
    eventType: "login.succeeded",
    details: { provider: "credentials" },
  });

  return user;
}

export async function getSessionByToken(token: string | null | undefined): Promise<AuthSessionRecord | null> {
  if (!token) {
    return null;
  }

  const session = await findAuthSessionByToken(token);
  if (!session || session.revokedAt) {
    return null;
  }

  if (session.lastSeenAt.getTime() + SESSION_INACTIVITY_TIMEOUT_MS <= Date.now()) {
    await revokeAuthSession(session.id);
    return null;
  }

  await updateAuthSessionLastSeen(session.id, new Date(), new Date(Date.now() + SESSION_INACTIVITY_TIMEOUT_MS));
  return findAuthSessionByToken(token);
}

export async function getCurrentSessionFromCookies(): Promise<AuthSessionRecord | null> {
  const store = await cookies();
  return getSessionByToken(store.get(SESSION_COOKIE_NAME)?.value);
}

export async function logoutCurrentSession(token: string): Promise<void> {
  await revokeAuthSession(token);
}

export async function logoutAllSessions(userId: string): Promise<void> {
  await revokeAllSessionsForUser(userId);
}

export async function completePasswordReset(token: string, password: string): Promise<UserRecord> {
  const reset = await findPasswordResetByToken(token);
  if (!reset || reset.usedAt) {
    throw new Error("password-reset-invalid");
  }
  if (reset.expiresAt.getTime() <= Date.now()) {
    throw new Error("password-reset-expired");
  }

  const user = await updateUserRecord(reset.userId, {
    passwordHash: hashPasswordValue(password),
  });
  await markPasswordResetUsed(reset.id);
  return user;
}

export function passwordResetTtlMs(): number {
  return PASSWORD_RESET_TTL_MS;
}
