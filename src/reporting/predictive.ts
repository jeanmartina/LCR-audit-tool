import {
  findGroupSettingsByGroupId,
  getPlatformSettingsRecord,
  recordPredictiveEvent,
  type PredictiveEventRecord,
} from "../storage/runtime-store";

export interface PredictiveState {
  predictiveType: "upcoming-expiration" | "publication-delayed";
  severity: "warning" | "critical";
  nextUpdate: string;
  message: string;
}

export async function getEffectivePredictiveWindowDays(groupIds: string[]): Promise<number> {
  const platform = await getPlatformSettingsRecord();
  const settings = await Promise.all(groupIds.map((groupId) => findGroupSettingsByGroupId(groupId)));
  const configured = settings
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item) => item.predictiveWindowDays);
  return configured[0] ?? platform.predictiveWindowDays;
}

export async function isPredictiveMonitoringEnabled(groupIds: string[]): Promise<boolean> {
  const platform = await getPlatformSettingsRecord();
  if (!platform.predictiveEnabled) {
    return false;
  }
  const settings = await Promise.all(groupIds.map((groupId) => findGroupSettingsByGroupId(groupId)));
  const configured = settings.filter((item): item is NonNullable<typeof item> => Boolean(item));
  if (configured.length === 0) {
    return true;
  }
  return configured.some((item) => item.predictiveEnabled);
}

export function evaluatePredictiveState(
  nextUpdate: string | null,
  windowDays: number,
  now: Date = new Date()
): PredictiveState | null {
  if (!nextUpdate) {
    return null;
  }

  const expirationAt = new Date(nextUpdate);
  if (Number.isNaN(expirationAt.getTime())) {
    return null;
  }

  if (expirationAt.getTime() <= now.getTime()) {
    return {
      predictiveType: "publication-delayed",
      severity: "critical",
      nextUpdate,
      message: `Publication is delayed because nextUpdate ${nextUpdate} has already passed.`,
    };
  }

  const threshold = now.getTime() + windowDays * 24 * 60 * 60 * 1000;
  if (expirationAt.getTime() <= threshold) {
    return {
      predictiveType: "upcoming-expiration",
      severity: "warning",
      nextUpdate,
      message: `The next CRL expiration (${nextUpdate}) is within the predictive window.`,
    };
  }

  return null;
}

export async function syncPredictiveState(input: {
  certificateId: string;
  targetId: string;
  groupId: string | null;
  nextUpdate: string | null;
  windowDays: number;
}): Promise<PredictiveEventRecord | null> {
  const state = evaluatePredictiveState(input.nextUpdate, input.windowDays);
  const id = `predictive-${input.certificateId}-${input.targetId}`;

  if (!state) {
    await recordPredictiveEvent({
      id,
      certificateId: input.certificateId,
      targetId: input.targetId,
      groupId: input.groupId,
      predictiveType: "upcoming-expiration",
      severity: "warning",
      nextUpdate: input.nextUpdate,
      message: "Predictive risk cleared.",
      resolvedAt: new Date(),
    });
    return null;
  }

  return recordPredictiveEvent({
    id,
    certificateId: input.certificateId,
    targetId: input.targetId,
    groupId: input.groupId,
    predictiveType: state.predictiveType,
    severity: state.severity,
    nextUpdate: state.nextUpdate,
    message: state.message,
    resolvedAt: null,
  });
}
