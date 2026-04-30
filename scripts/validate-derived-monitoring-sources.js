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

const derivePath = "src/monitoring-sources/derive.ts";
const packageJsonPath = "package.json";
assert(fs.existsSync(derivePath), "monitoring source derive module must exist");
const derive = read(derivePath);
const packageJson = read(packageJsonPath);
for (const literal of [
  "deriveMonitoringSourceCandidatesFromCertificate",
  "aia-ocsp",
  "certificate-policies-cps-uri",
  "aia-ocsp-missing",
  "policy-document-url-missing",
  "certificate-extension-parse-failed",
]) {
  assert(derive.includes(literal), `${literal} must be in monitoring source derivation`);
}
for (const forbidden of ["fetch(", "http.request", "https.request"]) {
  assert(!derive.includes(forbidden), `${forbidden} must not be used in monitoring source derivation`);
}
assert(
  packageJson.includes("@peculiar/x509") || packageJson.includes("pkijs"),
  "package.json must include a selected X.509/ASN.1 dependency"
);

console.log("Derived monitoring source validation passed");
