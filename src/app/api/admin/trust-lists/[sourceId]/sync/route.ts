import { rejectCrossOriginRequest } from "../../../../../../auth/request-security";
import { assertAuthenticated } from "../../../../../../auth/authorization";
import { validateCertificateReviewSubmission } from "../../../../../../inventory/certificate-admin";
import { syncTrustListSourceNow } from "../../../../../../trust-lists/admin";
import type { TrustListReviewPayload } from "../../../../../../trust-lists/sync";

function validateReviewPayload(parsed: TrustListReviewPayload | null | undefined): TrustListReviewPayload {
  if (!parsed?.candidateDecisions || typeof parsed.candidateDecisions !== "object") {
    throw new Error("review-required:candidate-decisions");
  }
  return parsed;
}

async function parseReviewPayload(request: Request): Promise<TrustListReviewPayload> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json();
    const direct = (body?.candidateDecisions ? body : body?.reviewPayload) as TrustListReviewPayload | undefined;
    return validateReviewPayload(direct);
  }
  const form = await request.formData();
  const raw = String(form.get("reviewPayload") ?? "").trim();
  if (!raw) {
    throw new Error("review-required:candidate-decisions");
  }
  return validateReviewPayload(JSON.parse(raw) as TrustListReviewPayload);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ sourceId: string }> }
): Promise<Response> {
  void validateCertificateReviewSubmission;
  const sameOriginFailure = rejectCrossOriginRequest(request);
  if (sameOriginFailure) return sameOriginFailure;
  const { sourceId } = await context.params;
  try {
    const principal = await assertAuthenticated();
    const reviewPayload = await parseReviewPayload(request);
    const result = await syncTrustListSourceNow(principal, sourceId, reviewPayload);
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
