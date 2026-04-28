import { rejectCrossOriginRequest } from "../../../../auth/request-security";
import { assertRateLimit } from "../../../../auth/rate-limit";
import { authenticateWithPassword, createSession, serializeSessionCookie } from "../../../../auth/session";
import { resolvePublicOrigin } from "../../../../auth/config";
import { normalizeLocale } from "../../../../i18n";
import { updateUserRecord } from "../../../../storage/runtime-store";

export async function POST(request: Request): Promise<Response> {
  const sameOriginFailure = rejectCrossOriginRequest(request);
  if (sameOriginFailure) return sameOriginFailure;
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const preferredLocale = normalizeLocale(String(form.get("locale") ?? ""));

  try {
    await assertRateLimit(`login:${email}`, 10, 15 * 60 * 1000);
    const user = await authenticateWithPassword(email, password);
    const effectiveUser = preferredLocale
      ? await updateUserRecord(user.id, { preferredLocale })
      : user;
    const session = await createSession(effectiveUser);

    return new Response(null, {
      status: 303,
      headers: {
        Location: new URL("/reporting", resolvePublicOrigin()).toString(),
        "set-cookie": serializeSessionCookie(session.token),
      },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "login-failed" },
      { status: 401 }
    );
  }
}
