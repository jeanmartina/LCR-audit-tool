const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const LOOP_INTERVAL_MS = Number(process.env.WORKER_LOOP_INTERVAL_MS ?? 60000);

function registerTypeScriptRuntime() {
  require.extensions[".ts"] = function compileTypeScript(module, filename) {
    const source = fs.readFileSync(filename, "utf8");
    const compiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
      },
      fileName: filename,
    });
    module._compile(compiled.outputText, filename);
  };
}

function loadWorkerModules() {
  registerTypeScriptRuntime();
  return {
    scheduler: require(path.join(process.cwd(), "src/polling/scheduler.ts")),
    trustLists: require(path.join(process.cwd(), "src/trust-lists/sync.ts")),
  };
}

async function main() {
  const { scheduler, trustLists } = loadWorkerModules();
  const runScheduledPolls = scheduler.runScheduledPolls;
  const syncEnabledTrustListSources = trustLists.syncEnabledTrustListSources;

  if (typeof runScheduledPolls !== "function") {
    throw new Error("runScheduledPolls export is required");
  }
  if (typeof syncEnabledTrustListSources !== "function") {
    throw new Error("syncEnabledTrustListSources export is required");
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

    try {
      await syncEnabledTrustListSources();
    } catch (error) {
      const message = error instanceof Error ? error.stack ?? error.message : String(error);
      console.error(`[worker] trust-list sync cycle failed: ${message}`);
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
