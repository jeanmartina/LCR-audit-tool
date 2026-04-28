import { rejectCrossOriginRequest } from "../../../../auth/request-security";
import { assertAuthenticated } from "../../../../auth/authorization";
import { createTrustListSource, listTrustListSourcesForAdmin } from "../../../../trust-lists/admin";

function parseCsv(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function parseRequest(request: Request): Promise<{
  label: string;
  url: string;
  enabled: boolean;
  groupIds: string[];
}> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json();
    return {
      label: String(body.label ?? "").trim(),
      url: String(body.url ?? "").trim(),
      enabled: body.enabled !== false,
      groupIds: Array.isArray(body.groupIds) ? body.groupIds.map(String) : parseCsv(body.groupIds),
    };
  }
  const form = await request.formData();
  return {
    label: String(form.get("label") ?? "").trim(),
    url: String(form.get("url") ?? "").trim(),
    enabled: form.get("enabled") !== null,
    groupIds: parseCsv(form.get("groupIds")),
  };
}

export async function GET(): Promise<Response> {
  try {
    const principal = await assertAuthenticated();
    return Response.json({ sources: await listTrustListSourcesForAdmin(principal) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "trust-list-list-failed" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  const sameOriginFailure = rejectCrossOriginRequest(request);
  if (sameOriginFailure) return sameOriginFailure;
  try {
    const principal = await assertAuthenticated();
    const source = await createTrustListSource(principal, await parseRequest(request));
    if (request.headers.get("accept")?.includes("application/json")) {
      return Response.json({ source }, { status: 201 });
    }
    return new Response(null, {
      status: 303,
      headers: { Location: "/admin/trust-lists?created=source" },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "trust-list-create-failed" },
      { status: 400 }
    );
  }
}
