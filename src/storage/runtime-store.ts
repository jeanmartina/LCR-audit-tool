import { Pool } from "pg";
import { buildMonitoringSourceKey } from "../monitoring-sources/model";
import type {
  MonitoringSourceProvenanceInput,
  MonitoringSourceRecord,
  MonitoringSourceState,
  MonitoringSourceType,
  PolicyDocumentRole,
} from "../monitoring-sources/types";
import type {
  DocumentExtractionStatus,
  DocumentSnapshotRecord,
  MonitoringSourceEventRecord,
  MonitoringSourceEventStatus,
} from "../monitoring-sources/document-types";
import type {
  OcspCheckEventRecord,
  OcspCheckEventStatus,
  OcspParseStatus,
  OcspResponseEvidenceRecord,
} from "../monitoring-sources/ocsp-types";

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

export interface AuthAccountRecord {
  id: string;
  userId: string;
  provider: "credentials" | "google" | "entra-id" | "oidc";
  providerAccountId: string;
  providerEmail: string;
  linkedAt: Date;
}

export interface AuthTransactionRecord {
  id: string;
  state: string;
  provider: "google" | "entra-id" | "oidc";
  inviteCode: string;
  expectedEmail: string;
  displayName: string | null;
  preferredLocale: string;
  nonce: string;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
}

export interface ProviderVerificationStatusRecord {
  provider: "google" | "entra-id" | "oidc";
  configured: boolean;
  verified: boolean;
  verifiedAt: Date | null;
  verifiedByUserId: string | null;
  notes: string | null;
  updatedAt: Date;
}

export interface ProviderRuntimeOverrideRecord {
  provider: "google" | "entra-id" | "oidc";
  enabled: boolean;
  updatedByUserId: string | null;
  updatedAt: Date;
}

export interface UserRecord {
  id: string;
  email: string;
  displayName: string | null;
  passwordHash: string | null;
  platformRole: "platform-admin" | null;
  preferredLocale: string;
  preferredTheme: "light" | "dark";
  createdAt: Date;
  updatedAt: Date;
  accounts: AuthAccountRecord[];
}

export interface AuthSessionRecord {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  lastSeenAt: Date;
  revokedAt: Date | null;
}

export interface GroupRecord {
  id: string;
  name: string;
  slug: string;
  createdByUserId: string;
  createdAt: Date;
}

export interface GroupSettingsRecord {
  groupId: string;
  defaultTrustSource: string | null;
  defaultPki: string | null;
  defaultJurisdiction: string | null;
  predictiveEnabled: boolean;
  predictiveWindowDays: number;
  updatedAt: Date;
}

export interface GroupMembershipRecord {
  id: string;
  userId: string;
  groupId: string;
  role: "viewer" | "operator" | "group-admin";
  createdAt: Date;
}

export interface GroupInviteRecord {
  id: string;
  code: string;
  email: string;
  groupId: string;
  role: "viewer" | "operator" | "group-admin";
  status: "pending" | "accepted" | "revoked";
  expiresAt: Date;
  invitedByUserId: string;
  acceptedByUserId: string | null;
  createdAt: Date;
}

export interface PasswordResetRecord {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
}

export interface MfaMethodRecord {
  id: string;
  userId: string;
  type: "totp";
  label: string;
  enabled: boolean;
  createdAt: Date;
}

export interface AuditEventRecord {
  id: string;
  actorUserId: string | null;
  targetUserId: string | null;
  targetEmail: string | null;
  groupId: string | null;
  eventType: string;
  details: Record<string, unknown>;
  occurredAt: Date;
}

export interface TargetGroupShareRecord {
  id: string;
  targetId: string;
  groupId: string;
  createdAt: Date;
}

export interface CertificateRecord {
  id: string;
  fingerprint: string;
  displayName: string;
  pemText: string;
  tags: string[];
  trustSource: string | null;
  pki: string | null;
  jurisdiction: string | null;
  status: "active" | "disabled";
  sourceType: "single" | "zip" | "template" | "trust-list";
  createdByUserId: string;
  templateId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CertificateImportRunRecord {
  id: string;
  mode: "single" | "zip";
  actorUserId: string;
  status: "running" | "completed" | "failed";
  summary: Record<string, unknown>;
  startedAt: Date;
  completedAt: Date | null;
}

export interface CertificateImportItemRecord {
  id: string;
  runId: string;
  certificateId: string | null;
  filename: string;
  fingerprint: string | null;
  result: "imported" | "updated" | "ignored" | "invalid";
  message: string | null;
  createdAt: Date;
}

export interface CertificateCrlLinkRecord {
  id: string;
  certificateId: string;
  crlUrl: string;
  ignored: boolean;
  runtimeTargetId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CertificateGroupShareRecord {
  id: string;
  certificateId: string;
  groupId: string;
  createdAt: Date;
}

export interface CertificateGroupOverrideRecord {
  id: string;
  certificateId: string;
  groupId: string;
  intervalSeconds: number | null;
  timeoutSeconds: number | null;
  criticality: "low" | "medium" | "high" | null;
  alertEmail: string | null;
  extraRecipients: string[];
  trustSource: string | null;
  pki: string | null;
  jurisdiction: string | null;
  retentionPollsDays: number | null;
  retentionAlertsDays: number | null;
  retentionCoverageGapsDays: number | null;
  enabled: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettingsRecord {
  userId: string;
  preferredTheme: "light" | "dark";
  predictiveEnabled: boolean;
  predictiveGroupIds: string[];
  predictiveSeverities: Array<"warning" | "critical">;
  predictiveTypes: Array<"upcoming-expiration" | "publication-delayed">;
  updatedAt: Date;
}

export interface PlatformSettingsRecord {
  id: "platform";
  predictiveEnabled: boolean;
  predictiveWindowDays: number;
  updatedAt: Date;
}

export interface PredictiveEventRecord {
  id: string;
  targetId: string;
  certificateId: string;
  groupId: string | null;
  predictiveType: "upcoming-expiration" | "publication-delayed";
  severity: "warning" | "critical";
  nextUpdate: string | null;
  message: string;
  createdAt: Date;
  resolvedAt: Date | null;
}

export interface CertificateChangeEventRecord {
  id: string;
  certificateId: string;
  actorUserId: string | null;
  eventType: string;
  details: Record<string, unknown>;
  occurredAt: Date;
}

export interface CertificateTemplateRecord {
  id: string;
  sourceCertificateId: string;
  name: string;
  details: Record<string, unknown>;
  createdByUserId: string;
  createdAt: Date;
}

export interface TrustListSourceRecord {
  id: string;
  label: string;
  url: string;
  enabled: boolean;
  groupIds: string[];
  parentSourceId: string | null;
  archivedAt: Date | null;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrustListSnapshotRecord {
  id: string;
  sourceId: string;
  digestSha256: string;
  sequenceNumber: string | null;
  territory: string | null;
  issueDate: string | null;
  nextUpdate: string | null;
  acceptedAt: Date;
  xmlSizeBytes: number;
  certificateCount: number;
}

export interface TrustListSyncRunRecord {
  id: string;
  sourceId: string;
  status: "running" | "succeeded" | "failed";
  startedAt: Date;
  finishedAt: Date | null;
  digestSha256: string | null;
  sequenceNumber: string | null;
  territory: string | null;
  issueDate: string | null;
  nextUpdate: string | null;
  snapshotId: string | null;
  failureReason: string | null;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
}

export interface TrustListExtractedCertificateRecord {
  id: string;
  sourceId: string;
  snapshotId: string;
  runId: string;
  fingerprint: string | null;
  subjectSummary: string | null;
  pem: string;
  importedCertificateId: string | null;
  importStatus: "imported" | "updated" | "skipped" | "failed";
  failureReason: string | null;
  createdAt: Date;
}

export interface TrustListCertificateProjectionRecord {
  id: string;
  sourceId: string;
  snapshotId: string;
  runId: string;
  extractedCertificateId: string;
  certificateId: string | null;
  fingerprint: string;
  candidateKey: string;
  candidateDigest: string;
  sourcePath: string;
  sequenceNumber: string | null;
  territory: string | null;
  status: "imported" | "updated" | "skipped" | "failed";
  changeReason:
    | "new-fingerprint"
    | "changed-candidate"
    | "unchanged"
    | "import-failed"
    | "duplicate-in-run";
  failureReason: string | null;
  createdAt: Date;
}

const cache = {
  targets: [] as TargetRecord[],
  polls: [] as PersistedPollEvent[],
  coverageGaps: [] as PersistedCoverageGap[],
  validations: [] as PersistedValidationEvent[],
  alerts: [] as PersistedAlertEvent[],
  snapshots: [] as PersistedSnapshotRecord[],
  users: [] as UserRecord[],
  userSettings: [] as UserSettingsRecord[],
  authAccounts: [] as AuthAccountRecord[],
  authTransactions: [] as AuthTransactionRecord[],
  authSessions: [] as AuthSessionRecord[],
  groups: [] as GroupRecord[],
  groupSettings: [] as GroupSettingsRecord[],
  groupMemberships: [] as GroupMembershipRecord[],
  groupInvites: [] as GroupInviteRecord[],
  passwordResets: [] as PasswordResetRecord[],
  mfaMethods: [] as MfaMethodRecord[],
  auditEvents: [] as AuditEventRecord[],
  targetGroupShares: [] as TargetGroupShareRecord[],
  certificates: [] as CertificateRecord[],
  certificateImportRuns: [] as CertificateImportRunRecord[],
  certificateImportItems: [] as CertificateImportItemRecord[],
  certificateCrlLinks: [] as CertificateCrlLinkRecord[],
  certificateGroupShares: [] as CertificateGroupShareRecord[],
  certificateGroupOverrides: [] as CertificateGroupOverrideRecord[],
  certificateChangeEvents: [] as CertificateChangeEventRecord[],
  certificateTemplates: [] as CertificateTemplateRecord[],
  monitoringSources: [] as MonitoringSourceRecord[],
  monitoringSourceEvents: [] as MonitoringSourceEventRecord[],
  documentSnapshots: [] as DocumentSnapshotRecord[],
  ocspCheckEvents: [] as OcspCheckEventRecord[],
  ocspResponseEvidence: [] as OcspResponseEvidenceRecord[],
  platformSettings: [] as PlatformSettingsRecord[],
  providerRuntimeOverrides: [] as ProviderRuntimeOverrideRecord[],
  providerVerificationStatuses: [] as ProviderVerificationStatusRecord[],
  predictiveEvents: [] as PredictiveEventRecord[],
  trustListSources: [] as TrustListSourceRecord[],
  trustListSnapshots: [] as TrustListSnapshotRecord[],
  trustListSyncRuns: [] as TrustListSyncRunRecord[],
  trustListExtractedCertificates: [] as TrustListExtractedCertificateRecord[],
  trustListCertificateProjections: [] as TrustListCertificateProjectionRecord[],
};

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

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
type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  password_hash: string | null;
  platform_role: "platform-admin" | null;
  preferred_locale: string;
  preferred_theme: "light" | "dark" | null;
  created_at: Date;
  updated_at: Date;
};
type UserSettingsRow = {
  user_id: string;
  preferred_theme: "light" | "dark";
  predictive_enabled: boolean;
  predictive_group_ids: string[];
  predictive_severities: Array<"warning" | "critical">;
  predictive_types: Array<"upcoming-expiration" | "publication-delayed">;
  updated_at: Date;
};
type AuthAccountRow = {
  id: string;
  user_id: string;
  provider: "credentials" | "google" | "entra-id" | "oidc";
  provider_account_id: string;
  provider_email: string;
  linked_at: Date;
};
type AuthTransactionRow = {
  id: string;
  state: string;
  provider: "google" | "entra-id" | "oidc";
  invite_code: string;
  expected_email: string;
  display_name: string | null;
  preferred_locale: string;
  nonce: string;
  expires_at: Date;
  consumed_at: Date | null;
  created_at: Date;
};
type AuthSessionRow = {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  last_seen_at: Date;
  revoked_at: Date | null;
};
type GroupRow = {
  id: string;
  name: string;
  slug: string;
  created_by_user_id: string;
  created_at: Date;
};
type GroupSettingsRow = {
  group_id: string;
  default_trust_source: string | null;
  default_pki: string | null;
  default_jurisdiction: string | null;
  predictive_enabled: boolean;
  predictive_window_days: number;
  updated_at: Date;
};
type GroupMembershipRow = {
  id: string;
  user_id: string;
  group_id: string;
  role: "viewer" | "operator" | "group-admin";
  created_at: Date;
};
type GroupInviteRow = {
  id: string;
  code: string;
  email: string;
  group_id: string;
  role: "viewer" | "operator" | "group-admin";
  status: "pending" | "accepted" | "revoked";
  expires_at: Date;
  invited_by_user_id: string;
  accepted_by_user_id: string | null;
  created_at: Date;
};
type PasswordResetRow = {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  used_at: Date | null;
};
type MfaMethodRow = {
  id: string;
  user_id: string;
  type: "totp";
  label: string;
  enabled: boolean;
  created_at: Date;
};
type AuditEventRowEx = {
  id: string;
  actor_user_id: string | null;
  target_user_id: string | null;
  target_email: string | null;
  group_id: string | null;
  event_type: string;
  details: string;
  occurred_at: Date;
};
type TargetGroupShareRow = {
  id: string;
  target_id: string;
  group_id: string;
  created_at: Date;
};
type PlatformSettingsRow = {
  id: "platform";
  predictive_enabled: boolean;
  predictive_window_days: number;
  updated_at: Date;
};
type ProviderVerificationStatusRow = {
  provider: "google" | "entra-id" | "oidc";
  configured: boolean;
  verified: boolean;
  verified_at: Date | null;
  verified_by_user_id: string | null;
  notes: string | null;
  updated_at: Date;
};
type ProviderRuntimeOverrideRow = {
  provider: "google" | "entra-id" | "oidc";
  enabled: boolean;
  updated_by_user_id: string | null;
  updated_at: Date;
};
type PredictiveEventRow = {
  id: string;
  target_id: string;
  certificate_id: string;
  group_id: string | null;
  predictive_type: "upcoming-expiration" | "publication-delayed";
  severity: "warning" | "critical";
  next_update: string | null;
  message: string;
  created_at: Date;
  resolved_at: Date | null;
};
type TrustListSourceRow = {
  id: string;
  label: string;
  url: string;
  enabled: boolean;
  group_ids: string[] | string;
  parent_source_id: string | null;
  archived_at: Date | null;
  created_by_user_id: string;
  created_at: Date;
  updated_at: Date;
};
type TrustListSnapshotRow = {
  id: string;
  source_id: string;
  digest_sha256: string;
  sequence_number: string | null;
  territory: string | null;
  issue_date: string | null;
  next_update: string | null;
  accepted_at: Date;
  xml_size_bytes: number;
  certificate_count: number;
};
type TrustListSyncRunRow = {
  id: string;
  source_id: string;
  status: "running" | "succeeded" | "failed";
  started_at: Date;
  finished_at: Date | null;
  digest_sha256: string | null;
  sequence_number: string | null;
  territory: string | null;
  issue_date: string | null;
  next_update: string | null;
  snapshot_id: string | null;
  failure_reason: string | null;
  imported_count: number;
  skipped_count: number;
  failed_count: number;
};
type TrustListExtractedCertificateRow = {
  id: string;
  source_id: string;
  snapshot_id: string;
  run_id: string;
  fingerprint: string | null;
  subject_summary: string | null;
  pem: string;
  imported_certificate_id: string | null;
  import_status: "imported" | "updated" | "skipped" | "failed";
  failure_reason: string | null;
  created_at: Date;
};

type TrustListCertificateProjectionRow = {
  id: string;
  source_id: string;
  snapshot_id: string;
  run_id: string;
  extracted_certificate_id: string;
  certificate_id: string | null;
  fingerprint: string;
  candidate_key: string;
  candidate_digest: string;
  source_path: string;
  sequence_number: string | null;
  territory: string | null;
  status: "imported" | "updated" | "skipped" | "failed";
  change_reason:
    | "new-fingerprint"
    | "changed-candidate"
    | "unchanged"
    | "import-failed"
    | "duplicate-in-run";
  failure_reason: string | null;
  created_at: Date;
};

type MonitoringSourceRow = {
  id: string;
  source_key: string;
  certificate_id: string;
  fingerprint: string;
  source_type: MonitoringSourceType;
  source_url: string | null;
  normalized_url: string | null;
  document_role: PolicyDocumentRole | null;
  policy_oid: string | null;
  state: MonitoringSourceState;
  derivation_reason: string;
  trust_list_source_id: string | null;
  trust_list_snapshot_id: string | null;
  trust_list_run_id: string | null;
  created_at: Date;
  updated_at: Date;
};

type MonitoringSourceEventRow = {
  id: string;
  source_id: string;
  source_key: string;
  source_type: MonitoringSourceType;
  status: MonitoringSourceEventStatus;
  status_label: string | null;
  checked_at: Date;
  duration_ms: number;
  http_status: number | null;
  content_type: string | null;
  content_length: number | null;
  content_sha256: string | null;
  failure_reason: string | null;
  snapshot_id: string | null;
};

type DocumentSnapshotRow = {
  id: string;
  source_id: string;
  source_key: string;
  certificate_id: string;
  fingerprint: string;
  source_url: string | null;
  normalized_url: string | null;
  final_url: string;
  policy_oid: string | null;
  document_role: PolicyDocumentRole | null;
  trust_list_source_id: string | null;
  trust_list_snapshot_id: string | null;
  trust_list_run_id: string | null;
  content_type: string | null;
  size_bytes: number;
  sha256: string;
  raw_body: Buffer;
  extracted_text: string | null;
  extracted_text_truncated: boolean;
  extraction_status: DocumentExtractionStatus;
  extraction_failure_reason: string | null;
  metadata_json: Record<string, unknown> | string;
  captured_at: Date;
};

type OcspCheckEventRow = {
  id: string;
  source_id: string;
  source_key: string;
  status: OcspCheckEventStatus;
  status_label: string | null;
  checked_at: Date;
  duration_ms: number;
  http_status: number | null;
  content_type: string | null;
  response_size_bytes: number | null;
  response_sha256: string | null;
  failure_reason: string | null;
  evidence_id: string | null;
};

type OcspResponseEvidenceRow = {
  id: string;
  source_id: string;
  source_key: string;
  certificate_id: string;
  certificate_fingerprint: string;
  issuer_certificate_id: string;
  issuer_fingerprint: string;
  responder_url: string;
  final_url: string;
  request_body: Buffer;
  request_sha256: string;
  request_size_bytes: number;
  response_body: Buffer | null;
  response_sha256: string | null;
  response_size_bytes: number | null;
  http_status: number | null;
  content_type: string | null;
  parse_status: OcspParseStatus;
  parse_failure_reason: string | null;
  metadata_json: Record<string, unknown> | string;
  checked_at: Date;
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
  access: `
    create table if not exists auth_users (
      id text primary key,
      email text not null unique,
      display_name text null,
      password_hash text null,
      platform_role text null,
      preferred_locale text not null,
      preferred_theme text null,
      created_at timestamptz not null,
      updated_at timestamptz not null
    );

    create table if not exists user_settings (
      user_id text primary key,
      preferred_theme text not null,
      predictive_enabled boolean not null,
      predictive_group_ids text[] not null,
      predictive_severities text[] not null,
      predictive_types text[] not null,
      updated_at timestamptz not null
    );

    create table if not exists auth_accounts (
      id text primary key,
      user_id text not null,
      provider text not null,
      provider_account_id text not null,
      provider_email text not null,
      linked_at timestamptz not null
    );

    create unique index if not exists auth_accounts_provider_account_uidx
      on auth_accounts (provider, provider_account_id);

    create table if not exists auth_transactions (
      id text primary key,
      state text not null unique,
      provider text not null,
      invite_code text not null,
      expected_email text not null,
      display_name text null,
      preferred_locale text not null,
      nonce text not null,
      expires_at timestamptz not null,
      consumed_at timestamptz null,
      created_at timestamptz not null
    );

    create table if not exists rate_limit_events (
      id text primary key,
      rate_key text not null,
      occurred_at timestamptz not null
    );

    create index if not exists rate_limit_events_lookup_idx
      on rate_limit_events (rate_key, occurred_at);

    create table if not exists auth_sessions (
      id text primary key,
      user_id text not null,
      token text not null unique,
      expires_at timestamptz not null,
      last_seen_at timestamptz not null,
      revoked_at timestamptz null
    );

    create table if not exists auth_groups (
      id text primary key,
      name text not null,
      slug text not null unique,
      created_by_user_id text not null,
      created_at timestamptz not null
    );

    create table if not exists group_settings (
      group_id text primary key,
      default_trust_source text null,
      default_pki text null,
      default_jurisdiction text null,
      predictive_enabled boolean not null,
      predictive_window_days integer not null,
      updated_at timestamptz not null
    );

    create table if not exists platform_settings (
      id text primary key,
      predictive_enabled boolean not null,
      predictive_window_days integer not null,
      updated_at timestamptz not null
    );

    create table if not exists provider_verification_status (
      provider text primary key,
      configured boolean not null,
      verified boolean not null,
      verified_at timestamptz null,
      verified_by_user_id text null,
      notes text null,
      updated_at timestamptz not null
    );

    create table if not exists provider_runtime_override (
      provider text primary key,
      enabled boolean not null,
      updated_by_user_id text null,
      updated_at timestamptz not null
    );

    create table if not exists group_memberships (
      id text primary key,
      user_id text not null,
      group_id text not null,
      role text not null,
      created_at timestamptz not null
    );

    create table if not exists group_invites (
      id text primary key,
      code text not null unique,
      email text not null,
      group_id text not null,
      role text not null,
      status text not null,
      expires_at timestamptz not null,
      invited_by_user_id text not null,
      accepted_by_user_id text null,
      created_at timestamptz not null
    );

    create table if not exists password_resets (
      id text primary key,
      user_id text not null,
      token text not null unique,
      expires_at timestamptz not null,
      used_at timestamptz null
    );

    create table if not exists mfa_methods (
      id text primary key,
      user_id text not null,
      type text not null,
      label text not null,
      enabled boolean not null,
      created_at timestamptz not null
    );

    create table if not exists audit_events (
      id text primary key,
      actor_user_id text null,
      target_user_id text null,
      target_email text null,
      group_id text null,
      event_type text not null,
      details jsonb not null,
      occurred_at timestamptz not null
    );

    create table if not exists target_group_shares (
      id text primary key,
      target_id text not null,
      group_id text not null,
      created_at timestamptz not null
    );
  `,
  certificateAdmin: `
    create table if not exists certificates (
      id text primary key,
      fingerprint text not null unique,
      display_name text not null,
      pem_text text not null,
      tags text[] not null,
      trust_source text null,
      pki text null,
      jurisdiction text null,
      status text not null,
      source_type text not null,
      created_by_user_id text not null,
      template_id text null,
      created_at timestamptz not null,
      updated_at timestamptz not null
    );

    create table if not exists certificate_import_runs (
      id text primary key,
      mode text not null,
      actor_user_id text not null,
      status text not null,
      summary jsonb not null,
      started_at timestamptz not null,
      completed_at timestamptz null
    );

    create table if not exists certificate_import_items (
      id text primary key,
      run_id text not null,
      certificate_id text null,
      filename text not null,
      fingerprint text null,
      result text not null,
      message text null,
      created_at timestamptz not null
    );

    create table if not exists certificate_crl_links (
      id text primary key,
      certificate_id text not null,
      crl_url text not null,
      ignored boolean not null,
      runtime_target_id text null,
      created_at timestamptz not null,
      updated_at timestamptz not null
    );

    create table if not exists certificate_group_shares (
      id text primary key,
      certificate_id text not null,
      group_id text not null,
      created_at timestamptz not null
    );

    create table if not exists certificate_group_overrides (
      id text primary key,
      certificate_id text not null,
      group_id text not null,
      interval_seconds integer null,
      timeout_seconds integer null,
      criticality text null,
      alert_email text null,
      extra_recipients text[] not null,
      trust_source text null,
      pki text null,
      jurisdiction text null,
      retention_polls_days integer null,
      retention_alerts_days integer null,
      retention_coverage_gaps_days integer null,
      enabled boolean null,
      created_at timestamptz not null,
      updated_at timestamptz not null
    );

    create table if not exists certificate_change_events (
      id text primary key,
      certificate_id text not null,
      actor_user_id text null,
      event_type text not null,
      details jsonb not null,
      occurred_at timestamptz not null
    );

    create table if not exists certificate_templates (
      id text primary key,
      source_certificate_id text not null,
      name text not null,
      details jsonb not null,
      created_by_user_id text not null,
      created_at timestamptz not null
    );
  `,
  monitoringSources: `
    create table if not exists monitoring_sources (
      id text primary key,
      source_key text not null unique,
      certificate_id text not null,
      fingerprint text not null,
      source_type text not null,
      source_url text null,
      normalized_url text null,
      document_role text null,
      policy_oid text null,
      state text not null,
      derivation_reason text not null,
      trust_list_source_id text null,
      trust_list_snapshot_id text null,
      trust_list_run_id text null,
      created_at timestamptz not null,
      updated_at timestamptz not null
    );

    create unique index if not exists monitoring_sources_source_key_uidx
      on monitoring_sources (source_key);
  `,
  documentMonitoring: `
    create table if not exists monitoring_source_events (
      id text primary key,
      source_id text not null,
      source_key text not null,
      source_type text not null,
      status text not null,
      status_label text null,
      checked_at timestamptz not null,
      duration_ms integer not null,
      http_status integer null,
      content_type text null,
      content_length integer null,
      content_sha256 text null,
      failure_reason text null,
      snapshot_id text null
    );

    create index if not exists monitoring_source_events_source_checked_idx
      on monitoring_source_events (source_id, checked_at desc);

    create table if not exists document_snapshots (
      id text primary key,
      source_id text not null,
      source_key text not null,
      certificate_id text not null,
      fingerprint text not null,
      source_url text null,
      normalized_url text null,
      final_url text not null,
      policy_oid text null,
      document_role text null,
      trust_list_source_id text null,
      trust_list_snapshot_id text null,
      trust_list_run_id text null,
      content_type text null,
      size_bytes integer not null,
      sha256 text not null,
      raw_body bytea not null,
      extracted_text text null,
      extracted_text_truncated boolean not null,
      extraction_status text not null,
      extraction_failure_reason text null,
      metadata_json jsonb not null,
      captured_at timestamptz not null
    );

    create index if not exists document_snapshots_source_captured_idx
      on document_snapshots (source_id, captured_at desc);
    create unique index if not exists document_snapshots_source_hash_uidx
      on document_snapshots (source_id, sha256);
  `,
  ocspMonitoring: `
    create table if not exists ocsp_check_events (
      id text primary key,
      source_id text not null,
      source_key text not null,
      status text not null,
      status_label text null,
      checked_at timestamptz not null,
      duration_ms integer not null,
      http_status integer null,
      content_type text null,
      response_size_bytes integer null,
      response_sha256 text null,
      failure_reason text null,
      evidence_id text null
    );

    create index if not exists ocsp_check_events_source_checked_idx
      on ocsp_check_events (source_id, checked_at desc);

    create table if not exists ocsp_response_evidence (
      id text primary key,
      source_id text not null,
      source_key text not null,
      certificate_id text not null,
      certificate_fingerprint text not null,
      issuer_certificate_id text not null,
      issuer_fingerprint text not null,
      responder_url text not null,
      final_url text not null,
      request_body bytea not null,
      request_sha256 text not null,
      request_size_bytes integer not null,
      response_body bytea null,
      response_sha256 text null,
      response_size_bytes integer null,
      http_status integer null,
      content_type text null,
      parse_status text not null,
      parse_failure_reason text null,
      metadata_json jsonb not null,
      checked_at timestamptz not null
    );

    create index if not exists ocsp_response_evidence_source_checked_idx
      on ocsp_response_evidence (source_id, checked_at desc);
  `,
  predictive: `
    create table if not exists predictive_events (
      id text primary key,
      target_id text not null,
      certificate_id text not null,
      group_id text null,
      predictive_type text not null,
      severity text not null,
      next_update text null,
      message text not null,
      created_at timestamptz not null,
      resolved_at timestamptz null
    );
  `,
  trustLists: `
    create table if not exists trust_list_sources (
      id text primary key,
      label text not null,
      url text not null,
      enabled boolean not null,
      group_ids text[] not null,
      parent_source_id text null,
      archived_at timestamptz null,
      created_by_user_id text not null,
      created_at timestamptz not null,
      updated_at timestamptz not null
    );

    create table if not exists trust_list_snapshots (
      id text primary key,
      source_id text not null,
      digest_sha256 text not null,
      sequence_number text null,
      territory text null,
      issue_date text null,
      next_update text null,
      accepted_at timestamptz not null,
      xml_size_bytes integer not null,
      certificate_count integer not null
    );

    create table if not exists trust_list_sync_runs (
      id text primary key,
      source_id text not null,
      status text not null,
      started_at timestamptz not null,
      finished_at timestamptz null,
      digest_sha256 text null,
      sequence_number text null,
      territory text null,
      issue_date text null,
      next_update text null,
      snapshot_id text null,
      failure_reason text null,
      imported_count integer not null default 0,
      skipped_count integer not null default 0,
      failed_count integer not null default 0
    );

    create table if not exists trust_list_extracted_certificates (
      id text primary key,
      source_id text not null,
      snapshot_id text not null,
      run_id text not null,
      fingerprint text null,
      subject_summary text null,
      pem text not null,
      imported_certificate_id text null,
      import_status text not null,
      failure_reason text null,
      created_at timestamptz not null
    );

    create table if not exists trust_list_certificate_projections (
      id text primary key,
      source_id text not null,
      snapshot_id text not null,
      run_id text not null,
      extracted_certificate_id text not null,
      certificate_id text null,
      fingerprint text not null,
      candidate_key text not null,
      candidate_digest text not null,
      source_path text not null,
      sequence_number text null,
      territory text null,
      status text not null,
      change_reason text not null,
      failure_reason text null,
      created_at timestamptz not null
    );

    create index if not exists trust_list_certificate_projections_lookup_idx
      on trust_list_certificate_projections (source_id, fingerprint, candidate_key, created_at desc);
    create index if not exists trust_list_certificate_projections_certificate_idx
      on trust_list_certificate_projections (certificate_id, created_at desc);
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
    await client.query(RUNTIME_SQL_SCHEMA.access);
    await client.query(RUNTIME_SQL_SCHEMA.certificateAdmin);
    await client.query(RUNTIME_SQL_SCHEMA.monitoringSources);
    await client.query(RUNTIME_SQL_SCHEMA.documentMonitoring);
    await client.query(RUNTIME_SQL_SCHEMA.ocspMonitoring);
    await client.query(RUNTIME_SQL_SCHEMA.predictive);
    await client.query(RUNTIME_SQL_SCHEMA.trustLists);
    await client.query(
      `alter table auth_users add column if not exists preferred_theme text null`
    );
    await client.query(
      `alter table certificates add column if not exists trust_source text null`
    );
    await client.query(`alter table certificates add column if not exists pki text null`);
    await client.query(
      `alter table certificates add column if not exists jurisdiction text null`
    );
    await client.query(
      `alter table certificate_group_overrides add column if not exists trust_source text null`
    );
    await client.query(
      `alter table certificate_group_overrides add column if not exists pki text null`
    );
    await client.query(
      `alter table certificate_group_overrides add column if not exists jurisdiction text null`
    );
    await client.query(
      `alter table trust_list_sources add column if not exists parent_source_id text null`
    );
    await client.query(
      `alter table trust_list_sources add column if not exists archived_at timestamptz null`
    );
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function ensureRuntimeSchema(): Promise<void> {
  if (!hasDatabase()) {
    return;
  }
  if (!schemaReady) {
    schemaReady = initializeRuntimeStoreSchema();
  }
  await schemaReady;
}

function mapTrustListSourceRow(row: TrustListSourceRow): TrustListSourceRecord {
  return {
    id: row.id,
    label: row.label,
    url: row.url,
    enabled: row.enabled,
    groupIds: Array.isArray(row.group_ids) ? row.group_ids : JSON.parse(row.group_ids),
    parentSourceId: row.parent_source_id,
    archivedAt: row.archived_at ? new Date(row.archived_at) : null,
    createdByUserId: row.created_by_user_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapTrustListSnapshotRow(row: TrustListSnapshotRow): TrustListSnapshotRecord {
  return {
    id: row.id,
    sourceId: row.source_id,
    digestSha256: row.digest_sha256,
    sequenceNumber: row.sequence_number,
    territory: row.territory,
    issueDate: row.issue_date,
    nextUpdate: row.next_update,
    acceptedAt: new Date(row.accepted_at),
    xmlSizeBytes: row.xml_size_bytes,
    certificateCount: row.certificate_count,
  };
}

function mapTrustListSyncRunRow(row: TrustListSyncRunRow): TrustListSyncRunRecord {
  return {
    id: row.id,
    sourceId: row.source_id,
    status: row.status,
    startedAt: new Date(row.started_at),
    finishedAt: row.finished_at ? new Date(row.finished_at) : null,
    digestSha256: row.digest_sha256,
    sequenceNumber: row.sequence_number,
    territory: row.territory,
    issueDate: row.issue_date,
    nextUpdate: row.next_update,
    snapshotId: row.snapshot_id,
    failureReason: row.failure_reason,
    importedCount: row.imported_count,
    skippedCount: row.skipped_count,
    failedCount: row.failed_count,
  };
}

function mapTrustListExtractedCertificateRow(
  row: TrustListExtractedCertificateRow
): TrustListExtractedCertificateRecord {
  return {
    id: row.id,
    sourceId: row.source_id,
    snapshotId: row.snapshot_id,
    runId: row.run_id,
    fingerprint: row.fingerprint,
    subjectSummary: row.subject_summary,
    pem: row.pem,
    importedCertificateId: row.imported_certificate_id,
    importStatus: row.import_status,
    failureReason: row.failure_reason,
    createdAt: new Date(row.created_at),
  };
}

function mapTrustListCertificateProjectionRow(
  row: TrustListCertificateProjectionRow
): TrustListCertificateProjectionRecord {
  return {
    id: row.id,
    sourceId: row.source_id,
    snapshotId: row.snapshot_id,
    runId: row.run_id,
    extractedCertificateId: row.extracted_certificate_id,
    certificateId: row.certificate_id,
    fingerprint: row.fingerprint,
    candidateKey: row.candidate_key,
    candidateDigest: row.candidate_digest,
    sourcePath: row.source_path,
    sequenceNumber: row.sequence_number,
    territory: row.territory,
    status: row.status,
    changeReason: row.change_reason,
    failureReason: row.failure_reason,
    createdAt: new Date(row.created_at),
  };
}

function mapMonitoringSourceRow(row: MonitoringSourceRow): MonitoringSourceRecord {
  return {
    id: row.id,
    sourceKey: row.source_key,
    certificateId: row.certificate_id,
    fingerprint: row.fingerprint,
    sourceType: row.source_type,
    sourceUrl: row.source_url,
    normalizedUrl: row.normalized_url,
    documentRole: row.document_role,
    policyOid: row.policy_oid,
    state: row.state,
    derivationReason: row.derivation_reason,
    trustListSourceId: row.trust_list_source_id,
    trustListSnapshotId: row.trust_list_snapshot_id,
    trustListRunId: row.trust_list_run_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapMonitoringSourceEventRow(row: MonitoringSourceEventRow): MonitoringSourceEventRecord {
  return {
    id: row.id,
    sourceId: row.source_id,
    sourceKey: row.source_key,
    sourceType: row.source_type,
    status: row.status,
    statusLabel: row.status_label,
    checkedAt: new Date(row.checked_at),
    durationMs: row.duration_ms,
    httpStatus: row.http_status,
    contentType: row.content_type,
    contentLength: row.content_length,
    contentSha256: row.content_sha256,
    failureReason: row.failure_reason,
    snapshotId: row.snapshot_id,
  };
}

function parseMetadataJson(value: Record<string, unknown> | string): Record<string, unknown> {
  return typeof value === "string" ? JSON.parse(value) : value;
}

function mapDocumentSnapshotRow(row: DocumentSnapshotRow): DocumentSnapshotRecord {
  return {
    id: row.id,
    sourceId: row.source_id,
    sourceKey: row.source_key,
    certificateId: row.certificate_id,
    fingerprint: row.fingerprint,
    sourceUrl: row.source_url,
    normalizedUrl: row.normalized_url,
    finalUrl: row.final_url,
    policyOid: row.policy_oid,
    documentRole: row.document_role,
    trustListSourceId: row.trust_list_source_id,
    trustListSnapshotId: row.trust_list_snapshot_id,
    trustListRunId: row.trust_list_run_id,
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
    sha256: row.sha256,
    rawBodyBase64: Buffer.from(row.raw_body).toString("base64"),
    extractedText: row.extracted_text,
    extractedTextTruncated: row.extracted_text_truncated,
    extractionStatus: row.extraction_status,
    extractionFailureReason: row.extraction_failure_reason,
    metadataJson: parseMetadataJson(row.metadata_json),
    capturedAt: new Date(row.captured_at),
  };
}

function mapOcspCheckEventRow(row: OcspCheckEventRow): OcspCheckEventRecord {
  return {
    id: row.id,
    sourceId: row.source_id,
    sourceKey: row.source_key,
    status: row.status,
    statusLabel: row.status_label,
    checkedAt: new Date(row.checked_at),
    durationMs: row.duration_ms,
    httpStatus: row.http_status,
    contentType: row.content_type,
    responseSizeBytes: row.response_size_bytes,
    responseSha256: row.response_sha256,
    failureReason: row.failure_reason,
    evidenceId: row.evidence_id,
  };
}

function mapOcspResponseEvidenceRow(row: OcspResponseEvidenceRow): OcspResponseEvidenceRecord {
  return {
    id: row.id,
    sourceId: row.source_id,
    sourceKey: row.source_key,
    certificateId: row.certificate_id,
    certificateFingerprint: row.certificate_fingerprint,
    issuerCertificateId: row.issuer_certificate_id,
    issuerFingerprint: row.issuer_fingerprint,
    responderUrl: row.responder_url,
    finalUrl: row.final_url,
    requestBodyBase64: Buffer.from(row.request_body).toString("base64"),
    requestSha256: row.request_sha256,
    requestSizeBytes: row.request_size_bytes,
    responseBodyBase64: row.response_body ? Buffer.from(row.response_body).toString("base64") : null,
    responseSha256: row.response_sha256,
    responseSizeBytes: row.response_size_bytes,
    httpStatus: row.http_status,
    contentType: row.content_type,
    parseStatus: row.parse_status,
    parseFailureReason: row.parse_failure_reason,
    metadataJson: parseMetadataJson(row.metadata_json),
    checkedAt: new Date(row.checked_at),
  };
}

export async function reloadRuntimeStoreCache(): Promise<void> {
  if (!hasDatabase()) {
    return;
  }

  const currentPool = getPool();
  const [targets, polls, coverageGaps, validations, alerts, snapshots, users, userSettings, authAccounts, authTransactions, authSessions, groups, groupSettings, memberships, invites, passwordResets, mfaMethods, auditEvents, targetGroupShares, platformSettings, providerVerificationStatuses, providerRuntimeOverrides, predictiveEvents, monitoringSources, monitoringSourceEvents, documentSnapshots, ocspCheckEvents, ocspResponseEvidence, trustListSources, trustListSnapshots, trustListSyncRuns, trustListExtractedCertificates, trustListCertificateProjections] = await Promise.all([
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
    currentPool.query<UserRow>(
      `select id, email, display_name, password_hash, platform_role, preferred_locale, preferred_theme, created_at, updated_at from auth_users order by email asc`
    ),
    currentPool.query<UserSettingsRow>(
      `select user_id, preferred_theme, predictive_enabled, predictive_group_ids, predictive_severities, predictive_types, updated_at from user_settings order by updated_at desc`
    ),
    currentPool.query<AuthAccountRow>(
      `select id, user_id, provider, provider_account_id, provider_email, linked_at from auth_accounts order by linked_at asc`
    ),
    currentPool.query<AuthTransactionRow>(
      `select id, state, provider, invite_code, expected_email, display_name, preferred_locale, nonce, expires_at, consumed_at, created_at from auth_transactions order by created_at asc`
    ),
    currentPool.query<AuthSessionRow>(
      `select id, user_id, token, expires_at, last_seen_at, revoked_at from auth_sessions order by last_seen_at desc`
    ),
    currentPool.query<GroupRow>(
      `select id, name, slug, created_by_user_id, created_at from auth_groups order by slug asc`
    ),
    currentPool.query<GroupSettingsRow>(
      `select group_id, default_trust_source, default_pki, default_jurisdiction, predictive_enabled, predictive_window_days, updated_at from group_settings order by updated_at desc`
    ),
    currentPool.query<GroupMembershipRow>(
      `select id, user_id, group_id, role, created_at from group_memberships order by created_at asc`
    ),
    currentPool.query<GroupInviteRow>(
      `select id, code, email, group_id, role, status, expires_at, invited_by_user_id, accepted_by_user_id, created_at from group_invites order by created_at asc`
    ),
    currentPool.query<PasswordResetRow>(
      `select id, user_id, token, expires_at, used_at from password_resets order by expires_at desc`
    ),
    currentPool.query<MfaMethodRow>(
      `select id, user_id, type, label, enabled, created_at from mfa_methods order by created_at asc`
    ),
    currentPool.query<AuditEventRowEx>(
      `select id, actor_user_id, target_user_id, target_email, group_id, event_type, details::text as details, occurred_at from audit_events order by occurred_at asc`
    ),
    currentPool.query<TargetGroupShareRow>(
      `select id, target_id, group_id, created_at from target_group_shares order by created_at asc`
    ),
    currentPool.query<PlatformSettingsRow>(
      `select id, predictive_enabled, predictive_window_days, updated_at from platform_settings order by updated_at desc`
    ),
    currentPool.query<ProviderVerificationStatusRow>(
      `select provider, configured, verified, verified_at, verified_by_user_id, notes, updated_at from provider_verification_status order by provider asc`
    ),
    currentPool.query<ProviderRuntimeOverrideRow>(
      `select provider, enabled, updated_by_user_id, updated_at from provider_runtime_override order by provider asc`
    ),
    currentPool.query<PredictiveEventRow>(
      `select id, target_id, certificate_id, group_id, predictive_type, severity, next_update, message, created_at, resolved_at from predictive_events order by created_at asc`
    ),
    currentPool.query<MonitoringSourceRow>(
      `select id, source_key, certificate_id, fingerprint, source_type, source_url, normalized_url, document_role, policy_oid, state, derivation_reason, trust_list_source_id, trust_list_snapshot_id, trust_list_run_id, created_at, updated_at from monitoring_sources order by updated_at desc`
    ),
    currentPool.query<MonitoringSourceEventRow>(
      `select id, source_id, source_key, source_type, status, status_label, checked_at, duration_ms, http_status, content_type, content_length, content_sha256, failure_reason, snapshot_id from monitoring_source_events order by checked_at desc`
    ),
    currentPool.query<DocumentSnapshotRow>(
      `select id, source_id, source_key, certificate_id, fingerprint, source_url, normalized_url, final_url, policy_oid, document_role, trust_list_source_id, trust_list_snapshot_id, trust_list_run_id, content_type, size_bytes, sha256, raw_body, extracted_text, extracted_text_truncated, extraction_status, extraction_failure_reason, metadata_json, captured_at from document_snapshots order by captured_at desc`
    ),
    currentPool.query<OcspCheckEventRow>(
      `select id, source_id, source_key, status, status_label, checked_at, duration_ms, http_status, content_type, response_size_bytes, response_sha256, failure_reason, evidence_id from ocsp_check_events order by checked_at desc`
    ),
    currentPool.query<OcspResponseEvidenceRow>(
      `select id, source_id, source_key, certificate_id, certificate_fingerprint, issuer_certificate_id, issuer_fingerprint, responder_url, final_url, request_body, request_sha256, request_size_bytes, response_body, response_sha256, response_size_bytes, http_status, content_type, parse_status, parse_failure_reason, metadata_json, checked_at from ocsp_response_evidence order by checked_at desc`
    ),
    currentPool.query<TrustListSourceRow>(
      `select id, label, url, enabled, group_ids, parent_source_id, created_by_user_id, created_at, updated_at from trust_list_sources order by updated_at desc`
    ),
    currentPool.query<TrustListSnapshotRow>(
      `select id, source_id, digest_sha256, sequence_number, territory, issue_date, next_update, accepted_at, xml_size_bytes, certificate_count from trust_list_snapshots order by accepted_at desc`
    ),
    currentPool.query<TrustListSyncRunRow>(
      `select id, source_id, status, started_at, finished_at, digest_sha256, sequence_number, territory, issue_date, next_update, snapshot_id, failure_reason, imported_count, skipped_count, failed_count from trust_list_sync_runs order by started_at desc`
    ),
    currentPool.query<TrustListExtractedCertificateRow>(
      `select id, source_id, snapshot_id, run_id, fingerprint, subject_summary, pem, imported_certificate_id, import_status, failure_reason, created_at from trust_list_extracted_certificates order by created_at desc`
    ),
    currentPool.query<TrustListCertificateProjectionRow>(
      `select id, source_id, snapshot_id, run_id, extracted_certificate_id, certificate_id, fingerprint, candidate_key, candidate_digest, source_path, sequence_number, territory, status, change_reason, failure_reason, created_at from trust_list_certificate_projections order by created_at desc`
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
  cache.authAccounts = authAccounts.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    providerAccountId: row.provider_account_id,
    providerEmail: row.provider_email,
    linkedAt: new Date(row.linked_at),
  }));
  cache.authTransactions = authTransactions.rows.map((row) => ({
    id: row.id,
    state: row.state,
    provider: row.provider,
    inviteCode: row.invite_code,
    expectedEmail: row.expected_email,
    displayName: row.display_name,
    preferredLocale: row.preferred_locale,
    nonce: row.nonce,
    expiresAt: new Date(row.expires_at),
    consumedAt: row.consumed_at ? new Date(row.consumed_at) : null,
    createdAt: new Date(row.created_at),
  }));
  cache.users = users.rows.map((row) => ({
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    passwordHash: row.password_hash,
    platformRole: row.platform_role,
    preferredLocale: row.preferred_locale,
    preferredTheme: row.preferred_theme ?? "dark",
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    accounts: cache.authAccounts.filter((account) => account.userId === row.id),
  }));
  cache.userSettings = userSettings.rows.map((row) => ({
    userId: row.user_id,
    preferredTheme: row.preferred_theme,
    predictiveEnabled: row.predictive_enabled,
    predictiveGroupIds: row.predictive_group_ids,
    predictiveSeverities: row.predictive_severities,
    predictiveTypes: row.predictive_types,
    updatedAt: new Date(row.updated_at),
  }));
  cache.authSessions = authSessions.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    token: row.token,
    expiresAt: new Date(row.expires_at),
    lastSeenAt: new Date(row.last_seen_at),
    revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
  }));
  cache.groups = groups.rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdByUserId: row.created_by_user_id,
    createdAt: new Date(row.created_at),
  }));
  cache.groupSettings = groupSettings.rows.map((row) => ({
    groupId: row.group_id,
    defaultTrustSource: row.default_trust_source,
    defaultPki: row.default_pki,
    defaultJurisdiction: row.default_jurisdiction,
    predictiveEnabled: row.predictive_enabled,
    predictiveWindowDays: row.predictive_window_days,
    updatedAt: new Date(row.updated_at),
  }));
  cache.groupMemberships = memberships.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    groupId: row.group_id,
    role: row.role,
    createdAt: new Date(row.created_at),
  }));
  cache.groupInvites = invites.rows.map((row) => ({
    id: row.id,
    code: row.code,
    email: row.email,
    groupId: row.group_id,
    role: row.role,
    status: row.status,
    expiresAt: new Date(row.expires_at),
    invitedByUserId: row.invited_by_user_id,
    acceptedByUserId: row.accepted_by_user_id,
    createdAt: new Date(row.created_at),
  }));
  cache.passwordResets = passwordResets.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    token: row.token,
    expiresAt: new Date(row.expires_at),
    usedAt: row.used_at ? new Date(row.used_at) : null,
  }));
  cache.mfaMethods = mfaMethods.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    label: row.label,
    enabled: row.enabled,
    createdAt: new Date(row.created_at),
  }));
  cache.auditEvents = auditEvents.rows.map((row) => ({
    id: row.id,
    actorUserId: row.actor_user_id,
    targetUserId: row.target_user_id,
    targetEmail: row.target_email,
    groupId: row.group_id,
    eventType: row.event_type,
    details: JSON.parse(row.details),
    occurredAt: new Date(row.occurred_at),
  }));
  cache.targetGroupShares = targetGroupShares.rows.map((row) => ({
    id: row.id,
    targetId: row.target_id,
    groupId: row.group_id,
    createdAt: new Date(row.created_at),
  }));
  cache.platformSettings = platformSettings.rows.map((row) => ({
    id: row.id,
    predictiveEnabled: row.predictive_enabled,
    predictiveWindowDays: row.predictive_window_days,
    updatedAt: new Date(row.updated_at),
  }));
  cache.providerVerificationStatuses = providerVerificationStatuses.rows.map((row) => ({
    provider: row.provider,
    configured: row.configured,
    verified: row.verified,
    verifiedAt: row.verified_at ? new Date(row.verified_at) : null,
    verifiedByUserId: row.verified_by_user_id,
    notes: row.notes,
    updatedAt: new Date(row.updated_at),
  }));
  cache.providerRuntimeOverrides = providerRuntimeOverrides.rows.map((row) => ({
    provider: row.provider,
    enabled: row.enabled,
    updatedByUserId: row.updated_by_user_id,
    updatedAt: new Date(row.updated_at),
  }));
  cache.predictiveEvents = predictiveEvents.rows.map((row) => ({
    id: row.id,
    targetId: row.target_id,
    certificateId: row.certificate_id,
    groupId: row.group_id,
    predictiveType: row.predictive_type,
    severity: row.severity,
    nextUpdate: row.next_update,
    message: row.message,
    createdAt: new Date(row.created_at),
    resolvedAt: row.resolved_at ? new Date(row.resolved_at) : null,
  }));
  cache.monitoringSources = monitoringSources.rows.map(mapMonitoringSourceRow);
  cache.monitoringSourceEvents = monitoringSourceEvents.rows.map(mapMonitoringSourceEventRow);
  cache.documentSnapshots = documentSnapshots.rows.map(mapDocumentSnapshotRow);
  cache.ocspCheckEvents = ocspCheckEvents.rows.map(mapOcspCheckEventRow);
  cache.ocspResponseEvidence = ocspResponseEvidence.rows.map(mapOcspResponseEvidenceRow);
  cache.trustListSources = trustListSources.rows.map(mapTrustListSourceRow);
  cache.trustListSnapshots = trustListSnapshots.rows.map(mapTrustListSnapshotRow);
  cache.trustListSyncRuns = trustListSyncRuns.rows.map(mapTrustListSyncRunRow);
  cache.trustListExtractedCertificates =
    trustListExtractedCertificates.rows.map(mapTrustListExtractedCertificateRow);
  cache.trustListCertificateProjections =
    trustListCertificateProjections.rows.map(mapTrustListCertificateProjectionRow);
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
  await ensureRuntimeSchema();

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
  await ensureRuntimeSchema();

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

export async function recordPredictiveEvent(input: Omit<PredictiveEventRecord, "id" | "createdAt"> & { id?: string }): Promise<PredictiveEventRecord> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }
  const record: PredictiveEventRecord = {
    id: input.id ?? makeId("predictive"),
    targetId: input.targetId,
    certificateId: input.certificateId,
    groupId: input.groupId,
    predictiveType: input.predictiveType,
    severity: input.severity,
    nextUpdate: input.nextUpdate,
    message: input.message,
    createdAt: new Date(),
    resolvedAt: input.resolvedAt,
  };
  cache.predictiveEvents = upsertInCache(cache.predictiveEvents, record);
  if (hasDatabase()) {
    await getPool().query(
      `insert into predictive_events (
         id, target_id, certificate_id, group_id, predictive_type, severity,
         next_update, message, created_at, resolved_at
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       on conflict (id) do update set
         predictive_type = excluded.predictive_type,
         severity = excluded.severity,
         group_id = excluded.group_id,
         next_update = excluded.next_update,
         message = excluded.message,
         resolved_at = excluded.resolved_at`,
      [
        record.id,
        record.targetId,
        record.certificateId,
        record.groupId,
        record.predictiveType,
        record.severity,
        record.nextUpdate,
        record.message,
        record.createdAt,
        record.resolvedAt,
      ]
    );
  }
  return record;
}

export async function listPredictiveEventsByCertificate(
  certificateId: string
): Promise<PredictiveEventRecord[]> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    const result = await getPool().query<PredictiveEventRow>(
      `select id, target_id, certificate_id, group_id, predictive_type, severity, next_update, message, created_at, resolved_at
       from predictive_events where certificate_id = $1 order by created_at asc`,
      [certificateId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      targetId: row.target_id,
      certificateId: row.certificate_id,
      groupId: row.group_id,
      predictiveType: row.predictive_type,
      severity: row.severity,
      nextUpdate: row.next_update,
      message: row.message,
      createdAt: new Date(row.created_at),
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : null,
    }));
  }
  return cache.predictiveEvents.filter((item) => item.certificateId === certificateId);
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

export async function recordRateLimitAttempt(
  key: string,
  windowMs: number,
  nowMs = Date.now()
): Promise<number | null> {
  if (!hasDatabase()) {
    return null;
  }

  await ensureRuntimeSchema();
  const occurredAt = new Date(nowMs);
  const windowStart = new Date(nowMs - windowMs);
  const currentPool = getPool();

  await currentPool.query(`delete from rate_limit_events where occurred_at < $1`, [windowStart]);
  await currentPool.query(
    `insert into rate_limit_events (id, rate_key, occurred_at) values ($1, $2, $3)`,
    [makeId("rl"), key, occurredAt]
  );

  const result = await currentPool.query<{ count: number }>(
    `select count(*)::int as count from rate_limit_events where rate_key = $1 and occurred_at >= $2`,
    [key, windowStart]
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function createUserRecord(input: {
  email: string;
  displayName: string | null;
  passwordHash: string | null;
  platformRole: "platform-admin" | null;
  preferredLocale: string;
  preferredTheme?: "light" | "dark";
}): Promise<UserRecord> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }
  const record: UserRecord = {
    id: makeId("user"),
    email: input.email,
    displayName: input.displayName,
    passwordHash: input.passwordHash,
    platformRole: input.platformRole,
    preferredLocale: input.preferredLocale,
    preferredTheme: input.preferredTheme ?? "dark",
    createdAt: new Date(),
    updatedAt: new Date(),
    accounts: [],
  };
  cache.users = upsertInCache(cache.users, record);

  if (hasDatabase()) {
    await getPool().query(
      `insert into auth_users (id, email, display_name, password_hash, platform_role, preferred_locale, preferred_theme, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       on conflict (id) do nothing`,
      [record.id, record.email, record.displayName, record.passwordHash, record.platformRole, record.preferredLocale, record.preferredTheme, record.createdAt, record.updatedAt]
    );
  }

  return record;
}

export async function updateUserRecord(userId: string, patch: Partial<Omit<UserRecord, "id" | "createdAt" | "accounts">>): Promise<UserRecord> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }
  const current = cache.users.find((item) => item.id === userId);
  if (!current) {
    throw new Error("user-not-found");
  }
  const updated: UserRecord = {
    ...current,
    ...patch,
    updatedAt: new Date(),
    accounts: current.accounts,
  };
  cache.users = upsertInCache(cache.users, updated);

  if (hasDatabase()) {
    await getPool().query(
      `update auth_users
       set email = $2, display_name = $3, password_hash = $4, platform_role = $5, preferred_locale = $6, preferred_theme = $7, updated_at = $8
       where id = $1`,
      [updated.id, updated.email, updated.displayName, updated.passwordHash, updated.platformRole, updated.preferredLocale, updated.preferredTheme, updated.updatedAt]
    );
  }

  return updated;
}

export async function loadUsers(): Promise<UserRecord[]> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    await reloadRuntimeStoreCache();
  }
  return cache.users.map((user) => ({
    ...user,
    accounts: cache.authAccounts.filter((account) => account.userId === user.id),
  }));
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const users = await loadUsers();
  return users.find((item) => item.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function findUserById(userId: string): Promise<UserRecord | null> {
  const users = await loadUsers();
  return users.find((item) => item.id === userId) ?? null;
}

export async function upsertUserSettingsRecord(input: {
  userId: string;
  preferredTheme: "light" | "dark";
  predictiveEnabled: boolean;
  predictiveGroupIds: string[];
  predictiveSeverities: Array<"warning" | "critical">;
  predictiveTypes: Array<"upcoming-expiration" | "publication-delayed">;
}): Promise<UserSettingsRecord> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }
  const record: UserSettingsRecord = {
    userId: input.userId,
    preferredTheme: input.preferredTheme,
    predictiveEnabled: input.predictiveEnabled,
    predictiveGroupIds: input.predictiveGroupIds,
    predictiveSeverities: input.predictiveSeverities,
    predictiveTypes: input.predictiveTypes,
    updatedAt: new Date(),
  };
  cache.userSettings = cache.userSettings.filter((item) => item.userId !== record.userId);
  cache.userSettings.push(record);
  cache.users = cache.users.map((user) =>
    user.id === input.userId ? { ...user, preferredTheme: input.preferredTheme } : user
  );

  if (hasDatabase()) {
    await getPool().query(
      `insert into user_settings (
         user_id, preferred_theme, predictive_enabled, predictive_group_ids,
         predictive_severities, predictive_types, updated_at
       ) values ($1,$2,$3,$4,$5,$6,$7)
       on conflict (user_id) do update set
         preferred_theme = excluded.preferred_theme,
         predictive_enabled = excluded.predictive_enabled,
         predictive_group_ids = excluded.predictive_group_ids,
         predictive_severities = excluded.predictive_severities,
         predictive_types = excluded.predictive_types,
         updated_at = excluded.updated_at`,
      [
        record.userId,
        record.preferredTheme,
        record.predictiveEnabled,
        record.predictiveGroupIds,
        record.predictiveSeverities,
        record.predictiveTypes,
        record.updatedAt,
      ]
    );
    await getPool().query(
      `update auth_users set preferred_theme = $2, updated_at = $3 where id = $1`,
      [record.userId, record.preferredTheme, record.updatedAt]
    );
  }

  return record;
}

export async function findUserSettingsByUserId(userId: string): Promise<UserSettingsRecord | null> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    const result = await getPool().query<UserSettingsRow>(
      `select user_id, preferred_theme, predictive_enabled, predictive_group_ids, predictive_severities, predictive_types, updated_at from user_settings where user_id = $1 limit 1`,
      [userId]
    );
    const row = result.rows[0];
    if (row) {
      return {
        userId: row.user_id,
        preferredTheme: row.preferred_theme,
        predictiveEnabled: row.predictive_enabled,
        predictiveGroupIds: row.predictive_group_ids,
        predictiveSeverities: row.predictive_severities,
        predictiveTypes: row.predictive_types,
        updatedAt: new Date(row.updated_at),
      };
    }
  }

  const existing = cache.userSettings.find((item) => item.userId === userId);
  if (existing) {
    return existing;
  }

  const memberships = await listGroupMembershipsByUser(userId);
  return {
    userId,
    preferredTheme: (await findUserById(userId))?.preferredTheme ?? "dark",
    predictiveEnabled: true,
    predictiveGroupIds: memberships.map((membership) => membership.groupId),
    predictiveSeverities: ["warning", "critical"],
    predictiveTypes: ["upcoming-expiration", "publication-delayed"],
    updatedAt: new Date(),
  };
}

export async function recordAuthAccount(input: {
  userId: string;
  provider: AuthAccountRecord["provider"];
  providerAccountId: string;
  providerEmail: string;
}): Promise<AuthAccountRecord> {
  const existing = cache.authAccounts.find(
    (item) => item.provider === input.provider && item.providerAccountId === input.providerAccountId
  );
  if (existing) {
    return existing;
  }
  const record: AuthAccountRecord = {
    id: makeId("acct"),
    userId: input.userId,
    provider: input.provider,
    providerAccountId: input.providerAccountId,
    providerEmail: input.providerEmail,
    linkedAt: new Date(),
  };
  cache.authAccounts = upsertInCache(cache.authAccounts, record);
  cache.users = cache.users.map((user) =>
    user.id === input.userId ? { ...user, accounts: [...user.accounts, record] } : user
  );

  if (hasDatabase()) {
    await getPool().query(
      `insert into auth_accounts (id, user_id, provider, provider_account_id, provider_email, linked_at)
       values ($1,$2,$3,$4,$5,$6)
       on conflict (id) do nothing`,
      [record.id, record.userId, record.provider, record.providerAccountId, record.providerEmail, record.linkedAt]
    );
  }

  return record;
}

export async function findAuthAccountByProviderAccount(
  provider: AuthAccountRecord["provider"],
  providerAccountId: string
): Promise<AuthAccountRecord | null> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    const result = await getPool().query<AuthAccountRow>(
      `select id, user_id, provider, provider_account_id, provider_email, linked_at
       from auth_accounts where provider = $1 and provider_account_id = $2 limit 1`,
      [provider, providerAccountId]
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      userId: row.user_id,
      provider: row.provider,
      providerAccountId: row.provider_account_id,
      providerEmail: row.provider_email,
      linkedAt: new Date(row.linked_at),
    };
  }

  return (
    cache.authAccounts.find(
      (item) => item.provider === provider && item.providerAccountId === providerAccountId
    ) ?? null
  );
}

export async function createAuthTransactionRecord(input: {
  state: string;
  provider: AuthTransactionRecord["provider"];
  inviteCode: string;
  expectedEmail: string;
  displayName: string | null;
  preferredLocale: string;
  nonce: string;
  expiresAt: Date;
}): Promise<AuthTransactionRecord> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }
  const record: AuthTransactionRecord = {
    id: makeId("authx"),
    state: input.state,
    provider: input.provider,
    inviteCode: input.inviteCode,
    expectedEmail: input.expectedEmail,
    displayName: input.displayName,
    preferredLocale: input.preferredLocale,
    nonce: input.nonce,
    expiresAt: input.expiresAt,
    consumedAt: null,
    createdAt: new Date(),
  };
  cache.authTransactions = upsertInCache(cache.authTransactions, record);

  if (hasDatabase()) {
    await getPool().query(
      `insert into auth_transactions (
         id, state, provider, invite_code, expected_email, display_name,
         preferred_locale, nonce, expires_at, consumed_at, created_at
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       on conflict (state) do update set
         provider = excluded.provider,
         invite_code = excluded.invite_code,
         expected_email = excluded.expected_email,
         display_name = excluded.display_name,
         preferred_locale = excluded.preferred_locale,
         nonce = excluded.nonce,
         expires_at = excluded.expires_at,
         consumed_at = excluded.consumed_at`,
      [
        record.id,
        record.state,
        record.provider,
        record.inviteCode,
        record.expectedEmail,
        record.displayName,
        record.preferredLocale,
        record.nonce,
        record.expiresAt,
        record.consumedAt,
        record.createdAt,
      ]
    );
  }

  return record;
}

export async function findAuthTransactionByState(state: string): Promise<AuthTransactionRecord | null> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    const result = await getPool().query<AuthTransactionRow>(
      `select id, state, provider, invite_code, expected_email, display_name, preferred_locale, nonce, expires_at, consumed_at, created_at
       from auth_transactions where state = $1 limit 1`,
      [state]
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      state: row.state,
      provider: row.provider,
      inviteCode: row.invite_code,
      expectedEmail: row.expected_email,
      displayName: row.display_name,
      preferredLocale: row.preferred_locale,
      nonce: row.nonce,
      expiresAt: new Date(row.expires_at),
      consumedAt: row.consumed_at ? new Date(row.consumed_at) : null,
      createdAt: new Date(row.created_at),
    };
  }
  return cache.authTransactions.find((item) => item.state === state) ?? null;
}

export async function markAuthTransactionConsumed(
  transactionId: string
): Promise<AuthTransactionRecord> {
  const current = cache.authTransactions.find((item) => item.id === transactionId);
  if (!current) {
    throw new Error("auth-transaction-not-found");
  }
  const updated: AuthTransactionRecord = {
    ...current,
    consumedAt: new Date(),
  };
  cache.authTransactions = upsertInCache(cache.authTransactions, updated);

  if (hasDatabase()) {
    await getPool().query(
      `update auth_transactions set consumed_at = $2 where id = $1`,
      [transactionId, updated.consumedAt]
    );
  }

  return updated;
}

export async function createAuthSessionRecord(input: {
  userId: string;
  token: string;
  expiresAt: Date;
  lastSeenAt: Date;
  revokedAt: Date | null;
}): Promise<AuthSessionRecord> {
  const record: AuthSessionRecord = {
    id: makeId("sess"),
    userId: input.userId,
    token: input.token,
    expiresAt: input.expiresAt,
    lastSeenAt: input.lastSeenAt,
    revokedAt: input.revokedAt,
  };
  cache.authSessions = upsertInCache(cache.authSessions, record);
  if (hasDatabase()) {
    await getPool().query(
      `insert into auth_sessions (id, user_id, token, expires_at, last_seen_at, revoked_at)
       values ($1,$2,$3,$4,$5,$6)
       on conflict (id) do nothing`,
      [record.id, record.userId, record.token, record.expiresAt, record.lastSeenAt, record.revokedAt]
    );
  }
  return record;
}

export async function findAuthSessionByToken(token: string): Promise<AuthSessionRecord | null> {
  if (hasDatabase()) {
    const result = await getPool().query<AuthSessionRow>(
      `select id, user_id, token, expires_at, last_seen_at, revoked_at from auth_sessions where token = $1 limit 1`,
      [token]
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      userId: row.user_id,
      token: row.token,
      expiresAt: new Date(row.expires_at),
      lastSeenAt: new Date(row.last_seen_at),
      revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
    };
  }
  return cache.authSessions.find((item) => item.token === token) ?? null;
}

export async function updateAuthSessionLastSeen(sessionId: string, lastSeenAt: Date, expiresAt: Date): Promise<void> {
  cache.authSessions = cache.authSessions.map((item) =>
    item.id === sessionId ? { ...item, lastSeenAt, expiresAt } : item
  );
  if (hasDatabase()) {
    await getPool().query(
      `update auth_sessions set last_seen_at = $2, expires_at = $3 where id = $1`,
      [sessionId, lastSeenAt, expiresAt]
    );
  }
}

export async function revokeAuthSession(tokenOrId: string): Promise<void> {
  const now = new Date();
  cache.authSessions = cache.authSessions.map((item) =>
    item.id === tokenOrId || item.token === tokenOrId ? { ...item, revokedAt: now } : item
  );
  if (hasDatabase()) {
    await getPool().query(
      `update auth_sessions set revoked_at = $2 where id = $1 or token = $1`,
      [tokenOrId, now]
    );
  }
}

export async function revokeAllSessionsForUser(userId: string): Promise<void> {
  const now = new Date();
  cache.authSessions = cache.authSessions.map((item) =>
    item.userId === userId ? { ...item, revokedAt: now } : item
  );
  if (hasDatabase()) {
    await getPool().query(
      `update auth_sessions set revoked_at = $2 where user_id = $1 and revoked_at is null`,
      [userId, now]
    );
  }
}

export async function createGroupRecord(input: {
  name: string;
  slug: string;
  createdByUserId: string;
}): Promise<GroupRecord> {
  const record: GroupRecord = {
    id: makeId("group"),
    name: input.name,
    slug: input.slug,
    createdByUserId: input.createdByUserId,
    createdAt: new Date(),
  };
  cache.groups = upsertInCache(cache.groups, record);
  if (hasDatabase()) {
    await getPool().query(
      `insert into auth_groups (id, name, slug, created_by_user_id, created_at)
       values ($1,$2,$3,$4,$5)
       on conflict (id) do nothing`,
      [record.id, record.name, record.slug, record.createdByUserId, record.createdAt]
    );
  }
  return record;
}

export async function updateGroupRecord(
  groupId: string,
  patch: Partial<Pick<GroupRecord, "name" | "slug">>
): Promise<GroupRecord> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }
  const current = cache.groups.find((item) => item.id === groupId);
  if (!current) {
    throw new Error("group-not-found");
  }
  const updated: GroupRecord = {
    ...current,
    ...patch,
  };
  cache.groups = upsertInCache(cache.groups, updated);
  if (hasDatabase()) {
    await getPool().query(
      `update auth_groups
       set name = $2, slug = $3
       where id = $1`,
      [groupId, updated.name, updated.slug]
    );
  }
  return updated;
}

export async function deleteGroupRecord(groupId: string): Promise<void> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }
  cache.groupSettings = cache.groupSettings.filter((item) => item.groupId !== groupId);
  cache.groupMemberships = cache.groupMemberships.filter((item) => item.groupId !== groupId);
  cache.groupInvites = cache.groupInvites.filter((item) => item.groupId !== groupId);
  cache.groups = cache.groups.filter((item) => item.id !== groupId);
  if (hasDatabase()) {
    await getPool().query(`delete from group_invites where group_id = $1`, [groupId]);
    await getPool().query(`delete from group_memberships where group_id = $1`, [groupId]);
    await getPool().query(`delete from group_settings where group_id = $1`, [groupId]);
    await getPool().query(`delete from auth_groups where id = $1`, [groupId]);
  }
}

export async function loadGroups(): Promise<GroupRecord[]> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    const result = await getPool().query<GroupRow>(
      `select id, name, slug, created_by_user_id, created_at from auth_groups order by slug asc`
    );
    cache.groups = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      createdByUserId: row.created_by_user_id,
      createdAt: new Date(row.created_at),
    }));
  }
  return [...cache.groups];
}

export async function findGroupById(groupId: string): Promise<GroupRecord | null> {
  const groups = await loadGroups();
  return groups.find((item) => item.id === groupId) ?? null;
}

export async function upsertGroupSettingsRecord(input: {
  groupId: string;
  defaultTrustSource?: string | null;
  defaultPki?: string | null;
  defaultJurisdiction?: string | null;
  predictiveEnabled?: boolean;
  predictiveWindowDays?: number;
}): Promise<GroupSettingsRecord> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }
  const existing = cache.groupSettings.find((item) => item.groupId === input.groupId);
  const record: GroupSettingsRecord = {
    groupId: input.groupId,
    defaultTrustSource: input.defaultTrustSource ?? existing?.defaultTrustSource ?? null,
    defaultPki: input.defaultPki ?? existing?.defaultPki ?? null,
    defaultJurisdiction: input.defaultJurisdiction ?? existing?.defaultJurisdiction ?? null,
    predictiveEnabled: input.predictiveEnabled ?? existing?.predictiveEnabled ?? true,
    predictiveWindowDays: input.predictiveWindowDays ?? existing?.predictiveWindowDays ?? 3,
    updatedAt: new Date(),
  };
  cache.groupSettings = cache.groupSettings.filter((item) => item.groupId !== record.groupId);
  cache.groupSettings.push(record);
  if (hasDatabase()) {
    await getPool().query(
      `insert into group_settings (
         group_id, default_trust_source, default_pki, default_jurisdiction,
         predictive_enabled, predictive_window_days, updated_at
       ) values ($1,$2,$3,$4,$5,$6,$7)
       on conflict (group_id) do update set
         default_trust_source = excluded.default_trust_source,
         default_pki = excluded.default_pki,
         default_jurisdiction = excluded.default_jurisdiction,
         predictive_enabled = excluded.predictive_enabled,
         predictive_window_days = excluded.predictive_window_days,
         updated_at = excluded.updated_at`,
      [
        record.groupId,
        record.defaultTrustSource,
        record.defaultPki,
        record.defaultJurisdiction,
        record.predictiveEnabled,
        record.predictiveWindowDays,
        record.updatedAt,
      ]
    );
  }
  return record;
}

export async function findGroupSettingsByGroupId(groupId: string): Promise<GroupSettingsRecord | null> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    const result = await getPool().query<GroupSettingsRow>(
      `select group_id, default_trust_source, default_pki, default_jurisdiction, predictive_enabled, predictive_window_days, updated_at from group_settings where group_id = $1 limit 1`,
      [groupId]
    );
    const row = result.rows[0];
    if (row) {
      return {
        groupId: row.group_id,
        defaultTrustSource: row.default_trust_source,
        defaultPki: row.default_pki,
        defaultJurisdiction: row.default_jurisdiction,
        predictiveEnabled: row.predictive_enabled,
        predictiveWindowDays: row.predictive_window_days,
        updatedAt: new Date(row.updated_at),
      };
    }
  }
  return cache.groupSettings.find((item) => item.groupId === groupId) ?? null;
}

export async function upsertPlatformSettingsRecord(input: {
  predictiveEnabled?: boolean;
  predictiveWindowDays?: number;
}): Promise<PlatformSettingsRecord> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }
  const existing = cache.platformSettings[0];
  const record: PlatformSettingsRecord = {
    id: "platform",
    predictiveEnabled: input.predictiveEnabled ?? existing?.predictiveEnabled ?? true,
    predictiveWindowDays: input.predictiveWindowDays ?? existing?.predictiveWindowDays ?? 3,
    updatedAt: new Date(),
  };
  cache.platformSettings = [record];
  if (hasDatabase()) {
    await getPool().query(
      `insert into platform_settings (id, predictive_enabled, predictive_window_days, updated_at)
       values ($1,$2,$3,$4)
       on conflict (id) do update set
         predictive_enabled = excluded.predictive_enabled,
         predictive_window_days = excluded.predictive_window_days,
         updated_at = excluded.updated_at`,
      [record.id, record.predictiveEnabled, record.predictiveWindowDays, record.updatedAt]
    );
  }
  return record;
}

export async function getPlatformSettingsRecord(): Promise<PlatformSettingsRecord> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    const result = await getPool().query<PlatformSettingsRow>(
      `select id, predictive_enabled, predictive_window_days, updated_at from platform_settings where id = 'platform' limit 1`
    );
    const row = result.rows[0];
    if (row) {
      return {
        id: "platform",
        predictiveEnabled: row.predictive_enabled,
        predictiveWindowDays: row.predictive_window_days,
        updatedAt: new Date(row.updated_at),
      };
    }
  }
  return cache.platformSettings[0] ?? {
    id: "platform",
    predictiveEnabled: true,
    predictiveWindowDays: 3,
    updatedAt: new Date(),
  };
}

export async function upsertProviderVerificationStatusRecord(input: {
  provider: ProviderVerificationStatusRecord["provider"];
  configured: boolean;
  verified: boolean;
  verifiedByUserId: string | null;
  notes?: string | null;
}): Promise<ProviderVerificationStatusRecord> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }
  const existing = cache.providerVerificationStatuses.find((item) => item.provider === input.provider);
  const record: ProviderVerificationStatusRecord = {
    provider: input.provider,
    configured: input.configured,
    verified: input.verified,
    verifiedAt: input.verified ? new Date() : null,
    verifiedByUserId: input.verified ? input.verifiedByUserId : null,
    notes: input.notes ?? existing?.notes ?? null,
    updatedAt: new Date(),
  };
  cache.providerVerificationStatuses = [
    ...cache.providerVerificationStatuses.filter((item) => item.provider !== record.provider),
    record,
  ];

  if (hasDatabase()) {
    await getPool().query(
      `insert into provider_verification_status (
         provider, configured, verified, verified_at, verified_by_user_id, notes, updated_at
       ) values ($1,$2,$3,$4,$5,$6,$7)
       on conflict (provider) do update set
         configured = excluded.configured,
         verified = excluded.verified,
         verified_at = excluded.verified_at,
         verified_by_user_id = excluded.verified_by_user_id,
         notes = excluded.notes,
         updated_at = excluded.updated_at`,
      [
        record.provider,
        record.configured,
        record.verified,
        record.verifiedAt,
        record.verifiedByUserId,
        record.notes,
        record.updatedAt,
      ]
    );
  }

  return record;
}

export async function findProviderVerificationStatus(
  provider: ProviderVerificationStatusRecord["provider"]
): Promise<ProviderVerificationStatusRecord | null> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    const result = await getPool().query<ProviderVerificationStatusRow>(
      `select provider, configured, verified, verified_at, verified_by_user_id, notes, updated_at
       from provider_verification_status where provider = $1 limit 1`,
      [provider]
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    return {
      provider: row.provider,
      configured: row.configured,
      verified: row.verified,
      verifiedAt: row.verified_at ? new Date(row.verified_at) : null,
      verifiedByUserId: row.verified_by_user_id,
      notes: row.notes,
      updatedAt: new Date(row.updated_at),
    };
  }
  return cache.providerVerificationStatuses.find((item) => item.provider === provider) ?? null;
}

export async function listProviderVerificationStatuses(): Promise<ProviderVerificationStatusRecord[]> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    await reloadRuntimeStoreCache();
  }
  return [...cache.providerVerificationStatuses];
}

export async function upsertProviderRuntimeOverrideRecord(input: {
  provider: ProviderRuntimeOverrideRecord["provider"];
  enabled: boolean;
  updatedByUserId: string | null;
}): Promise<ProviderRuntimeOverrideRecord> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }
  const record: ProviderRuntimeOverrideRecord = {
    provider: input.provider,
    enabled: input.enabled,
    updatedByUserId: input.updatedByUserId,
    updatedAt: new Date(),
  };
  cache.providerRuntimeOverrides = [
    ...cache.providerRuntimeOverrides.filter((item) => item.provider !== record.provider),
    record,
  ];
  if (hasDatabase()) {
    await getPool().query(
      `insert into provider_runtime_override (provider, enabled, updated_by_user_id, updated_at)
       values ($1,$2,$3,$4)
       on conflict (provider) do update set
         enabled = excluded.enabled,
         updated_by_user_id = excluded.updated_by_user_id,
         updated_at = excluded.updated_at`,
      [record.provider, record.enabled, record.updatedByUserId, record.updatedAt]
    );
  }
  return record;
}

export async function findProviderRuntimeOverride(
  provider: ProviderRuntimeOverrideRecord["provider"]
): Promise<ProviderRuntimeOverrideRecord | null> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    const result = await getPool().query<ProviderRuntimeOverrideRow>(
      `select provider, enabled, updated_by_user_id, updated_at
       from provider_runtime_override where provider = $1 limit 1`,
      [provider]
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    return {
      provider: row.provider,
      enabled: row.enabled,
      updatedByUserId: row.updated_by_user_id,
      updatedAt: new Date(row.updated_at),
    };
  }
  return cache.providerRuntimeOverrides.find((item) => item.provider === provider) ?? null;
}

export async function createGroupMembershipRecord(input: {
  userId: string;
  groupId: string;
  role: GroupMembershipRecord["role"];
}): Promise<GroupMembershipRecord> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }
  const existing = cache.groupMemberships.find(
    (item) => item.userId === input.userId && item.groupId === input.groupId
  );
  if (existing) {
    const updated = { ...existing, role: input.role };
    cache.groupMemberships = upsertInCache(cache.groupMemberships, updated);
    if (hasDatabase()) {
      await getPool().query(`update group_memberships set role = $2 where id = $1`, [updated.id, updated.role]);
    }
    return updated;
  }
  const record: GroupMembershipRecord = {
    id: makeId("gm"),
    userId: input.userId,
    groupId: input.groupId,
    role: input.role,
    createdAt: new Date(),
  };
  cache.groupMemberships = upsertInCache(cache.groupMemberships, record);
  if (hasDatabase()) {
    await getPool().query(
      `insert into group_memberships (id, user_id, group_id, role, created_at)
       values ($1,$2,$3,$4,$5)
       on conflict (id) do nothing`,
      [record.id, record.userId, record.groupId, record.role, record.createdAt]
    );
  }
  return record;
}

export async function listGroupMembershipsByUser(userId: string): Promise<GroupMembershipRecord[]> {
  if (hasDatabase()) {
    const result = await getPool().query<GroupMembershipRow>(
      `select id, user_id, group_id, role, created_at from group_memberships where user_id = $1 order by created_at asc`,
      [userId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      groupId: row.group_id,
      role: row.role,
      createdAt: new Date(row.created_at),
    }));
  }
  return cache.groupMemberships.filter((item) => item.userId === userId);
}

export async function findMembership(userId: string, groupId: string): Promise<GroupMembershipRecord | null> {
  const memberships = await listGroupMembershipsByUser(userId);
  return memberships.find((item) => item.groupId === groupId) ?? null;
}

export async function createGroupInviteRecord(input: {
  email: string;
  groupId: string;
  role: GroupInviteRecord["role"];
  expiresAt: Date;
  invitedByUserId: string;
}): Promise<GroupInviteRecord> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }
  const record: GroupInviteRecord = {
    id: makeId("invite"),
    code: makeId("code"),
    email: input.email,
    groupId: input.groupId,
    role: input.role,
    status: "pending",
    expiresAt: input.expiresAt,
    invitedByUserId: input.invitedByUserId,
    acceptedByUserId: null,
    createdAt: new Date(),
  };
  cache.groupInvites = upsertInCache(cache.groupInvites, record);
  if (hasDatabase()) {
    await getPool().query(
      `insert into group_invites (id, code, email, group_id, role, status, expires_at, invited_by_user_id, accepted_by_user_id, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       on conflict (id) do nothing`,
      [record.id, record.code, record.email, record.groupId, record.role, record.status, record.expiresAt, record.invitedByUserId, record.acceptedByUserId, record.createdAt]
    );
  }
  return record;
}

export async function updateGroupInviteRecord(
  inviteId: string,
  patch: Partial<Pick<GroupInviteRecord, "email" | "role" | "expiresAt" | "status">>
): Promise<GroupInviteRecord> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }
  const current = cache.groupInvites.find((item) => item.id === inviteId);
  if (!current) {
    throw new Error("invite-not-found");
  }
  const updated: GroupInviteRecord = { ...current, ...patch };
  if (hasDatabase()) {
    await getPool().query(
      `update group_invites
       set email = $2, role = $3, expires_at = $4, status = $5
       where id = $1`,
      [inviteId, updated.email, updated.role, updated.expiresAt, updated.status]
    );
  }
  cache.groupInvites = upsertInCache(cache.groupInvites, updated);
  return updated;
}

export async function markInviteAccepted(inviteId: string, acceptedByUserId: string): Promise<GroupInviteRecord> {
  const current = cache.groupInvites.find((item) => item.id === inviteId);
  if (!current) {
    throw new Error("invite-not-found");
  }
  const updated: GroupInviteRecord = { ...current, status: "accepted", acceptedByUserId };
  cache.groupInvites = upsertInCache(cache.groupInvites, updated);
  if (hasDatabase()) {
    await getPool().query(`update group_invites set status = 'accepted', accepted_by_user_id = $2 where id = $1`, [inviteId, acceptedByUserId]);
  }
  return updated;
}

export async function markInviteRevoked(inviteId: string): Promise<GroupInviteRecord> {
  const current = cache.groupInvites.find((item) => item.id === inviteId);
  if (!current) {
    throw new Error("invite-not-found");
  }
  const updated: GroupInviteRecord = { ...current, status: "revoked" };
  cache.groupInvites = upsertInCache(cache.groupInvites, updated);
  if (hasDatabase()) {
    await getPool().query(`update group_invites set status = 'revoked' where id = $1`, [inviteId]);
  }
  return updated;
}

export async function findGroupInviteByCode(code: string): Promise<GroupInviteRecord | null> {
  if (hasDatabase()) {
    const result = await getPool().query<GroupInviteRow>(
      `select id, code, email, group_id, role, status, expires_at, invited_by_user_id, accepted_by_user_id, created_at from group_invites where code = $1 limit 1`,
      [code]
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      code: row.code,
      email: row.email,
      groupId: row.group_id,
      role: row.role,
      status: row.status,
      expiresAt: new Date(row.expires_at),
      invitedByUserId: row.invited_by_user_id,
      acceptedByUserId: row.accepted_by_user_id,
      createdAt: new Date(row.created_at),
    };
  }
  return cache.groupInvites.find((item) => item.code === code) ?? null;
}

export async function listGroupInvitesByGroupId(groupId: string): Promise<GroupInviteRecord[]> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    const result = await getPool().query<GroupInviteRow>(
      `select id, code, email, group_id, role, status, expires_at, invited_by_user_id, accepted_by_user_id, created_at
       from group_invites
       where group_id = $1
       order by created_at desc`,
      [groupId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      code: row.code,
      email: row.email,
      groupId: row.group_id,
      role: row.role,
      status: row.status,
      expiresAt: new Date(row.expires_at),
      invitedByUserId: row.invited_by_user_id,
      acceptedByUserId: row.accepted_by_user_id,
      createdAt: new Date(row.created_at),
    }));
  }
  return cache.groupInvites.filter((item) => item.groupId === groupId);
}

export async function upsertPasswordResetRecord(input: {
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
}): Promise<PasswordResetRecord> {
  const record: PasswordResetRecord = {
    id: makeId("reset"),
    userId: input.userId,
    token: input.token,
    expiresAt: input.expiresAt,
    usedAt: input.usedAt,
  };
  cache.passwordResets = upsertInCache(cache.passwordResets, record);
  if (hasDatabase()) {
    await getPool().query(
      `insert into password_resets (id, user_id, token, expires_at, used_at)
       values ($1,$2,$3,$4,$5)
       on conflict (id) do nothing`,
      [record.id, record.userId, record.token, record.expiresAt, record.usedAt]
    );
  }
  return record;
}

export async function findPasswordResetByToken(token: string): Promise<PasswordResetRecord | null> {
  if (hasDatabase()) {
    const result = await getPool().query<PasswordResetRow>(
      `select id, user_id, token, expires_at, used_at from password_resets where token = $1 limit 1`,
      [token]
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      userId: row.user_id,
      token: row.token,
      expiresAt: new Date(row.expires_at),
      usedAt: row.used_at ? new Date(row.used_at) : null,
    };
  }
  return cache.passwordResets.find((item) => item.token === token) ?? null;
}

export async function markPasswordResetUsed(resetId: string): Promise<void> {
  const now = new Date();
  cache.passwordResets = cache.passwordResets.map((item) =>
    item.id === resetId ? { ...item, usedAt: now } : item
  );
  if (hasDatabase()) {
    await getPool().query(`update password_resets set used_at = $2 where id = $1`, [resetId, now]);
  }
}

export async function createAuditEventRecord(input: {
  actorUserId: string | null;
  targetUserId?: string | null;
  targetEmail?: string | null;
  groupId?: string | null;
  eventType: string;
  details: Record<string, unknown>;
}): Promise<AuditEventRecord> {
  const record: AuditEventRecord = {
    id: makeId("audit"),
    actorUserId: input.actorUserId,
    targetUserId: input.targetUserId ?? null,
    targetEmail: input.targetEmail ?? null,
    groupId: input.groupId ?? null,
    eventType: input.eventType,
    details: input.details,
    occurredAt: new Date(),
  };
  cache.auditEvents = upsertInCache(cache.auditEvents, record);
  if (hasDatabase()) {
    await getPool().query(
      `insert into audit_events (id, actor_user_id, target_user_id, target_email, group_id, event_type, details, occurred_at)
       values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)
       on conflict (id) do nothing`,
      [record.id, record.actorUserId, record.targetUserId, record.targetEmail, record.groupId, record.eventType, JSON.stringify(record.details), record.occurredAt]
    );
  }
  return record;
}

export async function loadAuditEvents(): Promise<AuditEventRecord[]> {
  if (hasDatabase()) {
    const result = await getPool().query<AuditEventRowEx>(
      `select id, actor_user_id, target_user_id, target_email, group_id, event_type, details::text as details, occurred_at from audit_events order by occurred_at asc`
    );
    cache.auditEvents = result.rows.map((row) => ({
      id: row.id,
      actorUserId: row.actor_user_id,
      targetUserId: row.target_user_id,
      targetEmail: row.target_email,
      groupId: row.group_id,
      eventType: row.event_type,
      details: JSON.parse(row.details),
      occurredAt: new Date(row.occurred_at),
    }));
  }
  return [...cache.auditEvents];
}

export async function upsertTargetGroupShare(input: { targetId: string; groupId: string }): Promise<TargetGroupShareRecord> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }
  const existing = cache.targetGroupShares.find((item) => item.targetId === input.targetId && item.groupId === input.groupId);
  if (existing) {
    return existing;
  }
  const record: TargetGroupShareRecord = {
    id: makeId("share"),
    targetId: input.targetId,
    groupId: input.groupId,
    createdAt: new Date(),
  };
  cache.targetGroupShares = upsertInCache(cache.targetGroupShares, record);
  if (hasDatabase()) {
    await getPool().query(
      `insert into target_group_shares (id, target_id, group_id, created_at)
       values ($1,$2,$3,$4)
       on conflict (id) do nothing`,
      [record.id, record.targetId, record.groupId, record.createdAt]
    );
  }
  return record;
}

export async function findTargetGroupIdsByTargetId(targetId: string): Promise<string[]> {
  if (hasDatabase()) {
    const result = await getPool().query<TargetGroupShareRow>(
      `select id, target_id, group_id, created_at from target_group_shares where target_id = $1 order by created_at asc`,
      [targetId]
    );
    return result.rows.map((row) => row.group_id);
  }
  return cache.targetGroupShares.filter((item) => item.targetId === targetId).map((item) => item.groupId);
}

export async function upsertCertificateRecord(input: {
  fingerprint: string;
  displayName: string;
  pemText: string;
  tags: string[];
  trustSource?: string | null;
  pki?: string | null;
  jurisdiction?: string | null;
  status: CertificateRecord["status"];
  sourceType: CertificateRecord["sourceType"];
  createdByUserId: string;
  templateId?: string | null;
}): Promise<{ record: CertificateRecord; operation: "imported" | "updated" }> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }
  const existing = cache.certificates.find((item) => item.fingerprint === input.fingerprint);
  const now = new Date();
  const record: CertificateRecord = existing
    ? {
        ...existing,
        displayName: input.displayName,
        pemText: input.pemText,
        tags: input.tags,
        trustSource: input.trustSource ?? existing.trustSource,
        pki: input.pki ?? existing.pki,
        jurisdiction: input.jurisdiction ?? existing.jurisdiction,
        status: input.status,
        sourceType: input.sourceType,
        templateId: input.templateId ?? existing.templateId,
        updatedAt: now,
      }
    : {
        id: makeId("cert"),
        fingerprint: input.fingerprint,
        displayName: input.displayName,
        pemText: input.pemText,
        tags: input.tags,
        trustSource: input.trustSource ?? null,
        pki: input.pki ?? null,
        jurisdiction: input.jurisdiction ?? null,
        status: input.status,
        sourceType: input.sourceType,
        createdByUserId: input.createdByUserId,
        templateId: input.templateId ?? null,
        createdAt: now,
        updatedAt: now,
      };

  cache.certificates = upsertInCache(cache.certificates, record);

  if (hasDatabase()) {
    await getPool().query(
      `
        insert into certificates (
          id, fingerprint, display_name, pem_text, tags, trust_source, pki, jurisdiction,
          status, source_type, created_by_user_id, template_id, created_at, updated_at
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        on conflict (fingerprint) do update set
          display_name = excluded.display_name,
          pem_text = excluded.pem_text,
          tags = excluded.tags,
          trust_source = excluded.trust_source,
          pki = excluded.pki,
          jurisdiction = excluded.jurisdiction,
          status = excluded.status,
          source_type = excluded.source_type,
          template_id = excluded.template_id,
          updated_at = excluded.updated_at
      `,
      [
        record.id,
        record.fingerprint,
        record.displayName,
        record.pemText,
        record.tags,
        record.trustSource,
        record.pki,
        record.jurisdiction,
        record.status,
        record.sourceType,
        record.createdByUserId,
        record.templateId,
        record.createdAt,
        record.updatedAt,
      ]
    );
  }

  return { record, operation: existing ? "updated" : "imported" };
}

function buildMonitoringSourceRecord(
  input: MonitoringSourceProvenanceInput,
  existing?: MonitoringSourceRecord
): MonitoringSourceRecord {
  const now = new Date();
  const sourceKey = buildMonitoringSourceKey({
    fingerprint: input.fingerprint,
    sourceType: input.sourceType,
    normalizedUrl: input.normalizedUrl,
    documentRole: input.documentRole,
    policyOid: input.policyOid,
  });
  return {
    id: existing?.id ?? makeId("msrc"),
    sourceKey,
    certificateId: input.certificateId,
    fingerprint: input.fingerprint,
    sourceType: input.sourceType,
    sourceUrl: input.sourceUrl,
    normalizedUrl: input.normalizedUrl,
    documentRole: input.documentRole,
    policyOid: input.policyOid,
    state: input.state,
    derivationReason: input.derivationReason,
    trustListSourceId: input.trustListSourceId ?? existing?.trustListSourceId ?? null,
    trustListSnapshotId: input.trustListSnapshotId ?? existing?.trustListSnapshotId ?? null,
    trustListRunId: input.trustListRunId ?? existing?.trustListRunId ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export async function upsertMonitoringSourceRecord(
  input: MonitoringSourceProvenanceInput
): Promise<MonitoringSourceRecord> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }

  const sourceKey = buildMonitoringSourceKey({
    fingerprint: input.fingerprint,
    sourceType: input.sourceType,
    normalizedUrl: input.normalizedUrl,
    documentRole: input.documentRole,
    policyOid: input.policyOid,
  });
  const existing = cache.monitoringSources.find((item) => item.sourceKey === sourceKey);
  const record = buildMonitoringSourceRecord(input, existing);
  const cacheIndex = cache.monitoringSources.findIndex((item) => item.sourceKey === record.sourceKey);
  cache.monitoringSources =
    cacheIndex === -1
      ? [...cache.monitoringSources, record]
      : cache.monitoringSources.map((item, index) => (index === cacheIndex ? record : item));

  if (hasDatabase()) {
    const result = await getPool().query<MonitoringSourceRow>(
      `
        insert into monitoring_sources (
          id, source_key, certificate_id, fingerprint, source_type, source_url, normalized_url,
          document_role, policy_oid, state, derivation_reason, trust_list_source_id,
          trust_list_snapshot_id, trust_list_run_id, created_at, updated_at
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        on conflict (source_key) do update set
          certificate_id = excluded.certificate_id,
          fingerprint = excluded.fingerprint,
          source_type = excluded.source_type,
          source_url = excluded.source_url,
          normalized_url = excluded.normalized_url,
          document_role = excluded.document_role,
          policy_oid = excluded.policy_oid,
          state = excluded.state,
          derivation_reason = excluded.derivation_reason,
          trust_list_source_id = excluded.trust_list_source_id,
          trust_list_snapshot_id = excluded.trust_list_snapshot_id,
          trust_list_run_id = excluded.trust_list_run_id,
          updated_at = excluded.updated_at
        returning id, source_key, certificate_id, fingerprint, source_type, source_url,
          normalized_url, document_role, policy_oid, state, derivation_reason,
          trust_list_source_id, trust_list_snapshot_id, trust_list_run_id, created_at, updated_at
      `,
      [
        record.id,
        record.sourceKey,
        record.certificateId,
        record.fingerprint,
        record.sourceType,
        record.sourceUrl,
        record.normalizedUrl,
        record.documentRole,
        record.policyOid,
        record.state,
        record.derivationReason,
        record.trustListSourceId,
        record.trustListSnapshotId,
        record.trustListRunId,
        record.createdAt,
        record.updatedAt,
      ]
    );
    const stored = mapMonitoringSourceRow(result.rows[0]);
    cache.monitoringSources = cache.monitoringSources.map((item) =>
      item.sourceKey === stored.sourceKey ? stored : item
    );
    return stored;
  }

  return record;
}

export async function listMonitoringSourceRecords(): Promise<MonitoringSourceRecord[]> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    const result = await getPool().query<MonitoringSourceRow>(
      `select id, source_key, certificate_id, fingerprint, source_type, source_url, normalized_url, document_role, policy_oid, state, derivation_reason, trust_list_source_id, trust_list_snapshot_id, trust_list_run_id, created_at, updated_at from monitoring_sources order by updated_at desc`
    );
    cache.monitoringSources = result.rows.map(mapMonitoringSourceRow);
  }
  return [...cache.monitoringSources];
}

export async function listMonitoringSourcesForCertificate(
  certificateId: string
): Promise<MonitoringSourceRecord[]> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    const result = await getPool().query<MonitoringSourceRow>(
      `select id, source_key, certificate_id, fingerprint, source_type, source_url, normalized_url, document_role, policy_oid, state, derivation_reason, trust_list_source_id, trust_list_snapshot_id, trust_list_run_id, created_at, updated_at from monitoring_sources where certificate_id = $1 order by updated_at desc`,
      [certificateId]
    );
    return result.rows.map(mapMonitoringSourceRow);
  }
  return cache.monitoringSources.filter((item) => item.certificateId === certificateId);
}

export async function findMonitoringSourceByKey(
  sourceKey: string
): Promise<MonitoringSourceRecord | null> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    const result = await getPool().query<MonitoringSourceRow>(
      `select id, source_key, certificate_id, fingerprint, source_type, source_url, normalized_url, document_role, policy_oid, state, derivation_reason, trust_list_source_id, trust_list_snapshot_id, trust_list_run_id, created_at, updated_at from monitoring_sources where source_key = $1 limit 1`,
      [sourceKey]
    );
    return result.rows[0] ? mapMonitoringSourceRow(result.rows[0]) : null;
  }
  return cache.monitoringSources.find((item) => item.sourceKey === sourceKey) ?? null;
}

type MonitoringSourceEventInput = Omit<MonitoringSourceEventRecord, "id" | "checkedAt"> & {
  id?: string;
  checkedAt?: Date;
};

type DocumentSnapshotInput = Omit<DocumentSnapshotRecord, "id" | "capturedAt"> & {
  id?: string;
  capturedAt?: Date;
};

function buildMonitoringSourceEventRecord(
  input: MonitoringSourceEventInput
): MonitoringSourceEventRecord {
  return {
    id: input.id ?? makeId("msrc-event"),
    sourceId: input.sourceId,
    sourceKey: input.sourceKey,
    sourceType: input.sourceType,
    status: input.status,
    statusLabel: input.statusLabel,
    checkedAt: input.checkedAt ?? new Date(),
    durationMs: input.durationMs,
    httpStatus: input.httpStatus,
    contentType: input.contentType,
    contentLength: input.contentLength,
    contentSha256: input.contentSha256,
    failureReason: input.failureReason,
    snapshotId: input.snapshotId,
  };
}

export async function recordMonitoringSourceEvent(
  input: MonitoringSourceEventInput
): Promise<MonitoringSourceEventRecord> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }

  const record = buildMonitoringSourceEventRecord(input);
  cache.monitoringSourceEvents = upsertInCache(cache.monitoringSourceEvents, record);

  if (hasDatabase()) {
    const result = await getPool().query<MonitoringSourceEventRow>(
      `
        insert into monitoring_source_events (
          id, source_id, source_key, source_type, status, status_label, checked_at,
          duration_ms, http_status, content_type, content_length, content_sha256,
          failure_reason, snapshot_id
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        returning id, source_id, source_key, source_type, status, status_label,
          checked_at, duration_ms, http_status, content_type, content_length,
          content_sha256, failure_reason, snapshot_id
      `,
      [
        record.id,
        record.sourceId,
        record.sourceKey,
        record.sourceType,
        record.status,
        record.statusLabel,
        record.checkedAt,
        record.durationMs,
        record.httpStatus,
        record.contentType,
        record.contentLength,
        record.contentSha256,
        record.failureReason,
        record.snapshotId,
      ]
    );
    const stored = mapMonitoringSourceEventRow(result.rows[0]);
    cache.monitoringSourceEvents = upsertInCache(cache.monitoringSourceEvents, stored);
    return stored;
  }

  return record;
}

function buildDocumentSnapshotRecord(input: DocumentSnapshotInput): DocumentSnapshotRecord {
  return {
    id: input.id ?? makeId("doc-snapshot"),
    sourceId: input.sourceId,
    sourceKey: input.sourceKey,
    certificateId: input.certificateId,
    fingerprint: input.fingerprint,
    sourceUrl: input.sourceUrl,
    normalizedUrl: input.normalizedUrl,
    finalUrl: input.finalUrl,
    policyOid: input.policyOid,
    documentRole: input.documentRole,
    trustListSourceId: input.trustListSourceId,
    trustListSnapshotId: input.trustListSnapshotId,
    trustListRunId: input.trustListRunId,
    contentType: input.contentType,
    sizeBytes: input.sizeBytes,
    sha256: input.sha256,
    rawBodyBase64: input.rawBodyBase64,
    extractedText: input.extractedText,
    extractedTextTruncated: input.extractedTextTruncated,
    extractionStatus: input.extractionStatus,
    extractionFailureReason: input.extractionFailureReason,
    metadataJson: input.metadataJson,
    capturedAt: input.capturedAt ?? new Date(),
  };
}

export async function recordDocumentSnapshot(
  input: DocumentSnapshotInput
): Promise<DocumentSnapshotRecord> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }

  const record = buildDocumentSnapshotRecord(input);
  cache.documentSnapshots = upsertInCache(cache.documentSnapshots, record);

  if (hasDatabase()) {
    const result = await getPool().query<DocumentSnapshotRow>(
      `
        insert into document_snapshots (
          id, source_id, source_key, certificate_id, fingerprint, source_url,
          normalized_url, final_url, policy_oid, document_role, trust_list_source_id,
          trust_list_snapshot_id, trust_list_run_id, content_type, size_bytes, sha256,
          raw_body, extracted_text, extracted_text_truncated, extraction_status,
          extraction_failure_reason, metadata_json, captured_at
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
        on conflict (source_id, sha256) do update set
          extracted_text = excluded.extracted_text,
          extracted_text_truncated = excluded.extracted_text_truncated,
          extraction_status = excluded.extraction_status,
          extraction_failure_reason = excluded.extraction_failure_reason,
          metadata_json = excluded.metadata_json
        returning id, source_id, source_key, certificate_id, fingerprint, source_url,
          normalized_url, final_url, policy_oid, document_role, trust_list_source_id,
          trust_list_snapshot_id, trust_list_run_id, content_type, size_bytes, sha256,
          raw_body, extracted_text, extracted_text_truncated, extraction_status,
          extraction_failure_reason, metadata_json, captured_at
      `,
      [
        record.id,
        record.sourceId,
        record.sourceKey,
        record.certificateId,
        record.fingerprint,
        record.sourceUrl,
        record.normalizedUrl,
        record.finalUrl,
        record.policyOid,
        record.documentRole,
        record.trustListSourceId,
        record.trustListSnapshotId,
        record.trustListRunId,
        record.contentType,
        record.sizeBytes,
        record.sha256,
        Buffer.from(record.rawBodyBase64, "base64"),
        record.extractedText,
        record.extractedTextTruncated,
        record.extractionStatus,
        record.extractionFailureReason,
        JSON.stringify(record.metadataJson),
        record.capturedAt,
      ]
    );
    const stored = mapDocumentSnapshotRow(result.rows[0]);
    cache.documentSnapshots = upsertInCache(cache.documentSnapshots, stored);
    return stored;
  }

  return record;
}

export async function findLatestDocumentSnapshotForSource(
  sourceId: string
): Promise<DocumentSnapshotRecord | null> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    const result = await getPool().query<DocumentSnapshotRow>(
      `select id, source_id, source_key, certificate_id, fingerprint, source_url, normalized_url, final_url, policy_oid, document_role, trust_list_source_id, trust_list_snapshot_id, trust_list_run_id, content_type, size_bytes, sha256, raw_body, extracted_text, extracted_text_truncated, extraction_status, extraction_failure_reason, metadata_json, captured_at from document_snapshots where source_id = $1 order by captured_at desc limit 1`,
      [sourceId]
    );
    return result.rows[0] ? mapDocumentSnapshotRow(result.rows[0]) : null;
  }

  return (
    cache.documentSnapshots
      .filter((item) => item.sourceId === sourceId)
      .sort((left, right) => right.capturedAt.getTime() - left.capturedAt.getTime())[0] ?? null
  );
}

export async function listDocumentSnapshotsForSource(
  sourceId: string
): Promise<DocumentSnapshotRecord[]> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    const result = await getPool().query<DocumentSnapshotRow>(
      `select id, source_id, source_key, certificate_id, fingerprint, source_url, normalized_url, final_url, policy_oid, document_role, trust_list_source_id, trust_list_snapshot_id, trust_list_run_id, content_type, size_bytes, sha256, raw_body, extracted_text, extracted_text_truncated, extraction_status, extraction_failure_reason, metadata_json, captured_at from document_snapshots where source_id = $1 order by captured_at desc`,
      [sourceId]
    );
    return result.rows.map(mapDocumentSnapshotRow);
  }

  return cache.documentSnapshots
    .filter((item) => item.sourceId === sourceId)
    .sort((left, right) => right.capturedAt.getTime() - left.capturedAt.getTime());
}

export async function listMonitoringSourceEventsForSource(
  sourceId: string
): Promise<MonitoringSourceEventRecord[]> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    const result = await getPool().query<MonitoringSourceEventRow>(
      `select id, source_id, source_key, source_type, status, status_label, checked_at, duration_ms, http_status, content_type, content_length, content_sha256, failure_reason, snapshot_id from monitoring_source_events where source_id = $1 order by checked_at desc`,
      [sourceId]
    );
    return result.rows.map(mapMonitoringSourceEventRow);
  }

  return cache.monitoringSourceEvents
    .filter((item) => item.sourceId === sourceId)
    .sort((left, right) => right.checkedAt.getTime() - left.checkedAt.getTime());
}

type OcspCheckEventInput = Omit<OcspCheckEventRecord, "id" | "checkedAt"> & {
  id?: string;
  checkedAt?: Date;
};

type OcspResponseEvidenceInput = Omit<OcspResponseEvidenceRecord, "id" | "checkedAt"> & {
  id?: string;
  checkedAt?: Date;
};

function buildOcspCheckEventRecord(input: OcspCheckEventInput): OcspCheckEventRecord {
  return {
    id: input.id ?? makeId("ocsp-event"),
    sourceId: input.sourceId,
    sourceKey: input.sourceKey,
    status: input.status,
    statusLabel: input.statusLabel,
    checkedAt: input.checkedAt ?? new Date(),
    durationMs: input.durationMs,
    httpStatus: input.httpStatus,
    contentType: input.contentType,
    responseSizeBytes: input.responseSizeBytes,
    responseSha256: input.responseSha256,
    failureReason: input.failureReason,
    evidenceId: input.evidenceId,
  };
}

function buildOcspResponseEvidenceRecord(
  input: OcspResponseEvidenceInput
): OcspResponseEvidenceRecord {
  return {
    id: input.id ?? makeId("ocsp-evidence"),
    sourceId: input.sourceId,
    sourceKey: input.sourceKey,
    certificateId: input.certificateId,
    certificateFingerprint: input.certificateFingerprint,
    issuerCertificateId: input.issuerCertificateId,
    issuerFingerprint: input.issuerFingerprint,
    responderUrl: input.responderUrl,
    finalUrl: input.finalUrl,
    requestBodyBase64: input.requestBodyBase64,
    requestSha256: input.requestSha256,
    requestSizeBytes: input.requestSizeBytes,
    responseBodyBase64: input.responseBodyBase64,
    responseSha256: input.responseSha256,
    responseSizeBytes: input.responseSizeBytes,
    httpStatus: input.httpStatus,
    contentType: input.contentType,
    parseStatus: input.parseStatus,
    parseFailureReason: input.parseFailureReason,
    metadataJson: input.metadataJson,
    checkedAt: input.checkedAt ?? new Date(),
  };
}

export async function recordOcspCheckEvent(
  input: OcspCheckEventInput
): Promise<OcspCheckEventRecord> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }

  const record = buildOcspCheckEventRecord(input);
  cache.ocspCheckEvents = upsertInCache(cache.ocspCheckEvents, record);

  if (hasDatabase()) {
    const result = await getPool().query<OcspCheckEventRow>(
      `
        insert into ocsp_check_events (
          id, source_id, source_key, status, status_label, checked_at, duration_ms,
          http_status, content_type, response_size_bytes, response_sha256,
          failure_reason, evidence_id
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        returning id, source_id, source_key, status, status_label, checked_at,
          duration_ms, http_status, content_type, response_size_bytes,
          response_sha256, failure_reason, evidence_id
      `,
      [
        record.id,
        record.sourceId,
        record.sourceKey,
        record.status,
        record.statusLabel,
        record.checkedAt,
        record.durationMs,
        record.httpStatus,
        record.contentType,
        record.responseSizeBytes,
        record.responseSha256,
        record.failureReason,
        record.evidenceId,
      ]
    );
    const stored = mapOcspCheckEventRow(result.rows[0]);
    cache.ocspCheckEvents = upsertInCache(cache.ocspCheckEvents, stored);
    return stored;
  }

  return record;
}

export async function recordOcspResponseEvidence(
  input: OcspResponseEvidenceInput
): Promise<OcspResponseEvidenceRecord> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }

  const record = buildOcspResponseEvidenceRecord(input);
  cache.ocspResponseEvidence = upsertInCache(cache.ocspResponseEvidence, record);

  if (hasDatabase()) {
    const result = await getPool().query<OcspResponseEvidenceRow>(
      `
        insert into ocsp_response_evidence (
          id, source_id, source_key, certificate_id, certificate_fingerprint,
          issuer_certificate_id, issuer_fingerprint, responder_url, final_url,
          request_body, request_sha256, request_size_bytes, response_body,
          response_sha256, response_size_bytes, http_status, content_type,
          parse_status, parse_failure_reason, metadata_json, checked_at
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
        returning id, source_id, source_key, certificate_id, certificate_fingerprint,
          issuer_certificate_id, issuer_fingerprint, responder_url, final_url,
          request_body, request_sha256, request_size_bytes, response_body,
          response_sha256, response_size_bytes, http_status, content_type,
          parse_status, parse_failure_reason, metadata_json, checked_at
      `,
      [
        record.id,
        record.sourceId,
        record.sourceKey,
        record.certificateId,
        record.certificateFingerprint,
        record.issuerCertificateId,
        record.issuerFingerprint,
        record.responderUrl,
        record.finalUrl,
        Buffer.from(record.requestBodyBase64, "base64"),
        record.requestSha256,
        record.requestSizeBytes,
        record.responseBodyBase64 ? Buffer.from(record.responseBodyBase64, "base64") : null,
        record.responseSha256,
        record.responseSizeBytes,
        record.httpStatus,
        record.contentType,
        record.parseStatus,
        record.parseFailureReason,
        JSON.stringify(record.metadataJson),
        record.checkedAt,
      ]
    );
    const stored = mapOcspResponseEvidenceRow(result.rows[0]);
    cache.ocspResponseEvidence = upsertInCache(cache.ocspResponseEvidence, stored);
    return stored;
  }

  return record;
}

export async function listOcspCheckEventsForSource(
  sourceId: string
): Promise<OcspCheckEventRecord[]> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    const result = await getPool().query<OcspCheckEventRow>(
      `select id, source_id, source_key, status, status_label, checked_at, duration_ms, http_status, content_type, response_size_bytes, response_sha256, failure_reason, evidence_id from ocsp_check_events where source_id = $1 order by checked_at desc`,
      [sourceId]
    );
    return result.rows.map(mapOcspCheckEventRow);
  }

  return cache.ocspCheckEvents
    .filter((item) => item.sourceId === sourceId)
    .sort((left, right) => right.checkedAt.getTime() - left.checkedAt.getTime());
}

export async function listOcspResponseEvidenceForSource(
  sourceId: string
): Promise<OcspResponseEvidenceRecord[]> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    const result = await getPool().query<OcspResponseEvidenceRow>(
      `select id, source_id, source_key, certificate_id, certificate_fingerprint, issuer_certificate_id, issuer_fingerprint, responder_url, final_url, request_body, request_sha256, request_size_bytes, response_body, response_sha256, response_size_bytes, http_status, content_type, parse_status, parse_failure_reason, metadata_json, checked_at from ocsp_response_evidence where source_id = $1 order by checked_at desc`,
      [sourceId]
    );
    return result.rows.map(mapOcspResponseEvidenceRow);
  }

  return cache.ocspResponseEvidence
    .filter((item) => item.sourceId === sourceId)
    .sort((left, right) => right.checkedAt.getTime() - left.checkedAt.getTime());
}

export async function listCertificateRecords(): Promise<CertificateRecord[]> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    const result = await getPool().query<{
      id: string;
      fingerprint: string;
      display_name: string;
      pem_text: string;
      tags: string[];
      trust_source: string | null;
      pki: string | null;
      jurisdiction: string | null;
      status: "active" | "disabled";
      source_type: "single" | "zip" | "template" | "trust-list";
      created_by_user_id: string;
      template_id: string | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `select id, fingerprint, display_name, pem_text, tags, trust_source, pki, jurisdiction, status, source_type, created_by_user_id, template_id, created_at, updated_at from certificates order by updated_at desc`
    );
    cache.certificates = result.rows.map((row) => ({
      id: row.id,
      fingerprint: row.fingerprint,
      displayName: row.display_name,
      pemText: row.pem_text,
      tags: row.tags,
      trustSource: row.trust_source,
      pki: row.pki,
      jurisdiction: row.jurisdiction,
      status: row.status,
      sourceType: row.source_type,
      createdByUserId: row.created_by_user_id,
      templateId: row.template_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }
  return [...cache.certificates];
}

export async function findCertificateById(certificateId: string): Promise<CertificateRecord | null> {
  const certificates = await listCertificateRecords();
  return certificates.find((item) => item.id === certificateId) ?? null;
}

export async function findCertificateByFingerprint(
  fingerprint: string
): Promise<CertificateRecord | null> {
  const certificates = await listCertificateRecords();
  return certificates.find((item) => item.fingerprint === fingerprint) ?? null;
}

export async function createCertificateImportRun(input: {
  mode: CertificateImportRunRecord["mode"];
  actorUserId: string;
  summary?: Record<string, unknown>;
}): Promise<CertificateImportRunRecord> {
  const record: CertificateImportRunRecord = {
    id: makeId("cert-run"),
    mode: input.mode,
    actorUserId: input.actorUserId,
    status: "running",
    summary: input.summary ?? {},
    startedAt: new Date(),
    completedAt: null,
  };
  cache.certificateImportRuns = upsertInCache(cache.certificateImportRuns, record);
  if (hasDatabase()) {
    await getPool().query(
      `insert into certificate_import_runs (id, mode, actor_user_id, status, summary, started_at, completed_at)
       values ($1,$2,$3,$4,$5::jsonb,$6,$7)`,
      [
        record.id,
        record.mode,
        record.actorUserId,
        record.status,
        JSON.stringify(record.summary),
        record.startedAt,
        record.completedAt,
      ]
    );
  }
  return record;
}

export async function findCertificateImportRun(runId: string): Promise<CertificateImportRunRecord | null> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    const result = await getPool().query<{
      id: string;
      mode: CertificateImportRunRecord["mode"];
      actor_user_id: string;
      status: CertificateImportRunRecord["status"];
      summary: Record<string, unknown> | string;
      started_at: Date;
      completed_at: Date | null;
    }>(
      `select id, mode, actor_user_id, status, summary, started_at, completed_at from certificate_import_runs where id = $1`,
      [runId]
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      mode: row.mode,
      actorUserId: row.actor_user_id,
      status: row.status,
      summary: typeof row.summary === "string" ? JSON.parse(row.summary) : row.summary,
      startedAt: new Date(row.started_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
    };
  }
  return cache.certificateImportRuns.find((item) => item.id === runId) ?? null;
}

export async function completeCertificateImportRun(
  runId: string,
  summary: Record<string, unknown>,
  status: CertificateImportRunRecord["status"] = "completed"
): Promise<void> {
  const completedAt = new Date();
  cache.certificateImportRuns = cache.certificateImportRuns.map((item) =>
    item.id === runId ? { ...item, status, summary, completedAt } : item
  );
  if (hasDatabase()) {
    await getPool().query(
      `update certificate_import_runs set status = $2, summary = $3::jsonb, completed_at = $4 where id = $1`,
      [runId, status, JSON.stringify(summary), completedAt]
    );
  }
}

export async function recordCertificateImportItem(input: {
  runId: string;
  certificateId: string | null;
  filename: string;
  fingerprint: string | null;
  result: CertificateImportItemRecord["result"];
  message?: string | null;
}): Promise<CertificateImportItemRecord> {
  const record: CertificateImportItemRecord = {
    id: makeId("cert-item"),
    runId: input.runId,
    certificateId: input.certificateId,
    filename: input.filename,
    fingerprint: input.fingerprint,
    result: input.result,
    message: input.message ?? null,
    createdAt: new Date(),
  };
  cache.certificateImportItems = upsertInCache(cache.certificateImportItems, record);
  if (hasDatabase()) {
    await getPool().query(
      `insert into certificate_import_items (id, run_id, certificate_id, filename, fingerprint, result, message, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        record.id,
        record.runId,
        record.certificateId,
        record.filename,
        record.fingerprint,
        record.result,
        record.message,
        record.createdAt,
      ]
    );
  }
  return record;
}

export async function recordCertificateReviewOutcome(input: {
  runId: string;
  filename: string;
  fingerprint: string | null;
  decision: "ignore" | "reject" | "duplicate" | "pending";
  reason?: string | null;
}): Promise<CertificateImportItemRecord> {
  return recordCertificateImportItem({
    runId: input.runId,
    certificateId: null,
    filename: input.filename,
    fingerprint: input.fingerprint,
    result: "ignored",
    message: `review:${input.decision}${input.reason ? `:${input.reason}` : ""}`,
  });
}

export async function listCertificateImportItems(
  runId: string
): Promise<CertificateImportItemRecord[]> {
  if (hasDatabase()) {
    const result = await getPool().query<{
      id: string;
      run_id: string;
      certificate_id: string | null;
      filename: string;
      fingerprint: string | null;
      result: CertificateImportItemRecord["result"];
      message: string | null;
      created_at: Date;
    }>(
      `select id, run_id, certificate_id, filename, fingerprint, result, message, created_at from certificate_import_items where run_id = $1 order by created_at asc`,
      [runId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      runId: row.run_id,
      certificateId: row.certificate_id,
      filename: row.filename,
      fingerprint: row.fingerprint,
      result: row.result,
      message: row.message,
      createdAt: new Date(row.created_at),
    }));
  }
  return cache.certificateImportItems.filter((item) => item.runId === runId);
}

export async function upsertCertificateCrlLink(input: {
  certificateId: string;
  crlUrl: string;
  ignored: boolean;
  runtimeTargetId?: string | null;
}): Promise<CertificateCrlLinkRecord> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }
  const existing = cache.certificateCrlLinks.find(
    (item) => item.certificateId === input.certificateId && item.crlUrl === input.crlUrl
  );
  const now = new Date();
  const record: CertificateCrlLinkRecord = existing
    ? {
        ...existing,
        ignored: input.ignored,
        runtimeTargetId: input.runtimeTargetId ?? existing.runtimeTargetId,
        updatedAt: now,
      }
    : {
        id: makeId("cert-crl"),
        certificateId: input.certificateId,
        crlUrl: input.crlUrl,
        ignored: input.ignored,
        runtimeTargetId: input.runtimeTargetId ?? null,
        createdAt: now,
        updatedAt: now,
      };
  cache.certificateCrlLinks = upsertInCache(cache.certificateCrlLinks, record);
  if (hasDatabase()) {
    await getPool().query(
      `
        insert into certificate_crl_links (
          id, certificate_id, crl_url, ignored, runtime_target_id, created_at, updated_at
        ) values ($1,$2,$3,$4,$5,$6,$7)
        on conflict (id) do update set
          ignored = excluded.ignored,
          runtime_target_id = excluded.runtime_target_id,
          updated_at = excluded.updated_at
      `,
      [
        record.id,
        record.certificateId,
        record.crlUrl,
        record.ignored,
        record.runtimeTargetId,
        record.createdAt,
        record.updatedAt,
      ]
    );
  }
  return record;
}

export async function listCertificateCrlLinks(
  certificateId: string
): Promise<CertificateCrlLinkRecord[]> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    const result = await getPool().query<{
      id: string;
      certificate_id: string;
      crl_url: string;
      ignored: boolean;
      runtime_target_id: string | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `select id, certificate_id, crl_url, ignored, runtime_target_id, created_at, updated_at from certificate_crl_links where certificate_id = $1 order by created_at asc`,
      [certificateId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      certificateId: row.certificate_id,
      crlUrl: row.crl_url,
      ignored: row.ignored,
      runtimeTargetId: row.runtime_target_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }
  return cache.certificateCrlLinks.filter((item) => item.certificateId === certificateId);
}

export async function upsertCertificateGroupShare(input: {
  certificateId: string;
  groupId: string;
}): Promise<CertificateGroupShareRecord> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }
  const existing = cache.certificateGroupShares.find(
    (item) => item.certificateId === input.certificateId && item.groupId === input.groupId
  );
  if (existing) {
    return existing;
  }
  const record: CertificateGroupShareRecord = {
    id: makeId("cert-share"),
    certificateId: input.certificateId,
    groupId: input.groupId,
    createdAt: new Date(),
  };
  cache.certificateGroupShares = upsertInCache(cache.certificateGroupShares, record);
  if (hasDatabase()) {
    await getPool().query(
      `insert into certificate_group_shares (id, certificate_id, group_id, created_at)
       values ($1,$2,$3,$4)`,
      [record.id, record.certificateId, record.groupId, record.createdAt]
    );
  }
  return record;
}

export async function listCertificateGroupShares(
  certificateId: string
): Promise<CertificateGroupShareRecord[]> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    const result = await getPool().query<{
      id: string;
      certificate_id: string;
      group_id: string;
      created_at: Date;
    }>(
      `select id, certificate_id, group_id, created_at from certificate_group_shares where certificate_id = $1 order by created_at asc`,
      [certificateId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      certificateId: row.certificate_id,
      groupId: row.group_id,
      createdAt: new Date(row.created_at),
    }));
  }
  return cache.certificateGroupShares.filter((item) => item.certificateId === certificateId);
}

export async function listCertificateGroupIds(certificateId: string): Promise<string[]> {
  const shares = await listCertificateGroupShares(certificateId);
  return shares.map((item) => item.groupId);
}

export async function upsertCertificateGroupOverride(input: {
  certificateId: string;
  groupId: string;
  intervalSeconds?: number | null;
  timeoutSeconds?: number | null;
  criticality?: "low" | "medium" | "high" | null;
  alertEmail?: string | null;
  extraRecipients?: string[];
  trustSource?: string | null;
  pki?: string | null;
  jurisdiction?: string | null;
  retentionPollsDays?: number | null;
  retentionAlertsDays?: number | null;
  retentionCoverageGapsDays?: number | null;
  enabled?: boolean | null;
}): Promise<CertificateGroupOverrideRecord> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }
  const existing = cache.certificateGroupOverrides.find(
    (item) => item.certificateId === input.certificateId && item.groupId === input.groupId
  );
  const now = new Date();
  const record: CertificateGroupOverrideRecord = existing
    ? {
        ...existing,
        intervalSeconds: input.intervalSeconds ?? existing.intervalSeconds,
        timeoutSeconds: input.timeoutSeconds ?? existing.timeoutSeconds,
        criticality: input.criticality ?? existing.criticality,
        alertEmail: input.alertEmail ?? existing.alertEmail,
        extraRecipients: input.extraRecipients ?? existing.extraRecipients,
        trustSource: input.trustSource ?? existing.trustSource,
        pki: input.pki ?? existing.pki,
        jurisdiction: input.jurisdiction ?? existing.jurisdiction,
        retentionPollsDays: input.retentionPollsDays ?? existing.retentionPollsDays,
        retentionAlertsDays: input.retentionAlertsDays ?? existing.retentionAlertsDays,
        retentionCoverageGapsDays:
          input.retentionCoverageGapsDays ?? existing.retentionCoverageGapsDays,
        enabled: input.enabled ?? existing.enabled,
        updatedAt: now,
      }
    : {
        id: makeId("cert-override"),
        certificateId: input.certificateId,
        groupId: input.groupId,
        intervalSeconds: input.intervalSeconds ?? null,
        timeoutSeconds: input.timeoutSeconds ?? null,
        criticality: input.criticality ?? null,
        alertEmail: input.alertEmail ?? null,
        extraRecipients: input.extraRecipients ?? [],
        trustSource: input.trustSource ?? null,
        pki: input.pki ?? null,
        jurisdiction: input.jurisdiction ?? null,
        retentionPollsDays: input.retentionPollsDays ?? null,
        retentionAlertsDays: input.retentionAlertsDays ?? null,
        retentionCoverageGapsDays: input.retentionCoverageGapsDays ?? null,
        enabled: input.enabled ?? null,
        createdAt: now,
        updatedAt: now,
      };
  cache.certificateGroupOverrides = upsertInCache(cache.certificateGroupOverrides, record);
  if (hasDatabase()) {
    await getPool().query(
      `
        insert into certificate_group_overrides (
          id, certificate_id, group_id, interval_seconds, timeout_seconds, criticality,
          alert_email, extra_recipients, trust_source, pki, jurisdiction,
          retention_polls_days, retention_alerts_days, retention_coverage_gaps_days,
          enabled, created_at, updated_at
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
        on conflict (id) do update set
          interval_seconds = excluded.interval_seconds,
          timeout_seconds = excluded.timeout_seconds,
          criticality = excluded.criticality,
          alert_email = excluded.alert_email,
          extra_recipients = excluded.extra_recipients,
          trust_source = excluded.trust_source,
          pki = excluded.pki,
          jurisdiction = excluded.jurisdiction,
          retention_polls_days = excluded.retention_polls_days,
          retention_alerts_days = excluded.retention_alerts_days,
          retention_coverage_gaps_days = excluded.retention_coverage_gaps_days,
          enabled = excluded.enabled,
          updated_at = excluded.updated_at
      `,
      [
        record.id,
        record.certificateId,
        record.groupId,
        record.intervalSeconds,
        record.timeoutSeconds,
        record.criticality,
        record.alertEmail,
        record.extraRecipients,
        record.trustSource,
        record.pki,
        record.jurisdiction,
        record.retentionPollsDays,
        record.retentionAlertsDays,
        record.retentionCoverageGapsDays,
        record.enabled,
        record.createdAt,
        record.updatedAt,
      ]
    );
  }
  return record;
}

export async function listCertificateGroupOverrides(
  certificateId: string
): Promise<CertificateGroupOverrideRecord[]> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    const result = await getPool().query<{
      id: string;
      certificate_id: string;
      group_id: string;
      interval_seconds: number | null;
      timeout_seconds: number | null;
      criticality: "low" | "medium" | "high" | null;
      alert_email: string | null;
      extra_recipients: string[];
      trust_source: string | null;
      pki: string | null;
      jurisdiction: string | null;
      retention_polls_days: number | null;
      retention_alerts_days: number | null;
      retention_coverage_gaps_days: number | null;
      enabled: boolean | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `select id, certificate_id, group_id, interval_seconds, timeout_seconds, criticality, alert_email, extra_recipients, trust_source, pki, jurisdiction, retention_polls_days, retention_alerts_days, retention_coverage_gaps_days, enabled, created_at, updated_at from certificate_group_overrides where certificate_id = $1 order by updated_at desc`,
      [certificateId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      certificateId: row.certificate_id,
      groupId: row.group_id,
      intervalSeconds: row.interval_seconds,
      timeoutSeconds: row.timeout_seconds,
      criticality: row.criticality,
      alertEmail: row.alert_email,
      extraRecipients: row.extra_recipients,
      trustSource: row.trust_source,
      pki: row.pki,
      jurisdiction: row.jurisdiction,
      retentionPollsDays: row.retention_polls_days,
      retentionAlertsDays: row.retention_alerts_days,
      retentionCoverageGapsDays: row.retention_coverage_gaps_days,
      enabled: row.enabled,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }
  return cache.certificateGroupOverrides.filter((item) => item.certificateId === certificateId);
}

export async function recordCertificateChangeEvent(input: {
  certificateId: string;
  actorUserId: string | null;
  eventType: string;
  details: Record<string, unknown>;
}): Promise<CertificateChangeEventRecord> {
  const record: CertificateChangeEventRecord = {
    id: makeId("cert-change"),
    certificateId: input.certificateId,
    actorUserId: input.actorUserId,
    eventType: input.eventType,
    details: input.details,
    occurredAt: new Date(),
  };
  cache.certificateChangeEvents = upsertInCache(cache.certificateChangeEvents, record);
  if (hasDatabase()) {
    await getPool().query(
      `insert into certificate_change_events (id, certificate_id, actor_user_id, event_type, details, occurred_at)
       values ($1,$2,$3,$4,$5::jsonb,$6)`,
      [
        record.id,
        record.certificateId,
        record.actorUserId,
        record.eventType,
        JSON.stringify(record.details),
        record.occurredAt,
      ]
    );
  }
  return record;
}

export async function listCertificateChangeEvents(
  certificateId: string
): Promise<CertificateChangeEventRecord[]> {
  if (hasDatabase()) {
    const result = await getPool().query<{
      id: string;
      certificate_id: string;
      actor_user_id: string | null;
      event_type: string;
      details: string;
      occurred_at: Date;
    }>(
      `select id, certificate_id, actor_user_id, event_type, details::text as details, occurred_at from certificate_change_events where certificate_id = $1 order by occurred_at desc`,
      [certificateId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      certificateId: row.certificate_id,
      actorUserId: row.actor_user_id,
      eventType: row.event_type,
      details: JSON.parse(row.details),
      occurredAt: new Date(row.occurred_at),
    }));
  }
  return cache.certificateChangeEvents.filter((item) => item.certificateId === certificateId);
}

export async function createCertificateTemplate(input: {
  sourceCertificateId: string;
  name: string;
  details: Record<string, unknown>;
  createdByUserId: string;
}): Promise<CertificateTemplateRecord> {
  const record: CertificateTemplateRecord = {
    id: makeId("cert-template"),
    sourceCertificateId: input.sourceCertificateId,
    name: input.name,
    details: input.details,
    createdByUserId: input.createdByUserId,
    createdAt: new Date(),
  };
  cache.certificateTemplates = upsertInCache(cache.certificateTemplates, record);
  if (hasDatabase()) {
    await getPool().query(
      `insert into certificate_templates (id, source_certificate_id, name, details, created_by_user_id, created_at)
       values ($1,$2,$3,$4::jsonb,$5,$6)`,
      [
        record.id,
        record.sourceCertificateId,
        record.name,
        JSON.stringify(record.details),
        record.createdByUserId,
        record.createdAt,
      ]
    );
  }
  return record;
}

export async function listCertificateTemplates(): Promise<CertificateTemplateRecord[]> {
  if (hasDatabase()) {
    const result = await getPool().query<{
      id: string;
      source_certificate_id: string;
      name: string;
      details: string;
      created_by_user_id: string;
      created_at: Date;
    }>(
      `select id, source_certificate_id, name, details::text as details, created_by_user_id, created_at from certificate_templates order by created_at desc`
    );
    cache.certificateTemplates = result.rows.map((row) => ({
      id: row.id,
      sourceCertificateId: row.source_certificate_id,
      name: row.name,
      details: JSON.parse(row.details),
      createdByUserId: row.created_by_user_id,
      createdAt: new Date(row.created_at),
    }));
  }
  return [...cache.certificateTemplates];
}

export async function upsertTrustListSource(input: {
  id?: string;
  label: string;
  url: string;
  enabled: boolean;
  groupIds: string[];
  parentSourceId?: string | null;
  archivedAt?: Date | null;
  createdByUserId: string;
}): Promise<TrustListSourceRecord> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }
  const existing = input.id
    ? cache.trustListSources.find((item) => item.id === input.id)
    : cache.trustListSources.find((item) => item.url === input.url);
  const now = new Date();
  const record: TrustListSourceRecord = existing
    ? {
        ...existing,
        label: input.label,
        url: input.url,
        enabled: input.enabled,
        groupIds: input.groupIds,
        parentSourceId: input.parentSourceId ?? null,
        archivedAt: input.archivedAt ?? null,
        updatedAt: now,
      }
    : {
        id: input.id ?? makeId("trust-list-source"),
        label: input.label,
        url: input.url,
        enabled: input.enabled,
        groupIds: input.groupIds,
        parentSourceId: input.parentSourceId ?? null,
        archivedAt: input.archivedAt ?? null,
        createdByUserId: input.createdByUserId,
        createdAt: now,
        updatedAt: now,
      };
  cache.trustListSources = upsertInCache(cache.trustListSources, record);
  if (hasDatabase()) {
    await getPool().query(
      `
        insert into trust_list_sources (
          id, label, url, enabled, group_ids, parent_source_id, archived_at, created_by_user_id, created_at, updated_at
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        on conflict (id) do update set
          label = excluded.label,
          url = excluded.url,
          enabled = excluded.enabled,
          group_ids = excluded.group_ids,
          parent_source_id = excluded.parent_source_id,
          archived_at = excluded.archived_at,
          updated_at = excluded.updated_at
      `,
      [
        record.id,
        record.label,
        record.url,
        record.enabled,
        record.groupIds,
        record.parentSourceId,
        record.archivedAt,
        record.createdByUserId,
        record.createdAt,
        record.updatedAt,
      ]
    );
  }
  return record;
}

export async function listTrustListSources(): Promise<TrustListSourceRecord[]> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    const result = await getPool().query<TrustListSourceRow>(
      `select id, label, url, enabled, group_ids, parent_source_id, archived_at, created_by_user_id, created_at, updated_at from trust_list_sources order by updated_at desc`
    );
    cache.trustListSources = result.rows.map(mapTrustListSourceRow);
  }
  return [...cache.trustListSources];
}

export async function listEnabledTrustListSources(): Promise<TrustListSourceRecord[]> {
  const sources = await listTrustListSources();
  return sources.filter((source) => source.enabled && !source.archivedAt);
}

export async function findTrustListSourceById(
  sourceId: string
): Promise<TrustListSourceRecord | null> {
  const sources = await listTrustListSources();
  return sources.find((item) => item.id === sourceId) ?? null;
}

export async function deleteTrustListSourceRecord(sourceId: string): Promise<void> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }
  cache.trustListSources = cache.trustListSources.filter((item) => item.id !== sourceId);
  if (hasDatabase()) {
    await getPool().query(`delete from trust_list_sources where id = $1`, [sourceId]);
  }
}

export async function createTrustListSyncRun(input: {
  sourceId: string;
}): Promise<TrustListSyncRunRecord> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }
  const record: TrustListSyncRunRecord = {
    id: makeId("trust-list-run"),
    sourceId: input.sourceId,
    status: "running",
    startedAt: new Date(),
    finishedAt: null,
    digestSha256: null,
    sequenceNumber: null,
    territory: null,
    issueDate: null,
    nextUpdate: null,
    snapshotId: null,
    failureReason: null,
    importedCount: 0,
    skippedCount: 0,
    failedCount: 0,
  };
  cache.trustListSyncRuns = upsertInCache(cache.trustListSyncRuns, record);
  if (hasDatabase()) {
    await getPool().query(
      `
        insert into trust_list_sync_runs (
          id, source_id, status, started_at, finished_at, digest_sha256,
          sequence_number, territory, issue_date, next_update, snapshot_id,
          failure_reason, imported_count, skipped_count, failed_count
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      `,
      [
        record.id,
        record.sourceId,
        record.status,
        record.startedAt,
        record.finishedAt,
        record.digestSha256,
        record.sequenceNumber,
        record.territory,
        record.issueDate,
        record.nextUpdate,
        record.snapshotId,
        record.failureReason,
        record.importedCount,
        record.skippedCount,
        record.failedCount,
      ]
    );
  }
  return record;
}

export async function completeTrustListSyncRun(
  runId: string,
  input: {
    status: TrustListSyncRunRecord["status"];
    digestSha256?: string | null;
    sequenceNumber?: string | null;
    territory?: string | null;
    issueDate?: string | null;
    nextUpdate?: string | null;
    snapshotId?: string | null;
    failureReason?: string | null;
    importedCount?: number;
    skippedCount?: number;
    failedCount?: number;
  }
): Promise<TrustListSyncRunRecord | null> {
  const finishedAt = new Date();
  let updated: TrustListSyncRunRecord | null = null;
  cache.trustListSyncRuns = cache.trustListSyncRuns.map((item) => {
    if (item.id !== runId) {
      return item;
    }
    updated = {
      ...item,
      status: input.status,
      finishedAt,
      digestSha256: input.digestSha256 ?? item.digestSha256,
      sequenceNumber: input.sequenceNumber ?? item.sequenceNumber,
      territory: input.territory ?? item.territory,
      issueDate: input.issueDate ?? item.issueDate,
      nextUpdate: input.nextUpdate ?? item.nextUpdate,
      snapshotId: input.snapshotId ?? item.snapshotId,
      failureReason: input.failureReason ?? null,
      importedCount: input.importedCount ?? item.importedCount,
      skippedCount: input.skippedCount ?? item.skippedCount,
      failedCount: input.failedCount ?? item.failedCount,
    };
    return updated;
  });
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    await getPool().query(
      `
        update trust_list_sync_runs set
          status = $2,
          finished_at = $3,
          digest_sha256 = $4,
          sequence_number = $5,
          territory = $6,
          issue_date = $7,
          next_update = $8,
          snapshot_id = $9,
          failure_reason = $10,
          imported_count = $11,
          skipped_count = $12,
          failed_count = $13
        where id = $1
      `,
      [
        runId,
        input.status,
        finishedAt,
        input.digestSha256 ?? null,
        input.sequenceNumber ?? null,
        input.territory ?? null,
        input.issueDate ?? null,
        input.nextUpdate ?? null,
        input.snapshotId ?? null,
        input.failureReason ?? null,
        input.importedCount ?? 0,
        input.skippedCount ?? 0,
        input.failedCount ?? 0,
      ]
    );
  }
  return updated;
}

export async function createTrustListSnapshot(input: {
  sourceId: string;
  digestSha256: string;
  sequenceNumber?: string | null;
  territory?: string | null;
  issueDate?: string | null;
  nextUpdate?: string | null;
  xmlSizeBytes: number;
  certificateCount: number;
}): Promise<TrustListSnapshotRecord> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }
  const record: TrustListSnapshotRecord = {
    id: makeId("trust-list-snapshot"),
    sourceId: input.sourceId,
    digestSha256: input.digestSha256,
    sequenceNumber: input.sequenceNumber ?? null,
    territory: input.territory ?? null,
    issueDate: input.issueDate ?? null,
    nextUpdate: input.nextUpdate ?? null,
    acceptedAt: new Date(),
    xmlSizeBytes: input.xmlSizeBytes,
    certificateCount: input.certificateCount,
  };
  cache.trustListSnapshots = upsertInCache(cache.trustListSnapshots, record);
  if (hasDatabase()) {
    await getPool().query(
      `
        insert into trust_list_snapshots (
          id, source_id, digest_sha256, sequence_number, territory, issue_date,
          next_update, accepted_at, xml_size_bytes, certificate_count
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      `,
      [
        record.id,
        record.sourceId,
        record.digestSha256,
        record.sequenceNumber,
        record.territory,
        record.issueDate,
        record.nextUpdate,
        record.acceptedAt,
        record.xmlSizeBytes,
        record.certificateCount,
      ]
    );
  }
  return record;
}

export async function recordTrustListExtractedCertificate(input: {
  sourceId: string;
  snapshotId: string;
  runId: string;
  fingerprint?: string | null;
  subjectSummary?: string | null;
  pem: string;
  importedCertificateId?: string | null;
  importStatus: TrustListExtractedCertificateRecord["importStatus"];
  failureReason?: string | null;
}): Promise<TrustListExtractedCertificateRecord> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }
  const record: TrustListExtractedCertificateRecord = {
    id: makeId("trust-list-cert"),
    sourceId: input.sourceId,
    snapshotId: input.snapshotId,
    runId: input.runId,
    fingerprint: input.fingerprint ?? null,
    subjectSummary: input.subjectSummary ?? null,
    pem: input.pem,
    importedCertificateId: input.importedCertificateId ?? null,
    importStatus: input.importStatus,
    failureReason: input.failureReason ?? null,
    createdAt: new Date(),
  };
  cache.trustListExtractedCertificates = upsertInCache(
    cache.trustListExtractedCertificates,
    record
  );
  if (hasDatabase()) {
    await getPool().query(
      `
        insert into trust_list_extracted_certificates (
          id, source_id, snapshot_id, run_id, fingerprint, subject_summary, pem,
          imported_certificate_id, import_status, failure_reason, created_at
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      `,
      [
        record.id,
        record.sourceId,
        record.snapshotId,
        record.runId,
        record.fingerprint,
        record.subjectSummary,
        record.pem,
        record.importedCertificateId,
        record.importStatus,
        record.failureReason,
        record.createdAt,
      ]
    );
  }
  return record;
}

export async function recordTrustListCertificateProjection(input: {
  sourceId: string;
  snapshotId: string;
  runId: string;
  extractedCertificateId: string;
  certificateId?: string | null;
  fingerprint: string;
  candidateKey: string;
  candidateDigest: string;
  sourcePath: string;
  sequenceNumber?: string | null;
  territory?: string | null;
  status: TrustListCertificateProjectionRecord["status"];
  changeReason: TrustListCertificateProjectionRecord["changeReason"];
  failureReason?: string | null;
}): Promise<TrustListCertificateProjectionRecord> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
  }
  const record: TrustListCertificateProjectionRecord = {
    id: makeId("trust-list-projection"),
    sourceId: input.sourceId,
    snapshotId: input.snapshotId,
    runId: input.runId,
    extractedCertificateId: input.extractedCertificateId,
    certificateId: input.certificateId ?? null,
    fingerprint: input.fingerprint,
    candidateKey: input.candidateKey,
    candidateDigest: input.candidateDigest,
    sourcePath: input.sourcePath,
    sequenceNumber: input.sequenceNumber ?? null,
    territory: input.territory ?? null,
    status: input.status,
    changeReason: input.changeReason,
    failureReason: input.failureReason ?? null,
    createdAt: new Date(),
  };
  cache.trustListCertificateProjections = upsertInCache(
    cache.trustListCertificateProjections,
    record
  );
  if (hasDatabase()) {
    await getPool().query(
      `
        insert into trust_list_certificate_projections (
          id, source_id, snapshot_id, run_id, extracted_certificate_id,
          certificate_id, fingerprint, candidate_key, candidate_digest,
          source_path, sequence_number, territory, status, change_reason,
          failure_reason, created_at
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      `,
      [
        record.id,
        record.sourceId,
        record.snapshotId,
        record.runId,
        record.extractedCertificateId,
        record.certificateId,
        record.fingerprint,
        record.candidateKey,
        record.candidateDigest,
        record.sourcePath,
        record.sequenceNumber,
        record.territory,
        record.status,
        record.changeReason,
        record.failureReason,
        record.createdAt,
      ]
    );
  }
  return record;
}

export async function findLatestTrustListProjection(input: {
  sourceId: string;
  fingerprint: string;
  candidateKey: string;
}): Promise<TrustListCertificateProjectionRecord | null> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    const result = await getPool().query<TrustListCertificateProjectionRow>(
      `select id, source_id, snapshot_id, run_id, extracted_certificate_id, certificate_id, fingerprint, candidate_key, candidate_digest, source_path, sequence_number, territory, status, change_reason, failure_reason, created_at
       from trust_list_certificate_projections
       where source_id = $1 and fingerprint = $2 and candidate_key = $3
       order by created_at desc limit 1`,
      [input.sourceId, input.fingerprint, input.candidateKey]
    );
    return result.rows[0] ? mapTrustListCertificateProjectionRow(result.rows[0]) : null;
  }
  return cache.trustListCertificateProjections
    .filter(
      (item) =>
        item.sourceId === input.sourceId &&
        item.fingerprint === input.fingerprint &&
        item.candidateKey === input.candidateKey
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null;
}

export async function listTrustListCertificateProjections(input: {
  certificateId?: string;
  sourceId?: string;
  runId?: string;
} = {}): Promise<TrustListCertificateProjectionRecord[]> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    const clauses: string[] = [];
    const values: string[] = [];
    if (input.certificateId) {
      values.push(input.certificateId);
      clauses.push(`certificate_id = $${values.length}`);
    }
    if (input.sourceId) {
      values.push(input.sourceId);
      clauses.push(`source_id = $${values.length}`);
    }
    if (input.runId) {
      values.push(input.runId);
      clauses.push(`run_id = $${values.length}`);
    }
    const where = clauses.length ? ` where ${clauses.join(" and ")}` : "";
    const result = await getPool().query<TrustListCertificateProjectionRow>(
      `select id, source_id, snapshot_id, run_id, extracted_certificate_id, certificate_id, fingerprint, candidate_key, candidate_digest, source_path, sequence_number, territory, status, change_reason, failure_reason, created_at
       from trust_list_certificate_projections${where}
       order by created_at desc`,
      values
    );
    const mapped = result.rows.map(mapTrustListCertificateProjectionRow);
    if (!input.certificateId && !input.sourceId && !input.runId) {
      cache.trustListCertificateProjections = mapped;
    }
    return mapped;
  }
  return cache.trustListCertificateProjections
    .filter((item) => !input.certificateId || item.certificateId === input.certificateId)
    .filter((item) => !input.sourceId || item.sourceId === input.sourceId)
    .filter((item) => !input.runId || item.runId === input.runId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function listTrustListSnapshots(
  sourceId?: string
): Promise<TrustListSnapshotRecord[]> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    const result = await getPool().query<TrustListSnapshotRow>(
      sourceId
        ? `select id, source_id, digest_sha256, sequence_number, territory, issue_date, next_update, accepted_at, xml_size_bytes, certificate_count from trust_list_snapshots where source_id = $1 order by accepted_at desc`
        : `select id, source_id, digest_sha256, sequence_number, territory, issue_date, next_update, accepted_at, xml_size_bytes, certificate_count from trust_list_snapshots order by accepted_at desc`,
      sourceId ? [sourceId] : []
    );
    const mapped = result.rows.map(mapTrustListSnapshotRow);
    if (!sourceId) {
      cache.trustListSnapshots = mapped;
    }
    return mapped;
  }
  return cache.trustListSnapshots
    .filter((item) => !sourceId || item.sourceId === sourceId)
    .sort((a, b) => b.acceptedAt.getTime() - a.acceptedAt.getTime());
}

export async function listTrustListSyncRuns(
  sourceId?: string
): Promise<TrustListSyncRunRecord[]> {
  if (hasDatabase()) {
    await ensureRuntimeSchema();
    const result = await getPool().query<TrustListSyncRunRow>(
      sourceId
        ? `select id, source_id, status, started_at, finished_at, digest_sha256, sequence_number, territory, issue_date, next_update, snapshot_id, failure_reason, imported_count, skipped_count, failed_count from trust_list_sync_runs where source_id = $1 order by started_at desc`
        : `select id, source_id, status, started_at, finished_at, digest_sha256, sequence_number, territory, issue_date, next_update, snapshot_id, failure_reason, imported_count, skipped_count, failed_count from trust_list_sync_runs order by started_at desc`,
      sourceId ? [sourceId] : []
    );
    const mapped = result.rows.map(mapTrustListSyncRunRow);
    if (!sourceId) {
      cache.trustListSyncRuns = mapped;
    }
    return mapped;
  }
  return cache.trustListSyncRuns
    .filter((item) => !sourceId || item.sourceId === sourceId)
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
}
