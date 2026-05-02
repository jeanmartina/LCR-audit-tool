import type { MonitoringSourceType, PolicyDocumentRole } from "./types";

export type MonitoringSourceEventStatus =
  | "available"
  | "changed"
  | "unchanged"
  | "unavailable"
  | "blocked"
  | "oversized"
  | "not_checkable"
  | "extraction_failed";

export type DocumentExtractionStatus = "not_attempted" | "succeeded" | "truncated" | "failed";

export interface MonitoringSourceEventRecord {
  id: string;
  sourceId: string;
  sourceKey: string;
  sourceType: MonitoringSourceType;
  status: MonitoringSourceEventStatus;
  statusLabel: string | null;
  checkedAt: Date;
  durationMs: number;
  httpStatus: number | null;
  contentType: string | null;
  contentLength: number | null;
  contentSha256: string | null;
  failureReason: string | null;
  snapshotId: string | null;
}

export interface DocumentSnapshotRecord {
  id: string;
  sourceId: string;
  sourceKey: string;
  certificateId: string;
  fingerprint: string;
  sourceUrl: string | null;
  normalizedUrl: string | null;
  finalUrl: string;
  policyOid: string | null;
  documentRole: PolicyDocumentRole | null;
  trustListSourceId: string | null;
  trustListSnapshotId: string | null;
  trustListRunId: string | null;
  contentType: string | null;
  sizeBytes: number;
  sha256: string;
  rawBodyBase64: string;
  extractedText: string | null;
  extractedTextTruncated: boolean;
  extractionStatus: DocumentExtractionStatus;
  extractionFailureReason: string | null;
  metadataJson: Record<string, unknown>;
  capturedAt: Date;
}
