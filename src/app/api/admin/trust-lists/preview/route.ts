import { assertAuthenticated } from "../../../../../auth/authorization";
import { previewTrustListSource } from "../../../../../trust-lists/admin";

function parseCsv(value: FormDataEntryValue | string[] | null | undefined): string[] {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function parseRequest(request: Request): Promise<{ url: string; groupIds: string[] }> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json();
    return {
      url: String(body.url ?? "").trim(),
      groupIds: Array.isArray(body.groupIds) ? body.groupIds.map(String) : parseCsv(body.groupIds),
    };
  }
  const form = await request.formData();
  return {
    url: String(form.get("url") ?? "").trim(),
    groupIds: parseCsv(form.get("groupIds")),
  };
}

export async function POST(request: Request): Promise<Response> {
  try {
    const principal = await assertAuthenticated();
    const preview = await previewTrustListSource(principal, await parseRequest(request));
    return Response.json({ preview }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "trust-list-preview-failed" },
      { status: 400 },
    );
  }
}
