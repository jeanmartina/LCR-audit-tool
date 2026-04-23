import { assertAuthenticated, type AuthenticatedPrincipal } from "../auth/authorization";
import {
  findGroupById,
  findTrustListSourceById,
  listTrustListCertificateProjections,
  listTrustListSnapshots,
  listTrustListSources,
  listTrustListSyncRuns,
  upsertTrustListSource,
  type TrustListCertificateProjectionRecord,
  type TrustListSnapshotRecord,
  type TrustListSourceRecord,
  type TrustListSyncRunRecord,
} from "../storage/runtime-store";
import {
  getTrustListRecoveryGuidance,
  previewTrustListXmlSource,
  syncTrustListSource,
} from "./sync";
import type { TrustListRecoveryGuidance, TrustListSourcePreviewResult } from "./types";

export interface TrustListProjectionCounts {
  imported: number;
  updated: number;
  skippedUnchanged: number;
  skippedDuplicate: number;
  failed: number;
}

export interface TrustListSourceSummary {
  source: TrustListSourceRecord;
  lastSnapshot: TrustListSnapshotRecord | null;
  lastRun: TrustListSyncRunRecord | null;
  lastSuccess: TrustListSyncRunRecord | null;
  lastFailure: TrustListSyncRunRecord | null;
  projectionCounts: TrustListProjectionCounts;
  latestProjectionFailureReason: string | null;
  latestRecovery: TrustListRecoveryGuidance | null;
}

export interface TrustListCertificateProvenance {
  source: TrustListSourceRecord | null;
  snapshot: TrustListSnapshotRecord | null;
  projection: TrustListCertificateProjectionRecord;
}

async function ensureTrustListOperator(actor?: AuthenticatedPrincipal): Promise<AuthenticatedPrincipal> {
  const principal = actor ?? (await assertAuthenticated());
  if (principal.isPlatformAdmin || getManagedTrustListGroupIds(principal).length > 0) {
    return principal;
  }
  throw new Error("trust-list-operator-required");
}

function getManagedTrustListGroupIds(actor: AuthenticatedPrincipal): string[] {
  if (actor.isPlatformAdmin) return [];
  return actor.groupRoles
    .filter((membership) => membership.role === "group-admin")
    .map((membership) => membership.groupId);
}

function canManageTrustListGroups(actor: AuthenticatedPrincipal, groupIds: string[]): boolean {
  if (actor.isPlatformAdmin) return true;
  const managed = new Set(getManagedTrustListGroupIds(actor));
  return groupIds.length > 0 && groupIds.every((groupId) => managed.has(groupId));
}

function canSeeTrustListSource(actor: AuthenticatedPrincipal, source: TrustListSourceRecord): boolean {
  if (actor.isPlatformAdmin) return true;
  const managed = new Set(getManagedTrustListGroupIds(actor));
  return source.groupIds.some((groupId) => managed.has(groupId));
}

function assertTrustListGroupScope(actor: AuthenticatedPrincipal, groupIds: string[]): void {
  if (!canManageTrustListGroups(actor, groupIds)) {
    throw new Error("trust-list-group-admin-required");
  }
}

function assertHttpsTrustListUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("trust-list-invalid-url");
  }
  const isLocalhost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (parsed.protocol !== "https:" && !isLocalhost) {
    throw new Error("trust-list-url-must-use-https");
  }
}

async function validateGroupIds(groupIds: string[]): Promise<void> {
  if (groupIds.length === 0) {
    throw new Error("trust-list-group-required");
  }
  for (const groupId of groupIds) {
    const group = await findGroupById(groupId);
    if (!group) {
      throw new Error(`trust-list-group-not-found:${groupId}`);
    }
  }
}

function normalizeTrustListSourceInput(input: { label?: string; url: string; enabled?: boolean; groupIds: string[] }) {
  const label = input.label?.trim() ?? "";
  const url = input.url.trim();
  const groupIds = [...new Set(input.groupIds.map((item) => item.trim()).filter(Boolean))];
  return { label, url, enabled: input.enabled !== false, groupIds };
}

function summarizeProjectionCounts(
  projections: TrustListCertificateProjectionRecord[],
): TrustListProjectionCounts {
  return projections.reduce<TrustListProjectionCounts>(
    (counts, projection) => {
      if (projection.status === "imported") counts.imported += 1;
      if (projection.status === "updated") counts.updated += 1;
      if (projection.status === "failed") counts.failed += 1;
      if (projection.changeReason === "unchanged") counts.skippedUnchanged += 1;
      if (projection.changeReason === "duplicate-in-run") counts.skippedDuplicate += 1;
      return counts;
    },
    { imported: 0, updated: 0, skippedUnchanged: 0, skippedDuplicate: 0, failed: 0 },
  );
}

export async function listTrustListSourcesForAdmin(
  actor?: AuthenticatedPrincipal,
): Promise<TrustListSourceSummary[]> {
  const principal = await ensureTrustListOperator(actor);
  const sources = (await listTrustListSources()).filter((source) => canSeeTrustListSource(principal, source));
  const summaries: TrustListSourceSummary[] = [];
  for (const source of sources) {
    const [snapshots, runs] = await Promise.all([
      listTrustListSnapshots(source.id),
      listTrustListSyncRuns(source.id),
    ]);
    const lastRun = runs[0] ?? null;
    const runProjections = lastRun
      ? await listTrustListCertificateProjections({ runId: lastRun.id })
      : [];
    const latestProjectionFailureReason =
      runProjections.find((projection) => projection.failureReason)?.failureReason ?? null;
    const latestFailureReason = lastRun?.failureReason ?? latestProjectionFailureReason;
    summaries.push({
      source,
      lastSnapshot: snapshots[0] ?? null,
      lastRun,
      lastSuccess: runs.find((run) => run.status === "succeeded") ?? null,
      lastFailure: runs.find((run) => run.status === "failed") ?? null,
      projectionCounts: summarizeProjectionCounts(runProjections),
      latestProjectionFailureReason,
      latestRecovery: getTrustListRecoveryGuidance(latestFailureReason),
    });
  }
  return summaries;
}

export async function findTrustListCertificateProvenance(
  certificateId: string,
): Promise<TrustListCertificateProvenance | null> {
  const [projection] = await listTrustListCertificateProjections({ certificateId });
  if (!projection) {
    return null;
  }
  const [source, snapshots] = await Promise.all([
    findTrustListSourceById(projection.sourceId),
    listTrustListSnapshots(projection.sourceId),
  ]);
  return {
    source,
    snapshot: snapshots.find((item) => item.id === projection.snapshotId) ?? null,
    projection,
  };
}

export async function createTrustListSource(
  actor: AuthenticatedPrincipal | undefined,
  input: { label: string; url: string; enabled: boolean; groupIds: string[] },
): Promise<TrustListSourceRecord> {
  const principal = await ensureTrustListOperator(actor);
  const normalized = normalizeTrustListSourceInput(input);
  if (!normalized.label) throw new Error("trust-list-label-required");
  assertHttpsTrustListUrl(normalized.url);
  await validateGroupIds(normalized.groupIds);
  assertTrustListGroupScope(principal, normalized.groupIds);
  return upsertTrustListSource({
    label: normalized.label,
    url: normalized.url,
    enabled: normalized.enabled,
    groupIds: normalized.groupIds,
    createdByUserId: principal.userId,
  });
}

export async function previewTrustListSource(
  actor: AuthenticatedPrincipal | undefined,
  input: { url: string; groupIds: string[] },
): Promise<TrustListSourcePreviewResult> {
  const principal = await ensureTrustListOperator(actor);
  const normalized = normalizeTrustListSourceInput({ url: input.url, groupIds: input.groupIds });
  await validateGroupIds(normalized.groupIds);
  assertTrustListGroupScope(principal, normalized.groupIds);
  return previewTrustListXmlSource(normalized.url);
}

export async function syncTrustListSourceNow(
  actor: AuthenticatedPrincipal | undefined,
  sourceId: string,
) {
  const principal = await ensureTrustListOperator(actor);
  const source = await findTrustListSourceById(sourceId);
  if (!source) throw new Error("trust-list-source-not-found");
  if (!canSeeTrustListSource(principal, source)) throw new Error("trust-list-group-admin-required");
  return syncTrustListSource(source);
}
