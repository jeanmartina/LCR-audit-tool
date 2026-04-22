export interface TrustListCertificateCandidate {
  ordinal: number;
  pem: string;
  subjectSummary: string | null;
  sourcePath: string;
}

export interface ParsedTrustListDocument {
  digestSha256: string;
  xmlSizeBytes: number;
  sequenceNumber: string | null;
  territory: string | null;
  issueDate: string | null;
  nextUpdate: string | null;
  certificates: TrustListCertificateCandidate[];
}

export interface XmlSignatureValidationResult {
  valid: boolean;
  reason?: string;
  signerCertificatePem?: string | null;
}

export interface TrustListSyncSummary {
  sourceId: string;
  runId: string;
  status: "succeeded" | "failed";
  snapshotId: string | null;
  digestSha256: string | null;
  sequenceNumber: string | null;
  territory: string | null;
  issueDate: string | null;
  nextUpdate: string | null;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  failureReason: string | null;
}
