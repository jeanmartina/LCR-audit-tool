import { getProviderRuntimeConfigs } from "../auth/providers";
import { hasPlatformAdmin, listSecurityAuditEvents } from "../auth/models";
import type { AuthenticatedPrincipal } from "../auth/authorization";
import { listProviderVerificationStatuses, type ProviderVerificationStatusRecord } from "../storage/runtime-store";

type TranslationValues = Record<string, string | number | boolean | null | undefined>;
type SettingsTranslator = (key: string, values?: TranslationValues) => string;

export interface AdministrationOverview {
  bootstrapComplete: boolean;
  setupHref: string;
  roles: Array<{ label: string; value: string }>;
  auditEvents: Array<{ label: string; value: string }>;
  health: Array<{
    label: string;
    enabled: boolean;
    configured: boolean;
    verified: boolean;
    value: string;
  }>;
}

function formatEventLabel(eventType: string): string {
  return eventType.replace(/\./g, " ");
}

function formatProviderHealth(
  enabled: boolean,
  verification: ProviderVerificationStatusRecord | null
): { value: string; enabled: boolean; configured: boolean; verified: boolean } {
  return {
    value: `${enabled ? "enabled" : "disabled"} / ${verification?.verified ? "verified" : "unverified"}`,
    enabled,
    configured: verification?.configured ?? false,
    verified: verification?.verified ?? false,
  };
}

export async function getAdministrationOverview(
  principal: AuthenticatedPrincipal | null,
  t: SettingsTranslator
): Promise<AdministrationOverview> {
  const bootstrapComplete = await hasPlatformAdmin();
  const providerRuntimeConfigs = await getProviderRuntimeConfigs();
  const verificationStatuses = await listProviderVerificationStatuses();
  const verificationByProvider = new Map(
    verificationStatuses.map((item) => [item.provider, item] as const)
  );

  return {
    bootstrapComplete,
    setupHref: "/setup",
    roles: principal
      ? [
          { label: t("settings.admin.roles.userId"), value: principal.userId },
          { label: t("settings.admin.roles.platform"), value: principal.isPlatformAdmin ? t("common.yes") : t("common.no") },
          {
            label: t("settings.admin.roles.groups"),
            value:
              principal.groupRoles.length > 0
                ? principal.groupRoles.map((role) => `${role.groupId}:${role.role}`).join(", ")
                : t("common.none"),
          },
        ]
      : [],
    auditEvents: (await listSecurityAuditEvents()).slice(-5).reverse().map((event) => ({
      label: formatEventLabel(event.eventType),
      value: `${event.groupId ?? t("common.none")} / ${event.targetEmail ?? t("common.none")}`,
    })),
    health: providerRuntimeConfigs
      .filter((provider) => provider.id !== "credentials")
      .map((provider) => {
        const verification = verificationByProvider.get(provider.id as ProviderVerificationStatusRecord["provider"]) ?? null;
        const health = formatProviderHealth(provider.enabled, verification);
        return {
          label: provider.label,
          ...health,
        };
      }),
  };
}
