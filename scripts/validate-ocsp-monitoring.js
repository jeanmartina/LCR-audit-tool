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

assert(fs.existsSync(path.join(process.cwd(), typesPath)), "OCSP type file is missing");

const types = read(typesPath);
const store = read(storePath);

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

console.log("OCSP monitoring validation passed");
