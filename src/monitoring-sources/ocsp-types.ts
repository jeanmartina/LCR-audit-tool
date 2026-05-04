export type OcspCheckEventStatus =
  | "available"
  | "unavailable"
  | "blocked"
  | "oversized"
  | "malformed"
  | "not_checkable";

export type OcspParseStatus = "not_attempted" | "parsed" | "failed";

export interface OcspCheckEventRecord {
  id: string;
  sourceId: string;
  sourceKey: string;
  status: OcspCheckEventStatus;
  statusLabel: string | null;
  checkedAt: Date;
  durationMs: number;
  httpStatus: number | null;
  contentType: string | null;
  responseSizeBytes: number | null;
  responseSha256: string | null;
  failureReason: string | null;
  evidenceId: string | null;
}

export interface OcspResponseEvidenceRecord {
  id: string;
  sourceId: string;
  sourceKey: string;
  certificateId: string;
  certificateFingerprint: string;
  issuerCertificateId: string;
  issuerFingerprint: string;
  responderUrl: string;
  finalUrl: string;
  requestBodyBase64: string;
  requestSha256: string;
  requestSizeBytes: number;
  responseBodyBase64: string | null;
  responseSha256: string | null;
  responseSizeBytes: number | null;
  httpStatus: number | null;
  contentType: string | null;
  parseStatus: OcspParseStatus;
  parseFailureReason: string | null;
  metadataJson: Record<string, unknown>;
  checkedAt: Date;
}
