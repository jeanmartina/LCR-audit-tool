import { createHash } from "node:crypto";
import { unzipSync } from "fflate";
import type { AuthenticatedPrincipal } from "../auth/authorization";
import {
  createCertificateImportRun,
  listCertificateGroupIds,
  listCertificateGroupOverrides,
  listCertificateRecords,
  listCertificateTemplates,
  listCertificateImportItems,
  listCertificateChangeEvents,
  listCertificateCrlLinks,
  recordCertificateChangeEvent,
  recordCertificateImportItem,
  completeCertificateImportRun,
  upsertCertificateCrlLink,
  upsertCertificateGroupOverride,
  upsertCertificateGroupShare,
  upsertCertificateRecord,
  createCertificateTemplate,
  findCertificateById,
  findCertificateImportRun,
  upsertTargetGroupShare,
  type CertificateRecord,
  type CertificateGroupOverrideRecord,
  type CertificateChangeEventRecord,
  type CertificateTemplateRecord,
  type CertificateImportRunRecord,
  type CertificateImportItemRecord,
} from "../storage/runtime-store";
import {
  getDefaultRetentionPolicy,
  persistTarget,
  type Target,
} from "./targets";

export interface CertificateInput {
  displayName: string;
  pemText: string;
  tags: string[];
  groupIds: string[];
  ignoredUrls: string[];
  status: "active" | "disabled";
  groupOverrides: Array<{
    groupId: string;
    intervalSeconds?: number | null;
    timeoutSeconds?: number | null;
    criticality?: "low" | "medium" | "high" | null;
    alertEmail?: string | null;
    extraRecipients?: string[];
    retentionPollsDays?: number | null;
    retentionAlertsDays?: number | null;
    retentionCoverageGapsDays?: number | null;
    enabled?: boolean | null;
  }>;
}

export interface CertificateAdminListItem {
  certificate: CertificateRecord;
  groupIds: string[];
  derivedCrlCount: number;
  ignoredCrlCount: number;
  lastImportAt: Date;
}

export interface CertificateAdminDetail {
  certificate: CertificateRecord;
  groupIds: string[];
  derivedCrls: Awaited<ReturnType<typeof listCertificateCrlLinks>>;
  groupOverrides: CertificateGroupOverrideRecord[];
  changeHistory: CertificateChangeEventRecord[];
  templates: CertificateTemplateRecord[];
  effectiveDefaults: Array<{
    groupId: string;
    intervalSeconds: number;
    timeoutSeconds: number;
    criticality: "low" | "medium" | "high";
    alertEmail: string | null;
    extraRecipients: string[];
    retentionPollsDays: number;
    retentionAlertsDays: number;
    retentionCoverageGapsDays: number;
    enabled: boolean;
  }>;
}

export interface CertificateImportPreview {
  fingerprint: string;
  derivedUrls: string[];
  trackedUrls: string[];
  ignoredUrls: string[];
  effectiveDefaults: Array<{
    groupId: string;
    intervalSeconds: number;
    timeoutSeconds: number;
    criticality: "low" | "medium" | "high";
    alertEmail: string | null;
    extraRecipients: string[];
    retentionPollsDays: number;
    retentionAlertsDays: number;
    retentionCoverageGapsDays: number;
    enabled: boolean;
  }>;
  warnings: string[];
}

export interface ImportRunSummary {
  runId: string;
  imported: number;
  updated: number;
  ignored: number;
  invalid: number;
  items: Awaited<ReturnType<typeof listCertificateImportItems>>;
}

export const TRUST_LIST_CERTIFICATE_SOURCE_TYPE = "trust-list" as const;

function makeDeterministicId(prefix: string, value: string): string {
  return `${prefix}-${createHash("sha256").update(value).digest("hex").slice(0, 16)}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

function isPemCertificateText(value: string): boolean {
  return value.includes("-----BEGIN CERTIFICATE-----");
}

function encodeDerAsPem(derBytes: Buffer): string {
  const base64 = derBytes.toString("base64");
  const lines = base64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN CERTIFICATE-----\n${lines.join("\n")}\n-----END CERTIFICATE-----\n`;
}

export function normalizeCertificatePem(
  payload: string | Buffer | Uint8Array
): string {
  const bytes = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
  const asUtf8 = bytes.toString("utf8");
  if (isPemCertificateText(asUtf8)) {
    return asUtf8;
  }
  return encodeDerAsPem(bytes);
}

function decodeCertificatePem(pemText: string): Buffer {
  const normalizedPem = normalizeCertificatePem(pemText);
  const normalized = normalizedPem
    .replace(/-----BEGIN CERTIFICATE-----/g, "")
    .replace(/-----END CERTIFICATE-----/g, "")
    .replace(/\s+/g, "");
  return Buffer.from(normalized, "base64");
}

export function extractCertificateFingerprint(pemText: string): string {
  return createHash("sha256").update(decodeCertificatePem(pemText)).digest("hex");
}

export function extractDerivedCrlUrls(pemText: string): string[] {
  const decoded = decodeCertificatePem(pemText).toString("latin1");
  const matches = decoded.match(/\b(?:https?|ldap):\/\/[^\s"'<>\\]+/gi) ?? [];
  return [...new Set(matches.map((item) => item.replace(/[),.;]+$/, "")))]
    .filter((item) => item.toLowerCase().includes("crl") || item.toLowerCase().endsWith(".crl"));
}

function buildRuntimeTarget(url: string, displayName: string): Partial<Target> {
  const urlObject = new URL(url);
  const slugSource = `${displayName}-${urlObject.hostname}-${urlObject.pathname}`;
  return {
    id: makeDeterministicId("lcr", url),
    slug: slugify(slugSource) || makeDeterministicId("lcr", url).slice(0, 20),
    url,
    type: "lcr",
    intervalSeconds: 600,
    timeoutSeconds: 5,
    source: "certificate-derived",
    enabled: true,
  };
}

function resolveOverrideEffectiveValues(
  override: CertificateInput["groupOverrides"][number] | CertificateGroupOverrideRecord | undefined
) {
  const defaults = getDefaultRetentionPolicy();
  return {
    intervalSeconds: override?.intervalSeconds ?? 600,
    timeoutSeconds: override?.timeoutSeconds ?? 5,
    criticality: override?.criticality ?? "medium",
    alertEmail: override?.alertEmail ?? null,
    extraRecipients: override?.extraRecipients ?? [],
    retentionPollsDays: override?.retentionPollsDays ?? defaults.pollsDays,
    retentionAlertsDays: override?.retentionAlertsDays ?? defaults.alertsDays,
    retentionCoverageGapsDays:
      override?.retentionCoverageGapsDays ?? defaults.coverageGapsDays,
    enabled: override?.enabled ?? true,
  } as const;
}

function canManageGroup(principal: AuthenticatedPrincipal, groupId: string): boolean {
  return (
    principal.isPlatformAdmin ||
    principal.groupRoles.some(
      (item) =>
        item.groupId === groupId &&
        (item.role === "operator" || item.role === "group-admin")
    )
  );
}

export async function previewCertificateImport(
  actor: AuthenticatedPrincipal,
  input: CertificateInput
): Promise<CertificateImportPreview> {
  for (const groupId of input.groupIds) {
    if (!canManageGroup(actor, groupId)) {
      throw new Error("forbidden");
    }
  }

  const fingerprint = extractCertificateFingerprint(input.pemText);
  const derivedUrls = extractDerivedCrlUrls(input.pemText);
  const ignoredSet = new Set(input.ignoredUrls);
  const ignoredUrls = derivedUrls.filter((url) => ignoredSet.has(url));
  const trackedUrls = derivedUrls.filter((url) => !ignoredSet.has(url));

  return {
    fingerprint,
    derivedUrls,
    trackedUrls,
    ignoredUrls,
    effectiveDefaults: input.groupIds.map((groupId) => {
      const override = input.groupOverrides.find((item) => item.groupId === groupId);
      return { groupId, ...resolveOverrideEffectiveValues(override) };
    }),
    warnings: derivedUrls.length ? [] : ["no-crl-urls-found"],
  };
}

export async function importCertificate(
  actor: AuthenticatedPrincipal,
  input: CertificateInput,
  sourceType: CertificateRecord["sourceType"],
  filename = "certificate.pem"
): Promise<{ certificateId: string; result: "imported" | "updated"; urls: string[] }> {
  for (const groupId of input.groupIds) {
    if (!canManageGroup(actor, groupId)) {
      throw new Error("forbidden");
    }
  }

  const fingerprint = extractCertificateFingerprint(input.pemText);
  const run = await createCertificateImportRun({
    mode: "single",
    actorUserId: actor.userId,
    summary: { sourceType },
  });

  const urls = extractDerivedCrlUrls(input.pemText);
  const { record, operation } = await upsertCertificateRecord({
    fingerprint,
    displayName: input.displayName,
    pemText: input.pemText,
    tags: input.tags,
    status: input.status,
    sourceType,
    createdByUserId: actor.userId,
  });

  for (const groupId of input.groupIds) {
    await upsertCertificateGroupShare({ certificateId: record.id, groupId });
  }

  for (const override of input.groupOverrides) {
    if (!input.groupIds.includes(override.groupId)) {
      continue;
    }
    await upsertCertificateGroupOverride({
      certificateId: record.id,
      groupId: override.groupId,
      intervalSeconds: override.intervalSeconds,
      timeoutSeconds: override.timeoutSeconds,
      criticality: override.criticality,
      alertEmail: override.alertEmail,
      extraRecipients: override.extraRecipients,
      retentionPollsDays: override.retentionPollsDays,
      retentionAlertsDays: override.retentionAlertsDays,
      retentionCoverageGapsDays: override.retentionCoverageGapsDays,
      enabled: override.enabled,
    });
  }

  for (const url of urls) {
    const ignored = input.ignoredUrls.includes(url);
    let runtimeTargetId: string | null = null;

    if (!ignored) {
      const runtimeTarget = await persistTarget({
        ...buildRuntimeTarget(url, input.displayName),
      });
      runtimeTargetId = runtimeTarget.id;
      for (const groupId of input.groupIds) {
        await upsertTargetGroupShare({ targetId: runtimeTarget.id, groupId });
      }
    }

    await upsertCertificateCrlLink({
      certificateId: record.id,
      crlUrl: url,
      ignored,
      runtimeTargetId,
    });
  }

  await recordCertificateChangeEvent({
    certificateId: record.id,
    actorUserId: actor.userId,
    eventType: operation === "imported" ? "certificate.imported" : "certificate.updated",
    details: {
      filename,
      fingerprint,
      groupIds: input.groupIds,
      ignoredUrls: input.ignoredUrls,
      derivedUrls: urls,
    },
  });

  await recordCertificateImportItem({
    runId: run.id,
    certificateId: record.id,
    filename,
    fingerprint,
    result: operation,
    message: urls.length ? null : "no-crl-urls-found",
  });

  await completeCertificateImportRun(run.id, {
    imported: operation === "imported" ? 1 : 0,
    updated: operation === "updated" ? 1 : 0,
    ignored: 0,
    invalid: 0,
    derivedUrls: urls.length,
  });

  return { certificateId: record.id, result: operation, urls };
}

async function extractCertificateFilesFromZip(
  zipBytes: Buffer
): Promise<Array<{ name: string; pemText: string }>> {
  let archiveEntries: Record<string, Uint8Array>;
  try {
    archiveEntries = unzipSync(new Uint8Array(zipBytes));
  } catch (error) {
    throw new Error(
      `invalid-zip-archive:${error instanceof Error ? error.message : "unreadable-archive"}`
    );
  }

  return Object.entries(archiveEntries)
    .filter(([name]) => {
      const lowered = name.toLowerCase();
      return (
        !name.endsWith("/") &&
        (lowered.endsWith(".pem") || lowered.endsWith(".crt") || lowered.endsWith(".cer"))
      );
    })
    .map(([name, content]) => ({
      name,
      pemText: normalizeCertificatePem(Buffer.from(content)),
    }));
}

export async function importCertificateZip(
  actor: AuthenticatedPrincipal,
  zipBytes: Buffer,
  sharedInput: Omit<CertificateInput, "displayName" | "pemText">
): Promise<ImportRunSummary> {
  for (const groupId of sharedInput.groupIds) {
    if (!canManageGroup(actor, groupId)) {
      throw new Error("forbidden");
    }
  }

  const run = await createCertificateImportRun({
    mode: "zip",
    actorUserId: actor.userId,
    summary: {},
  });
  let entries: Array<{ name: string; pemText: string }>;
  try {
    entries = await extractCertificateFilesFromZip(zipBytes);
  } catch (error) {
    await completeCertificateImportRun(run.id, {
      imported: 0,
      updated: 0,
      ignored: 0,
      invalid: 0,
      archiveError:
        error instanceof Error ? error.message : "invalid-zip-archive",
      archiveReadable: false,
      status: "failed",
    }, "failed");
    return {
      runId: run.id,
      imported: 0,
      updated: 0,
      ignored: 0,
      invalid: 0,
      items: await listCertificateImportItems(run.id),
    };
  }
  let imported = 0;
  let updated = 0;
  let ignored = 0;
  let invalid = 0;

  for (const entry of entries) {
    try {
      const result = await importCertificate(
        actor,
        {
          ...sharedInput,
          displayName: slugify(entry.name).replace(/-/g, " "),
          pemText: entry.pemText,
        },
        "zip",
        entry.name
      );
      if (result.result === "imported") {
        imported += 1;
      } else {
        updated += 1;
      }
      await recordCertificateImportItem({
        runId: run.id,
        certificateId: result.certificateId,
        filename: entry.name,
        fingerprint: extractCertificateFingerprint(entry.pemText),
        result: result.result,
      });
    } catch (error) {
      invalid += 1;
      await recordCertificateImportItem({
        runId: run.id,
        certificateId: null,
        filename: entry.name,
        fingerprint: null,
        result: "invalid",
        message: error instanceof Error ? error.message : "invalid-certificate",
      });
    }
  }

  const summary = {
    runId: run.id,
    imported,
    updated,
    ignored,
    invalid,
    archiveReadable: true,
    status: "completed",
  };
  await completeCertificateImportRun(run.id, summary);
  return {
    ...summary,
    items: await listCertificateImportItems(run.id),
  };
}

export async function getCertificateImportRunDetail(
  actor: AuthenticatedPrincipal,
  runId: string
): Promise<{ run: CertificateImportRunRecord; items: CertificateImportItemRecord[] } | null> {
  const run = await findCertificateImportRun(runId);
  if (!run) {
    return null;
  }
  if (!actor.isPlatformAdmin && run.actorUserId !== actor.userId) {
    throw new Error("forbidden");
  }
  return { run, items: await listCertificateImportItems(runId) };
}

export async function listVisibleCertificates(
  principal: AuthenticatedPrincipal
): Promise<CertificateAdminListItem[]> {
  const certificates = await listCertificateRecords();
  const visible: CertificateAdminListItem[] = [];

  for (const certificate of certificates) {
    const groupIds = await listCertificateGroupIds(certificate.id);
    const canSee =
      principal.isPlatformAdmin ||
      groupIds.some((groupId) =>
        principal.groupRoles.some((membership) => membership.groupId === groupId)
      );
    if (!canSee) {
      continue;
    }
    const derived = await listCertificateCrlLinks(certificate.id);
    visible.push({
      certificate,
      groupIds,
      derivedCrlCount: derived.length,
      ignoredCrlCount: derived.filter((item) => item.ignored).length,
      lastImportAt: certificate.updatedAt,
    });
  }

  return visible;
}

export async function getCertificateAdminDetail(
  principal: AuthenticatedPrincipal,
  certificateId: string
): Promise<CertificateAdminDetail | null> {
  const certificate = await findCertificateById(certificateId);
  if (!certificate) {
    return null;
  }

  const groupIds = await listCertificateGroupIds(certificate.id);
  const canSee =
    principal.isPlatformAdmin ||
    groupIds.some((groupId) =>
      principal.groupRoles.some((membership) => membership.groupId === groupId)
    );
  if (!canSee) {
    return null;
  }

  const [derivedCrls, groupOverrides, changeHistory, templates] = await Promise.all([
    listCertificateCrlLinks(certificate.id),
    listCertificateGroupOverrides(certificate.id),
    listCertificateChangeEvents(certificate.id),
    listCertificateTemplates(),
  ]);

  return {
    certificate,
    groupIds,
    derivedCrls,
    groupOverrides,
    changeHistory,
    templates: templates.filter((template) => template.sourceCertificateId === certificate.id),
    effectiveDefaults: groupIds.map((groupId) => {
      const override = groupOverrides.find((item) => item.groupId === groupId);
      return { groupId, ...resolveOverrideEffectiveValues(override) };
    }),
  };
}

export async function ignoreDerivedUrl(
  actor: AuthenticatedPrincipal,
  certificateId: string,
  crlUrl: string,
  ignored: boolean
): Promise<void> {
  const certificate = await findCertificateById(certificateId);
  if (!certificate) {
    throw new Error("certificate-not-found");
  }
  const groupIds = await listCertificateGroupIds(certificateId);
  const manageable = groupIds.some((groupId) => canManageGroup(actor, groupId));
  if (!manageable) {
    throw new Error("forbidden");
  }

  const links = await listCertificateCrlLinks(certificateId);
  const existing = links.find((item) => item.crlUrl === crlUrl);
  await upsertCertificateCrlLink({
    certificateId,
    crlUrl,
    ignored,
    runtimeTargetId: existing?.runtimeTargetId ?? null,
  });
  await recordCertificateChangeEvent({
    certificateId,
    actorUserId: actor.userId,
    eventType: "certificate.crl-ignore-updated",
    details: { crlUrl, ignored },
  });
}

export async function createCertificateTemplateFromCertificate(
  actor: AuthenticatedPrincipal,
  certificateId: string,
  name: string
): Promise<CertificateTemplateRecord> {
  const detail = await getCertificateAdminDetail(actor, certificateId);
  if (!detail) {
    throw new Error("certificate-not-found");
  }

  const template = await createCertificateTemplate({
    sourceCertificateId: certificateId,
    name,
    details: {
      displayName: detail.certificate.displayName,
      tags: detail.certificate.tags,
      groupIds: detail.groupIds,
      derivedUrls: detail.derivedCrls.map((item) => ({
        crlUrl: item.crlUrl,
        ignored: item.ignored,
      })),
      overrides: detail.groupOverrides,
    },
    createdByUserId: actor.userId,
  });

  await recordCertificateChangeEvent({
    certificateId,
    actorUserId: actor.userId,
    eventType: "certificate.template-created",
    details: { templateId: template.id, name },
  });

  return template;
}

export async function updateCertificateAdministration(
  actor: AuthenticatedPrincipal,
  certificateId: string,
  input: {
    displayName: string;
    tags: string[];
    status: "active" | "disabled";
    groupIds: string[];
    groupOverrides: CertificateInput["groupOverrides"];
  }
): Promise<void> {
  const detail = await getCertificateAdminDetail(actor, certificateId);
  if (!detail) {
    throw new Error("certificate-not-found");
  }

  if (
    !actor.isPlatformAdmin &&
    !input.groupIds.every((groupId) => canManageGroup(actor, groupId))
  ) {
    throw new Error("forbidden");
  }

  await upsertCertificateRecord({
    fingerprint: detail.certificate.fingerprint,
    displayName: input.displayName,
    pemText: detail.certificate.pemText,
    tags: input.tags,
    status: input.status,
    sourceType: detail.certificate.sourceType,
    createdByUserId: detail.certificate.createdByUserId,
    templateId: detail.certificate.templateId,
  });

  for (const groupId of input.groupIds) {
    await upsertCertificateGroupShare({ certificateId, groupId });
  }

  for (const override of input.groupOverrides) {
    if (!input.groupIds.includes(override.groupId)) {
      continue;
    }
    await upsertCertificateGroupOverride({
      certificateId,
      groupId: override.groupId,
      intervalSeconds: override.intervalSeconds,
      timeoutSeconds: override.timeoutSeconds,
      criticality: override.criticality,
      alertEmail: override.alertEmail,
      extraRecipients: override.extraRecipients,
      retentionPollsDays: override.retentionPollsDays,
      retentionAlertsDays: override.retentionAlertsDays,
      retentionCoverageGapsDays: override.retentionCoverageGapsDays,
      enabled: override.enabled,
    });
  }

  await recordCertificateChangeEvent({
    certificateId,
    actorUserId: actor.userId,
    eventType: "certificate.admin-updated",
    details: {
      displayName: input.displayName,
      tags: input.tags,
      status: input.status,
      groupIds: input.groupIds,
    },
  });
}

export async function runManualConnectivityCheck(
  actor: AuthenticatedPrincipal,
  certificateId: string
): Promise<{ derivedUrls: number; ignoredUrls: number }> {
  const detail = await getCertificateAdminDetail(actor, certificateId);
  if (!detail) {
    throw new Error("certificate-not-found");
  }

  const summary = {
    derivedUrls: detail.derivedCrls.length,
    ignoredUrls: detail.derivedCrls.filter((item) => item.ignored).length,
  };

  await recordCertificateChangeEvent({
    certificateId,
    actorUserId: actor.userId,
    eventType: "certificate.manual-check-triggered",
    details: summary,
  });

  return summary;
}
