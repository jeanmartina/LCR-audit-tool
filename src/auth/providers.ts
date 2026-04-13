import {
  findProviderVerificationStatus,
  type ProviderVerificationStatusRecord,
} from "../storage/runtime-store";
import { AUTH_PROVIDERS, AuthProvider, resolvePublicOrigin } from "./config";
import { getConfigPresence, getProviderCallbackUrl } from "./provider-flow";

export interface ProviderRuntimeConfig {
  id: AuthProvider;
  label: string;
  enabled: boolean;
  callbackUrl: string;
}

export interface ProviderStatusEntry {
  id: Exclude<AuthProvider, "credentials">;
  label: string;
  configured: boolean;
  callbackUrl: string;
  verification: ProviderVerificationStatusRecord | null;
}

export function getProviderRuntimeConfigs(): ProviderRuntimeConfig[] {
  return AUTH_PROVIDERS.map((provider) => ({
    id: provider.id,
    label: provider.label,
    enabled: provider.envKeys.every((key) => process.env[key] || provider.id === "credentials"),
    callbackUrl: `${resolvePublicOrigin()}/api/auth/callback/${provider.id}`,
  }));
}

export async function listProviderStatusEntries(): Promise<ProviderStatusEntry[]> {
  const providers = AUTH_PROVIDERS.filter(
    (provider): provider is (typeof AUTH_PROVIDERS)[number] & { id: Exclude<AuthProvider, "credentials"> } =>
      provider.id !== "credentials"
  );

  return Promise.all(
    providers.map(async (provider) => ({
      id: provider.id,
      label: provider.label,
      configured: getConfigPresence(provider.id),
      callbackUrl: getProviderCallbackUrl(provider.id),
      verification: await findProviderVerificationStatus(provider.id),
    }))
  );
}
