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

const typesPath = "src/monitoring-sources/types.ts";
const modelPath = "src/monitoring-sources/model.ts";
const storePath = "src/storage/runtime-store.ts";

assert(fs.existsSync(typesPath), "monitoring source types must exist");
assert(fs.existsSync(modelPath), "monitoring source model must exist");

const types = read(typesPath);
const model = read(modelPath);
const store = read(storePath);

for (const literal of ["MonitoringSourceType", "MonitoringSourceState", "PolicyDocumentRole"]) {
  assert(types.includes(literal), `${literal} must be exported`);
}
for (const state of ["discovered", "not_discovered", "not_checkable", "disabled"]) {
  assert(types.includes(`"${state}"`) || store.includes(`'${state}'`), `${state} state must be represented`);
}
for (const literal of ["normalizeMonitoringSourceUrl", "buildMonitoringSourceKey", "createHash(\"sha256\")"]) {
  assert(model.includes(literal), `${literal} must be in monitoring source model`);
}
for (const literal of [
  "create table if not exists monitoring_sources",
  "monitoring_sources_source_key_uidx",
  "source_key text not null unique",
  "trust_list_source_id",
  "trust_list_snapshot_id",
  "trust_list_run_id",
  "upsertMonitoringSourceRecord",
  "listMonitoringSourceRecords",
  "listMonitoringSourcesForCertificate",
  "findMonitoringSourceByKey",
]) {
  assert(store.includes(literal), `${literal} must be in runtime store`);
}

console.log("Derived monitoring source validation passed");
