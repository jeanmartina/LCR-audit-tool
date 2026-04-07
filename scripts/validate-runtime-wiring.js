const fs = require("fs");

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function assertIncludes(content, fragment, message) {
  if (!content.includes(fragment)) {
    throw new Error(message);
  }
}

function validateInventory() {
  const targets = read("src/inventory/targets.ts");
  const admin = read("src/inventory/target-admin.ts");
  const store = read("src/storage/runtime-store.ts");

  assertIncludes(targets, "loadTargetRecords", "Inventory must load targets from runtime store");
  assertIncludes(targets, "persistTarget", "Inventory must support persisted target writes");
  assertIncludes(admin, "upsertRuntimeTarget", "Missing operator write path");
  assertIncludes(store, "runtime_targets", "Missing database-backed target schema");
  assertIncludes(store, "new Pool", "Runtime store must use Postgres pool");
  console.log("Runtime inventory ready");
}

function validateScheduler() {
  const scheduler = read("src/polling/scheduler.ts");

  assertIncludes(scheduler, "validateLcr", "Scheduler must invoke validation");
  assertIncludes(scheduler, "persistAlertEvent", "Scheduler must persist alert events");
  assertIncludes(scheduler, "recordSnapshotBlob", "Scheduler must persist snapshot evidence");
  assertIncludes(scheduler, "recordValidationResult", "Scheduler must persist validation events");
  console.log("Runtime scheduler wiring ready");
}

function validatePersistence() {
  const store = read("src/storage/runtime-store.ts");
  const records = read("src/storage/coverage-records.ts");
  const alerts = read("src/alerting/alert-policy.ts");

  assertIncludes(store, "poll_events", "Missing durable poll event schema");
  assertIncludes(store, "validation_events", "Missing durable validation event schema");
  assertIncludes(store, "alert_events", "Missing durable alert event schema");
  assertIncludes(store, "snapshot_records", "Missing durable snapshot schema");
  assertIncludes(records, "listValidationEvents", "Missing runtime read contracts");
  assertIncludes(alerts, "updateAlertDeliveryState", "Missing persisted delivery state updates");
  console.log("Runtime persistence ready");
}

const mode = process.argv[2];

if (mode === "inventory") {
  validateInventory();
} else if (mode === "scheduler") {
  validateScheduler();
} else if (mode === "persistence") {
  validatePersistence();
} else {
  throw new Error(`Unknown validation mode: ${mode}`);
}
