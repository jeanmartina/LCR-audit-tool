import { buildDetailEvidence, ReportFilters } from "./read-models";

export type TimelineEventType =
  | "poll"
  | "alert"
  | "validation"
  | "expiration"
  | "recovery"
  | "coverage-gap";

export interface TimelineEvent {
  type: TimelineEventType;
  at: Date;
  title: string;
  detail: string;
}

export function buildAuditTimeline(
  targetId: string,
  filters: ReportFilters = {}
): Promise<TimelineEvent[]> {
  return buildDetailEvidence(targetId, filters).then((detail) => {
    if (!detail) {
      return [];
    }

    const pollEvents: TimelineEvent[] = detail.pollHistory.map((poll) => ({
      type: poll.coverageLost ? "poll" : "recovery",
      at: poll.occurredAt,
      title: poll.coverageLost ? "Poll failed" : "Poll succeeded",
      detail: `HTTP ${poll.httpStatus} in ${poll.durationMs}ms${poll.timedOut ? " (timeout)" : ""}`,
    }));

    const alertEvents: TimelineEvent[] = detail.alertHistory.map((alert) => ({
      type: "alert",
      at: alert.sentAt,
      title: `${alert.severity} alert sent`,
      detail: `Recipients: ${alert.recipients.join(", ") || "none"}`,
    }));

    const validationEvents: TimelineEvent[] = detail.validationFailures.map((failure) => ({
      type: "validation",
      at: failure.occurredAt,
      title: "Validation failure",
      detail: failure.reason,
    }));

    const coverageEvents: TimelineEvent[] = detail.coverageWindows.map((window) => ({
      type: "coverage-gap",
      at: window.startTs,
      title: "Coverage gap opened",
      detail: `Ended: ${window.endTs?.toISOString() ?? "open"}; duration ${window.durationMs}ms`,
    }));

    const expirationEvents: TimelineEvent[] = detail.snapshots
      .filter((snapshot) => snapshot.nextUpdate)
      .map((snapshot) => ({
        type: "expiration",
        at: new Date(snapshot.nextUpdate as string),
        title: "LCR expiration",
        detail: `Hash ${snapshot.hash ?? "unknown"}`,
      }));

    return [
      ...pollEvents,
      ...alertEvents,
      ...validationEvents,
      ...coverageEvents,
      ...expirationEvents,
    ]
      .filter((event) => !filters.eventType || event.type === filters.eventType)
      .sort((left, right) => left.at.getTime() - right.at.getTime());
  });
}
