import { rejectCrossOriginRequest } from "../../../../auth/request-security";
import { assertAuthenticated } from "../../../../auth/authorization";
import { resolvePublicOrigin } from "../../../../auth/config";
import { logoutAllSessions, serializeClearSessionCookie } from "../../../../auth/session";

export async function POST(request: Request): Promise<Response> {
  const sameOriginFailure = rejectCrossOriginRequest(request);
  if (sameOriginFailure) return sameOriginFailure;
  const principal = await assertAuthenticated();
  await logoutAllSessions(principal.userId);

  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL("/auth", resolvePublicOrigin()).toString(),
      "set-cookie": serializeClearSessionCookie(),
    },
  });
}
