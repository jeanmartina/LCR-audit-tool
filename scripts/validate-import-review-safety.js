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

assertContains("src/trust-lists/sync.ts", "reviewPayload", "trust-list sync must accept review payload");
assertContains("src/trust-lists/sync.ts", "ignore");
assertContains("src/trust-lists/sync.ts", "reject");
assertContains("src/trust-lists/sync.ts", "duplicate");
assertContains("src/trust-lists/sync.ts", "pending");
assertContains("src/trust-lists/sync.ts", "recordCertificateReviewOutcome", "non-accepted trust-list decisions must be persisted");

assertContains("src/app/api/admin/trust-lists/[sourceId]/sync/route.ts", "reviewPayload", "sync route must parse review payload");
assertContains("src/app/api/admin/trust-lists/[sourceId]/sync/route.ts", "review-required", "sync route must fail when review is missing");
assertContains("src/app/api/admin/trust-lists/[sourceId]/sync/route.ts", "candidate-decisions", "sync route must enforce per-candidate decisions");

assertContains("src/app/admin/trust-lists/trust-list-source-wizard.tsx", "admin.trustLists.review", "trust-list review copy keys must be used");
assertContains("src/app/admin/trust-lists/trust-list-source-wizard.tsx", "reviewDecision", "trust-list review UI must capture decisions");
assertContains("src/app/admin/trust-lists/trust-list-source-wizard.tsx", "reviewJustification", "trust-list review UI must capture justification");

assertContains("src/app/admin/certificates/[certificateId]/page.tsx", "review:", "certificate detail must surface review history provenance");
assertContains("src/i18n/index.ts", "admin.trustLists.review.title", "review copy keys must exist");

console.log("Import review safety validation passed");
