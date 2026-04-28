import { rejectCrossOriginRequest } from "../../../../../../auth/request-security";
import { assertAuthenticated } from "../../../../../../auth/authorization";
import { syncTrustListSourceNow } from "../../../../../../trust-lists/admin";

export async function POST(
  request: Request,
  context: { params: Promise<{ sourceId: string }> }
): Promise<Response> {
  const sameOriginFailure = rejectCrossOriginRequest(request);
  if (sameOriginFailure) return sameOriginFailure;
  const { sourceId } = await context.params;
  try {
    const principal = await assertAuthenticated();
    const result = await syncTrustListSourceNow(principal, sourceId);
    if (request.headers.get("accept")?.includes("application/json")) {
      return Response.json({ result }, { status: result.status === "succeeded" ? 200 : 400 });
    }
    const suffix = result.status === "succeeded" ? "sync=complete" : "sync=failed";
    return new Response(null, {
      status: 303,
      headers: { Location: `/admin/trust-lists?${suffix}` },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "trust-list-sync-failed" },
      { status: 400 }
    );
  }
}
