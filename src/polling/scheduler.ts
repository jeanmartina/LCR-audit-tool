import { createHash } from "node:crypto";

import { classifySeverity, markAlertDelivery, persistAlertEvent } from "../alerting/alert-policy";
import { loadTargets, Target } from "../inventory/targets";
import {
  findLatestValidHash,
  recordPollResult,
  recordSnapshotBlob,
  recordValidationResult,
} from "../storage/coverage-records";
import { toValidationStatusLabel, validateLcr } from "../validation/lcr-validator";

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

function hashBody(body: string): string {
  return createHash("sha256").update(body).digest("hex");
}

async function deliverAlert(alertId: string): Promise<void> {
  try {
    await markAlertDelivery(alertId, "sent");
  } catch {
    await markAlertDelivery(alertId, "failed");
  }
}

export async function runScheduledPolls(): Promise<void> {
  const now = Date.now();
  const targets = (await loadTargets()).filter((t) => t.enabled);

  for (const target of targets.filter((t) => isDue(t, now))) {
    const start = Date.now();
    let status = 0;
    let coverageLost = false;
    let body: string | null = null;
    let signature: string | null = null;
    let hash: string | null = null;
    let statusLabel: string | null = null;

    try {
      const response = await fetchWithTimeout(target.url, target.timeoutSeconds);
      status = response.status;
      coverageLost = response.status !== 200;
      signature = response.headers.get("x-signature");
      if (!coverageLost) {
        body = await response.text();
        hash = hashBody(body);
      }
    } catch {
      coverageLost = true;
    }

    const latestValidHash = findLatestValidHash(target.id);
    const validation = validateLcr(signature, hash, target.issuer ?? null);
    statusLabel = toValidationStatusLabel(validation);
    await recordValidationResult({
      targetId: target.id,
      hash,
      issuer: target.issuer ?? null,
      valid: validation.valid,
      reason: validation.reason ?? null,
    });

    if (!validation.valid) {
      coverageLost = true;
    }

    const duration = Date.now() - start;
    await recordPollResult(target.id, status, duration, hash, coverageLost, {
      issuer: target.issuer ?? null,
      thisUpdate: new Date().toISOString(),
      nextUpdate: null,
      statusLabel,
    });

    if (!validation.valid || hash !== latestValidHash) {
      await recordSnapshotBlob({
        targetId: target.id,
        hash,
        issuer: target.issuer ?? null,
        thisUpdate: new Date().toISOString(),
        nextUpdate: null,
        statusLabel,
        blob: body,
        valid: validation.valid,
      });
    }

    if (coverageLost) {
      const severity =
        classifySeverity(duration, 1, { warningBudget: 0.5, warningDurationMs: 10 * 60 * 1000 }, !validation.valid) ??
        "critical";
      const event = await persistAlertEvent(
        target.id,
        severity,
        target.alertEmail ? [target.alertEmail] : []
      );
      await deliverAlert(event.id);
    }

    if (!coverageLost) {
      const heartbeatUrl = buildHeartbeatUrl(target.id);
      // In production, this would be an HTTP POST to Healthchecks.
      void fetch(heartbeatUrl, { method: "POST" });
    }

    lastCheckAtById.set(target.id, Date.now());
  }
}
