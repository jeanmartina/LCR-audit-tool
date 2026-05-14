import { rejectCrossOriginRequest } from "../../../../../auth/request-security";
import { assertAuthenticated } from "../../../../../auth/authorization";
import { deleteTrustListSource, updateTrustListSource } from "../../../../../trust-lists/admin";

function parseCsv(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBoolean(value: FormDataEntryValue | null): boolean {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "on" || normalized === "true" || normalized === "1";
}

async function parseRequest(request: Request): Promise<{
  label: string;
  url: string;
  enabled: boolean;
  groupIds: string[];
  parentSourceId: string | null;
}> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json();
    return {
      label: String(body.label ?? "").trim(),
      url: String(body.url ?? "").trim(),
      enabled: body.enabled !== false,
      groupIds: Array.isArray(body.groupIds) ? body.groupIds.map(String) : parseCsv(body.groupIds),
      parentSourceId: body.parentSourceId ? String(body.parentSourceId).trim() : null,
    };
  }
  const form = await request.formData();
  return parseForm(form);
}

function parseForm(form: FormData): {
  label: string;
  url: string;
  enabled: boolean;
  groupIds: string[];
  parentSourceId: string | null;
} {
  return {
    label: String(form.get("label") ?? "").trim(),
    url: String(form.get("url") ?? "").trim(),
    enabled: parseBoolean(form.get("enabled")),
    groupIds: parseCsv(form.get("groupIds")),
    parentSourceId: String(form.get("parentSourceId") ?? "").trim() || null,
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sourceId: string }> }
): Promise<Response> {
  const sameOriginFailure = rejectCrossOriginRequest(request);
  if (sameOriginFailure) return sameOriginFailure;
  try {
    const principal = await assertAuthenticated();
    const { sourceId } = await params;
    const updated = await updateTrustListSource(principal, sourceId, await parseRequest(request));
    if (request.headers.get("accept")?.includes("application/json")) {
      return Response.json({ source: updated }, { status: 200 });
    }
    return new Response(null, {
      status: 303,
      headers: { Location: "/admin/trust-lists?updated=source" },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "trust-list-update-failed" },
      { status: 400 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ sourceId: string }> }
): Promise<Response> {
  const sameOriginFailure = rejectCrossOriginRequest(request);
  if (sameOriginFailure) return sameOriginFailure;
  const form = await request.formData();
  const method = String(form.get("_method") ?? "").trim().toUpperCase();
  if (method === "DELETE") {
    try {
      const principal = await assertAuthenticated();
      const { sourceId } = await context.params;
      await deleteTrustListSource(principal, sourceId);
      return new Response(null, {
        status: 303,
        headers: { Location: "/admin/trust-lists?deleted=source" },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "trust-list-delete-failed";
      return Response.json({ error: message }, { status: 400 });
    }
  }
  try {
    const principal = await assertAuthenticated();
    const { sourceId } = await context.params;
    await updateTrustListSource(principal, sourceId, parseForm(form));
    return new Response(null, {
      status: 303,
      headers: { Location: "/admin/trust-lists?updated=source" },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "trust-list-update-failed" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ sourceId: string }> }
): Promise<Response> {
  const sameOriginFailure = rejectCrossOriginRequest(request);
  if (sameOriginFailure) return sameOriginFailure;
  try {
    const principal = await assertAuthenticated();
    const { sourceId } = await params;
    await deleteTrustListSource(principal, sourceId);
    if (request.headers.get("accept")?.includes("application/json")) {
      return Response.json({ ok: true }, { status: 200 });
    }
    return new Response(null, {
      status: 303,
      headers: { Location: "/admin/trust-lists?deleted=source" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "trust-list-delete-failed";
    const status = message === "trust-list-source-has-children" || message === "trust-list-source-has-history"
      ? 409
      : 400;
    return Response.json({ error: message }, { status });
  }
}
