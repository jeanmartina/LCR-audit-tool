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
const storePath = "src/storage/runtime-store.ts";

for (const filePath of [fetchSafetyPath, documentTypesPath, storePath]) {
  assert(fs.existsSync(filePath), `${filePath} must exist`);
}

const fetchSafety = read(fetchSafetyPath);
const documentTypes = read(documentTypesPath);
const store = read(storePath);

for (const literal of [
  "assertPublicMonitoringSourceUrl",
  "fetchMonitoringSourceBytes",
  "DEFAULT_MAX_DOCUMENT_BYTES",
  "DEFAULT_MAX_REDIRECTS",
  "MONITORING_SOURCE_FETCH_TIMEOUT_MS",
  "MONITORING_SOURCE_MAX_DOCUMENT_BYTES",
  "MONITORING_SOURCE_ALLOW_LOCALHOST",
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
  assert(documentTypes.includes(`\"${status}\"`), `${status} event status must be represented`);
}

for (const literal of [
  "create table if not exists monitoring_source_events",
  "create table if not exists document_snapshots",
  "monitoring_source_events_source_checked_idx",
  "document_snapshots_source_captured_idx",
  "document_snapshots_source_hash_uidx",
  "raw_body bytea not null",
  "metadata_json jsonb not null",
  "recordMonitoringSourceEvent",
  "recordDocumentSnapshot",
  "findLatestDocumentSnapshotForSource",
  "listDocumentSnapshotsForSource",
  "listMonitoringSourceEventsForSource",
]) {
  assert(store.includes(literal), `${literal} must be in runtime store`);
}

console.log("Document snapshot validation passed");
