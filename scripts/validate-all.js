const { execFileSync } = require("child_process");

const commands = [
  ["node", ["scripts/validate-inventory.js"]],
  ["node", ["scripts/validate-scheduler.js"]],
  ["node", ["scripts/validate-storage.js"]],
  ["node", ["scripts/validate-runtime-wiring.js", "inventory"]],
  ["node", ["scripts/validate-runtime-wiring.js", "scheduler"]],
  ["node", ["scripts/validate-runtime-wiring.js", "persistence"]],
  ["node", ["scripts/validate-reporting.js", "read-models"]],
  ["node", ["scripts/validate-reporting.js", "dashboard"]],
  ["node", ["scripts/validate-reporting.js", "detail"]],
  ["node", ["scripts/validate-reporting.js", "settings"]],
  ["node", ["scripts/validate-reporting.js", "pdf-bytes"]],
  ["node", ["scripts/validate-reporting.js", "pdf-routes"]],
  ["node", ["scripts/validate-reporting.js", "pdf-audit"]],
  ["node", ["scripts/validate-auth-foundation.js", "schema"]],
  ["node", ["scripts/validate-auth-foundation.js", "auth"]],
  ["node", ["scripts/validate-auth-foundation.js", "permissions"]],
  ["node", ["scripts/validate-onboarding-admin.js", "schema"]],
  ["node", ["scripts/validate-onboarding-admin.js", "import"]],
  ["node", ["scripts/validate-onboarding-admin.js", "ui"]],
  ["node", ["scripts/validate-batch-runtime.js", "runtime"]],
  ["node", ["scripts/validate-batch-runtime.js", "proof"]],
  ["node", ["scripts/validate-first-run-onboarding.js"]],
  ["node", ["scripts/validate-ui-guidance.js"]],
  ["node", ["scripts/validate-i18n.js", "foundation"]],
  ["node", ["scripts/validate-i18n.js", "ui"]],
  ["node", ["scripts/validate-i18n.js", "exports"]],
  ["node", ["scripts/validate-packaging.js", "artifacts"]],
  ["node", ["scripts/validate-packaging.js", "compose"]],
  ["node", ["scripts/validate-packaging.js", "docs"]],
];

for (const [bin, args] of commands) {
  execFileSync(bin, args, { stdio: "inherit" });
}

console.log("All project validations passed");
