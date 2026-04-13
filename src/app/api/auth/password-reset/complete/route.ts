import { completePasswordReset } from "../../../../../auth/session";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const token = String(form.get("token") ?? "").trim();
  const password = String(form.get("password") ?? "");

  try {
    await completePasswordReset(token, password);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "password-reset-failed" },
      { status: 400 }
    );
  }
}
