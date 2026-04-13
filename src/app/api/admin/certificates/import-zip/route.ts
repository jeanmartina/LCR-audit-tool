import { assertAuthenticated } from "../../../../../auth/authorization";
import { importCertificateZip } from "../../../../../inventory/certificate-admin";

function parseCsv(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseOverrides(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return [];
  }
  return JSON.parse(raw);
}

export async function POST(request: Request): Promise<Response> {
  try {
    const principal = await assertAuthenticated();
    const form = await request.formData();
    const file = form.get("archive");
    if (!(file instanceof File)) {
      return Response.json({ error: "zip-file-required" }, { status: 400 });
    }

    const summary = await importCertificateZip(
      principal,
      Buffer.from(await file.arrayBuffer()),
      {
        tags: parseCsv(form.get("tags")),
        groupIds: parseCsv(form.get("groupIds")),
        ignoredUrls: parseCsv(form.get("ignoredUrls")),
        status: "active",
        groupOverrides: parseOverrides(form.get("groupOverrides")),
      }
    );

    return Response.json(summary, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "certificate-zip-import-failed" },
      { status: 400 }
    );
  }
}
