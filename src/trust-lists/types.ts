export interface TrustListCertificateCandidate {
  ordinal: number;
  pem: string;
  subjectSummary: string | null;
  sourcePath: string;
}


export interface TrustListProjectionCandidate extends TrustListCertificateCandidate {
  fingerprint: string;
  candidateKey: string;
  candidateDigest: string;
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

export interface TrustListRecoveryGuidance {
  code:
    | "invalid-url"
    | "https-required"
    | "xml-signature-invalid"
    | "xml-too-large"
    | "fetch-failed"
    | "no-certificates"
    | "parse-failed"
    | "unknown";
  severity: "info" | "warning" | "critical";
  titleKey: string;
  bodyKey: string;
  actionKey: string;
}

export interface TrustListSourcePreviewResult {
  ok: boolean;
  url: string;
  digestSha256: string | null;
  sequenceNumber: string | null;
  territory: string | null;
  issueDate: string | null;
  nextUpdate: string | null;
  xmlSizeBytes: number | null;
  certificateCount: number | null;
  validationStatus: "valid" | "invalid";
  failureReason: string | null;
  recovery: TrustListRecoveryGuidance | null;
}
