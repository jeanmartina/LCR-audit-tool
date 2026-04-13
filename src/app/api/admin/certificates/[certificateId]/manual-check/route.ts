import { assertAuthenticated } from "../../../../../../auth/authorization";
import { runManualConnectivityCheck } from "../../../../../../inventory/certificate-admin";

export async function POST(
  request: Request,
  context: { params: Promise<{ certificateId: string }> }
): Promise<Response> {
  const { certificateId } = await context.params;
  try {
    const principal = await assertAuthenticated();
    await runManualConnectivityCheck(principal, certificateId);
    return Response.redirect(new URL(`/admin/certificates/${certificateId}`, request.url), 303);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "manual-check-failed" },
      { status: 400 }
    );
  }
}
