const fs = require("fs");

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function assertIncludes(content, needle, message) {
  if (!content.includes(needle)) {
    throw new Error(`${message} (missing: ${needle})`);
  }
}

const mode = process.argv[2];
const certificateAdmin = read("src/inventory/certificate-admin.ts");
const runtimeStore = read("src/storage/runtime-store.ts");
const readme = read("README.md");
const operators = read("docs/operators.md");

if (mode === "runtime") {
  assertIncludes(certificateAdmin, "unzipSync", "Missing in-process zip extraction");
  assertIncludes(certificateAdmin, 'invalid-zip-archive', "Missing archive-level zip error");
  assertIncludes(certificateAdmin, 'archiveReadable: false', "Missing archive-level unreadable summary");
  assertIncludes(certificateAdmin, 'archiveReadable: true', "Missing readable-archive summary");
  assertIncludes(runtimeStore, 'status: "running" | "completed" | "failed"', "Missing failed import run status");
  console.log("Batch runtime hardening ready");
  process.exit(0);
}

if (mode === "proof") {
  assertIncludes(readme, "## Packaged batch-import proof path", "Missing README packaged proof path");
  assertIncludes(operators, "## Packaged batch-import proof procedure", "Missing operator packaged proof path");
  assertIncludes(readme, ".pem`, `.crt`, and `.cer`", "Missing README supported file list");
  assertIncludes(operators, ".pem`, `.crt`, `.cer`", "Missing operator supported file list");
  console.log("Batch packaged proof contract ready");
  process.exit(0);
}

throw new Error("Usage: node scripts/validate-batch-runtime.js <runtime|proof>");
