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

const typesPath = "src/monitoring-sources/ocsp-types.ts";
const storePath = "src/storage/runtime-store.ts";
const ocspPath = "src/monitoring-sources/ocsp.ts";
const fetchSafetyPath = "src/monitoring-sources/fetch-safety.ts";
const packageJsonPath = "package.json";
const workerPath = "src/monitoring-sources/worker.ts";
const runWorkerPath = "scripts/run-worker.js";
const envExamplePath = ".env.example";
const composePath = "compose.yaml";
const operatorsPath = "docs/operators.md";
const readmePath = "README.md";
const proofPath = ".planning/phases/24-ocsp-technical-evidence-monitoring/24-PROOF.md";

assert(fs.existsSync(path.join(process.cwd(), typesPath)), "OCSP type file is missing");

const types = read(typesPath);
const store = read(storePath);
const fetchSafety = read(fetchSafetyPath);
const packageJson = read(packageJsonPath);

for (const requirement of ["OCSP-01", "OCSP-02", "OCSP-03", "OCSP-04"]) {
  assert(requirement.startsWith("OCSP-"), `${requirement} requirement marker is malformed`);
}

for (const literal of [
  "export type OcspCheckEventStatus",
  "export type OcspParseStatus",
  "export interface OcspCheckEventRecord",
  "export interface OcspResponseEvidenceRecord",
  "requestBodyBase64",
  "responseBodyBase64",
]) {
  assert(types.includes(literal), `OCSP types must include ${literal}`);
}

for (const status of [
  "available",
  "unavailable",
  "blocked",
  "oversized",
  "malformed",
  "not_checkable",
]) {
  assert(types.includes(`"${status}"`), `OCSP event status ${status} is missing`);
}

for (const forbidden of ['"good"', '"revoked"', '"unknown"']) {
  assert(!types.includes(forbidden), `OCSP event types must not include semantic status ${forbidden}`);
}

for (const literal of [
  "ocsp_check_events",
  "ocsp_response_evidence",
  "request_body",
  "response_body",
  "request_sha256",
  "response_sha256",
  "request_body bytea not null",
  "response_body bytea null",
  "issuer_fingerprint text not null",
  "metadata_json",
  "recordOcspCheckEvent",
  "recordOcspResponseEvidence",
  "listOcspCheckEventsForSource",
  "listOcspResponseEvidenceForSource",
]) {
  assert(store.includes(literal), `runtime store must include ${literal}`);
}

assert(packageJson.includes('"pkijs"'), "package.json must include pkijs");
assert(packageJson.includes('"asn1js"'), "package.json must include asn1js");
assert(!packageJson.includes('"ocsp"'), "package.json must not include ocsp");
assert(!packageJson.includes('"node-forge"'), "package.json must not include node-forge");
assert(fs.existsSync(path.join(process.cwd(), ocspPath)), "OCSP service file is missing");

const ocsp = read(ocspPath);
for (const literal of [
  "checkOcspSource",
  "buildOcspRequestDer",
  'hashAlgorithm: "SHA-256"',
  "issuer-certificate-not-found",
  "source-not-ocsp",
  "ocsp-source-not-discovered",
  "application/ocsp-request",
  "application/ocsp-response",
  "recordOcspResponseEvidence",
  "recordOcspCheckEvent",
  "malformed",
]) {
  assert(ocsp.includes(literal), `OCSP service must include ${literal}`);
}

for (const forbidden of ['status: "good"', 'status: "revoked"', 'status: "unknown"']) {
  assert(!ocsp.includes(forbidden), `OCSP service must not include semantic status ${forbidden}`);
}

for (const literal of [
  "getOcspFetchTimeoutMs",
  "getOcspMaxResponseBytes",
  "OCSP_MAX_REDIRECTS",
  "OCSP_ALLOW_LOCALHOST",
  "fetchOcspResponseBytes",
  "application/ocsp-request",
  "application/ocsp-response",
  "ocsp-response-too-large",
]) {
  assert(fetchSafety.includes(literal), `fetch safety must include ${literal}`);
}

const worker = read(workerPath);
for (const literal of [
  "runScheduledOcspSourceChecks",
  "OCSP_CHECK_INTERVAL_SECONDS",
  "lastOcspCheckAtBySourceId",
  'source.sourceType === "ocsp"',
  "checkOcspSource",
  "[worker] ocsp source check failed:",
]) {
  assert(worker.includes(literal), `worker must include ${literal}`);
}
assert(
  !worker.includes('source.sourceType === "policy-document" && source.sourceType === "ocsp"'),
  "worker must not combine policy-document and ocsp filters impossibly"
);

const runWorker = read(runWorkerPath);
for (const literal of [
  "runScheduledOcspSourceChecks",
  "runScheduledOcspSourceChecks export is required",
  "await runScheduledOcspSourceChecks();",
  "[worker] ocsp source cycle failed:",
]) {
  assert(runWorker.includes(literal), `run-worker must include ${literal}`);
}

const envExample = read(envExamplePath);
const compose = read(composePath);
for (const key of [
  "OCSP_FETCH_TIMEOUT_MS",
  "OCSP_MAX_RESPONSE_BYTES",
  "OCSP_MAX_REDIRECTS",
  "OCSP_CHECK_INTERVAL_SECONDS",
  "OCSP_ALLOW_LOCALHOST",
]) {
  assert(envExample.includes(key), `.env.example must include ${key}`);
  assert(compose.includes(key), `compose.yaml must include ${key}`);
}

const operators = read(operatorsPath);
const readme = read(readmePath);
assert(
  operators.includes("## OCSP technical monitoring limits"),
  "operators documentation must include OCSP limits"
);
assert(
  operators.includes("not treated as compliance health"),
  "operators documentation must explain semantic boundary"
);

for (const literal of [
  "## OCSP technical monitoring",
  "real OCSP requests",
  "not_checkable",
  "does not perform full semantic OCSP validation",
  "not compliance health labels",
]) {
  assert(readme.includes(literal), `README.md must include ${literal}`);
}

const validateAll = read("scripts/validate-all.js");
const validateAllHits = validateAll.match(/validate-ocsp-monitoring\.js/g) ?? [];
assert(validateAllHits.length === 1, "validate-ocsp-monitoring.js exactly once in validate-all");

if (fs.existsSync(path.join(process.cwd(), proofPath))) {
  const proof = read(proofPath);
  for (const literal of [
    "OCSP-01",
    "OCSP-04",
    "node scripts/validate-ocsp-monitoring.js",
    "node scripts/validate-all.js",
    "npm run typecheck",
    "npm run build",
  ]) {
    assert(proof.includes(literal), `Phase proof must include ${literal}`);
  }
}

console.log("OCSP monitoring validation passed");
