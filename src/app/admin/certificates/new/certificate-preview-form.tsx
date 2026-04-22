"use client";

import { useRef, useState, type ReactElement } from "react";
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

type Copy = Record<string, string>;

export function CertificatePreviewForm({ copy }: { copy: Copy }): ReactElement {
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function previewImport(): Promise<void> {
    if (!formRef.current) {
      return;
    }
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const response = await fetch("/api/admin/certificates/import/preview", {
        method: "POST",
        body: new FormData(formRef.current),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "certificate-preview-failed");
        return;
      }
      setPreview(payload.preview);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "certificate-preview-failed");
    } finally {
      setLoading(false);
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
          defaultValue={`[
  {
    "groupId": "group-1",
    "intervalSeconds": 600,
    "timeoutSeconds": 5,
    "criticality": "high",
    "alertEmail": "alerts@example.com",
    "extraRecipients": ["backup@example.com"]
  }
]`}
        />
      </Field>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={previewImport}
          style={{
            width: "fit-content",
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid var(--button-border)",
            background: "var(--subtle-bg)",
            color: "inherit",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {loading ? copy.previewLoading : copy.previewButton}
        </button>
        <ActionButton>{copy.submit}</ActionButton>
      </div>

      {error ? (
        <Notice tone="warning" title={copy.previewErrorTitle}>
          {error}
        </Notice>
      ) : null}

      <Panel title={copy.previewConfig} description={copy.previewConfigText} compact>
        {preview ? (
          <div style={stackStyle("10px")}>
            <div>
              <strong>{copy.previewFingerprint}</strong>
              <div style={{ overflowWrap: "anywhere" }}>{preview.fingerprint}</div>
            </div>
            <div>
              <strong>{copy.previewDerivedCrls}</strong>
              <ul>
                {preview.derivedUrls.map((url) => (
                  <li key={url}>{url}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong>{copy.previewTrackedCrls}</strong> {preview.trackedUrls.length}
            </div>
            <div>
              <strong>{copy.previewIgnoredCrls}</strong> {preview.ignoredUrls.length}
            </div>
            <div>
              <strong>{copy.previewEffectiveDefaults}</strong>
              <ul>
                {preview.effectiveDefaults.map((item) => (
                  <li key={item.groupId}>
                    {item.groupId}: {item.intervalSeconds}s / {item.timeoutSeconds}s / {item.criticality}
                  </li>
                ))}
              </ul>
            </div>
            {preview.warnings.length ? (
              <Notice tone="warning" title={copy.previewWarnings}>
                {preview.warnings.join(", ")}
              </Notice>
            ) : null}
          </div>
        ) : (
          <p style={{ color: "var(--muted-color)", margin: 0 }}>{copy.previewEmpty}</p>
        )}
      </Panel>
    </form>
  );
}
