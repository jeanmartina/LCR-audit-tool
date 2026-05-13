"use client";

import { useMemo, useRef, useState, type ReactElement } from "react";
import {
  ActionButton,
  Field,
  Notice,
  Panel,
  TextAreaInput,
  TextInput,
  stackStyle,
} from "../../../../components/ui/primitives";

type Preview = {
  fingerprint: string;
  derivedUrls: string[];
  trackedUrls: string[];
  ignoredUrls: string[];
  effectiveDefaults: Array<{
    groupId: string;
    intervalSeconds: number;
    timeoutSeconds: number;
    criticality: string;
    alertEmail: string | null;
    extraRecipients: string[];
    retentionPollsDays: number;
    retentionAlertsDays: number;
    retentionCoverageGapsDays: number;
    enabled: boolean;
  }>;
  warnings: string[];
};

type Snapshot = {
  origin: "single" | "zip" | "trust-list";
  input: {
    displayName: string;
    pemText: string;
    tags: string[];
    groupIds: string[];
    ignoredUrls: string[];
    status: "active" | "disabled";
    groupOverrides: unknown[];
  };
  preview: Preview;
};

type Copy = Record<string, string>;

type Decision = "accept" | "edit" | "ignore" | "reject" | "duplicate" | "pending";

const DECISIONS: Decision[] = ["accept", "edit", "ignore", "reject", "duplicate", "pending"];

function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function CertificatePreviewForm({ copy }: { copy: Copy }): ReactElement {
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [decision, setDecision] = useState<Decision>("accept");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [highlightedError, setHighlightedError] = useState<string | null>(null);
  const [justification, setJustification] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedDisplayName, setEditedDisplayName] = useState("");
  const [editedTags, setEditedTags] = useState("");
  const [editedGroupIds, setEditedGroupIds] = useState("");
  const [editedIgnoredUrls, setEditedIgnoredUrls] = useState("");
  const [editedStatus, setEditedStatus] = useState<"active" | "disabled">("active");

  const hasDivergence = useMemo(() => {
    if (!snapshot) return false;
    return (
      editedDisplayName.trim() !== snapshot.input.displayName ||
      JSON.stringify(parseCsv(editedTags)) !== JSON.stringify(snapshot.input.tags) ||
      JSON.stringify(parseCsv(editedGroupIds)) !== JSON.stringify(snapshot.input.groupIds) ||
      JSON.stringify(parseCsv(editedIgnoredUrls)) !== JSON.stringify(snapshot.input.ignoredUrls) ||
      editedStatus !== snapshot.input.status
    );
  }, [editedDisplayName, editedGroupIds, editedIgnoredUrls, editedStatus, editedTags, snapshot]);

  async function previewImport(): Promise<void> {
    if (!formRef.current) {
      return;
    }
    setLoading(true);
    setReviewError(null);
    setHighlightedError(null);
    setPreview(null);
    setSnapshot(null);
    try {
      const response = await fetch("/api/admin/certificates/import/preview", {
        method: "POST",
        body: new FormData(formRef.current),
      });
      const payload = await response.json();
      if (!response.ok) {
        setReviewError(payload.error ?? "certificate-preview-failed");
        return;
      }
      setPreview(payload.preview);
      setSnapshot(payload.snapshot);
      setDecision("accept");
      setJustification("");
      setEditedDisplayName(payload.snapshot.input.displayName);
      setEditedTags(payload.snapshot.input.tags.join(", "));
      setEditedGroupIds(payload.snapshot.input.groupIds.join(", "));
      setEditedIgnoredUrls(payload.snapshot.input.ignoredUrls.join(", "));
      setEditedStatus(payload.snapshot.input.status);
    } catch (nextError) {
      setReviewError(nextError instanceof Error ? nextError.message : "certificate-preview-failed");
    } finally {
      setLoading(false);
    }
  }

  async function submitReview(): Promise<void> {
    if (!formRef.current || !snapshot) {
      return;
    }
    if (hasDivergence && !justification.trim()) {
      setHighlightedError("review-justification-required");
      setReviewError(copy.reviewMissingJustification);
      return;
    }

    setSaving(true);
    setReviewError(null);
    setHighlightedError(null);
    try {
      const formData = new FormData(formRef.current);
      const reviewPayload = {
        snapshot,
        decision,
        editedInput: {
          ...snapshot.input,
          displayName: editedDisplayName.trim(),
          tags: parseCsv(editedTags),
          groupIds: parseCsv(editedGroupIds),
          ignoredUrls: parseCsv(editedIgnoredUrls),
          status: editedStatus,
        },
        justification,
      };
      formData.set("reviewDecision", decision);
      formData.set("reviewJustification", justification);
      formData.set("reviewPayload", JSON.stringify(reviewPayload));

      const response = await fetch("/api/admin/certificates/import", {
        method: "POST",
        body: formData,
        redirect: "manual",
      });

      if (response.status === 303) {
        const location = response.headers.get("location") ?? "/admin/certificates";
        window.location.assign(location);
        return;
      }

      const payload = await response.json();
      if (!response.ok) {
        const errorCode = String(payload.error ?? "certificate-import-failed");
        setReviewError(copy.reviewSaveFailed.replace("{error}", errorCode));
        setHighlightedError(errorCode);
        return;
      }
      if (payload.runId) {
        window.location.assign(`/admin/certificates/import-runs/${payload.runId}?reviewRecorded=1`);
      }
    } catch (nextError) {
      setReviewError(nextError instanceof Error ? nextError.message : "certificate-import-failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      ref={formRef}
      action="/api/admin/certificates/import"
      method="post"
      encType="multipart/form-data"
      style={stackStyle()}
    >
      <Field label={copy.displayName} hint={copy.displayNameHint}>
        <TextInput name="displayName" required />
      </Field>
      <Field label={copy.file} hint={copy.fileHint} example="root.pem, intermediate.cer, ca.crt">
        <TextInput type="file" name="certificate" required accept=".pem,.crt,.cer" />
      </Field>
      <Field label={copy.tags} hint={copy.tagsHint} example="eu-qualified, finance">
        <TextInput name="tags" />
      </Field>
      <Field label={copy.groupIds} hint={copy.groupIdsHint} example="group-1, group-2">
        <TextInput name="groupIds" required />
      </Field>
      <Field label={copy.ignoredUrls} hint={copy.ignoredUrlsHint} example="https://example.test/root.crl">
        <TextAreaInput name="ignoredUrls" rows={3} />
      </Field>
      <Field label={copy.groupOverrides} hint={copy.groupOverridesHint}>
        <TextAreaInput
          name="groupOverrides"
          rows={8}
          defaultValue={`[\n  {\n    "groupId": "group-1",\n    "intervalSeconds": 600,\n    "timeoutSeconds": 5,\n    "criticality": "high",\n    "alertEmail": "alerts@example.com",\n    "extraRecipients": ["backup@example.com"]\n  }\n]`}
        />
      </Field>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button type="button" onClick={previewImport} style={{ width: "fit-content", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--button-border)", background: "var(--subtle-bg)", color: "inherit", fontWeight: 700, cursor: "pointer" }}>
          {loading ? copy.previewLoading : copy.previewButton}
        </button>
        <button type="button" onClick={submitReview} disabled={!snapshot || saving || (hasDivergence && !justification.trim())} style={{ width: "fit-content", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--button-border)", background: "var(--accent)", color: "white", fontWeight: 700, cursor: "pointer", opacity: !snapshot || saving || (hasDivergence && !justification.trim()) ? 0.6 : 1 }}>
          {saving ? copy.reviewSaving : copy.reviewSaveButton}
        </button>
      </div>

      {reviewError ? (
        <Notice tone="warning" title={copy.previewErrorTitle}>
          {reviewError}
        </Notice>
      ) : null}

      <Panel title={copy.reviewTitle} description={copy.reviewDescription} compact>
        {!preview || !snapshot ? (
          <p style={{ color: "var(--muted-color)", margin: 0 }}>{copy.previewEmpty}</p>
        ) : (
          <div style={stackStyle("10px")}>
            <div>
              <strong>{copy.previewFingerprint}</strong>
              <div style={{ overflowWrap: "anywhere" }}>{preview.fingerprint}</div>
            </div>
            <div>
              <strong>{copy.reviewDecisionLabel}</strong>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                {DECISIONS.map((value) => (
                  <label key={value} style={{ display: "inline-flex", gap: "4px", alignItems: "center" }}>
                    <input type="radio" checked={decision === value} onChange={() => setDecision(value)} />
                    {copy[`reviewDecision.${value}`]}
                  </label>
                ))}
              </div>
            </div>
            <Field label={copy.displayName}>
              <TextInput value={editedDisplayName} onChange={(event) => setEditedDisplayName(event.target.value)} />
            </Field>
            <Field label={copy.tags}>
              <TextInput value={editedTags} onChange={(event) => setEditedTags(event.target.value)} />
            </Field>
            <Field label={copy.groupIds}>
              <TextInput value={editedGroupIds} onChange={(event) => setEditedGroupIds(event.target.value)} />
            </Field>
            <Field label={copy.ignoredUrls}>
              <TextAreaInput rows={3} value={editedIgnoredUrls} onChange={(event) => setEditedIgnoredUrls(event.target.value)} />
            </Field>
            <Field label={copy.reviewStatusLabel}>
              <select value={editedStatus} onChange={(event) => setEditedStatus(event.target.value === "disabled" ? "disabled" : "active")}>
                <option value="active">active</option>
                <option value="disabled">disabled</option>
              </select>
            </Field>
            <Field label={copy.reviewJustificationLabel} hint={copy.reviewJustificationHint}>
              <TextAreaInput
                rows={3}
                value={justification}
                onChange={(event) => setJustification(event.target.value)}
                style={highlightedError === "review-justification-required" ? { borderColor: "#c53030" } : undefined}
              />
            </Field>
            {preview.warnings.length ? (
              <Notice tone="warning" title={copy.previewWarnings}>
                {preview.warnings.join(", ")}
              </Notice>
            ) : null}
            <div style={{ color: "var(--muted-color)" }}>{copy.reviewServerGuardrail}</div>
          </div>
        )}
      </Panel>
      <button
        type="button"
        onClick={submitReview}
        disabled={!snapshot || saving || (hasDivergence && !justification.trim())}
        style={{
          width: "fit-content",
          padding: "10px 14px",
          borderRadius: "10px",
          border: "1px solid var(--button-border)",
          background: "var(--accent)",
          color: "white",
          fontWeight: 700,
          cursor: "pointer",
          opacity: !snapshot || saving || (hasDivergence && !justification.trim()) ? 0.6 : 1,
        }}
      >
        {saving ? copy.reviewSaving : copy.reviewSaveButton}
      </button>
    </form>
  );
}
