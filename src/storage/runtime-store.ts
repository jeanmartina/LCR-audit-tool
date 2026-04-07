import { Pool } from "pg";

export interface TargetRecord {
  id: string;
  slug: string;
  url: string;
  type: "lcr" | "certificate";
  interval_seconds: number;
  timeout_seconds: number;
  alert_email: string | null;
  issuer: string | null;
  owner: string | null;
  criticality: "low" | "medium" | "high";
  source: string;
  retention_polls_days: number;
  retention_alerts_days: number;
  retention_coverage_gaps_days: number;
  enabled: boolean;
}

export interface PersistedPollEvent {
  id: string;
  targetId: string;
  status: number;
  durationMs: number;
  occurredAt: Date;
  coverageLost: boolean;
  hash: string | null;
  issuer: string | null;
  thisUpdate: string | null;
  nextUpdate: string | null;
  statusLabel: string | null;
}

export interface PersistedCoverageGap {
  targetId: string;
  startTs: Date;
  endTs: Date | null;
}

export interface PersistedValidationEvent {
  id: string;
  targetId: string;
  occurredAt: Date;
  hash: string | null;
  issuer: string | null;
  valid: boolean;
  reason: string | null;
}

export interface PersistedAlertEvent {
  id: string;
  targetId: string;
  severity: "warning" | "critical";
  sentAt: Date;
  recipients: string[];
  resolvedAt: Date | null;
  deliveryState: "pending" | "sent" | "failed";
}

export interface PersistedSnapshotRecord {
  id: string;
  targetId: string;
  hash: string | null;
  issuer: string | null;
  thisUpdate: string | null;
  nextUpdate: string | null;
  statusLabel: string | null;
  blob: string | null;
  valid: boolean;
  occurredAt: Date;
}

const cache = {
  targets: [] as TargetRecord[],
  polls: [] as PersistedPollEvent[],
  coverageGaps: [] as PersistedCoverageGap[],
  validations: [] as PersistedValidationEvent[],
  alerts: [] as PersistedAlertEvent[],
  snapshots: [] as PersistedSnapshotRecord[],
};

let pool: Pool | null = null;

type TargetRow = TargetRecord;
type PollEventRow = {
  id: string;
  target_id: string;
  status: number;
  duration_ms: number;
  occurred_at: Date;
  coverage_lost: boolean;
  hash: string | null;
  issuer: string | null;
  this_update: string | null;
  next_update: string | null;
  status_label: string | null;
};
type CoverageGapRow = {
  target_id: string;
  start_ts: Date;
  end_ts: Date | null;
};
type ValidationEventRow = {
  id: string;
  target_id: string;
  occurred_at: Date;
  hash: string | null;
  issuer: string | null;
  valid: boolean;
  reason: string | null;
};
type AlertEventRow = {
  id: string;
  target_id: string;
  severity: "warning" | "critical";
  sent_at: Date;
  recipients: string[];
  resolved_at: Date | null;
  delivery_state: "pending" | "sent" | "failed";
};
type SnapshotRecordRow = {
  id: string;
  target_id: string;
  hash: string | null;
  issuer: string | null;
  this_update: string | null;
  next_update: string | null;
  status_label: string | null;
  blob: string | null;
  valid: boolean;
  occurred_at: Date;
};

function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for database-backed runtime store");
  }

  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  return pool;
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function upsertInCache<T extends { id: string }>(items: T[], next: T): T[] {
  const index = items.findIndex((item) => item.id === next.id);
  if (index === -1) {
    return [...items, next];
  }

  const updated = items.slice();
  updated[index] = next;
  return updated;
}

export const RUNTIME_SQL_SCHEMA = {
  targets: `
    create table if not exists runtime_targets (
      id text primary key,
      slug text not null,
      url text not null,
      type text not null,
      interval_seconds integer not null,
      timeout_seconds integer not null,
      alert_email text null,
      issuer text null,
      owner text null,
      criticality text not null,
      source text not null,
      retention_polls_days integer not null,
      retention_alerts_days integer not null,
      retention_coverage_gaps_days integer not null,
      enabled boolean not null
    );
  `,
  events: `
    create table if not exists poll_events (
      id text primary key,
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

    create table if not exists validation_events (
      id text primary key,
      target_id text not null,
      occurred_at timestamptz not null,
      hash text null,
      issuer text null,
      valid boolean not null,
      reason text null
    );

    create table if not exists alert_events (
      id text primary key,
      target_id text not null,
      severity text not null,
      sent_at timestamptz not null,
      recipients text[] not null,
      resolved_at timestamptz null,
      delivery_state text not null
    );

    create table if not exists snapshot_records (
      id text primary key,
      target_id text not null,
      hash text null,
      issuer text null,
      this_update text null,
      next_update text null,
      status_label text null,
      blob text null,
      valid boolean not null,
      occurred_at timestamptz not null
    );

    create table if not exists coverage_gaps (
      target_id text not null,
      start_ts timestamptz not null,
      end_ts timestamptz null,
      primary key (target_id, start_ts)
    );
  `,
};

export async function initializeRuntimeStoreSchema(): Promise<void> {
  if (!hasDatabase()) {
    throw new Error("DATABASE_URL is required to initialize the runtime schema");
  }

  const client = await getPool().connect();
  try {
    await client.query("begin");
    await client.query(RUNTIME_SQL_SCHEMA.targets);
    await client.query(RUNTIME_SQL_SCHEMA.events);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function reloadRuntimeStoreCache(): Promise<void> {
  if (!hasDatabase()) {
    return;
  }

  const currentPool = getPool();
  const [targets, polls, coverageGaps, validations, alerts, snapshots] = await Promise.all([
    currentPool.query<TargetRow>(
      `
        select
          id,
          slug,
          url,
          type,
          interval_seconds,
          timeout_seconds,
          alert_email,
          issuer,
          owner,
          criticality,
          source,
          retention_polls_days,
          retention_alerts_days,
          retention_coverage_gaps_days,
          enabled
        from runtime_targets
        order by slug asc
      `
    ),
    currentPool.query<PollEventRow>(
      `
        select
          id,
          target_id,
          status,
          duration_ms,
          occurred_at,
          coverage_lost,
          hash,
          issuer,
          this_update,
          next_update,
          status_label
        from poll_events
        order by occurred_at asc
      `
    ),
    currentPool.query<CoverageGapRow>(
      `
        select target_id, start_ts, end_ts
        from coverage_gaps
        order by start_ts asc
      `
    ),
    currentPool.query<ValidationEventRow>(
      `
        select id, target_id, occurred_at, hash, issuer, valid, reason
        from validation_events
        order by occurred_at asc
      `
    ),
    currentPool.query<AlertEventRow>(
      `
        select id, target_id, severity, sent_at, recipients, resolved_at, delivery_state
        from alert_events
        order by sent_at asc
      `
    ),
    currentPool.query<SnapshotRecordRow>(
      `
        select
          id,
          target_id,
          hash,
          issuer,
          this_update,
          next_update,
          status_label,
          blob,
          valid,
          occurred_at
        from snapshot_records
        order by occurred_at asc
      `
    ),
  ]);

  cache.targets = [...targets.rows];
  cache.polls = polls.rows.map((row) => ({
    id: row.id,
    targetId: row.target_id,
    status: row.status,
    durationMs: row.duration_ms,
    occurredAt: new Date(row.occurred_at),
    coverageLost: row.coverage_lost,
    hash: row.hash,
    issuer: row.issuer,
    thisUpdate: row.this_update,
    nextUpdate: row.next_update,
    statusLabel: row.status_label,
  }));
  cache.coverageGaps = coverageGaps.rows.map((row) => ({
    targetId: row.target_id,
    startTs: new Date(row.start_ts),
    endTs: row.end_ts ? new Date(row.end_ts) : null,
  }));
  cache.validations = validations.rows.map((row) => ({
    id: row.id,
    targetId: row.target_id,
    occurredAt: new Date(row.occurred_at),
    hash: row.hash,
    issuer: row.issuer,
    valid: row.valid,
    reason: row.reason,
  }));
  cache.alerts = alerts.rows.map((row) => ({
    id: row.id,
    targetId: row.target_id,
    severity: row.severity,
    sentAt: new Date(row.sent_at),
    recipients: row.recipients,
    resolvedAt: row.resolved_at ? new Date(row.resolved_at) : null,
    deliveryState: row.delivery_state,
  }));
  cache.snapshots = snapshots.rows.map((row) => ({
    id: row.id,
    targetId: row.target_id,
    hash: row.hash,
    issuer: row.issuer,
    thisUpdate: row.this_update,
    nextUpdate: row.next_update,
    statusLabel: row.status_label,
    blob: row.blob,
    valid: row.valid,
    occurredAt: new Date(row.occurred_at),
  }));
}

export async function closeRuntimeStore(): Promise<void> {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = null;
}

export async function upsertTargetRecord(record: TargetRecord): Promise<void> {
  cache.targets = upsertInCache(cache.targets, record);

  if (!hasDatabase()) {
    return;
  }

  await getPool().query(
    `
      insert into runtime_targets (
        id, slug, url, type, interval_seconds, timeout_seconds, alert_email,
        issuer, owner, criticality, source, retention_polls_days,
        retention_alerts_days, retention_coverage_gaps_days, enabled
      ) values (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14, $15
      )
      on conflict (id) do update set
        slug = excluded.slug,
        url = excluded.url,
        type = excluded.type,
        interval_seconds = excluded.interval_seconds,
        timeout_seconds = excluded.timeout_seconds,
        alert_email = excluded.alert_email,
        issuer = excluded.issuer,
        owner = excluded.owner,
        criticality = excluded.criticality,
        source = excluded.source,
        retention_polls_days = excluded.retention_polls_days,
        retention_alerts_days = excluded.retention_alerts_days,
        retention_coverage_gaps_days = excluded.retention_coverage_gaps_days,
        enabled = excluded.enabled
    `,
    [
      record.id,
      record.slug,
      record.url,
      record.type,
      record.interval_seconds,
      record.timeout_seconds,
      record.alert_email,
      record.issuer,
      record.owner,
      record.criticality,
      record.source,
      record.retention_polls_days,
      record.retention_alerts_days,
      record.retention_coverage_gaps_days,
      record.enabled,
    ]
  );
}

export async function loadTargetRecords(): Promise<TargetRecord[]> {
  if (!hasDatabase()) {
    return [...cache.targets];
  }

  const result = await getPool().query<TargetRecord>(
    `
      select
        id,
        slug,
        url,
        type,
        interval_seconds,
        timeout_seconds,
        alert_email,
        issuer,
        owner,
        criticality,
        source,
        retention_polls_days,
        retention_alerts_days,
        retention_coverage_gaps_days,
        enabled
      from runtime_targets
      order by slug asc
    `
  );

  cache.targets = result.rows;
  return [...cache.targets];
}

export async function recordPollEvent(event: PersistedPollEvent): Promise<void> {
  cache.polls = upsertInCache(cache.polls, event);

  if (!hasDatabase()) {
    return;
  }

  await getPool().query(
    `
      insert into poll_events (
        id, target_id, status, duration_ms, occurred_at, coverage_lost,
        hash, issuer, this_update, next_update, status_label
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      on conflict (id) do nothing
    `,
    [
      event.id,
      event.targetId,
      event.status,
      event.durationMs,
      event.occurredAt,
      event.coverageLost,
      event.hash,
      event.issuer,
      event.thisUpdate,
      event.nextUpdate,
      event.statusLabel,
    ]
  );
}

export async function recordCoverageGapEvent(gap: PersistedCoverageGap): Promise<void> {
  const existing = cache.coverageGaps.find(
    (item) => item.targetId === gap.targetId && item.startTs.getTime() === gap.startTs.getTime()
  );
  if (existing) {
    existing.endTs = gap.endTs;
  } else {
    cache.coverageGaps.push(gap);
  }

  if (!hasDatabase()) {
    return;
  }

  await getPool().query(
    `
      insert into coverage_gaps (target_id, start_ts, end_ts)
      values ($1, $2, $3)
      on conflict (target_id, start_ts)
      do update set end_ts = excluded.end_ts
    `,
    [gap.targetId, gap.startTs, gap.endTs]
  );
}

export async function recordValidationEvent(event: PersistedValidationEvent): Promise<void> {
  cache.validations = upsertInCache(cache.validations, event);

  if (!hasDatabase()) {
    return;
  }

  await getPool().query(
    `
      insert into validation_events (
        id, target_id, occurred_at, hash, issuer, valid, reason
      ) values ($1, $2, $3, $4, $5, $6, $7)
      on conflict (id) do nothing
    `,
    [event.id, event.targetId, event.occurredAt, event.hash, event.issuer, event.valid, event.reason]
  );
}

export async function recordAlertEventRow(event: PersistedAlertEvent): Promise<void> {
  cache.alerts = upsertInCache(cache.alerts, event);

  if (!hasDatabase()) {
    return;
  }

  await getPool().query(
    `
      insert into alert_events (
        id, target_id, severity, sent_at, recipients, resolved_at, delivery_state
      ) values ($1, $2, $3, $4, $5, $6, $7)
      on conflict (id) do nothing
    `,
    [event.id, event.targetId, event.severity, event.sentAt, event.recipients, event.resolvedAt, event.deliveryState]
  );
}

export async function updateAlertDeliveryState(
  alertId: string,
  deliveryState: PersistedAlertEvent["deliveryState"]
): Promise<void> {
  cache.alerts = cache.alerts.map((event) =>
    event.id === alertId ? { ...event, deliveryState } : event
  );

  if (!hasDatabase()) {
    return;
  }

  await getPool().query(
    `update alert_events set delivery_state = $2 where id = $1`,
    [alertId, deliveryState]
  );
}

export async function recordSnapshotRecord(snapshot: PersistedSnapshotRecord): Promise<void> {
  cache.snapshots = upsertInCache(cache.snapshots, snapshot);

  if (!hasDatabase()) {
    return;
  }

  await getPool().query(
    `
      insert into snapshot_records (
        id, target_id, hash, issuer, this_update, next_update, status_label, blob, valid, occurred_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      on conflict (id) do nothing
    `,
    [
      snapshot.id,
      snapshot.targetId,
      snapshot.hash,
      snapshot.issuer,
      snapshot.thisUpdate,
      snapshot.nextUpdate,
      snapshot.statusLabel,
      snapshot.blob,
      snapshot.valid,
      snapshot.occurredAt,
    ]
  );
}

export function listPersistedPollEvents(targetId?: string): PersistedPollEvent[] {
  return cache.polls.filter((item) => !targetId || item.targetId === targetId);
}

export function listPersistedCoverageGaps(targetId?: string): PersistedCoverageGap[] {
  return cache.coverageGaps.filter((item) => !targetId || item.targetId === targetId);
}

export function listPersistedValidationEvents(targetId?: string): PersistedValidationEvent[] {
  return cache.validations.filter((item) => !targetId || item.targetId === targetId);
}

export function listPersistedAlertEvents(targetId?: string): PersistedAlertEvent[] {
  return cache.alerts.filter((item) => !targetId || item.targetId === targetId);
}

export function listPersistedSnapshotRecords(targetId?: string): PersistedSnapshotRecord[] {
  return cache.snapshots.filter((item) => !targetId || item.targetId === targetId);
}

export function getLatestValidSnapshotHash(targetId: string): string | null {
  const snapshot = [...cache.snapshots]
    .reverse()
    .find((item) => item.targetId === targetId && item.valid && item.hash);
  return snapshot?.hash ?? null;
}

export function makeRuntimeId(prefix: string): string {
  return makeId(prefix);
}
