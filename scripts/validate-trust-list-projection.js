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

function assertOrdered(file, before, after, message = `${before} must appear before ${after} in ${file}`) {
  const content = read(file);
  const beforeIndex = content.indexOf(before);
  const afterIndex = content.indexOf(after);
  if (beforeIndex === -1 || afterIndex === -1 || beforeIndex > afterIndex) {
    throw new Error(message);
  }
}

assertContains("src/storage/runtime-store.ts", "trust_list_certificate_projections");
assertContains("src/storage/runtime-store.ts", "TrustListCertificateProjectionRecord");
assertContains("src/storage/runtime-store.ts", "findLatestTrustListProjection");
assertContains("src/storage/runtime-store.ts", "recordTrustListCertificateProjection");
assertContains("src/storage/runtime-store.ts", "listTrustListCertificateProjections");
assertContains("src/storage/runtime-store.ts", "extracted_certificate_id");
assertContains("src/storage/runtime-store.ts", "candidate_key");
assertContains("src/storage/runtime-store.ts", "candidate_digest");

assertContains("src/trust-lists/types.ts", "TrustListProjectionCandidate");
assertContains("src/trust-lists/types.ts", "candidateKey");
assertContains("src/trust-lists/types.ts", "candidateDigest");
assertContains("src/trust-lists/types.ts", "sourcePath");

assertContains("src/trust-lists/sync.ts", "buildCandidateKey");
assertContains("src/trust-lists/sync.ts", "buildCandidateDigest");
assertContains("src/trust-lists/sync.ts", "candidateKey");
assertContains("src/trust-lists/sync.ts", "candidateDigest");
assertContains("src/trust-lists/sync.ts", "findLatestTrustListProjection");
assertContains("src/trust-lists/sync.ts", "recordTrustListCertificateProjection");
assertContains("src/trust-lists/sync.ts", "duplicate-in-run");
assertContains("src/trust-lists/sync.ts", "unchanged");
assertContains("src/trust-lists/sync.ts", "new-fingerprint");
assertContains("src/trust-lists/sync.ts", "changed-candidate");
assertContains("src/trust-lists/sync.ts", "import-failed");
assertOrdered(
  "src/trust-lists/sync.ts",
  "validateTrustListXmlSignature(xml)",
  "const snapshot = await createTrustListSnapshot",
  "XMLDSig validation must remain before snapshot creation",
);
assertOrdered(
  "src/trust-lists/sync.ts",
  "findLatestTrustListProjection({",
  "const result = await importCertificate(",
  "latest projection lookup must happen before importCertificate in the projection loop",
);

if (fs.existsSync(path.join(process.cwd(), "src/trust-lists/admin.ts"))) {
  assertContains("src/trust-lists/admin.ts", "listTrustListCertificateProjections");
  assertContains("src/trust-lists/admin.ts", "projectionCounts");
  assertContains("src/trust-lists/admin.ts", "findTrustListCertificateProvenance");
  assertContains("src/app/admin/trust-lists/page.tsx", "skippedUnchanged");
  assertContains("src/app/admin/certificates/[certificateId]/page.tsx", "trustListProvenance");
  assertContains("src/i18n/index.ts", "trustListProvenance");
}

assertContains("scripts/validate-all.js", "validate-trust-list-projection.js");

console.log("Trust-list projection validation passed");
