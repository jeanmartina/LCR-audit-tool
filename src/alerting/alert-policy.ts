export type AlertSeverity = "warning" | "critical";

import {
  listPersistedAlertEvents,
  makeRuntimeId,
  recordAlertEventRow,
  updateAlertDeliveryState,
} from "../storage/runtime-store";

export interface AlertEvent {
  id: string;
  targetId: string;
  severity: AlertSeverity;
  sentAt: Date;
  recipients: string[];
  resolvedAt: Date | null;
  deliveryState: "pending" | "sent" | "failed";
}

const WARNING_COOLDOWN_MS = 30 * 60 * 1000;
const CRITICAL_COOLDOWN_MS = 10 * 60 * 1000;
const alertEvents: AlertEvent[] = [];

export function shouldSendAlert(
  severity: AlertSeverity,
  lastSentAt: Date | null
): boolean {
  if (!lastSentAt) {
    return true;
  }

  const cooldown = severity === "critical" ? CRITICAL_COOLDOWN_MS : WARNING_COOLDOWN_MS;
  return Date.now() - lastSentAt.getTime() >= cooldown;
}

export function classifySeverity(
  coverageLostDurationMs: number,
  errorBudgetUsed: number,
  thresholds: { warningBudget: number; warningDurationMs: number },
  validationFailed: boolean
): AlertSeverity | null {
  if (validationFailed) {
    return "critical";
  }

  if (coverageLostDurationMs > 0) {
    return "critical";
  }

  const warningByBudget = errorBudgetUsed >= thresholds.warningBudget;
  const warningByTime = coverageLostDurationMs >= thresholds.warningDurationMs;

  if (warningByBudget || warningByTime) {
    return "warning";
  }

  return null;
}

export function recordAlertEvent(event: AlertEvent): void {
  alertEvents.push(event);
}

export function listAlertEvents(targetId?: string): AlertEvent[] {
  const persisted = listPersistedAlertEvents(targetId).map((event) => ({
    id: event.id,
    targetId: event.targetId,
    severity: event.severity,
    sentAt: event.sentAt,
    recipients: event.recipients,
    resolvedAt: event.resolvedAt,
    deliveryState: event.deliveryState,
  }));

  if (persisted.length > 0) {
    return persisted;
  }

  if (!targetId) {
    return [...alertEvents];
  }
  return alertEvents.filter((event) => event.targetId === targetId);
}

export async function persistAlertEvent(
  targetId: string,
  severity: AlertSeverity,
  recipients: string[]
): Promise<AlertEvent> {
  const event: AlertEvent = {
    id: makeRuntimeId("alert"),
    targetId,
    severity,
    sentAt: new Date(),
    recipients,
    resolvedAt: null,
    deliveryState: "pending",
  };

  alertEvents.push(event);
  await recordAlertEventRow(event);
  return event;
}

export async function markAlertDelivery(
  alertId: string,
  deliveryState: AlertEvent["deliveryState"]
): Promise<void> {
  const event = alertEvents.find((item) => item.id === alertId);
  if (event) {
    event.deliveryState = deliveryState;
  }

  await updateAlertDeliveryState(alertId, deliveryState);
}
