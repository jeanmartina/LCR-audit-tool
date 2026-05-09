const fs = require("fs");

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function assertIncludes(content, fragment, message) {
  if (!content.includes(fragment)) {
    throw new Error(`${message} (missing: ${fragment})`);
  }
}

function assertExists(path) {
  if (!fs.existsSync(path)) {
    throw new Error(`Missing file: ${path}`);
  }
}

const mode = process.argv[2];

if (mode === "artifacts") {
  ["Dockerfile", ".dockerignore", "compose.yaml", "Caddyfile", ".env.example", "README.md", "docs/operators.md"].forEach(assertExists);
  console.log("Packaging artifacts ready");
  process.exit(0);
}

if (mode === "compose") {
  const compose = read("compose.yaml");
  const caddy = read("Caddyfile");
  const executivePage = read("src/app/reporting/executive/page.tsx");
  const executivePdfRoute = read("src/app/reporting/export/executive.pdf/route.ts");

  assertIncludes(compose, "web:", "Compose is missing web service");
  assertIncludes(compose, "worker:", "Compose is missing worker service");
  assertIncludes(compose, "postgres:", "Compose is missing postgres service");
  assertIncludes(compose, "caddy:", "Compose is missing caddy service");
  assertIncludes(compose, "DATABASE_URL: postgresql://", "Compose is missing internal DATABASE_URL wiring");
  assertIncludes(compose, 'command: ["npm", "run", "start:worker"]', "Worker command is missing");
  assertIncludes(caddy, "reverse_proxy web:3000", "Caddy is not proxying to web");
  assertIncludes(caddy, "Content-Security-Policy", "Caddy is missing CSP header");
  assertIncludes(caddy, "X-Content-Type-Options", "Caddy is missing nosniff header");
  assertIncludes(caddy, "X-Frame-Options", "Caddy is missing frame protection header");
  assertIncludes(compose, "CERT_IMPORT_MAX_ARCHIVE_BYTES", "Compose is missing certificate archive limit env");
  assertIncludes(compose, "TRUST_LIST_MAX_XML_BYTES", "Compose is missing trust-list XML limit env");
  assertIncludes(compose, "OCSP_FETCH_TIMEOUT_MS", "Compose is missing OCSP fetch timeout env");
  assertIncludes(compose, "OCSP_MAX_RESPONSE_BYTES", "Compose is missing OCSP response size env");
  assertIncludes(compose, "OCSP_MAX_REDIRECTS", "Compose is missing OCSP redirect limit env");
  assertIncludes(compose, "OCSP_CHECK_INTERVAL_SECONDS", "Compose is missing OCSP interval env");
  assertIncludes(compose, "OCSP_ALLOW_LOCALHOST", "Compose is missing OCSP localhost opt-in env");
  assertIncludes(executivePage, "/reporting/export/executive.pdf", "Executive packaged route is missing PDF export linkage");
  assertIncludes(executivePdfRoute, "application/pdf", "Executive packaged export route is missing PDF response");
  console.log("Packaging compose topology ready");
  process.exit(0);
}

if (mode === "docs") {
  const readme = read("README.md");
  const operators = read("docs/operators.md");
  const googleProof = read("docs/google-public-proof.md");
  const archivedProofTemplatePath =
    ".planning/phases/15-public-https-oauth-oidc-proof-and-callback-validation/15-PROOF-REPORT-TEMPLATE.md";
  const proofTemplate = fs.existsSync(archivedProofTemplatePath)
    ? read(archivedProofTemplatePath)
    : googleProof;

  assertIncludes(readme, "## Quick start", "README is missing quick start");
  assertIncludes(readme, "## Environment variables", "README is missing environment matrix");
  assertIncludes(readme, "docs/operators.md", "README does not reference operator guide");
  assertIncludes(readme, "## Executive summary in the packaged stack", "README is missing the executive summary packaged section");
  assertIncludes(readme, "## Batch certificate import in the packaged stack", "README is missing packaged batch import contract");
  assertIncludes(readme, "## Packaged batch-import proof path", "README is missing packaged batch-import proof path");
  assertIncludes(readme, "## Google public-host proof kit", "README is missing the Google proof kit section");
  assertIncludes(readme, "## Phase 26 runtime limits and closure boundary", "README is missing the Phase 26 closure section");
  assertIncludes(readme, "future AI-assisted PKI policy analysis", "README is missing the Phase 26 future-AI boundary");
  assertIncludes(readme, "OCSP_FETCH_TIMEOUT_MS", "README is missing OCSP env documentation");
  assertIncludes(operators, "## Service responsibilities", "Operator guide is missing service responsibilities");
  assertIncludes(operators, "## Local HTTPS mode", "Operator guide is missing local HTTPS guidance");
  assertIncludes(operators, "## Real-domain mode", "Operator guide is missing real-domain guidance");
  assertIncludes(operators, "## Batch import contract", "Operator guide is missing batch import contract");
  assertIncludes(operators, "## Executive summary in the packaged stack", "Operator guide is missing executive summary guidance");
  assertIncludes(operators, "### Executive packaged smoke path", "Operator guide is missing the executive packaged smoke path");
  assertIncludes(operators, "## Packaged batch-import proof procedure", "Operator guide is missing batch proof procedure");
  assertIncludes(operators, "## Google public-host proof checklist", "Operator guide is missing the Google proof checklist");
  assertIncludes(operators, "## Phase 26 operations, configuration, and proof closure", "Operator guide is missing the Phase 26 closure section");
  assertIncludes(operators, "### Validation and proof closure", "Operator guide is missing Phase 26 validation guidance");
  assertIncludes(operators, "future AI-assisted PKI policy analysis", "Operator guide is missing the future AI boundary");
  assertIncludes(googleProof, "# Google Public-Host Proof Runbook", "Google proof runbook is missing");
  assertIncludes(googleProof, "## Step 6: Execute the Google sign-in flow", "Google proof runbook is missing the sign-in step");
  const hasProofHeader =
    proofTemplate.includes("# Phase 15 Google Proof Report Template") ||
    proofTemplate.includes("# Phase 15 Google Proof Report") ||
    proofTemplate.includes("# Google Public-Host Proof Runbook");
  if (!hasProofHeader) {
    throw new Error("Google proof report artifact is missing the expected Phase 15 heading");
  }
  console.log("Packaging documentation ready");
  process.exit(0);
}

throw new Error("Usage: node scripts/validate-packaging.js <artifacts|compose|docs>");
