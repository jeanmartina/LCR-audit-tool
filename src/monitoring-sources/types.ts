export type MonitoringSourceType = "ocsp" | "policy-document";

export type MonitoringSourceState =
  | "discovered"
  | "not_discovered"
  | "not_checkable"
  | "disabled";

export type PolicyDocumentRole = "cp" | "cps" | "dpc" | "unknown-policy-document";

export interface MonitoringSourceProvenanceInput {
  certificateId: string;
  fingerprint: string;
  sourceType: MonitoringSourceType;
  sourceUrl: string | null;
  normalizedUrl: string | null;
  trustListSourceId?: string | null;
  trustListSnapshotId?: string | null;
  trustListRunId?: string | null;
  policyOid: string | null;
  documentRole: PolicyDocumentRole | null;
  derivationReason: string;
  state: MonitoringSourceState;
}

export interface MonitoringSourceRecord extends MonitoringSourceProvenanceInput {
  id: string;
  sourceKey: string;
  trustListSourceId: string | null;
  trustListSnapshotId: string | null;
  trustListRunId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
