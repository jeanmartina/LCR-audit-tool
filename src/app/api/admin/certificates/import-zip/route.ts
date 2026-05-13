import { rejectCrossOriginRequest } from "../../../../../auth/request-security";
import { assertAuthenticated } from "../../../../../auth/authorization";
import {
  importCertificate,
  getMaxZipArchiveBytes,
  importCertificateZip,
  previewCertificateZip,
  validateCertificateReviewSubmission,
  type CertificateReviewSubmission,
} from "../../../../../inventory/certificate-admin";
import {
  completeCertificateImportRun,
  createCertificateImportRun,
  listCertificateImportItems,
  recordCertificateImportItem,
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

export async function POST(request: Request): Promise<Response> {
  const sameOriginFailure = rejectCrossOriginRequest(request);
  if (sameOriginFailure) return sameOriginFailure;
  try {
    const principal = await assertAuthenticated();
    const form = await request.formData();
    const mode = String(form.get("mode") ?? "direct").trim();
    const file = form.get("archive");
    if (!(file instanceof File)) {
      return Response.json({ error: "zip-file-required" }, { status: 400 });
    }
    if (file.size > getMaxZipArchiveBytes()) {
      return Response.json({ error: "zip-archive-too-large" }, { status: 413 });
    }

    const zipBytes = Buffer.from(await file.arrayBuffer());
    const sharedInput = {
      tags: parseCsv(form.get("tags")),
      groupIds: parseCsv(form.get("groupIds")),
      ignoredUrls: parseCsv(form.get("ignoredUrls")),
      status: "active" as const,
      groupOverrides: parseOverrides(form.get("groupOverrides")),
    };

    if (mode === "preview") {
      const candidates = await previewCertificateZip(principal, zipBytes, sharedInput);
      return Response.json({ candidates }, { status: 200 });
    }

    if (mode === "review-save") {
      const payloadRaw = String(form.get("reviewPayload") ?? "").trim();
      if (!payloadRaw) {
        return Response.json({ error: "review-payload-required" }, { status: 400 });
      }
      const payload = JSON.parse(payloadRaw) as {
        candidates: Array<{
          filename: string;
          submission: CertificateReviewSubmission;
        }>;
      };
      const run = await createCertificateImportRun({
        mode: "zip",
        actorUserId: principal.userId,
        summary: { sourceType: "zip", reviewOnly: true },
      });

      let imported = 0;
      let updated = 0;
      let ignored = 0;
      let invalid = 0;
      let firstErrorIndex: number | null = null;
      const errors: Array<{ index: number; error: string }> = [];

      for (let index = 0; index < payload.candidates.length; index += 1) {
        const candidate = payload.candidates[index];
        try {
          const validated = await validateCertificateReviewSubmission(principal, candidate.submission);
          if (!validated.shouldPersistActiveCertificate) {
            ignored += 1;
            await recordCertificateReviewOutcome({
              runId: run.id,
              filename: candidate.filename,
              fingerprint: validated.preview.fingerprint,
              decision: validated.decision as "ignore" | "reject" | "duplicate" | "pending",
              reason: candidate.submission.justification ?? null,
            });
            continue;
          }

          const result = await importCertificate(principal, validated.input, "zip", candidate.filename);
          if (result.result === "imported") {
            imported += 1;
          } else {
            updated += 1;
          }
          await recordCertificateImportItem({
            runId: run.id,
            certificateId: result.certificateId,
            filename: candidate.filename,
            fingerprint: validated.preview.fingerprint,
            result: result.result,
          });
        } catch (error) {
          invalid += 1;
          if (firstErrorIndex === null) {
            firstErrorIndex = index;
          }
          const message = error instanceof Error ? error.message : "certificate-zip-import-failed";
          errors.push({ index, error: message });
          await recordCertificateImportItem({
            runId: run.id,
            certificateId: null,
            filename: candidate.filename,
            fingerprint: null,
            result: "invalid",
            message,
          });
        }
      }

      await completeCertificateImportRun(
        run.id,
        {
          imported,
          updated,
          ignored,
          invalid,
          archiveReadable: true,
          status: invalid ? "failed" : "completed",
          sourceType: "zip",
          reviewOnly: true,
        },
        invalid ? "failed" : "completed"
      );

      if (invalid) {
        return Response.json(
          {
            error: "review-revalidation-failed",
            firstErrorIndex,
            errors,
            runId: run.id,
          },
          { status: 400 }
        );
      }

      return Response.json(
        { status: "ok", runId: run.id, items: await listCertificateImportItems(run.id) },
        { status: 200 }
      );
    }

    const summary = await importCertificateZip(principal, zipBytes, sharedInput);

    if (request.headers.get("accept")?.includes("application/json")) {
      return Response.json(summary, { status: 200 });
    }

    return new Response(null, {
      status: 303,
      headers: { Location: `/admin/certificates/import-runs/${summary.runId}` },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "certificate-zip-import-failed" },
      { status: 400 }
    );
  }
}
