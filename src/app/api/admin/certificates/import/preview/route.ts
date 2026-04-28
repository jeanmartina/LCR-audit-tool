import { rejectCrossOriginRequest } from "../../../../../../auth/request-security";
import { assertAuthenticated } from "../../../../../../auth/authorization";
import {
  getMaxCertificateFileBytes,
  normalizeCertificatePem,
  previewCertificateImport,
} from "../../../../../../inventory/certificate-admin";

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
  const sameOriginFailure = rejectCrossOriginRequest(request);
  if (sameOriginFailure) return sameOriginFailure;
  try {
    const principal = await assertAuthenticated();
    const form = await request.formData();
    const file = form.get("certificate");
    if (!(file instanceof File)) {
      return Response.json({ error: "certificate-file-required" }, { status: 400 });
    }
    if (file.size > getMaxCertificateFileBytes()) {
      return Response.json({ error: "certificate-file-too-large" }, { status: 413 });
    }

    const preview = await previewCertificateImport(principal, {
      displayName: String(form.get("displayName") ?? "").trim(),
      pemText: normalizeCertificatePem(Buffer.from(await file.arrayBuffer())),
      tags: parseCsv(form.get("tags")),
      groupIds: parseCsv(form.get("groupIds")),
      ignoredUrls: parseCsv(form.get("ignoredUrls")),
      status: String(form.get("status") ?? "active").trim() === "disabled" ? "disabled" : "active",
      groupOverrides: parseOverrides(form.get("groupOverrides")),
    });

    return Response.json({ preview }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "certificate-preview-failed" },
      { status: 400 }
    );
  }
}
