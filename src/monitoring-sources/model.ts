import { createHash } from "node:crypto";
import type { MonitoringSourceType, PolicyDocumentRole } from "./types";

export function normalizeMonitoringSourceUrl(value: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    parsed.protocol = parsed.protocol.toLowerCase();
    parsed.hostname = parsed.hostname.toLowerCase();
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return trimmed;
  }
}

export function buildMonitoringSourceKey(input: {
  fingerprint: string;
  sourceType: MonitoringSourceType;
  normalizedUrl: string | null;
  documentRole: PolicyDocumentRole | null;
  policyOid: string | null;
}): string {
  const digest = createHash("sha256")
    .update(input.fingerprint)
    .update("\0")
    .update(input.sourceType)
    .update("\0")
    .update(input.normalizedUrl ?? "")
    .update("\0")
    .update(input.documentRole ?? "")
    .update("\0")
    .update(input.policyOid ?? "")
    .digest("hex");
  return `msrc-${digest.slice(0, 32)}`;
}
