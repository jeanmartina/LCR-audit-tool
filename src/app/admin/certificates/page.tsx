import type { ReactElement } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { assertAuthenticated } from "../../../auth/authorization";
import { getPrincipalTranslator } from "../../../i18n";
import { listVisibleCertificates } from "../../../inventory/certificate-admin";

const BOX_STYLE = {
  background: "#1e293b",
  borderRadius: "16px",
  border: "1px solid #334155",
  padding: "16px",
} as const;

export default async function CertificatesAdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; status?: string }>;
}): Promise<ReactElement> {
  let principal;
  try {
    principal = await assertAuthenticated();
  } catch {
    redirect("/auth");
  }

  const params = (await searchParams) ?? {};
  const query = String(params.q ?? "").trim().toLowerCase();
  const status = String(params.status ?? "").trim();
  const certificates = (await listVisibleCertificates(principal)).filter((item) => {
    if (status && item.certificate.status !== status) {
      return false;
    }
    if (!query) {
      return true;
    }
    return (
      item.certificate.displayName.toLowerCase().includes(query) ||
      item.certificate.fingerprint.toLowerCase().includes(query) ||
      item.certificate.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });
  const { t } = await getPrincipalTranslator(principal);

  return (
    <main style={{ padding: "32px", display: "grid", gap: "24px" }}>
      <header style={{ display: "grid", gap: "12px" }}>
        <Link href="/reporting" style={{ color: "#93c5fd" }}>
          {t("admin.certificates.backToReporting")}
        </Link>
        <h1 style={{ margin: 0 }}>{t("admin.certificates.title")}</h1>
        <p style={{ margin: 0, color: "#94a3b8", maxWidth: "960px" }}>
          {t("admin.certificates.description")}
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/admin/certificates/new" style={{ color: "#93c5fd" }}>
            {t("admin.certificates.importSingle")}
          </Link>
          <Link href="/admin/certificates/batch" style={{ color: "#93c5fd" }}>
            {t("admin.certificates.importBatch")}
          </Link>
        </div>
      </header>

      <form action="/admin/certificates" method="get" style={{ ...BOX_STYLE, display: "grid", gap: "12px", gridTemplateColumns: "2fr 1fr auto" }}>
        <input
          name="q"
          placeholder={t("admin.certificates.search")}
          defaultValue={query}
          style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0" }}
        />
        <select
          name="status"
          defaultValue={status}
          style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0" }}
        >
          <option value="">{t("admin.certificates.allStatuses")}</option>
          <option value="active">{t("common.status.active")}</option>
          <option value="disabled">{t("common.status.disabled")}</option>
        </select>
        <button type="submit" style={{ padding: "10px 14px", borderRadius: "10px", border: 0, background: "#2563eb", color: "#eff6ff" }}>
          {t("common.actions.apply")}
        </button>
      </form>

      <section style={{ ...BOX_STYLE, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {[
                t("admin.certificates.table.certificate"),
                t("admin.certificates.table.status"),
                t("admin.certificates.table.groups"),
                t("admin.certificates.table.derivedCrls"),
                t("admin.certificates.table.ignored"),
                t("admin.certificates.table.lastImport"),
              ].map(
                (label) => (
                  <th
                    key={label}
                    style={{ textAlign: "left", padding: "12px", borderBottom: "1px solid #334155" }}
                  >
                    {label}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {certificates.map((item) => (
              <tr key={item.certificate.id}>
                <td style={{ padding: "12px", borderBottom: "1px solid #1e293b" }}>
                  <Link href={`/admin/certificates/${item.certificate.id}`} style={{ color: "#93c5fd" }}>
                    {item.certificate.displayName}
                  </Link>
                </td>
                <td style={{ padding: "12px", borderBottom: "1px solid #1e293b" }}>
                  {t(`common.status.${item.certificate.status}`)}
                </td>
                <td style={{ padding: "12px", borderBottom: "1px solid #1e293b" }}>
                  {item.groupIds.join(", ") || "-"}
                </td>
                <td style={{ padding: "12px", borderBottom: "1px solid #1e293b" }}>
                  {item.derivedCrlCount}
                </td>
                <td style={{ padding: "12px", borderBottom: "1px solid #1e293b" }}>
                  {item.ignoredCrlCount}
                </td>
                <td style={{ padding: "12px", borderBottom: "1px solid #1e293b" }}>
                  {item.lastImportAt.toISOString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!certificates.length ? (
          <p style={{ marginBottom: 0, color: "#94a3b8" }}>
            {t("admin.certificates.empty")}
          </p>
        ) : null}
      </section>
    </main>
  );
}
