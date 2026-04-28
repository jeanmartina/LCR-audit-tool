import { rejectCrossOriginRequest } from "../../../../auth/request-security";
import { resolvePublicOrigin } from "../../../../auth/config";
import { logoutCurrentSession, serializeClearSessionCookie, SESSION_COOKIE_NAME } from "../../../../auth/session";

export async function POST(request: Request): Promise<Response> {
  const sameOriginFailure = rejectCrossOriginRequest(request);
  if (sameOriginFailure) return sameOriginFailure;
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.split("=")[1];

  if (token) {
    await logoutCurrentSession(token);
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL("/auth", resolvePublicOrigin()).toString(),
      "set-cookie": serializeClearSessionCookie(),
    },
  });
}
