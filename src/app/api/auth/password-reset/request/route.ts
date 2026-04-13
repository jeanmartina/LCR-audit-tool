import { assertRateLimit } from "../../../../../auth/rate-limit";
import { issuePasswordReset } from "../../../../../auth/invitations";
import { findUserByEmail } from "../../../../../storage/runtime-store";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  assertRateLimit(`password-reset:${email}`, 5, 15 * 60 * 1000);

  const user = await findUserByEmail(email);
  if (!user) {
    return Response.json({ ok: true });
  }

  const token = await issuePasswordReset({ actorUserId: null, userId: user.id, email: user.email });
  return Response.json({ ok: true, token });
}
