const fs = require("fs");

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function assertIncludes(content, needle, message) {
  if (!content.includes(needle)) {
    throw new Error(`${message} (missing: ${needle})`);
  }
}

function assertNotIncludes(content, needle, message) {
  if (content.includes(needle)) {
    throw new Error(`${message} (found: ${needle})`);
  }
}

function assertFile(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing file: ${file}`);
  }
}

function count(content, needle) {
  return content.split(needle).length - 1;
}

const setupPagePath = "src/app/setup/page.tsx";
const setupRoutePath = "src/app/api/setup/platform-admin/route.ts";
const previewRoutePath = "src/app/api/admin/certificates/import/preview/route.ts";
const runPagePath = "src/app/admin/certificates/import-runs/[runId]/page.tsx";

[setupPagePath, setupRoutePath, previewRoutePath, runPagePath].forEach(assertFile);

const models = read("src/auth/models.ts");
const setupPage = read(setupPagePath);
const setupRoute = read(setupRoutePath);
const certificateAdmin = read("src/inventory/certificate-admin.ts");
const newPage = read("src/app/admin/certificates/new/page.tsx");
const batchPage = read("src/app/admin/certificates/batch/page.tsx");
const listPage = read("src/app/admin/certificates/page.tsx");
const zipRoute = read("src/app/api/admin/certificates/import-zip/route.ts");
const singleRoute = read("src/app/api/admin/certificates/import/route.ts");
const runPage = read(runPagePath);
const i18n = read("src/i18n/index.ts");

assertIncludes(models, "export async function hasPlatformAdmin", "Missing platform-admin bootstrap guard");
assertIncludes(models, "export async function createFirstPlatformAdmin", "Missing first admin creation helper");
assertIncludes(models, "hashPassword", "First admin helper must hash passwords");
assertIncludes(models, "platform-admin.bootstrap.created", "Missing bootstrap audit event");
assertIncludes(models, "bootstrap-already-complete", "Missing closed-bootstrap error");

assertIncludes(setupPage, "hasPlatformAdmin", "Setup page does not check bootstrap state");
assertIncludes(setupPage, 'action="/api/setup/platform-admin"', "Setup form action missing");
assertIncludes(setupPage, "../../components/ui/primitives", "Setup page must use shared primitives");
assertIncludes(setupRoute, "createFirstPlatformAdmin", "Setup API does not create first admin through helper");
assertIncludes(setupRoute, "createSession", "Setup API does not create session");
assertIncludes(setupRoute, "serializeSessionCookie", "Setup API does not set session cookie through secure helper");
assertIncludes(setupRoute, "Location: \"/settings?firstRun=complete\"", "Setup API must use relative success redirect");
assertNotIncludes(setupRoute, "request.url", "Setup API must not derive redirects from internal request URL");

assertIncludes(certificateAdmin, "export interface CertificateImportPreview", "Missing certificate preview interface");
assertIncludes(certificateAdmin, "export async function previewCertificateImport", "Missing pure certificate preview helper");
const previewBody = certificateAdmin.slice(
  certificateAdmin.indexOf("export async function previewCertificateImport"),
  certificateAdmin.indexOf("export async function importCertificate")
);
assertNotIncludes(previewBody, "createCertificateImportRun", "Preview helper must not create import runs");
assertNotIncludes(previewBody, "upsertCertificateRecord", "Preview helper must not persist certificates");
assertIncludes(previewBody, "trackedUrls", "Preview helper must expose tracked URLs");
assertIncludes(previewBody, "no-crl-urls-found", "Preview helper must warn on certificates without CRLs");

assertIncludes(read(previewRoutePath), "previewCertificateImport", "Preview API does not call preview helper");
assertIncludes(read(previewRoutePath), "certificate-file-required", "Preview API missing file validation");
assertIncludes(newPage, "../../../../components/ui/primitives", "Single import page must use shared primitives");
assertIncludes(newPage, "admin.certificates.new.previewFingerprint", "Single import page missing fingerprint preview copy");
assertIncludes(newPage, "admin.certificates.new.previewDerivedCrls", "Single import page missing derived CRL preview copy");
assertIncludes(read("src/app/admin/certificates/new/certificate-preview-form.tsx"), 'action="/api/admin/certificates/import"', "Single import commit form missing");
assertIncludes(singleRoute, "?imported=single", "Single import route missing post-action redirect");
assertNotIncludes(singleRoute, "request.url", "Single import route must not use internal request URL for redirect");

assertIncludes(certificateAdmin, "getCertificateImportRunDetail", "Missing import-run detail read model");
assertIncludes(read("src/storage/runtime-store.ts"), "findCertificateImportRun", "Missing import-run storage lookup");
assertIncludes(runPage, "admin.certificates.importRun.title", "Import-run result page missing title copy");
assertIncludes(runPage, "StatusPill", "Import-run result page missing status pills");
assertIncludes(runPage, "admin.certificates.importRun.table.filename", "Import-run result page missing filename column");
assertIncludes(batchPage, "../../../../components/ui/primitives", "Batch import page must use shared primitives");
assertIncludes(batchPage, "admin.certificates.batch.acceptedEntriesHint", "Batch page missing accepted entries hint");
assertIncludes(zipRoute, "/admin/certificates/import-runs/${summary.runId}", "ZIP route must redirect browser flow to result page");
assertIncludes(zipRoute, "Location:", "ZIP route missing redirect Location");
assertIncludes(zipRoute, "Response.json(summary", "ZIP route must retain JSON client support");
assertIncludes(listPage, "../../../components/ui/primitives", "Certificate list must use shared primitives");

for (const key of [
  '"setup.title"',
  '"admin.certificates.new.previewFingerprint"',
  '"admin.certificates.batch.acceptedEntriesHint"',
  '"admin.certificates.importRun.title"',
]) {
  if (count(i18n, key) !== 3) {
    throw new Error(`${key} must appear exactly once per locale`);
  }
}

console.log("First-run and guided onboarding UX ready");
