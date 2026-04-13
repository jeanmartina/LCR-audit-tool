import { assertRateLimit } from "../../../../auth/rate-limit";
import { authenticateWithPassword, createSession, SESSION_COOKIE_NAME } from "../../../../auth/session";
import { resolvePublicOrigin } from "../../../../auth/config";
import { normalizeLocale } from "../../../../i18n";
import { updateUserRecord } from "../../../../storage/runtime-store";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const preferredLocale = normalizeLocale(String(form.get("locale") ?? ""));

  try {
    assertRateLimit(`login:${email}`, 10, 15 * 60 * 1000);
    const user = await authenticateWithPassword(email, password);
    const effectiveUser = preferredLocale
      ? await updateUserRecord(user.id, { preferredLocale })
      : user;
    const session = await createSession(effectiveUser);

    return new Response(null, {
      status: 303,
      headers: {
        Location: new URL("/reporting", resolvePublicOrigin()).toString(),
        "set-cookie": `${SESSION_COOKIE_NAME}=${session.token}; Path=/; HttpOnly; SameSite=Lax`,
      },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "login-failed" },
      { status: 401 }
    );
  }
}
