import type { ReactElement } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { assertAuthenticated } from "../../../../auth/authorization";
import { getPrincipalTranslator } from "../../../../i18n";

const FIELD_STYLE = {
  width: "100%",
  padding: "10px",
  borderRadius: "10px",
  border: "1px solid #475569",
  background: "#0f172a",
  color: "#e2e8f0",
} as const;

export default async function NewCertificatePage(): Promise<ReactElement> {
  let principal;
  try {
    principal = await assertAuthenticated();
  } catch {
    redirect("/auth");
  }
  const { t } = await getPrincipalTranslator(principal);

  return (
    <main style={{ padding: "32px", display: "grid", gap: "24px", maxWidth: "960px" }}>
      <header style={{ display: "grid", gap: "8px" }}>
        <Link href="/admin/certificates" style={{ color: "#93c5fd" }}>
          {t("admin.certificates.new.back")}
        </Link>
        <h1 style={{ margin: 0 }}>{t("admin.certificates.new.title")}</h1>
        <p style={{ margin: 0, color: "#94a3b8" }}>
          {t("admin.certificates.new.description")}
        </p>
      </header>

      <form
        action="/api/admin/certificates/import"
        method="post"
        encType="multipart/form-data"
        style={{ display: "grid", gap: "16px" }}
      >
        <label>
          <div>{t("admin.certificates.new.displayName")}</div>
          <input name="displayName" required style={FIELD_STYLE} />
        </label>
        <label>
          <div>{t("admin.certificates.new.file")}</div>
          <input type="file" name="certificate" required style={FIELD_STYLE} />
        </label>
        <label>
          <div>{t("admin.certificates.new.tags")}</div>
          <input name="tags" placeholder="eu-qualified, finance" style={FIELD_STYLE} />
        </label>
        <label>
          <div>{t("admin.certificates.new.groupIds")}</div>
          <input name="groupIds" required placeholder="group-1, group-2" style={FIELD_STYLE} />
        </label>
        <label>
          <div>{t("admin.certificates.new.ignoredUrls")}</div>
          <textarea
            name="ignoredUrls"
            rows={3}
            placeholder="https://example.test/root.crl"
            style={FIELD_STYLE}
          />
        </label>
        <label>
          <div>{t("admin.certificates.new.groupOverrides")}</div>
          <textarea
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
            style={FIELD_STYLE}
          />
        </label>
        <section style={{ border: "1px solid #334155", borderRadius: "12px", padding: "16px" }}>
          <strong>{t("admin.certificates.new.previewConfig")}</strong>
          <p style={{ color: "#94a3b8", marginBottom: 0 }}>
            {t("admin.certificates.new.previewConfigText")}
          </p>
        </section>
        <section style={{ border: "1px solid #334155", borderRadius: "12px", padding: "16px" }}>
          <strong>{t("admin.certificates.new.previewRecipients")}</strong>
          <p style={{ color: "#94a3b8", marginBottom: 0 }}>
            {t("admin.certificates.new.previewRecipientsText")}
          </p>
        </section>
        <button
          type="submit"
          style={{ padding: "10px 14px", borderRadius: "10px", border: 0, background: "#2563eb", color: "#eff6ff" }}
        >
          {t("admin.certificates.new.submit")}
        </button>
      </form>
    </main>
  );
}
