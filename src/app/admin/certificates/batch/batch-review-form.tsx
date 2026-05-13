"use client";

import { useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { ActionButton, Field, Notice, Panel, TextAreaInput, TextInput, stackStyle } from "../../../../components/ui/primitives";

const REVIEW_STATE_KEY = "zip-review-state-v1";

export function BatchReviewForm({ copy }: { copy: Record<string, string> }): ReactElement {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handlePreview(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData(form);
      formData.set("mode", "preview");
      const response = await fetch("/api/admin/certificates/import-zip", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "zip-review-preview-failed");
        return;
      }
      const persisted = {
        candidates: payload.candidates,
        shared: {
          tags: String(formData.get("tags") ?? ""),
          groupIds: String(formData.get("groupIds") ?? ""),
          ignoredUrls: String(formData.get("ignoredUrls") ?? ""),
          groupOverrides: String(formData.get("groupOverrides") ?? ""),
        },
      };
      sessionStorage.setItem(REVIEW_STATE_KEY, JSON.stringify(persisted));
      router.push("/admin/certificates/batch/review");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "zip-review-preview-failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handlePreview} encType="multipart/form-data" style={{ ...stackStyle(), marginTop: "16px" }}>
      <Field label={copy.archive} hint={copy.archiveHint} example="certificates.zip">
        <TextInput type="file" name="archive" required accept=".zip,application/zip" />
      </Field>
      <Field label={copy.sharedTags} hint={copy.sharedTagsHint} example="qualified, imported-batch">
        <TextInput name="tags" />
      </Field>
      <Field label={copy.groupIds} hint={copy.groupIdsHint} example="group-1, group-2">
        <TextInput name="groupIds" required />
      </Field>
      <Field label={copy.ignoredUrls} hint={copy.ignoredUrlsHint}>
        <TextAreaInput name="ignoredUrls" rows={3} />
      </Field>
      <Field label={copy.groupOverrides} hint={copy.groupOverridesHint}>
        <TextAreaInput name="groupOverrides" rows={8} />
      </Field>
      <Panel compact title={copy.acceptedEntries} description={copy.acceptedEntriesHint}>
        <span />
      </Panel>
      {error ? <Notice tone="warning" title={copy.errorTitle}>{error}</Notice> : null}
      <ActionButton>{loading ? copy.previewLoading : copy.previewButton}</ActionButton>
    </form>
  );
}
