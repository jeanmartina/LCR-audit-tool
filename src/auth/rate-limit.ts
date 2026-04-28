import { recordRateLimitAttempt } from "../storage/runtime-store";

const counters = new Map<string, number[]>();

function prune(key: string, windowMs: number, now: number): number[] {
  const values = counters.get(key) ?? [];
  const next = values.filter((value) => now - value <= windowMs);
  counters.set(key, next);
  return next;
}

export async function assertRateLimit(key: string, limit: number, windowMs: number): Promise<void> {
  const now = Date.now();

  const persistedCount = await recordRateLimitAttempt(key, windowMs, now);
  if (persistedCount !== null) {
    if (persistedCount > limit) {
      throw new Error("rate-limit-exceeded");
    }
    return;
  }

  const current = prune(key, windowMs, now);
  if (current.length >= limit) {
    throw new Error("rate-limit-exceeded");
  }
  current.push(now);
  counters.set(key, current);
}
