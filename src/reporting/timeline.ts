import { buildDetailEvidence, ReportFilters } from "./read-models";

export type TimelineEventType =
  | "poll"
  | "alert"
  | "validation"
  | "expiration"
  | "recovery"
  | "coverage-gap"
  | "predictive";

export interface TimelineEvent {
  type: TimelineEventType;
  at: Date;
  title: string;
  detail: string;
}

export async function buildAuditTimeline(
  certificateId: string,
  filters: ReportFilters = {}
): Promise<TimelineEvent[]> {
  return buildDetailEvidence(certificateId, filters).then((detail) => {
    if (!detail) {
      return [];
    }

    const pollEvents: TimelineEvent[] = detail.pollHistory.map((poll) => ({
      type: poll.coverageLost ? "recovery" : "poll",
      at: poll.occurredAt,
      title: `${poll.targetLabel} HTTP ${poll.httpStatus}`,
      detail: `Coverage lost=${String(poll.coverageLost)}; duration ${poll.durationMs}ms; hash ${poll.hash ?? "-"}`,
    }));

    const alertEvents: TimelineEvent[] = detail.alertHistory.map((alert) => ({
      type: "alert",
      at: alert.sentAt,
      title: `${alert.severity} alert sent`,
      detail: `${alert.targetLabel}; recipients ${alert.recipients.join(", ") || "none"}; delivery ${alert.deliveryState}`,
    }));

    const validationEvents: TimelineEvent[] = detail.validationFailures.map((failure) => ({
      type: "validation",
      at: failure.occurredAt,
      title: `${failure.targetLabel} validation failure`,
      detail: `Reason ${failure.reason}; hash ${failure.hash ?? "-"}`,
    }));

    const coverageEvents: TimelineEvent[] = detail.coverageWindows.map((window) => ({
      type: "coverage-gap",
      at: window.startTs,
      title: `${window.targetLabel} coverage gap opened`,
      detail: `Ended ${window.endTs?.toISOString() ?? "open"}; duration ${window.durationMs}ms`,
    }));

    const expirationEvents: TimelineEvent[] = detail.snapshots
      .filter((snapshot) => snapshot.nextUpdate)
      .map((snapshot) => ({
        type: "expiration",
        at: new Date(snapshot.nextUpdate as string),
        title: `${snapshot.targetLabel} CRL expiration`,
        detail: `Hash ${snapshot.hash ?? "unknown"}`,
      }));

    const predictiveEvents: TimelineEvent[] = detail.predictiveEvents.map((event) => ({
      type: "predictive",
      at: event.resolvedAt ?? event.createdAt,
      title: `${event.severity} ${event.predictiveType}`,
      detail: event.message,
    }));

    return [
      ...pollEvents,
      ...alertEvents,
      ...validationEvents,
      ...coverageEvents,
      ...expirationEvents,
      ...predictiveEvents,
    ]
      .filter((event) => !filters.eventType || event.type === filters.eventType)
      .sort((left, right) => left.at.getTime() - right.at.getTime());
  });
}
