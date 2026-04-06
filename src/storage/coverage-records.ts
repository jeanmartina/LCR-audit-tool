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

  if (!coverageLost) {
    closeCoverageGap(targetId);
    return;
  }

  openOrExtendCoverageGap(targetId);
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

function openOrExtendCoverageGap(targetId: string): void {
  const existing = coverageGaps.find(
    (gap) => gap.endTs === null && gap.targetIds.includes(targetId)
  );

  if (existing) {
    return;
  }

  coverageGaps.push({
    startTs: new Date(),
    endTs: null,
    targetIds: [targetId],
  });
}

function closeCoverageGap(targetId: string): void {
  for (const gap of coverageGaps) {
    if (gap.endTs === null && gap.targetIds.includes(targetId)) {
      gap.endTs = new Date();
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
