import type { DerivedSourceDisplayStatus } from "./read-models";

export type DerivedOperationalState =
  | "ok"
  | "degraded"
  | "blocked"
  | "failed"
  | "not-checkable"
  | "unknown";

export function toDerivedOperationalState(
  status: DerivedSourceDisplayStatus
): DerivedOperationalState {
  if (status === "available" || status === "unchanged") {
    return "ok";
  }
  if (status === "blocked") {
    return "blocked";
  }
  if (status === "not_checkable") {
    return "not-checkable";
  }
  if (status === "unavailable" || status === "malformed" || status === "extraction_failed") {
    return "failed";
  }
  if (status === "changed" || status === "oversized") {
    return "degraded";
  }
  return "unknown";
}

export function getDerivedOperationalTone(
  state: DerivedOperationalState
): "success" | "warning" | "neutral" {
  if (state === "ok") {
    return "success";
  }
  if (state === "unknown") {
    return "neutral";
  }
  return "warning";
}

export function getDerivedOperationalLabel(state: DerivedOperationalState): string {
  return state;
}
