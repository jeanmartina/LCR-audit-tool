export type TargetType = "lcr" | "certificate";

export interface Target {
  id: string;
  slug: string;
  url: string;
  type: TargetType;
  intervalSeconds: number;
  timeoutSeconds: number;
  alertEmail?: string;
  enabled: boolean;
}

const DEFAULT_INTERVAL_SECONDS = 600; // 10 minutes default when unspecified
const DEFAULT_TIMEOUT_SECONDS = 5;

const DEFAULT_TARGETS: Target[] = [];

export function normalizeTarget(target: Partial<Target>): Target {
  const intervalSeconds = target.intervalSeconds ?? DEFAULT_INTERVAL_SECONDS;
  const timeoutSeconds = target.timeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS;

  if (!target.id || !target.slug || !target.url || !target.type) {
    throw new Error("Target must include id, slug, url, and type");
  }

  return {
    id: target.id,
    slug: target.slug,
    url: target.url,
    type: target.type,
    intervalSeconds,
    timeoutSeconds,
    alertEmail: target.alertEmail,
    enabled: target.enabled ?? true,
  };
}

export function loadTargets(): Target[] {
  // Placeholder loader until the inventory UI/config storage is implemented.
  return DEFAULT_TARGETS.map((t) => normalizeTarget(t));
}

export function upsertTarget(targets: Target[], target: Partial<Target>): Target[] {
  const normalized = normalizeTarget(target);
  const index = targets.findIndex((t) => t.id === normalized.id);
  if (index === -1) {
    return [...targets, normalized];
  }

  const updated = targets.slice();
  updated[index] = normalized;
  return updated;
}
