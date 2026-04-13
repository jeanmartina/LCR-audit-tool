export const SESSION_INACTIVITY_TIMEOUT_MS = 8 * 60 * 60 * 1000;
export const INVITE_TTL_MS = 3 * 24 * 60 * 60 * 1000;
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

export type AuthProvider = "credentials" | "google" | "entra-id" | "oidc";
export type PlatformRole = "platform-admin" | null;
export type GroupRole = "viewer" | "operator" | "group-admin";

export interface ProviderConfig {
  id: AuthProvider;
  label: string;
  envKeys: string[];
}

export const AUTH_PROVIDERS: ProviderConfig[] = [
  {
    id: "credentials",
    label: "Email and password",
    envKeys: [],
  },
  {
    id: "google",
    label: "Google",
    envKeys: ["AUTH_GOOGLE_CLIENT_ID", "AUTH_GOOGLE_CLIENT_SECRET"],
  },
  {
    id: "entra-id",
    label: "Microsoft Entra ID",
    envKeys: ["AUTH_ENTRA_CLIENT_ID", "AUTH_ENTRA_CLIENT_SECRET", "AUTH_ENTRA_TENANT_ID"],
  },
  {
    id: "oidc",
    label: "Generic OIDC",
    envKeys: ["AUTH_OIDC_CLIENT_ID", "AUTH_OIDC_CLIENT_SECRET", "AUTH_OIDC_ISSUER"],
  },
];

export function resolvePublicOrigin(): string {
  return process.env.AUTH_PUBLIC_ORIGIN ?? process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:3000";
}

export function getInviteExpiry(now = new Date()): Date {
  return new Date(now.getTime() + INVITE_TTL_MS);
}

export function getPasswordResetExpiry(now = new Date()): Date {
  return new Date(now.getTime() + PASSWORD_RESET_TTL_MS);
}
