"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { Notice, TextAreaInput } from "../../../../components/ui/primitives";

type Decision = "accept" | "edit" | "ignore" | "reject" | "duplicate" | "pending";

type Candidate = {
  filename: string;
  snapshot: {
    input: {
      displayName: string;
      tags: string[];
      groupIds: string[];
      ignoredUrls: string[];
      status: "active" | "disabled";
      groupOverrides: unknown[];
      pemText: string;
    };
    preview: { fingerprint: string };
    origin: "zip";
  };
};

type CandidateState = {
  decision: Decision;
  displayName: string;
  tags: string;
  groupIds: string;
  ignoredUrls: string;
  status: "active" | "disabled";
  justification: string;
};

const REVIEW_STATE_KEY = "zip-review-state-v1";

function parseCsv(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function BatchReviewPageClient({ copy }: { copy: Record<string, string> }): ReactElement {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [states, setStates] = useState<CandidateState[]>([]);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(REVIEW_STATE_KEY);
      if (!raw) {
        setError(copy.missingState);
        return;
      }
      const parsed = JSON.parse(raw) as { candidates: Candidate[] };
      setCandidates(parsed.candidates);
      setStates(
        parsed.candidates.map((candidate) => ({
          decision: "accept",
          displayName: candidate.snapshot.input.displayName,
          tags: candidate.snapshot.input.tags.join(", "),
          groupIds: candidate.snapshot.input.groupIds.join(", "),
          ignoredUrls: candidate.snapshot.input.ignoredUrls.join(", "),
          status: candidate.snapshot.input.status,
          justification: "",
        }))
      );
    } catch {
      setError(copy.loadError);
    }
  }, [copy.loadError, copy.missingState]);

  const current = candidates[index];
  const currentState = states[index];

  const hasDivergence = useMemo(() => {
    if (!current || !currentState) return false;
    return (
      currentState.displayName.trim() !== current.snapshot.input.displayName ||
      JSON.stringify(parseCsv(currentState.tags)) !== JSON.stringify(current.snapshot.input.tags) ||
      JSON.stringify(parseCsv(currentState.groupIds)) !== JSON.stringify(current.snapshot.input.groupIds) ||
      JSON.stringify(parseCsv(currentState.ignoredUrls)) !== JSON.stringify(current.snapshot.input.ignoredUrls) ||
      currentState.status !== current.snapshot.input.status
    );
  }, [current, currentState]);

  function updateState(next: Partial<CandidateState>): void {
    setStates((previous) => previous.map((entry, i) => (i === index ? { ...entry, ...next } : entry)));
  }

  async function saveReview(): Promise<void> {
    setError(null);
    setSaving(true);
    setHighlightedIndex(null);
    try {
      const reviewPayload = {
        candidates: candidates.map((candidate, i) => ({
          filename: candidate.filename,
          submission: {
            snapshot: candidate.snapshot,
            decision: states[i].decision,
            editedInput: {
              ...candidate.snapshot.input,
              displayName: states[i].displayName.trim(),
              tags: parseCsv(states[i].tags),
              groupIds: parseCsv(states[i].groupIds),
              ignoredUrls: parseCsv(states[i].ignoredUrls),
              status: states[i].status,
            },
            justification: states[i].justification,
          },
        })),
      };

      const formData = new FormData();
      formData.set("mode", "review-save");
      formData.set("reviewPayload", JSON.stringify(reviewPayload));

      const response = await fetch("/api/admin/certificates/import-zip", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) {
        if (typeof payload.firstErrorIndex === "number") {
          setIndex(payload.firstErrorIndex);
          setHighlightedIndex(payload.firstErrorIndex);
        }
        setError(`${copy.saveError}: ${payload.error ?? copy.reviewMismatch}`);
        return;
      }
      sessionStorage.removeItem(REVIEW_STATE_KEY);
      router.push(`/admin/certificates/import-runs/${payload.runId}?reviewSaved=1`);
    } catch {
      setError(copy.reviewMismatch);
    } finally {
      setSaving(false);
    }
  }

  if (error && !candidates.length) {
    return <Notice tone="warning" title={copy.revalidationTitle}>{error}</Notice>;
  }

  if (!current || !currentState) {
    return <p>{copy.missingState}</p>;
  }

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      {error ? <Notice tone="warning" title={copy.revalidationTitle}>{error}</Notice> : null}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {candidates.map((candidate, candidateIndex) => (
          <button key={candidate.filename} type="button" onClick={() => setIndex(candidateIndex)} style={{ border: candidateIndex === index ? "2px solid #1d4ed8" : "1px solid var(--panel-border)", borderRadius: "8px", padding: "6px 10px", background: "transparent" }}>
            {candidate.filename}
          </button>
        ))}
      </div>
      <div style={{ fontSize: "12px", color: "var(--muted-color)" }}>{current.snapshot.preview.fingerprint}</div>
      <div>
        <strong>{copy.decision}</strong>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "6px" }}>
          {([
            ["accept", copy.decisionAccept],
            ["edit", copy.decisionEdit],
            ["ignore", copy.decisionIgnore],
            ["reject", copy.decisionReject],
            ["duplicate", copy.decisionDuplicate],
            ["pending", copy.decisionPending],
          ] as Array<[Decision, string]>).map(([value, label]) => (
            <label key={value} style={{ display: "inline-flex", gap: "4px", alignItems: "center" }}>
              <input type="radio" checked={currentState.decision === value} onChange={() => updateState({ decision: value })} />
              {label}
            </label>
          ))}
        </div>
      </div>
      <label>Display name <input value={currentState.displayName} onChange={(event) => updateState({ displayName: event.target.value })} /></label>
      <label>Tags <input value={currentState.tags} onChange={(event) => updateState({ tags: event.target.value })} /></label>
      <label>Group IDs <input value={currentState.groupIds} onChange={(event) => updateState({ groupIds: event.target.value })} /></label>
      <label>Ignored URLs <textarea value={currentState.ignoredUrls} onChange={(event) => updateState({ ignoredUrls: event.target.value })} /></label>
      <label>
        Status
        <select value={currentState.status} onChange={(event) => updateState({ status: event.target.value === "disabled" ? "disabled" : "active" })}>
          <option value="active">active</option>
          <option value="disabled">disabled</option>
        </select>
      </label>
      <label>
        {copy.justification}
        <TextAreaInput rows={3} value={currentState.justification} onChange={(event) => updateState({ justification: event.target.value })} style={hasDivergence && !currentState.justification.trim() ? { borderColor: "#c53030" } : undefined} />
      </label>
      <button type="button" onClick={saveReview} disabled={saving || (hasDivergence && !currentState.justification.trim())} style={{ width: "fit-content", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--button-border)", background: "var(--accent)", color: "white" }}>
        {saving ? copy.saving : copy.save}
      </button>
      {highlightedIndex === index ? <Notice tone="warning" title={copy.revalidationTitle}>{copy.reviewMismatch}</Notice> : null}
    </div>
  );
}
