import { rejectCrossOriginRequest } from "../../../../../../auth/request-security";
import { assertPlatformAdmin } from "../../../../../../auth/authorization";
import { getConfigPresence } from "../../../../../../auth/provider-flow";
import { saveProviderVerificationSetting } from "../../../../../../settings/preferences";

const SUPPORTED_PROVIDERS = new Set(["google", "entra-id", "oidc"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
): Promise<Response> {
  const sameOriginFailure = rejectCrossOriginRequest(request);
  if (sameOriginFailure) return sameOriginFailure;
  let principal;
  try {
    principal = await assertPlatformAdmin();
  } catch {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const { provider } = await params;
  if (!SUPPORTED_PROVIDERS.has(provider)) {
    return Response.json({ error: "unsupported-provider" }, { status: 400 });
  }

  const formData = await request.formData();
  await saveProviderVerificationSetting({
    provider: provider as "google" | "entra-id" | "oidc",
    configured: getConfigPresence(provider as "google" | "entra-id" | "oidc"),
    verified: formData.get("verified") === "on",
    verifiedByUserId: formData.get("verified") === "on" ? principal.userId : null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });

  return new Response(null, { status: 303, headers: { Location: "/settings?saved=provider" } });
}
