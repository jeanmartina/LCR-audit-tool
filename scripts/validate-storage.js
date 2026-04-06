const fs = require("fs");

const file = "src/storage/coverage-records.ts";
const content = fs.readFileSync(file, "utf8");

const hasPolls = content.includes("create table if not exists polls");
const hasCoverage = content.includes("create table if not exists coverage_gaps");
const hasOnConflict = content.includes("on conflict (start_ts, target_ids)");

if (!hasPolls || !hasCoverage || !hasOnConflict) {
  console.error("Coverage schema invalid");
  process.exit(1);
}

console.log("Coverage schema ready");
