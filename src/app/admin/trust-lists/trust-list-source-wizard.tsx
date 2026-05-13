"use client";

import { useRef, useState, type ReactElement } from "react";
import {
  CheckboxField,
  Field,
  Notice,
  Panel,
  SelectInput,
  stackStyle,
  StatusPill,
  TextInput,
} from "../../../components/ui/primitives";
import type { TrustListSourcePreviewResult } from "../../../trust-lists/types";
import type { TrustListReviewDecision, TrustListReviewPayload } from "../../../trust-lists/sync";

export type TrustListWizardCopy = Record<string, string>;

interface PreviewResponse {
  preview?: TrustListSourcePreviewResult;
  error?: string;
}

interface CreateSourceResponse {
  source?: { id: string };
  error?: string;
}

interface SyncSourceResponse {
  result?: { status: "succeeded" | "failed" };
  error?: string;
}

type CandidateDecisionState = Record<
  string,
  { decision: TrustListReviewDecision; reason: string }
>;

const REVIEW_DECISIONS: TrustListReviewDecision[] = ["accept", "edit", "ignore", "reject", "duplicate", "pending"];

function valueOrDash(value: string | number | null | undefined): string {
  return value === null || value === undefined || value === "" ? "-" : String(value);
}

export function TrustListSourceWizard({ copy }: { copy: TrustListWizardCopy }): ReactElement {
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<TrustListSourcePreviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [candidateDecisions, setCandidateDecisions] = useState<CandidateDecisionState>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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
      const nextPreview = body.preview ?? null;
      setPreview(nextPreview);
      if (nextPreview) {
        setCandidateDecisions(
          Object.fromEntries(
            nextPreview.candidates.map((candidate) => [
              candidate.reviewKey,
              { decision: "pending" as TrustListReviewDecision, reason: "" },
            ]),
          ),
        );
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy["admin.trustLists.wizard.testErrorFallback"]);
    } finally {
      setLoading(false);
    }
  }

  function setCandidateDecision(reviewKey: string, decision: TrustListReviewDecision): void {
    setCandidateDecisions((current) => ({
      ...current,
      [reviewKey]: {
        decision,
        reason: current[reviewKey]?.reason ?? "",
      },
    }));
  }

  function setCandidateReason(reviewKey: string, reason: string): void {
    setCandidateDecisions((current) => ({
      ...current,
      [reviewKey]: {
        decision: current[reviewKey]?.decision ?? "pending",
        reason,
      },
    }));
  }

  function buildReviewPayload(): TrustListReviewPayload {
    const payload: TrustListReviewPayload = { candidateDecisions: {} };
    for (const candidate of preview?.candidates ?? []) {
      const state = candidateDecisions[candidate.reviewKey] ?? { decision: "pending", reason: "" };
      payload.candidateDecisions[candidate.reviewKey] = {
        decision: state.decision,
        reason: state.reason.trim() || undefined,
      };
    }
    return payload;
  }

  async function createAndSyncSource(): Promise<void> {
    const form = formRef.current;
    if (!form) return;
    if (!preview?.candidates?.length) {
      setSaveError(copy["admin.trustLists.review.required"]);
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);
    try {
      const formData = new FormData(form);
      const createResponse = await fetch("/api/admin/trust-lists", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });
      const createBody = (await createResponse.json()) as CreateSourceResponse;
      if (!createResponse.ok || !createBody.source?.id) {
        throw new Error(createBody.error ?? copy["admin.trustLists.review.saveFailed"]);
      }

      const syncResponse = await fetch(`/api/admin/trust-lists/${createBody.source.id}/sync`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reviewPayload: buildReviewPayload() }),
      });
      const syncBody = (await syncResponse.json()) as SyncSourceResponse;
      if (!syncResponse.ok || !syncBody.result || syncBody.result.status !== "succeeded") {
        throw new Error(syncBody.error ?? copy["admin.trustLists.review.saveFailed"]);
      }
      setSaveMessage(copy["admin.trustLists.review.saved"]);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : copy["admin.trustLists.review.saveFailed"]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title={copy["admin.trustLists.new.title"]} description={copy["admin.trustLists.new.description"]}>
      <form ref={formRef} style={stackStyle()}>
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
        <Notice title={copy["admin.trustLists.review.title"]}>
          {copy["admin.trustLists.review.body"]}
        </Notice>
        {preview?.candidates?.length ? (
          <div style={{ display: "grid", gap: "12px" }}>
            {preview.candidates.map((candidate) => {
              const state = candidateDecisions[candidate.reviewKey] ?? { decision: "pending", reason: "" };
              return (
                <div
                  key={candidate.reviewKey}
                  style={{ border: "1px solid var(--panel-border)", borderRadius: "12px", padding: "12px", display: "grid", gap: "10px" }}
                >
                  <div style={{ display: "grid", gap: "4px" }}>
                    <strong>{copy["admin.trustLists.review.candidate"]} #{candidate.ordinal}</strong>
                    <span>{copy["admin.trustLists.review.fingerprint"]}: {candidate.fingerprint}</span>
                    <span>{copy["admin.trustLists.review.subject"]}: {valueOrDash(candidate.subjectSummary)}</span>
                  </div>
                  <Field label={copy["admin.trustLists.review.decision"]}>
                    <SelectInput
                      value={state.decision}
                      onChange={(event) => setCandidateDecision(candidate.reviewKey, event.target.value as TrustListReviewDecision)}
                    >
                      {REVIEW_DECISIONS.map((decision) => (
                        <option key={decision} value={decision}>
                          {copy[`admin.trustLists.review.decision.${decision}`]}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field label={copy["admin.trustLists.review.reason"]} hint={copy["admin.trustLists.review.reason.hint"]}>
                    <TextInput
                      value={state.reason}
                      onChange={(event) => setCandidateReason(candidate.reviewKey, event.target.value)}
                    />
                  </Field>
                </div>
              );
            })}
          </div>
        ) : (
          <Notice tone="warning" title={copy["admin.trustLists.review.empty.title"]}>
            {copy["admin.trustLists.review.empty.body"]}
          </Notice>
        )}

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
          <button
            type="button"
            onClick={createAndSyncSource}
            disabled={saving}
            style={{
              width: "fit-content",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid var(--button-border)",
              background: "var(--button-bg)",
              color: "var(--button-fg)",
              fontWeight: 700,
              cursor: saving ? "wait" : "pointer",
            }}
          >
            {saving ? copy["admin.trustLists.review.saving"] : copy["admin.trustLists.create"]}
          </button>
        </div>

        {!preview ? (
          <Notice tone="warning" title={copy["admin.trustLists.wizard.saveWithoutTest.title"]}>
            {copy["admin.trustLists.wizard.saveWithoutTest.body"]}
          </Notice>
        ) : null}
        {error ? <Notice tone="warning" title={copy["admin.trustLists.wizard.testErrorTitle"]}>{error}</Notice> : null}
        {saveError ? <Notice tone="warning" title={copy["admin.trustLists.wizard.testErrorTitle"]}>{saveError}</Notice> : null}
        {saveMessage ? <Notice tone="success" title={copy["admin.trustLists.syncComplete.title"]}>{saveMessage}</Notice> : null}
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
