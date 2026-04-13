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

export default async function BatchCertificatePage(): Promise<ReactElement> {
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
        <h1 style={{ margin: 0 }}>{t("admin.certificates.batch.title")}</h1>
        <p style={{ margin: 0, color: "#94a3b8" }}>
          {t("admin.certificates.batch.description")}
        </p>
      </header>

      <form
        action="/api/admin/certificates/import-zip"
        method="post"
        encType="multipart/form-data"
        style={{ display: "grid", gap: "16px" }}
      >
        <label>
          <div>{t("admin.certificates.batch.archive")}</div>
          <input type="file" name="archive" required style={FIELD_STYLE} />
        </label>
        <label>
          <div>{t("admin.certificates.batch.sharedTags")}</div>
          <input name="tags" placeholder="qualified, imported-batch" style={FIELD_STYLE} />
        </label>
        <label>
          <div>{t("admin.certificates.new.groupIds")}</div>
          <input name="groupIds" required placeholder="group-1, group-2" style={FIELD_STYLE} />
        </label>
        <label>
          <div>{t("admin.certificates.new.ignoredUrls")}</div>
          <textarea name="ignoredUrls" rows={3} style={FIELD_STYLE} />
        </label>
        <label>
          <div>{t("admin.certificates.new.groupOverrides")}</div>
          <textarea name="groupOverrides" rows={8} style={FIELD_STYLE} />
        </label>
        <section style={{ border: "1px solid #334155", borderRadius: "12px", padding: "16px" }}>
          <strong>{t("admin.certificates.batch.behavior")}</strong>
          <p style={{ color: "#94a3b8", marginBottom: 0 }}>
            {t("admin.certificates.batch.behaviorText")}
          </p>
        </section>
        <button
          type="submit"
          style={{ padding: "10px 14px", borderRadius: "10px", border: 0, background: "#2563eb", color: "#eff6ff" }}
        >
          {t("admin.certificates.batch.submit")}
        </button>
      </form>
    </main>
  );
}
