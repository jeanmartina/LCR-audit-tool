const fs = require("fs");
const path = require("path");

function read(file) {
  return fs.readFileSync(path.join(process.cwd(), file), "utf8");
}

function assertContains(file, needle, message = `${file} must contain ${needle}`) {
  const content = read(file);
  if (!content.includes(needle)) {
    throw new Error(message);
  }
}

assertContains("src/app/admin/certificates/new/certificate-preview-form.tsx", "reviewDecision");
assertContains("src/app/admin/certificates/new/certificate-preview-form.tsx", "reviewJustification");
assertContains("src/app/admin/certificates/new/certificate-preview-form.tsx", "reviewPayload");
assertContains("src/app/admin/certificates/new/certificate-preview-form.tsx", "review-justification-required");
assertContains("src/app/admin/certificates/new/certificate-preview-form.tsx", "setHighlightedError");

assertContains("src/app/admin/certificates/batch/page.tsx", "BatchReviewForm");
assertContains("src/app/admin/certificates/batch/review/page.tsx", "BatchReviewPageClient");
assertContains("src/app/admin/certificates/batch/batch-review-page-client.tsx", "accept");
assertContains("src/app/admin/certificates/batch/batch-review-page-client.tsx", "edit");
assertContains("src/app/admin/certificates/batch/batch-review-page-client.tsx", "ignore");
assertContains("src/app/admin/certificates/batch/batch-review-page-client.tsx", "reject");
assertContains("src/app/admin/certificates/batch/batch-review-page-client.tsx", "duplicate");
assertContains("src/app/admin/certificates/batch/batch-review-page-client.tsx", "pending");
assertContains("src/app/admin/certificates/batch/batch-review-page-client.tsx", "firstErrorIndex");

assertContains("src/app/api/admin/certificates/import-zip/route.ts", "mode === \"preview\"");
assertContains("src/app/api/admin/certificates/import-zip/route.ts", "mode === \"review-save\"");
assertContains("src/app/api/admin/certificates/import-zip/route.ts", "review-revalidation-failed");

assertContains("src/i18n/index.ts", "admin.certificates.new.reviewSaveButton");
assertContains("src/i18n/index.ts", "admin.certificates.batch.review.title");

console.log("Import review UX validation passed");
