import { assertPlatformAdmin, type AuthenticatedPrincipal } from "../auth/authorization";
import {
  findGroupById,
  findTrustListSourceById,
  listTrustListSnapshots,
  listTrustListSources,
  listTrustListSyncRuns,
  upsertTrustListSource,
  type TrustListSnapshotRecord,
  type TrustListSourceRecord,
  type TrustListSyncRunRecord,
} from "../storage/runtime-store";
import { syncTrustListSource } from "./sync";

export interface TrustListSourceSummary {
  source: TrustListSourceRecord;
  lastSnapshot: TrustListSnapshotRecord | null;
  lastRun: TrustListSyncRunRecord | null;
  lastSuccess: TrustListSyncRunRecord | null;
  lastFailure: TrustListSyncRunRecord | null;
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

export async function listTrustListSourcesForAdmin(
  actor?: AuthenticatedPrincipal
): Promise<TrustListSourceSummary[]> {
  await ensurePlatformAdmin(actor);
  const sources = await listTrustListSources();
  const summaries: TrustListSourceSummary[] = [];
  for (const source of sources) {
    const [snapshots, runs] = await Promise.all([
      listTrustListSnapshots(source.id),
      listTrustListSyncRuns(source.id),
    ]);
    summaries.push({
      source,
      lastSnapshot: snapshots[0] ?? null,
      lastRun: runs[0] ?? null,
      lastSuccess: runs.find((run) => run.status === "succeeded") ?? null,
      lastFailure: runs.find((run) => run.status === "failed") ?? null,
    });
  }
  return summaries;
}

export async function createTrustListSource(
  actor: AuthenticatedPrincipal | undefined,
  input: { label: string; url: string; enabled: boolean; groupIds: string[] }
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
  sourceId: string
) {
  await ensurePlatformAdmin(actor);
  const source = await findTrustListSourceById(sourceId);
  if (!source) throw new Error("trust-list-source-not-found");
  return syncTrustListSource(source);
}
