import { assertAuthenticated } from "../../../../../../auth/authorization";
import { updateCertificateAdministration } from "../../../../../../inventory/certificate-admin";

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

export async function POST(
  request: Request,
  context: { params: Promise<{ certificateId: string }> }
): Promise<Response> {
  const { certificateId } = await context.params;
  try {
    const principal = await assertAuthenticated();
    const form = await request.formData();
    await updateCertificateAdministration(principal, certificateId, {
      displayName: String(form.get("displayName") ?? "").trim(),
      tags: parseCsv(form.get("tags")),
      status:
        String(form.get("status") ?? "active").trim() === "disabled" ? "disabled" : "active",
      groupIds: parseCsv(form.get("groupIds")),
      groupOverrides: parseOverrides(form.get("groupOverrides")),
    });
    return Response.redirect(new URL(`/admin/certificates/${certificateId}`, request.url), 303);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "certificate-update-failed" },
      { status: 400 }
    );
  }
}
