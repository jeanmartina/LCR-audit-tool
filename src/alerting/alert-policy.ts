export type AlertSeverity = "warning" | "critical";

const WARNING_COOLDOWN_MS = 30 * 60 * 1000;
const CRITICAL_COOLDOWN_MS = 10 * 60 * 1000;

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
