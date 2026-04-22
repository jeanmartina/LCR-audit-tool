import { assertAuthenticated } from "../../../../../auth/authorization";
import {
  importCertificate,
  normalizeCertificatePem,
} from "../../../../../inventory/certificate-admin";

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
    const file = form.get("certificate");
    if (!(file instanceof File)) {
      return Response.json({ error: "certificate-file-required" }, { status: 400 });
    }

    const result = await importCertificate(
      principal,
      {
        displayName: String(form.get("displayName") ?? "").trim(),
        pemText: normalizeCertificatePem(Buffer.from(await file.arrayBuffer())),
        tags: parseCsv(form.get("tags")),
        groupIds: parseCsv(form.get("groupIds")),
        ignoredUrls: parseCsv(form.get("ignoredUrls")),
        status: String(form.get("status") ?? "active").trim() === "disabled" ? "disabled" : "active",
        groupOverrides: parseOverrides(form.get("groupOverrides")),
      },
      "single",
      file.name
    );

    return new Response(null, {
      status: 303,
      headers: { Location: `/admin/certificates/${result.certificateId}?imported=single` },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "certificate-import-failed" },
      { status: 400 }
    );
  }
}
