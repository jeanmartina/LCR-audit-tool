"use client";

import { useRef, useState, type ReactElement } from "react";
import {
  ActionButton,
  CheckboxField,
  Field,
  Notice,
  Panel,
  stackStyle,
  StatusPill,
  TextInput,
} from "../../../components/ui/primitives";
import type { TrustListSourcePreviewResult } from "../../../trust-lists/types";

export type TrustListWizardCopy = Record<string, string>;

interface PreviewResponse {
  preview?: TrustListSourcePreviewResult;
  error?: string;
}

function valueOrDash(value: string | number | null | undefined): string {
  return value === null || value === undefined || value === "" ? "-" : String(value);
}

export function TrustListSourceWizard({ copy }: { copy: TrustListWizardCopy }): ReactElement {
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<TrustListSourcePreviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function testSource(): Promise<void> {
    const form = formRef.current;
    if (!form) return;
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const response = await fetch("/api/admin/trust-lists/preview", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      const body = (await response.json()) as PreviewResponse;
      if (!response.ok) {
        setError(body.error ?? copy["admin.trustLists.wizard.testErrorFallback"]);
        return;
      }
      setPreview(body.preview ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy["admin.trustLists.wizard.testErrorFallback"]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel title={copy["admin.trustLists.new.title"]} description={copy["admin.trustLists.new.description"]}>
      <form ref={formRef} action="/api/admin/trust-lists" method="post" style={stackStyle()}>
        <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <Notice title={copy["admin.trustLists.wizard.step.details"]}>
            {copy["admin.trustLists.wizard.step.details.body"]}
          </Notice>
          <Notice title={copy["admin.trustLists.wizard.step.test"]}>
            {copy["admin.trustLists.wizard.step.test.body"]}
          </Notice>
          <Notice title={copy["admin.trustLists.wizard.step.save"]}>
            {copy["admin.trustLists.wizard.step.save.body"]}
          </Notice>
        </div>

        <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <Field label={copy["admin.trustLists.label"]} hint={copy["admin.trustLists.label.hint"]} example={copy["admin.trustLists.label.example"]}>
            <TextInput name="label" required />
          </Field>
          <Field label={copy["admin.trustLists.url"]} hint={copy["admin.trustLists.url.hint"]} example={copy["admin.trustLists.url.example"]}>
            <TextInput name="url" type="url" required />
          </Field>
          <Field label={copy["admin.trustLists.groupIds"]} hint={copy["admin.trustLists.groupIds.hint"]} example={copy["admin.trustLists.groupIds.example"]}>
            <TextInput name="groupIds" required />
          </Field>
        </div>
        <CheckboxField name="enabled" defaultChecked label={copy["admin.trustLists.enabled"]} hint={copy["admin.trustLists.enabled.hint"]} />

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            onClick={testSource}
            disabled={loading}
            style={{
              width: "fit-content",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid var(--button-border)",
              background: "transparent",
              color: "inherit",
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? copy["admin.trustLists.wizard.testing"] : copy["admin.trustLists.wizard.testButton"]}
          </button>
          <ActionButton>{copy["admin.trustLists.create"]}</ActionButton>
        </div>

        {!preview ? (
          <Notice tone="warning" title={copy["admin.trustLists.wizard.saveWithoutTest.title"]}>
            {copy["admin.trustLists.wizard.saveWithoutTest.body"]}
          </Notice>
        ) : null}
        {error ? <Notice tone="warning" title={copy["admin.trustLists.wizard.testErrorTitle"]}>{error}</Notice> : null}
        {preview ? (
          <Notice tone={preview.ok ? "success" : "warning"} title={copy["admin.trustLists.wizard.testResultTitle"]}>
            <span style={stackStyle("4px")}>
              <span>{copy["admin.trustLists.wizard.preview.validationStatus"]}: {preview.validationStatus}</span>
              <span>{copy["admin.trustLists.wizard.preview.digest"]}: {valueOrDash(preview.digestSha256)}</span>
              <span>{copy["admin.trustLists.wizard.preview.sequence"]}: {valueOrDash(preview.sequenceNumber)}</span>
              <span>{copy["admin.trustLists.wizard.preview.territory"]}: {valueOrDash(preview.territory)}</span>
              <span>{copy["admin.trustLists.wizard.preview.certificateCount"]}: {valueOrDash(preview.certificateCount)}</span>
              <span>{copy["admin.trustLists.wizard.preview.xmlSize"]}: {valueOrDash(preview.xmlSizeBytes)}</span>
              {preview.recovery ? (
                <span>
                  <StatusPill tone="warning">{copy[preview.recovery.titleKey]}</StatusPill> {copy[preview.recovery.actionKey]}
                </span>
              ) : null}
            </span>
          </Notice>
        ) : null}
      </form>
    </Panel>
  );
}
