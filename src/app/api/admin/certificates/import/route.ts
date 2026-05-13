import { rejectCrossOriginRequest } from "../../../../../auth/request-security";
import { assertAuthenticated } from "../../../../../auth/authorization";
import {
  createCertificateReviewSnapshot,
  getMaxCertificateFileBytes,
  importCertificate,
  normalizeCertificatePem,
  validateCertificateReviewSubmission,
  type CertificateInput,
  type CertificateReviewSubmission,
} from "../../../../../inventory/certificate-admin";
import {
  createCertificateImportRun,
  recordCertificateReviewOutcome,
} from "../../../../../storage/runtime-store";

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

function parseInputFromForm(form: FormData, pemText: string): CertificateInput {
  return {
    displayName: String(form.get("displayName") ?? "").trim(),
    pemText,
    tags: parseCsv(form.get("tags")),
    groupIds: parseCsv(form.get("groupIds")),
    ignoredUrls: parseCsv(form.get("ignoredUrls")),
    status: String(form.get("status") ?? "active").trim() === "disabled" ? "disabled" : "active",
    groupOverrides: parseOverrides(form.get("groupOverrides")),
  };
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

    const input = parseInputFromForm(form, normalizeCertificatePem(Buffer.from(await file.arrayBuffer())));
    const reviewPayloadRaw = String(form.get("reviewPayload") ?? "").trim();
    const reviewDecision = String(form.get("reviewDecision") ?? "accept").trim();
    const reviewJustification = String(form.get("reviewJustification") ?? "").trim();
    const submission: CertificateReviewSubmission = reviewPayloadRaw
      ? JSON.parse(reviewPayloadRaw)
      : {
          snapshot: await createCertificateReviewSnapshot(principal, input, "single"),
          decision: reviewDecision as
            | "accept"
            | "edit"
            | "ignore"
            | "reject"
            | "duplicate"
            | "pending",
          editedInput: input,
          justification: reviewJustification,
        };

    const validated = await validateCertificateReviewSubmission(principal, submission);
    if (!validated.shouldPersistActiveCertificate) {
      const run = await createCertificateImportRun({
        mode: "single",
        actorUserId: principal.userId,
        summary: { sourceType: "single", reviewOnly: true },
      });
      await recordCertificateReviewOutcome({
        runId: run.id,
        filename: file.name,
        fingerprint: validated.preview.fingerprint,
        decision: validated.decision as "ignore" | "reject" | "duplicate" | "pending",
        reason: reviewJustification || null,
      });
      return Response.json({ status: "review-recorded", runId: run.id }, { status: 200 });
    }

    const result = await importCertificate(principal, validated.input, "single", file.name);

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
