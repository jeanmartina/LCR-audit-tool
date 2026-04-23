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

function assertFile(file) {
  if (!fs.existsSync(path.join(process.cwd(), file))) {
    throw new Error(`${file} is required`);
  }
}

const pkg = JSON.parse(read("package.json"));
for (const dep of ["@xmldom/xmldom", "xpath", "xml-crypto"]) {
  if (!pkg.dependencies?.[dep]) {
    throw new Error(`missing dependency ${dep}`);
  }
}

for (const file of [
  "src/trust-lists/types.ts",
  "src/trust-lists/parser.ts",
  "src/trust-lists/xmldsig.ts",
  "src/trust-lists/sync.ts",
]) {
  assertFile(file);
}

for (const table of [
  "trust_list_sources",
  "trust_list_snapshots",
  "trust_list_sync_runs",
  "trust_list_extracted_certificates",
]) {
  assertContains("src/storage/runtime-store.ts", table);
}

for (const symbol of [
  "listEnabledTrustListSources",
  "createTrustListSyncRun",
  "completeTrustListSyncRun",
  "createTrustListSnapshot",
  "recordTrustListExtractedCertificate",
]) {
  assertContains("src/storage/runtime-store.ts", symbol);
}

for (const symbol of ["sequenceNumber", "territory", "nextUpdate", "X509Certificate", "createHash"]) {
  assertContains("src/trust-lists/parser.ts", symbol);
}
assertContains("src/trust-lists/parser.ts", "@xmldom/xmldom");
assertContains("src/trust-lists/parser.ts", "xpath");
assertContains("src/trust-lists/xmldsig.ts", "xml-crypto");
assertContains("src/trust-lists/xmldsig.ts", "validateTrustListXmlSignature");
assertContains("src/trust-lists/xmldsig.ts", "xml-signature-missing");
assertContains("src/trust-lists/sync.ts", "validateTrustListXmlSignature");
assertContains("src/trust-lists/sync.ts", "importCertificate");
assertContains("src/trust-lists/sync.ts", "trust-list-url-must-use-https");
assertContains("src/trust-lists/sync.ts", "AbortController");
assertContains("src/trust-lists/sync.ts", "failureReason");
assertContains("src/inventory/certificate-admin.ts", '"trust-list"');

if (fs.existsSync(path.join(process.cwd(), "src/trust-lists/admin.ts"))) {
  assertContains("src/trust-lists/admin.ts", "ensureTrustListOperator");
  assertContains("src/trust-lists/admin.ts", "createTrustListSource");
  assertContains("src/trust-lists/admin.ts", "syncTrustListSourceNow");
  assertContains("src/app/api/admin/trust-lists/route.ts", "createTrustListSource");
  assertContains("src/app/api/admin/trust-lists/[sourceId]/sync/route.ts", "syncTrustListSourceNow");
  assertContains("src/app/admin/trust-lists/page.tsx", "StatusPill");
  assertContains("src/i18n/index.ts", "XMLDSig");
  assertContains("scripts/run-worker.js", "syncEnabledTrustListSources");
}

const compose = read("compose.yaml");
if (!compose.includes("worker:")) {
  throw new Error("compose.yaml must define a worker service");
}

console.log("Trust-list foundation validation passed");
