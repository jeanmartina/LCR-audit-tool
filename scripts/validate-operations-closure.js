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

function assertIncludes(content, fragment, message) {
  if (!content.includes(fragment)) {
    throw new Error(`${message} (missing: ${fragment})`);
  }
}

function sliceSection(content, startMarker, endMarker) {
  const start = content.indexOf(startMarker);
  assert(start >= 0, `Missing section start: ${startMarker}`);
  const end = endMarker ? content.indexOf(endMarker, start + startMarker.length) : -1;
  return end >= 0 ? content.slice(start, end) : content.slice(start);
}

const phaseDir = ".planning/phases/26-operations-configuration-and-proof-closure";
const proofPath = `${phaseDir}/26-PROOF.md`;
const verificationPath = `${phaseDir}/26-VERIFICATION.md`;

for (const filePath of [
  ".env.example",
  "compose.yaml",
  "README.md",
  "docs/operators.md",
  "scripts/validate-all.js",
  proofPath,
  verificationPath,
]) {
  assert(fs.existsSync(filePath), `Missing file: ${filePath}`);
}

const envExample = read(".env.example");
const compose = read("compose.yaml");
const readme = read("README.md");
const operators = read("docs/operators.md");
const validateAll = read("scripts/validate-all.js");
const proof = read(proofPath);
const verification = read(verificationPath);

const webBlock = sliceSection(compose, "  web:", "\n\n  worker:");
const workerBlock = sliceSection(compose, "  worker:", "\n\n  postgres:");

for (const [sectionName, sectionContent, requiredFragments] of [
  [
    "web",
    webBlock,
    [
      "MONITORING_SOURCE_FETCH_TIMEOUT_MS: ${MONITORING_SOURCE_FETCH_TIMEOUT_MS:-30000}",
      "MONITORING_SOURCE_MAX_DOCUMENT_BYTES: ${MONITORING_SOURCE_MAX_DOCUMENT_BYTES:-5242880}",
      "MONITORING_SOURCE_MAX_EXTRACTED_TEXT_BYTES: ${MONITORING_SOURCE_MAX_EXTRACTED_TEXT_BYTES:-200000}",
      "MONITORING_SOURCE_MAX_REDIRECTS: ${MONITORING_SOURCE_MAX_REDIRECTS:-3}",
      "MONITORING_SOURCE_ALLOW_LOCALHOST: ${MONITORING_SOURCE_ALLOW_LOCALHOST:-false}",
      "OCSP_FETCH_TIMEOUT_MS: ${OCSP_FETCH_TIMEOUT_MS:-30000}",
      "OCSP_MAX_RESPONSE_BYTES: ${OCSP_MAX_RESPONSE_BYTES:-1048576}",
      "OCSP_MAX_REDIRECTS: ${OCSP_MAX_REDIRECTS:-3}",
      "OCSP_ALLOW_LOCALHOST: ${OCSP_ALLOW_LOCALHOST:-false}",
    ],
  ],
  [
    "worker",
    workerBlock,
    [
      "MONITORING_SOURCE_FETCH_TIMEOUT_MS: ${MONITORING_SOURCE_FETCH_TIMEOUT_MS:-30000}",
      "MONITORING_SOURCE_MAX_DOCUMENT_BYTES: ${MONITORING_SOURCE_MAX_DOCUMENT_BYTES:-5242880}",
      "MONITORING_SOURCE_MAX_EXTRACTED_TEXT_BYTES: ${MONITORING_SOURCE_MAX_EXTRACTED_TEXT_BYTES:-200000}",
      "MONITORING_SOURCE_MAX_REDIRECTS: ${MONITORING_SOURCE_MAX_REDIRECTS:-3}",
      "MONITORING_SOURCE_DOCUMENT_INTERVAL_SECONDS: ${MONITORING_SOURCE_DOCUMENT_INTERVAL_SECONDS:-3600}",
      "MONITORING_SOURCE_ALLOW_LOCALHOST: ${MONITORING_SOURCE_ALLOW_LOCALHOST:-false}",
      "OCSP_FETCH_TIMEOUT_MS: ${OCSP_FETCH_TIMEOUT_MS:-30000}",
      "OCSP_MAX_RESPONSE_BYTES: ${OCSP_MAX_RESPONSE_BYTES:-1048576}",
      "OCSP_MAX_REDIRECTS: ${OCSP_MAX_REDIRECTS:-3}",
      "OCSP_CHECK_INTERVAL_SECONDS: ${OCSP_CHECK_INTERVAL_SECONDS:-3600}",
      "OCSP_ALLOW_LOCALHOST: ${OCSP_ALLOW_LOCALHOST:-false}",
    ],
  ],
]) {
  for (const fragment of requiredFragments) {
    assertIncludes(sectionContent, fragment, `${sectionName} compose section is missing ${fragment}`);
  }
}

for (const fragment of [
  "MONITORING_SOURCE_FETCH_TIMEOUT_MS=30000",
  "MONITORING_SOURCE_MAX_DOCUMENT_BYTES=5242880",
  "MONITORING_SOURCE_MAX_EXTRACTED_TEXT_BYTES=200000",
  "MONITORING_SOURCE_MAX_REDIRECTS=3",
  "MONITORING_SOURCE_DOCUMENT_INTERVAL_SECONDS=3600",
  "MONITORING_SOURCE_ALLOW_LOCALHOST=false",
  "OCSP_FETCH_TIMEOUT_MS=30000",
  "OCSP_MAX_RESPONSE_BYTES=1048576",
  "OCSP_MAX_REDIRECTS=3",
  "OCSP_CHECK_INTERVAL_SECONDS=3600",
  "OCSP_ALLOW_LOCALHOST=false",
]) {
  assertIncludes(envExample, fragment, `.env.example is missing ${fragment}`);
}

for (const fragment of [
  "## Phase 26 runtime limits and closure boundary",
  "future AI-assisted PKI policy analysis",
  "MONITORING_SOURCE_ALLOW_LOCALHOST=false",
  "OCSP_ALLOW_LOCALHOST=false",
]) {
  assertIncludes(readme, fragment, `README.md is missing ${fragment}`);
}

for (const fragment of [
  "## Phase 26 operations, configuration, and proof closure",
  "### Canonical runtime limits",
  "### Health-state interpretation",
  "### Safety and retention boundary",
  "### Validation and proof closure",
  "future AI-assisted PKI policy analysis",
  "node scripts/validate-operations-closure.js",
  "npm run typecheck",
  "npm run build",
]) {
  assertIncludes(operators, fragment, `docs/operators.md is missing ${fragment}`);
}

for (const fragment of [
  "validate-operations-closure.js",
  "scripts/validate-packaging.js",
]) {
  assertIncludes(validateAll, fragment, `scripts/validate-all.js is missing ${fragment}`);
}

for (const fragment of [
  "## Requirement Checklist",
  "OPS-07",
  "OPS-08",
  "future AI-assisted PKI policy analysis",
  "node scripts/validate-operations-closure.js",
  "node scripts/validate-packaging.js compose",
  "node scripts/validate-packaging.js docs",
  "node scripts/validate-all.js",
  "npm run typecheck",
  "npm run build",
]) {
  assertIncludes(proof, fragment, `Phase 26 proof is missing ${fragment}`);
}

for (const fragment of [
  "## Result",
  "## Commands Run",
  "## Coverage",
  "## Scope Boundary",
  "node scripts/validate-operations-closure.js",
  "node scripts/validate-all.js",
  "npm run typecheck",
  "npm run build",
]) {
  assertIncludes(verification, fragment, `Phase 26 verification is missing ${fragment}`);
}

console.log("Phase 26 closure validation passed");
