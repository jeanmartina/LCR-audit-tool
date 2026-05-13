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

assertContains("src/inventory/certificate-admin.ts", "CertificateReviewDecision");
assertContains("src/inventory/certificate-admin.ts", "createCertificateReviewSnapshot");
assertContains("src/inventory/certificate-admin.ts", "validateCertificateReviewSubmission");
assertContains("src/inventory/certificate-admin.ts", "review-justification-required");
assertContains("src/inventory/certificate-admin.ts", "review-mismatch-detected");
assertContains("src/inventory/certificate-admin.ts", "ignore");
assertContains("src/inventory/certificate-admin.ts", "reject");
assertContains("src/inventory/certificate-admin.ts", "duplicate");

assertContains("src/storage/runtime-store.ts", "recordCertificateReviewOutcome");

assertContains("src/app/api/admin/certificates/import/preview/route.ts", "createCertificateReviewSnapshot");
assertContains("src/app/api/admin/certificates/import/route.ts", "validateCertificateReviewSubmission");
assertContains("src/app/api/admin/certificates/import-zip/route.ts", "validateCertificateReviewSubmission");
assertContains("src/app/api/admin/trust-lists/[sourceId]/sync/route.ts", "validateCertificateReviewSubmission");

console.log("Import review foundation validation passed");
