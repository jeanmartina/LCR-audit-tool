import { resolvePublicOrigin } from "./config";

function originFrom(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function allowedOrigins(request: Request): Set<string> {
  const origins = new Set<string>();
  const requestOrigin = originFrom(request.url);
  const publicOrigin = originFrom(resolvePublicOrigin());
  const frontendOrigin = originFrom(process.env.NEXT_PUBLIC_APP_ORIGIN ?? null);
  if (requestOrigin) origins.add(requestOrigin);
  if (publicOrigin) origins.add(publicOrigin);
  if (frontendOrigin) origins.add(frontendOrigin);
  return origins;
}

export function rejectCrossOriginRequest(request: Request): Response | null {
  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") {
    return null;
  }

  const origins = allowedOrigins(request);
  const origin = originFrom(request.headers.get("origin"));
  if (origin && !origins.has(origin)) {
    return Response.json({ error: "same-origin-required" }, { status: 403 });
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") {
    return Response.json({ error: "same-origin-required" }, { status: 403 });
  }

  const referer = originFrom(request.headers.get("referer"));
  if (!origin && referer && !origins.has(referer)) {
    return Response.json({ error: "same-origin-required" }, { status: 403 });
  }

  return null;
}
