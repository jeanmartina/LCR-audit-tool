import {
  getLatestValidSnapshotHash,
  listPersistedCoverageGaps,
  listPersistedPollEvents,
  listPersistedSnapshotRecords,
  listPersistedValidationEvents,
  makeRuntimeId,
  recordCoverageGapEvent,
  recordPollEvent,
  recordSnapshotRecord,
  recordValidationEvent,
} from "./runtime-store";

export type PollStatus = number;

export interface PollRow {
  targetId: string;
  status: PollStatus;
  durationMs: number;
  occurredAt: Date;
  coverageLost: boolean;
  hash?: string | null;
  issuer?: string | null;
  thisUpdate?: string | null;
  nextUpdate?: string | null;
  statusLabel?: string | null;
}

export interface CoverageGap {
  startTs: Date;
  endTs: Date | null;
  targetIds: string[];
}

const polls: PollRow[] = [];
const coverageGaps: CoverageGap[] = [];

export interface SnapshotMetadata {
  targetId: string;
  hash: string | null;
  issuer: string | null;
  thisUpdate: string | null;
  nextUpdate: string | null;
  statusLabel: string | null;
  occurredAt: Date;
}

export interface ValidationEvent {
  id: string;
  targetId: string;
  occurredAt: Date;
  hash: string | null;
  issuer: string | null;
  valid: boolean;
  reason: string | null;
}

const validationEvents: ValidationEvent[] = [];

export async function recordPollResult(
  targetId: string,
  status: PollStatus,
  durationMs: number,
  hash: string | null,
  coverageLost: boolean,
  metadata?: {
    issuer?: string | null;
    thisUpdate?: string | null;
    nextUpdate?: string | null;
    statusLabel?: string | null;
  }
): Promise<void> {
  polls.push({
    targetId,
    status,
    durationMs,
    occurredAt: new Date(),
    coverageLost,
    hash,
    issuer: metadata?.issuer ?? null,
    thisUpdate: metadata?.thisUpdate ?? null,
    nextUpdate: metadata?.nextUpdate ?? null,
    statusLabel: metadata?.statusLabel ?? null,
  });

  await recordPollEvent({
    id: makeRuntimeId("poll"),
    targetId,
    status,
    durationMs,
    occurredAt: polls[polls.length - 1].occurredAt,
    coverageLost,
    hash,
    issuer: metadata?.issuer ?? null,
    thisUpdate: metadata?.thisUpdate ?? null,
    nextUpdate: metadata?.nextUpdate ?? null,
    statusLabel: metadata?.statusLabel ?? null,
  });

  if (!coverageLost) {
    await closeCoverageGap(targetId);
    return;
  }

  await openOrExtendCoverageGap(targetId);
}

export function getCoverageStatus(): {
  latestGaps: CoverageGap[];
  lastSuccessByTarget: Record<string, Date | null>;
} {
  const lastSuccessByTarget: Record<string, Date | null> = {};

  for (const row of polls) {
    if (!row.coverageLost) {
      lastSuccessByTarget[row.targetId] = row.occurredAt;
    }
  }

  return {
    latestGaps: coverageGaps,
    lastSuccessByTarget,
  };
}

export function listPollRows(targetId?: string): PollRow[] {
  const persisted = listPersistedPollEvents(targetId).map((row) => ({
    targetId: row.targetId,
    status: row.status,
    durationMs: row.durationMs,
    occurredAt: row.occurredAt,
    coverageLost: row.coverageLost,
    hash: row.hash,
    issuer: row.issuer,
    thisUpdate: row.thisUpdate,
    nextUpdate: row.nextUpdate,
    statusLabel: row.statusLabel,
  }));
  if (persisted.length > 0) {
    return persisted;
  }
  if (!targetId) {
    return [...polls];
  }
  return polls.filter((row) => row.targetId === targetId);
}

export function listSnapshotMetadata(targetId?: string): SnapshotMetadata[] {
  const persisted = listPersistedSnapshotRecords(targetId).map((row) => ({
    targetId: row.targetId,
    hash: row.hash,
    issuer: row.issuer,
    thisUpdate: row.thisUpdate,
    nextUpdate: row.nextUpdate,
    statusLabel: row.statusLabel,
    occurredAt: row.occurredAt,
  }));
  if (persisted.length > 0) {
    return persisted;
  }
  return listPollRows(targetId)
    .filter((row) => row.hash || row.issuer || row.thisUpdate || row.nextUpdate)
    .map((row) => ({
      targetId: row.targetId,
      hash: row.hash ?? null,
      issuer: row.issuer ?? null,
      thisUpdate: row.thisUpdate ?? null,
      nextUpdate: row.nextUpdate ?? null,
      statusLabel: row.statusLabel ?? null,
      occurredAt: row.occurredAt,
    }));
}

export function listValidationEvents(targetId?: string): ValidationEvent[] {
  const persisted = listPersistedValidationEvents(targetId).map((event) => ({
    id: event.id,
    targetId: event.targetId,
    occurredAt: event.occurredAt,
    hash: event.hash,
    issuer: event.issuer,
    valid: event.valid,
    reason: event.reason,
  }));
  if (persisted.length > 0) {
    return persisted;
  }

  if (!targetId) {
    return [...validationEvents];
  }
  return validationEvents.filter((event) => event.targetId === targetId);
}

export async function recordValidationResult(input: {
  targetId: string;
  hash: string | null;
  issuer: string | null;
  valid: boolean;
  reason: string | null;
}): Promise<void> {
  const event: ValidationEvent = {
    id: makeRuntimeId("validation"),
    targetId: input.targetId,
    occurredAt: new Date(),
    hash: input.hash,
    issuer: input.issuer,
    valid: input.valid,
    reason: input.reason,
  };
  validationEvents.push(event);
  await recordValidationEvent(event);
}

export async function recordSnapshotBlob(input: {
  targetId: string;
  hash: string | null;
  issuer: string | null;
  thisUpdate: string | null;
  nextUpdate: string | null;
  statusLabel: string | null;
  blob: string | null;
  valid: boolean;
}): Promise<void> {
  await recordSnapshotRecord({
    id: makeRuntimeId("snapshot"),
    targetId: input.targetId,
    hash: input.hash,
    issuer: input.issuer,
    thisUpdate: input.thisUpdate,
    nextUpdate: input.nextUpdate,
    statusLabel: input.statusLabel,
    blob: input.blob,
    valid: input.valid,
    occurredAt: new Date(),
  });
}

export function findLatestValidHash(targetId: string): string | null {
  const persisted = getLatestValidSnapshotHash(targetId);
  if (persisted) {
    return persisted;
  }

  const snapshot = [...listSnapshotMetadata(targetId)]
    .reverse()
    .find((row) => row.hash && row.statusLabel !== "invalid");
  return snapshot?.hash ?? null;
}

async function openOrExtendCoverageGap(targetId: string): Promise<void> {
  const existing = coverageGaps.find(
    (gap) => gap.endTs === null && gap.targetIds.includes(targetId)
  );

  if (existing) {
    await recordCoverageGapEvent({
      targetId,
      startTs: existing.startTs,
      endTs: existing.endTs,
    });
    return;
  }

  const gap = {
    startTs: new Date(),
    endTs: null,
    targetIds: [targetId],
  };
  coverageGaps.push(gap);
  await recordCoverageGapEvent({
    targetId,
    startTs: gap.startTs,
    endTs: gap.endTs,
  });
}

async function closeCoverageGap(targetId: string): Promise<void> {
  for (const gap of coverageGaps) {
    if (gap.endTs === null && gap.targetIds.includes(targetId)) {
      gap.endTs = new Date();
      await recordCoverageGapEvent({
        targetId,
        startTs: gap.startTs,
        endTs: gap.endTs,
      });
    }
  }
}

// Timescale schema reference (polls, coverage_gaps) with ON CONFLICT upserts:
export const SQL_SCHEMA = {
  polls: `
    create table if not exists polls (
      target_id text not null,
      status integer not null,
      duration_ms integer not null,
      occurred_at timestamptz not null,
      coverage_lost boolean not null,
      hash text null,
      issuer text null,
      this_update text null,
      next_update text null,
      status_label text null
    );
  `,
  coverageGaps: `
    create table if not exists coverage_gaps (
      start_ts timestamptz not null,
      end_ts timestamptz null,
      target_ids text[] not null,
      primary key (start_ts, target_ids)
    );

    insert into coverage_gaps (start_ts, end_ts, target_ids)
    values ($1, $2, $3)
    on conflict (start_ts, target_ids)
    do update set end_ts = excluded.end_ts;
  `,
};

export function listCoverageGaps(targetId?: string): CoverageGap[] {
  const persisted = listPersistedCoverageGaps(targetId).map((gap) => ({
    startTs: gap.startTs,
    endTs: gap.endTs,
    targetIds: [gap.targetId],
  }));
  if (persisted.length > 0) {
    return persisted;
  }
  if (!targetId) {
    return [...coverageGaps];
  }
  return coverageGaps.filter((gap) => gap.targetIds.includes(targetId));
}
