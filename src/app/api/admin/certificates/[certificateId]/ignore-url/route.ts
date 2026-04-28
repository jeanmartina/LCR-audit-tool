import { rejectCrossOriginRequest } from "../../../../../../auth/request-security";
import { assertAuthenticated } from "../../../../../../auth/authorization";
import { ignoreDerivedUrl } from "../../../../../../inventory/certificate-admin";

export async function POST(
  request: Request,
  context: { params: Promise<{ certificateId: string }> }
): Promise<Response> {
  const sameOriginFailure = rejectCrossOriginRequest(request);
  if (sameOriginFailure) return sameOriginFailure;
  const { certificateId } = await context.params;
  try {
    const principal = await assertAuthenticated();
    const form = await request.formData();
    await ignoreDerivedUrl(
      principal,
      certificateId,
      String(form.get("crlUrl") ?? "").trim(),
      String(form.get("ignored") ?? "false").trim() === "true"
    );
    return Response.redirect(new URL(`/admin/certificates/${certificateId}`, request.url), 303);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "ignore-url-update-failed" },
      { status: 400 }
    );
  }
}
