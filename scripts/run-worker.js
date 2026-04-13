const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const LOOP_INTERVAL_MS = Number(process.env.WORKER_LOOP_INTERVAL_MS ?? 60000);

function loadSchedulerModule() {
  const sourcePath = path.join(process.cwd(), "src/polling/scheduler.ts");
  const outputDir = path.join(process.cwd(), ".tmp", "worker");
  const outputPath = path.join(outputDir, "scheduler.cjs");
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

async function main() {
  const scheduler = loadSchedulerModule();
  const runScheduledPolls = scheduler.runScheduledPolls;

  if (typeof runScheduledPolls !== "function") {
    throw new Error("runScheduledPolls export is required");
  }

  let stopped = false;
  const stop = () => {
    stopped = true;
  };

  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  while (!stopped) {
    try {
      await runScheduledPolls();
    } catch (error) {
      const message = error instanceof Error ? error.stack ?? error.message : String(error);
      console.error(`[worker] poll cycle failed: ${message}`);
    }

    if (stopped) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, LOOP_INTERVAL_MS));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
