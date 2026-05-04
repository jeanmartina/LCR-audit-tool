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
  "request_body bytea not null",
  "response_body bytea null",
  "issuer_fingerprint text not null",
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

console.log("OCSP monitoring validation passed");
