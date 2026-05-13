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

function assertNotContains(file, needle, message = `${file} must not contain ${needle}`) {
  const content = read(file);
  if (content.includes(needle)) {
    throw new Error(message);
  }
}

assertContains("src/app/admin/trust-lists/trust-list-source-wizard.tsx", "preview.candidates.map");
assertContains("src/app/admin/trust-lists/trust-list-source-wizard.tsx", "candidateDecisions");
assertContains("src/app/admin/trust-lists/trust-list-source-wizard.tsx", "createAndSyncSource");
assertContains("src/app/admin/trust-lists/trust-list-source-wizard.tsx", "\"accept\"");
assertContains("src/app/admin/trust-lists/trust-list-source-wizard.tsx", "\"edit\"");
assertContains("src/app/admin/trust-lists/trust-list-source-wizard.tsx", "\"ignore\"");
assertContains("src/app/admin/trust-lists/trust-list-source-wizard.tsx", "\"reject\"");
assertContains("src/app/admin/trust-lists/trust-list-source-wizard.tsx", "\"duplicate\"");
assertContains("src/app/admin/trust-lists/trust-list-source-wizard.tsx", "\"pending\"");
assertNotContains("src/app/admin/trust-lists/trust-list-source-wizard.tsx", "name=\"reviewPayload\"");
assertNotContains("src/app/admin/trust-lists/trust-list-source-wizard.tsx", "Review payload (JSON)");

assertContains("src/app/api/admin/trust-lists/[sourceId]/sync/route.ts", "candidateDecisions");
assertContains("src/app/api/admin/trust-lists/[sourceId]/sync/route.ts", "contentType.includes(\"application/json\")");

console.log("Trust-list review UI gap validation passed");
