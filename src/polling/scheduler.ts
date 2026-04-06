import { loadTargets, Target } from "../inventory/targets";
import { recordPollResult } from "../storage/coverage-records";

const lastCheckAtById = new Map<string, number>();

function isDue(target: Target, now: number): boolean {
  const last = lastCheckAtById.get(target.id) ?? 0;
  return now - last >= target.intervalSeconds * 1000;
}

function buildHeartbeatUrl(targetId: string): string {
  // Uses infra/healthchecks-config.yml heartbeat_url template with {{target_id}} placeholder.
  return `https://hc.example.com/ping/${targetId}`;
}

async function fetchWithTimeout(url: string, timeoutSeconds: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
  try {
    return await fetch(url, { method: "GET", signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function runScheduledPolls(): Promise<void> {
  const now = Date.now();
  const targets = loadTargets().filter((t) => t.enabled);

  for (const target of targets.filter((t) => isDue(t, now))) {
    const start = Date.now();
    let status = 0;
    let coverageLost = false;

    try {
      const response = await fetchWithTimeout(target.url, target.timeoutSeconds);
      status = response.status;
      coverageLost = response.status !== 200;
    } catch {
      coverageLost = true;
    }

    const duration = Date.now() - start;
    await recordPollResult(target.id, status, duration, null, coverageLost);

    if (!coverageLost) {
      const heartbeatUrl = buildHeartbeatUrl(target.id);
      // In production, this would be an HTTP POST to Healthchecks.
      void fetch(heartbeatUrl, { method: "POST" });
    }

    lastCheckAtById.set(target.id, Date.now());
  }
}
