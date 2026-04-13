import { assertAuthenticated } from "../../../../auth/authorization";
import { resolvePublicOrigin } from "../../../../auth/config";
import { logoutAllSessions, SESSION_COOKIE_NAME } from "../../../../auth/session";

export async function POST(request: Request): Promise<Response> {
  const principal = await assertAuthenticated();
  await logoutAllSessions(principal.userId);

  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL("/auth", resolvePublicOrigin()).toString(),
      "set-cookie": `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`,
    },
  });
}
