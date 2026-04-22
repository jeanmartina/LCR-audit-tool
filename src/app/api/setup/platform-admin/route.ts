import { createFirstPlatformAdmin } from "../../../../auth/models";
import { createSession, SESSION_COOKIE_NAME } from "../../../../auth/session";
import { normalizeLocale } from "../../../../i18n";

function redirectToSetup(error: string): Response {
  return new Response(null, {
    status: 303,
    headers: { Location: `/setup?error=${encodeURIComponent(error)}` },
  });
}

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const displayName = String(form.get("displayName") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const confirmPassword = String(form.get("confirmPassword") ?? "");
  const locale = normalizeLocale(String(form.get("locale") ?? "")) ?? "en";

  if (!email || !email.includes("@")) {
    return redirectToSetup("setup-invalid-email");
  }
  if (password.length < 12) {
    return redirectToSetup("setup-password-too-short");
  }
  if (password !== confirmPassword) {
    return redirectToSetup("setup-password-mismatch");
  }

  try {
    const user = await createFirstPlatformAdmin({
      email,
      displayName: displayName || null,
      password,
      preferredLocale: locale,
    });
    const session = await createSession(user);

    return new Response(null, {
      status: 303,
      headers: {
        Location: "/settings?firstRun=complete",
        "set-cookie": `${SESSION_COOKIE_NAME}=${session.token}; Path=/; HttpOnly; SameSite=Lax`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "bootstrap-already-complete") {
      return Response.json({ error: "bootstrap-already-complete" }, { status: 409 });
    }
    return Response.json(
      { error: error instanceof Error ? error.message : "setup-failed" },
      { status: 400 }
    );
  }
}
