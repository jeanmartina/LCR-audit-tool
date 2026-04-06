const fs = require("fs");

const file = "src/polling/scheduler.ts";
const content = fs.readFileSync(file, "utf8");

const hasExport = content.includes("export async function runScheduledPolls()");
const hasRecordCall = content.includes("recordPollResult(");
const hasTimeout = content.includes("timeoutSeconds");

if (!hasExport || !hasRecordCall || !hasTimeout) {
  console.error("Scheduler not ready");
  process.exit(1);
}

console.log("Scheduler polls ready");
