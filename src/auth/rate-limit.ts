const counters = new Map<string, number[]>();

function prune(key: string, windowMs: number, now: number): number[] {
  const values = counters.get(key) ?? [];
  const next = values.filter((value) => now - value <= windowMs);
  counters.set(key, next);
  return next;
}

export function assertRateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const current = prune(key, windowMs, now);
  if (current.length >= limit) {
    throw new Error("rate-limit-exceeded");
  }
  current.push(now);
  counters.set(key, current);
}
