const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const { Pool } = require("pg");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function loadRuntimeStoreModule() {
  const sourcePath = path.join(process.cwd(), "src/storage/runtime-store.ts");
  const outputDir = path.join(process.cwd(), ".tmp", "runtime-smoke");
  const outputPath = path.join(outputDir, "runtime-store.cjs");
  const source = fs.readFileSync(sourcePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: sourcePath,
  });

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, compiled.outputText);
  return require(outputPath);
}

async function cleanup(pool, targetId) {
  await pool.query("delete from alert_events where target_id = $1", [targetId]);
  await pool.query("delete from validation_events where target_id = $1", [targetId]);
  await pool.query("delete from snapshot_records where target_id = $1", [targetId]);
  await pool.query("delete from coverage_gaps where target_id = $1", [targetId]);
  await pool.query("delete from poll_events where target_id = $1", [targetId]);
  await pool.query("delete from runtime_targets where id = $1", [targetId]);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for runtime smoke");
  }

  const runtimeStore = loadRuntimeStoreModule();
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const targetId = `smoke-${suffix}`;
  const occurredAt = new Date("2026-04-07T12:00:00.000Z");

  try {
    await runtimeStore.initializeRuntimeStoreSchema();

    await runtimeStore.upsertTargetRecord({
      id: targetId,
      slug: `smoke-${suffix}`,
      url: "https://example.invalid/lcr",
      type: "lcr",
      interval_seconds: 600,
      timeout_seconds: 5,
      alert_email: "ops@example.com",
      issuer: "CN=Smoke Issuer",
      owner: "platform",
      criticality: "high",
      source: "smoke",
      retention_polls_days: 180,
      retention_alerts_days: 180,
      retention_coverage_gaps_days: 180,
      enabled: true,
    });

    await runtimeStore.recordPollEvent({
      id: runtimeStore.makeRuntimeId("poll"),
      targetId,
      status: 200,
      durationMs: 321,
      occurredAt,
      coverageLost: false,
      hash: "hash-smoke",
      issuer: "CN=Smoke Issuer",
      thisUpdate: "2026-04-07T12:00:00.000Z",
      nextUpdate: "2026-04-08T12:00:00.000Z",
      statusLabel: "valid",
    });
    await runtimeStore.recordValidationEvent({
      id: runtimeStore.makeRuntimeId("validation"),
      targetId,
      occurredAt,
      hash: "hash-smoke",
      issuer: "CN=Smoke Issuer",
      valid: true,
      reason: null,
    });
    await runtimeStore.recordAlertEventRow({
      id: runtimeStore.makeRuntimeId("alert"),
      targetId,
      severity: "warning",
      sentAt: occurredAt,
      recipients: ["ops@example.com"],
      resolvedAt: null,
      deliveryState: "pending",
    });
    await runtimeStore.recordSnapshotRecord({
      id: runtimeStore.makeRuntimeId("snapshot"),
      targetId,
      hash: "hash-smoke",
      issuer: "CN=Smoke Issuer",
      thisUpdate: "2026-04-07T12:00:00.000Z",
      nextUpdate: "2026-04-08T12:00:00.000Z",
      statusLabel: "valid",
      blob: "ZHVtbXk=",
      valid: true,
      occurredAt,
    });
    await runtimeStore.recordCoverageGapEvent({
      targetId,
      startTs: occurredAt,
      endTs: new Date("2026-04-07T12:10:00.000Z"),
    });

    await runtimeStore.reloadRuntimeStoreCache();

    const targets = await runtimeStore.loadTargetRecords();
    const polls = runtimeStore.listPersistedPollEvents(targetId);
    const validations = runtimeStore.listPersistedValidationEvents(targetId);
    const alerts = runtimeStore.listPersistedAlertEvents(targetId);
    const snapshots = runtimeStore.listPersistedSnapshotRecords(targetId);
    const gaps = runtimeStore.listPersistedCoverageGaps(targetId);

    assert(targets.some((target) => target.id === targetId), "Target record was not persisted");
    assert(polls.length === 1 && polls[0].status === 200, "Poll event was not reloaded from Postgres");
    assert(validations.length === 1 && validations[0].valid === true, "Validation event was not reloaded from Postgres");
    assert(alerts.length === 1 && alerts[0].deliveryState === "pending", "Alert event was not reloaded from Postgres");
    assert(snapshots.length === 1 && snapshots[0].hash === "hash-smoke", "Snapshot record was not reloaded from Postgres");
    assert(gaps.length === 1 && gaps[0].endTs !== null, "Coverage gap was not reloaded from Postgres");

    console.log("Runtime smoke passed against Postgres");
  } finally {
    try {
      await cleanup(pool, targetId);
    } finally {
      await pool.end();
      await runtimeStore.closeRuntimeStore();
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
