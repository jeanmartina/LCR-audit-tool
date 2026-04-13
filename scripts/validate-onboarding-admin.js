const fs = require("fs");

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function assertIncludes(content, needle, message) {
  if (!content.includes(needle)) {
    throw new Error(`${message} (missing: ${needle})`);
  }
}

const mode = process.argv[2];
const runtimeStore = read("src/storage/runtime-store.ts");
const certificateAdmin = read("src/inventory/certificate-admin.ts");
const adminListPage = read("src/app/admin/certificates/page.tsx");
const adminNewPage = read("src/app/admin/certificates/new/page.tsx");
const adminBatchPage = read("src/app/admin/certificates/batch/page.tsx");
const adminDetailPage = read("src/app/admin/certificates/[certificateId]/page.tsx");
const singleImportRoute = read("src/app/api/admin/certificates/import/route.ts");
const batchImportRoute = read("src/app/api/admin/certificates/import-zip/route.ts");
const ignoreRoute = read("src/app/api/admin/certificates/[certificateId]/ignore-url/route.ts");
const templateRoute = read("src/app/api/admin/certificates/[certificateId]/template/route.ts");
const updateRoute = read("src/app/api/admin/certificates/[certificateId]/update/route.ts");
const manualCheckRoute = read("src/app/api/admin/certificates/[certificateId]/manual-check/route.ts");

if (mode === "schema") {
  assertIncludes(runtimeStore, "create table if not exists certificates", "Missing certificates schema");
  assertIncludes(runtimeStore, "create table if not exists certificate_import_runs", "Missing import run schema");
  assertIncludes(runtimeStore, "create table if not exists certificate_group_overrides", "Missing group override schema");
  assertIncludes(runtimeStore, "create table if not exists certificate_templates", "Missing template schema");
  assertIncludes(certificateAdmin, "upsertCertificateRecord", "Missing certificate persistence wiring");
  console.log("Certificate admin schema ready");
  process.exit(0);
}

if (mode === "import") {
  assertIncludes(certificateAdmin, "extractCertificateFingerprint", "Missing fingerprint dedup");
  assertIncludes(certificateAdmin, "extractDerivedCrlUrls", "Missing CRL derivation");
  assertIncludes(certificateAdmin, "importCertificateZip", "Missing zip import flow");
  assertIncludes(certificateAdmin, 'unzipSync', "Missing in-process zip extraction");
  assertIncludes(certificateAdmin, 'normalizeCertificatePem', "Missing PEM/DER normalization");
  if (certificateAdmin.includes('execFileAsync("unzip"') || certificateAdmin.includes('execFile("unzip"')) {
    throw new Error("Batch import still shells out to unzip");
  }
  assertIncludes(adminNewPage, 'action="/api/admin/certificates/import"', "Missing single import form");
  assertIncludes(singleImportRoute, 'normalizeCertificatePem', "Missing single-import PEM/DER normalization");
  assertIncludes(singleImportRoute, "importCertificate(", "Missing single import route wiring");
  assertIncludes(batchImportRoute, "importCertificateZip", "Missing batch import route wiring");
  console.log("Certificate import flows ready");
  process.exit(0);
}

if (mode === "ui") {
  assertIncludes(adminListPage, 't("admin.certificates.title")', "Missing admin list page");
  assertIncludes(adminNewPage, 't("admin.certificates.new.previewConfig")', "Missing effective preview");
  assertIncludes(adminBatchPage, 't("admin.certificates.batch.description")', "Missing separate batch flow");
  assertIncludes(adminDetailPage, 't("admin.certificates.detail.changeHistory")', "Missing change history surface");
  assertIncludes(adminDetailPage, 't("admin.certificates.detail.templateClone")', "Missing template clone surface");
  assertIncludes(adminDetailPage, 't("admin.certificates.detail.save")', "Missing edit/update surface");
  assertIncludes(ignoreRoute, "ignoreDerivedUrl", "Missing ignored URL route");
  assertIncludes(templateRoute, "createCertificateTemplateFromCertificate", "Missing template route");
  assertIncludes(updateRoute, "updateCertificateAdministration", "Missing certificate update route");
  assertIncludes(manualCheckRoute, "runManualConnectivityCheck", "Missing manual validation route");
  console.log("Certificate admin UI ready");
  process.exit(0);
}

throw new Error("Usage: node scripts/validate-onboarding-admin.js <schema|import|ui>");
