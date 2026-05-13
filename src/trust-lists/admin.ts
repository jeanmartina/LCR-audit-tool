import { assertAuthenticated, type AuthenticatedPrincipal } from "../auth/authorization";
import {
  findGroupById,
  deleteTrustListSourceRecord,
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
  type TrustListReviewPayload,
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

function assertTrustListSourceAcyclic(
  sourceId: string,
  parentSourceId: string | null,
  sources: TrustListSourceRecord[]
): void {
  if (!parentSourceId) {
    return;
  }
  if (parentSourceId === sourceId) {
    throw new Error("trust-list-parent-cycle");
  }
  const byId = new Map(sources.map((item) => [item.id, item] as const));
  let current = byId.get(parentSourceId) ?? null;
  while (current) {
    if (current.id === sourceId) {
      throw new Error("trust-list-parent-cycle");
    }
    current = current.parentSourceId ? byId.get(current.parentSourceId) ?? null : null;
  }
}

function buildTrustListSourceWriteInput(input: {
  id?: string;
  createdByUserId: string;
  label: string;
  url: string;
  enabled: boolean;
  groupIds: string[];
  parentSourceId: string | null;
  archivedAt: Date | null;
}) {
  return {
    id: input.id,
    createdByUserId: input.createdByUserId,
    label: input.label,
    url: input.url,
    enabled: input.enabled,
    groupIds: input.groupIds,
    parentSourceId: input.parentSourceId,
    archivedAt: input.archivedAt,
  };
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
  input: { label: string; url: string; enabled: boolean; groupIds: string[]; parentSourceId?: string | null },
): Promise<TrustListSourceRecord> {
  const principal = await ensureTrustListOperator(actor);
  const normalized = normalizeTrustListSourceInput(input);
  if (!normalized.label) throw new Error("trust-list-label-required");
  assertHttpsTrustListUrl(normalized.url);
  await validateGroupIds(normalized.groupIds);
  assertTrustListGroupScope(principal, normalized.groupIds);
  if (input.parentSourceId) {
    const parent = await findTrustListSourceById(input.parentSourceId);
    if (!parent) {
      throw new Error("trust-list-parent-not-found");
    }
    if (!canSeeTrustListSource(principal, parent)) {
      throw new Error("trust-list-group-admin-required");
    }
  }
  return upsertTrustListSource(buildTrustListSourceWriteInput({
    label: normalized.label,
    url: normalized.url,
    enabled: normalized.enabled,
    groupIds: normalized.groupIds,
    parentSourceId: input.parentSourceId ?? null,
    archivedAt: null,
    createdByUserId: principal.userId,
  }));
}

export async function updateTrustListSource(
  actor: AuthenticatedPrincipal | undefined,
  sourceId: string,
  input: {
    label: string;
    url: string;
    enabled: boolean;
    groupIds: string[];
    parentSourceId: string | null;
  }
): Promise<TrustListSourceRecord> {
  const principal = await ensureTrustListOperator(actor);
  const current = await findTrustListSourceById(sourceId);
  if (!current) {
    throw new Error("trust-list-source-not-found");
  }
  if (!canSeeTrustListSource(principal, current)) {
    throw new Error("trust-list-group-admin-required");
  }
  const normalized = normalizeTrustListSourceInput(input);
  if (!normalized.label) throw new Error("trust-list-label-required");
  assertHttpsTrustListUrl(normalized.url);
  await validateGroupIds(normalized.groupIds);
  assertTrustListGroupScope(principal, normalized.groupIds);
  if (input.parentSourceId) {
    const parent = await findTrustListSourceById(input.parentSourceId);
    if (!parent) {
      throw new Error("trust-list-parent-not-found");
    }
    if (!canSeeTrustListSource(principal, parent)) {
      throw new Error("trust-list-group-admin-required");
    }
  }
  const sources = await listTrustListSources();
  assertTrustListSourceAcyclic(sourceId, input.parentSourceId, sources);
  const archivedAt = current.archivedAt ?? (normalized.enabled ? null : new Date());
  return upsertTrustListSource(buildTrustListSourceWriteInput({
    id: sourceId,
    createdByUserId: current.createdByUserId,
    label: normalized.label,
    url: normalized.url,
    enabled: current.archivedAt ? false : normalized.enabled,
    groupIds: normalized.groupIds,
    parentSourceId: input.parentSourceId,
    archivedAt,
  }));
}

export async function archiveTrustListSource(
  actor: AuthenticatedPrincipal | undefined,
  sourceId: string,
): Promise<TrustListSourceRecord> {
  const principal = await ensureTrustListOperator(actor);
  const current = await findTrustListSourceById(sourceId);
  if (!current) {
    throw new Error("trust-list-source-not-found");
  }
  if (!canSeeTrustListSource(principal, current)) {
    throw new Error("trust-list-group-admin-required");
  }
  return upsertTrustListSource(
    buildTrustListSourceWriteInput({
      id: sourceId,
      createdByUserId: current.createdByUserId,
      label: current.label,
      url: current.url,
      enabled: false,
      groupIds: current.groupIds,
      parentSourceId: current.parentSourceId,
      archivedAt: current.archivedAt ?? new Date(),
    }),
  );
}

export async function deleteTrustListSource(
  actor: AuthenticatedPrincipal | undefined,
  sourceId: string,
): Promise<void> {
  const principal = await ensureTrustListOperator(actor);
  const current = await findTrustListSourceById(sourceId);
  if (!current) {
    throw new Error("trust-list-source-not-found");
  }
  if (!canSeeTrustListSource(principal, current)) {
    throw new Error("trust-list-group-admin-required");
  }
  const children = (await listTrustListSources()).filter((item) => item.parentSourceId === sourceId);
  if (children.length > 0) {
    throw new Error("trust-list-source-has-children");
  }
  const [snapshots, runs, projections] = await Promise.all([
    listTrustListSnapshots(sourceId),
    listTrustListSyncRuns(sourceId),
    listTrustListCertificateProjections({ sourceId }),
  ]);
  if (snapshots.length > 0 || runs.length > 0 || projections.length > 0) {
    throw new Error("trust-list-source-has-history");
  }
  await deleteTrustListSourceRecord(sourceId);
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
  reviewPayload?: TrustListReviewPayload,
) {
  const principal = await ensureTrustListOperator(actor);
  const source = await findTrustListSourceById(sourceId);
  if (!source) throw new Error("trust-list-source-not-found");
  if (!canSeeTrustListSource(principal, source)) throw new Error("trust-list-group-admin-required");
  if (source.archivedAt) throw new Error("trust-list-source-archived");
  return syncTrustListSource(source, reviewPayload);
}
