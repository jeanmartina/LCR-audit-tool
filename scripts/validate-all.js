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
  ["node", ["scripts/validate-reporting.js", "pdf-bytes"]],
  ["node", ["scripts/validate-reporting.js", "pdf-routes"]],
  ["node", ["scripts/validate-reporting.js", "pdf-audit"]],
];

for (const [bin, args] of commands) {
  execFileSync(bin, args, { stdio: "inherit" });
}

console.log("All project validations passed");
