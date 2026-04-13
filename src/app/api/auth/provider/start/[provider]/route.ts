import { assertRateLimit } from "../../../../../../auth/rate-limit";
import { getValidatedPendingInvite, recordFailedInviteAcceptance } from "../../../../../../auth/invitations";
import { createProviderAuthStart } from "../../../../../../auth/provider-flow";
import { normalizeLocale } from "../../../../../../i18n";

const SUPPORTED_PROVIDERS = new Set(["google", "entra-id", "oidc"]);

export async function POST(
  request: Request,
  context: { params: Promise<{ provider: string }> }
): Promise<Response> {
  const { provider } = await context.params;
  if (!SUPPORTED_PROVIDERS.has(provider)) {
    return Response.json({ error: "unsupported-provider" }, { status: 400 });
  }

  const form = await request.formData();
  const inviteCode = String(form.get("inviteCode") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const displayName = String(form.get("displayName") ?? "").trim() || null;
  const locale = normalizeLocale(String(form.get("locale") ?? ""));

  try {
    assertRateLimit(`provider-start:${provider}:${email || inviteCode}`, 10, 15 * 60 * 1000);
    await getValidatedPendingInvite(inviteCode, email);
    const location = await createProviderAuthStart({
      provider: provider as "google" | "entra-id" | "oidc",
      inviteCode,
      expectedEmail: email,
      displayName,
      locale: locale ?? undefined,
    });
    return Response.redirect(location, 303);
  } catch (error) {
    await recordFailedInviteAcceptance({
      inviteCode,
      email,
      reason: error instanceof Error ? error.message : "provider-start-failed",
    });
    return Response.json(
      { error: error instanceof Error ? error.message : "provider-start-failed" },
      { status: 400 }
    );
  }
}
