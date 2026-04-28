import { rejectCrossOriginRequest } from "../../../../../auth/request-security";
import { assertRateLimit } from "../../../../../auth/rate-limit";
import { resolvePublicOrigin } from "../../../../../auth/config";
import { acceptInvite, recordFailedInviteAcceptance } from "../../../../../auth/invitations";
import { createSession, hashPassword, serializeSessionCookie } from "../../../../../auth/session";
import { normalizeLocale } from "../../../../../i18n";

export async function POST(request: Request): Promise<Response> {
  const sameOriginFailure = rejectCrossOriginRequest(request);
  if (sameOriginFailure) return sameOriginFailure;
  const form = await request.formData();
  const inviteCode = String(form.get("inviteCode") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const displayName = String(form.get("displayName") ?? "").trim() || null;
  const password = String(form.get("password") ?? "").trim();
  const preferredLocale = normalizeLocale(String(form.get("locale") ?? ""));

  try {
    await assertRateLimit(`invite:${email || inviteCode}`, 10, 15 * 60 * 1000);
    const result = await acceptInvite({
      inviteCode,
      email,
      displayName,
      passwordHash: password ? hashPassword(password) : null,
      preferredLocale,
    });
    const session = await createSession(result.user);

    return new Response(null, {
      status: 303,
      headers: {
        Location: new URL("/reporting", resolvePublicOrigin()).toString(),
        "set-cookie": serializeSessionCookie(session.token),
      },
    });
  } catch (error) {
    await recordFailedInviteAcceptance({
      inviteCode,
      email,
      reason: error instanceof Error ? error.message : "invite-acceptance-failed",
    });
    return Response.json(
      { error: error instanceof Error ? error.message : "invite-acceptance-failed" },
      { status: 400 }
    );
  }
}
