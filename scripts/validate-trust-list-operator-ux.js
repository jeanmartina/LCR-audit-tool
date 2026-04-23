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

function assertNotContains(segment, needle, message) {
  if (segment.includes(needle)) {
    throw new Error(message);
  }
}

assertContains("src/trust-lists/types.ts", "TrustListRecoveryGuidance");
assertContains("src/trust-lists/types.ts", "TrustListSourcePreviewResult");
assertContains("src/trust-lists/types.ts", "xml-signature-invalid");

assertContains("src/trust-lists/admin.ts", "ensureTrustListOperator");
assertContains("src/trust-lists/admin.ts", "group-admin");
assertContains("src/trust-lists/admin.ts", "canManageTrustListGroups");
assertContains("src/trust-lists/admin.ts", "previewTrustListSource");
assertContains("src/trust-lists/admin.ts", "latestRecovery");
assertContains("src/trust-lists/admin.ts", "trust-list-group-admin-required");

assertContains("src/trust-lists/sync.ts", "previewTrustListXmlSource");
assertContains("src/trust-lists/sync.ts", "getTrustListRecoveryGuidance");
assertContains("src/trust-lists/sync.ts", "trust-list-no-certificates");
for (const code of [
  "invalid-url",
  "https-required",
  "xml-signature-invalid",
  "xml-too-large",
  "fetch-failed",
  "no-certificates",
  "parse-failed",
  "unknown",
]) {
  assertContains("src/trust-lists/sync.ts", code);
}

const sync = read("src/trust-lists/sync.ts");
const previewStart = sync.indexOf("export async function previewTrustListXmlSource");
const syncStart = sync.indexOf("export async function syncTrustListSource");
if (previewStart === -1 || syncStart === -1 || previewStart > syncStart) {
  throw new Error("previewTrustListXmlSource must be defined before the mutating sync function");
}
const previewSegment = sync.slice(previewStart, syncStart);
for (const mutator of [
  "createTrustListSyncRun",
  "createTrustListSnapshot",
  "recordTrustListCertificateProjection",
  "recordTrustListExtractedCertificate",
  "importCertificate(",
  "completeTrustListSyncRun",
]) {
  assertNotContains(previewSegment, mutator, `previewTrustListXmlSource must not call ${mutator}`);
}

assertContains("src/app/api/admin/trust-lists/preview/route.ts", "previewTrustListSource");
assertContains("src/app/api/admin/trust-lists/preview/route.ts", "assertAuthenticated");
assertContains("src/app/api/admin/trust-lists/route.ts", "assertAuthenticated");
assertContains("src/app/api/admin/trust-lists/[sourceId]/sync/route.ts", "assertAuthenticated");

assertContains("src/app/admin/trust-lists/trust-list-source-wizard.tsx", "admin.trustLists.wizard.testButton");
assertContains("src/app/admin/trust-lists/trust-list-source-wizard.tsx", "/api/admin/trust-lists/preview");
assertContains("src/app/admin/trust-lists/trust-list-source-wizard.tsx", "saveWithoutTest");
assertContains("src/app/admin/trust-lists/page.tsx", "TrustListSourceWizard");
assertContains("src/app/admin/trust-lists/page.tsx", "timeline");
assertContains("src/app/admin/trust-lists/page.tsx", "latestRecovery");

for (const key of [
  "admin.trustLists.wizard.step.details",
  "admin.trustLists.wizard.testButton",
  "admin.trustLists.wizard.saveWithoutTest.title",
  "admin.trustLists.timeline.title",
  "admin.trustLists.timeline.recommendedAction",
  "admin.trustLists.recovery.xmlSignatureInvalid.title",
  "admin.trustLists.recovery.fetchFailed.action",
]) {
  assertContains("src/i18n/index.ts", key);
}

assertContains("docs/operators.md", "Trust-list source onboarding");
assertContains("docs/operators.md", "Preview source");
assertContains("docs/operators.md", "Recovery guidance");
assertContains("scripts/validate-all.js", "validate-trust-list-operator-ux.js");

console.log("Trust-list operator UX validation passed");
