const fs = require("fs");

const file = "src/inventory/targets.ts";
const content = fs.readFileSync(file, "utf8");

const hasInterface = /interface\s+Target\s*\{[\s\S]*id:\s*string;[\s\S]*slug:\s*string;[\s\S]*url:\s*string;[\s\S]*intervalSeconds:\s*number;[\s\S]*timeoutSeconds:\s*number;[\s\S]*alertEmail\?:\s*string;[\s\S]*enabled:\s*boolean;[\s\S]*\}/.test(
  content
);
const hasDefault = content.includes("DEFAULT_INTERVAL_SECONDS = 600");

if (!hasInterface || !hasDefault) {
  console.error("Inventory schema invalid");
  process.exit(1);
}

console.log("Inventory schema valid");
