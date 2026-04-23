import { assertPlatformAdmin, type AuthenticatedPrincipal } from "../auth/authorization";
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
import { syncTrustListSource } from "./sync";

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
}

export interface TrustListCertificateProvenance {
  source: TrustListSourceRecord | null;
  snapshot: TrustListSnapshotRecord | null;
  projection: TrustListCertificateProjectionRecord;
}

async function ensurePlatformAdmin(actor?: AuthenticatedPrincipal): Promise<AuthenticatedPrincipal> {
  if (actor) {
    if (!actor.isPlatformAdmin) throw new Error("platform-admin-required");
    return actor;
  }
  return assertPlatformAdmin();
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
  await ensurePlatformAdmin(actor);
  const sources = await listTrustListSources();
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
    summaries.push({
      source,
      lastSnapshot: snapshots[0] ?? null,
      lastRun,
      lastSuccess: runs.find((run) => run.status === "succeeded") ?? null,
      lastFailure: runs.find((run) => run.status === "failed") ?? null,
      projectionCounts: summarizeProjectionCounts(runProjections),
      latestProjectionFailureReason:
        runProjections.find((projection) => projection.failureReason)?.failureReason ?? null,
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
  const principal = await ensurePlatformAdmin(actor);
  const label = input.label.trim();
  const url = input.url.trim();
  const groupIds = [...new Set(input.groupIds.map((item) => item.trim()).filter(Boolean))];
  if (!label) throw new Error("trust-list-label-required");
  assertHttpsTrustListUrl(url);
  await validateGroupIds(groupIds);
  return upsertTrustListSource({
    label,
    url,
    enabled: input.enabled,
    groupIds,
    createdByUserId: principal.userId,
  });
}

export async function syncTrustListSourceNow(
  actor: AuthenticatedPrincipal | undefined,
  sourceId: string,
) {
  await ensurePlatformAdmin(actor);
  const source = await findTrustListSourceById(sourceId);
  if (!source) throw new Error("trust-list-source-not-found");
  return syncTrustListSource(source);
}
