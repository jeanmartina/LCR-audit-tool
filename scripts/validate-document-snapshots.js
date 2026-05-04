const fs = require("fs");
const path = require("path");

function read(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const fetchSafetyPath = "src/monitoring-sources/fetch-safety.ts";
const documentTypesPath = "src/monitoring-sources/document-types.ts";
const documentsPath = "src/monitoring-sources/documents.ts";
const workerPath = "src/monitoring-sources/worker.ts";
const storePath = "src/storage/runtime-store.ts";
const runWorkerPath = "scripts/run-worker.js";
const envExamplePath = ".env.example";
const composePath = "compose.yaml";
const operatorsPath = "docs/operators.md";

for (const filePath of [
  fetchSafetyPath,
  documentTypesPath,
  documentsPath,
  workerPath,
  storePath,
  runWorkerPath,
  envExamplePath,
  composePath,
  operatorsPath,
]) {
  assert(fs.existsSync(filePath), `${filePath} must exist`);
}

const fetchSafety = read(fetchSafetyPath);
const documentTypes = read(documentTypesPath);
const documents = read(documentsPath);
const worker = read(workerPath);
const store = read(storePath);
const runWorker = read(runWorkerPath);
const envExample = read(envExamplePath);
const compose = read(composePath);
const operators = read(operatorsPath);
const validateAll = read("scripts/validate-all.js");
const phaseRequirements = ["DOCS-01", "DOCS-02", "DOCS-03", "DOCS-04", "DOCS-05", "SEC-01"];

function walkFiles(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(root, entry.name);
    return entry.isDirectory() ? walkFiles(fullPath) : [fullPath];
  });
}

for (const literal of [
  "assertPublicMonitoringSourceUrl",
  "fetchMonitoringSourceBytes",
  "DEFAULT_MAX_DOCUMENT_BYTES",
  "MONITORING_SOURCE_MAX_DOCUMENT_BYTES",
  "DEFAULT_MAX_REDIRECTS",
  "MONITORING_SOURCE_MAX_REDIRECTS",
  "MONITORING_SOURCE_FETCH_TIMEOUT_MS",
  "MONITORING_SOURCE_MAX_DOCUMENT_BYTES",
  "MONITORING_SOURCE_ALLOW_LOCALHOST",
  'parsed.protocol !== "http:" && parsed.protocol !== "https:"',
  "redirect: \"manual\"",
  "lookup(",
  "isIP(",
  "monitoring-source-url-private-address-blocked",
]) {
  assert(fetchSafety.includes(literal), `${literal} must be enforced by fetch safety`);
}

for (const literal of [
  "MonitoringSourceEventStatus",
  "DocumentExtractionStatus",
  "MonitoringSourceEventRecord",
  "DocumentSnapshotRecord",
  "rawBodyBase64",
  "metadataJson",
]) {
  assert(documentTypes.includes(literal), `${literal} must be exported by document types`);
}

for (const literal of [
  "extractDocumentText",
  "checkPolicyDocumentSource",
  "pdf-extraction-failed:",
  "getMonitoringSourceMaxExtractedTextBytes",
  "text/html",
  "application/pdf",
  "source-not-policy-document",
  "policy-document-source-not-discovered",
  "findLatestDocumentSnapshotForSource",
  "recordDocumentSnapshot",
  "recordMonitoringSourceEvent",
]) {
  assert(documents.includes(literal), `${literal} must be in document snapshot service`);
}

assert(!documents.includes("dangerouslySetInnerHTML"), "document extraction must not render HTML");

for (const literal of [
  "runScheduledDocumentSourceChecks",
  "getMonitoringSourceDocumentIntervalSeconds",
  "MONITORING_SOURCE_DOCUMENT_INTERVAL_SECONDS",
  "listMonitoringSourceRecords",
  "checkPolicyDocumentSource",
  'source.sourceType === "policy-document"',
]) {
  assert(worker.includes(literal), `${literal} must be in document source worker`);
}

assert(!worker.includes('source.sourceType === "ocsp"'), "document worker must not process OCSP sources");

for (const literal of [
  "src/monitoring-sources/worker.ts",
  "runScheduledDocumentSourceChecks export is required",
  "await runScheduledDocumentSourceChecks();",
  "[worker] document source cycle failed:",
]) {
  assert(runWorker.includes(literal), `${literal} must be wired into worker runtime`);
}

for (const literal of [
  "MONITORING_SOURCE_FETCH_TIMEOUT_MS=30000",
  "MONITORING_SOURCE_MAX_DOCUMENT_BYTES=5242880",
  "MONITORING_SOURCE_MAX_EXTRACTED_TEXT_BYTES=200000",
  "MONITORING_SOURCE_MAX_REDIRECTS=3",
  "MONITORING_SOURCE_DOCUMENT_INTERVAL_SECONDS=3600",
  "MONITORING_SOURCE_ALLOW_LOCALHOST=false",
]) {
  assert(envExample.includes(literal), `${literal} must be documented in .env.example`);
}

for (const literal of [
  "MONITORING_SOURCE_FETCH_TIMEOUT_MS",
  "MONITORING_SOURCE_MAX_DOCUMENT_BYTES",
  "MONITORING_SOURCE_MAX_EXTRACTED_TEXT_BYTES",
  "MONITORING_SOURCE_MAX_REDIRECTS",
  "MONITORING_SOURCE_DOCUMENT_INTERVAL_SECONDS",
  "MONITORING_SOURCE_ALLOW_LOCALHOST",
]) {
  assert(compose.includes(literal), `${literal} must be wired in compose.yaml`);
}

assert(
  operators.includes("## Policy document monitoring limits"),
  "operators guide must document policy document monitoring limits"
);

for (const status of [
  "available",
  "changed",
  "unchanged",
  "unavailable",
  "blocked",
  "oversized",
  "not_checkable",
  "extraction_failed",
]) {
  assert(
    documentTypes.includes(`\"${status}\"`) || documents.includes(`\"${status}\"`),
    `${status} event status must be represented`
  );
}

for (const requirement of phaseRequirements) {
  assert(requirement.startsWith("DOCS-") || requirement === "SEC-01", `${requirement} requirement marker`);
}

for (const literal of [
  "create table if not exists monitoring_source_events",
  "create table if not exists document_snapshots",
  "monitoring_source_events_source_checked_idx",
  "document_snapshots_source_captured_idx",
  "document_snapshots_source_hash_uidx",
  "raw_body bytea not null",
  "content_sha256 text null",
  "extracted_text text null",
  "extracted_text_truncated boolean not null",
  "extraction_status text not null",
  "metadata_json jsonb not null",
  "trust_list_source_id",
  "trust_list_snapshot_id",
  "trust_list_run_id",
  "recordMonitoringSourceEvent",
  "recordDocumentSnapshot",
  "findLatestDocumentSnapshotForSource",
  "listDocumentSnapshotsForSource",
  "listMonitoringSourceEventsForSource",
]) {
  assert(store.includes(literal), `${literal} must be in runtime store`);
}

const validateAllHits = validateAll.match(/validate-document-snapshots\.js/g) ?? [];
assert(validateAllHits.length === 1, "validate-all must include validate-document-snapshots.js exactly once");

const adminManualSourceFiles = walkFiles(path.join(process.cwd(), "src/app/admin")).filter((filePath) =>
  filePath.toLowerCase().includes("monitoring-source")
);
assert(adminManualSourceFiles.length === 0, "Phase 23 must not add manual monitoring-source admin UI routes");

console.log("Document snapshot validation passed");
