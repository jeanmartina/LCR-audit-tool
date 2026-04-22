import type { ReactElement } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { assertAuthenticated } from "../../../../auth/authorization";
import { getPrincipalTranslator } from "../../../../i18n";
import { getCertificateAdminDetail } from "../../../../inventory/certificate-admin";
import { Notice } from "../../../../components/ui/primitives";

const BOX_STYLE = {
  background: "#1e293b",
  borderRadius: "16px",
  border: "1px solid #334155",
  padding: "16px",
} as const;

export default async function CertificateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ certificateId: string }>;
  searchParams?: Promise<{ imported?: string }>;
}): Promise<ReactElement> {
  const { certificateId } = await params;
  const query = (await searchParams) ?? {};
  let principal;
  try {
    principal = await assertAuthenticated();
  } catch {
    redirect("/auth");
  }

  const detail = await getCertificateAdminDetail(principal, certificateId);
  const { t } = await getPrincipalTranslator(principal);
  if (!detail) {
    return (
      <main style={{ padding: "32px" }}>
        <p>{t("admin.certificates.detail.notFound")}</p>
        <Link href="/admin/certificates" style={{ color: "#93c5fd" }}>
          {t("common.actions.back")}
        </Link>
      </main>
    );
  }

  return (
    <main style={{ padding: "32px", display: "grid", gap: "24px" }}>
      <header style={{ display: "grid", gap: "8px" }}>
        <Link href="/admin/certificates" style={{ color: "#93c5fd" }}>
          {t("admin.certificates.new.back")}
        </Link>
        <h1 style={{ margin: 0 }}>{detail.certificate.displayName}</h1>
        <p style={{ margin: 0, color: "#94a3b8" }}>
          {t("admin.certificates.detail.fingerprint", {
            fingerprint: detail.certificate.fingerprint,
          })}
        </p>
      </header>

      {query.imported === "single" ? (
        <Notice tone="success" title={t("admin.certificates.importedSingle.title")}>
          {t("admin.certificates.importedSingle.body")}
        </Notice>
      ) : null}

      <section style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
        <article style={BOX_STYLE}>
          <div style={{ color: "#94a3b8", fontSize: "12px" }}>{t("admin.certificates.detail.status")}</div>
          <strong>{t(`common.status.${detail.certificate.status}`)}</strong>
        </article>
        <article style={BOX_STYLE}>
          <div style={{ color: "#94a3b8", fontSize: "12px" }}>{t("admin.certificates.detail.groups")}</div>
          <strong>{detail.groupIds.join(", ") || "-"}</strong>
        </article>
        <article style={BOX_STYLE}>
          <div style={{ color: "#94a3b8", fontSize: "12px" }}>{t("admin.certificates.detail.derived")}</div>
          <strong>{detail.derivedCrls.length}</strong>
        </article>
        <article style={BOX_STYLE}>
          <div style={{ color: "#94a3b8", fontSize: "12px" }}>{t("admin.certificates.detail.templates")}</div>
          <strong>{detail.templates.length}</strong>
        </article>
      </section>

      <section style={BOX_STYLE}>
        <h2 style={{ marginTop: 0 }}>{t("admin.certificates.detail.editTitle")}</h2>
        <form
          action={`/api/admin/certificates/${detail.certificate.id}/update`}
          method="post"
          style={{ display: "grid", gap: "12px" }}
        >
          <input
            name="displayName"
            defaultValue={detail.certificate.displayName}
            style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0" }}
          />
          <input
            name="tags"
            defaultValue={detail.certificate.tags.join(", ")}
            style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0" }}
          />
          <input
            name="groupIds"
            defaultValue={detail.groupIds.join(", ")}
            style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0" }}
          />
          <textarea
            name="groupOverrides"
            defaultValue={JSON.stringify(detail.groupOverrides, null, 2)}
            rows={8}
            style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0" }}
          />
          <select
            name="status"
            defaultValue={detail.certificate.status}
            style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0" }}
          >
            <option value="active">{t("common.status.active")}</option>
            <option value="disabled">{t("common.status.disabled")}</option>
          </select>
          <button
            type="submit"
            style={{ padding: "10px 14px", borderRadius: "10px", border: 0, background: "#2563eb", color: "#eff6ff" }}
          >
            {t("admin.certificates.detail.save")}
          </button>
        </form>
      </section>

      <section style={BOX_STYLE}>
        <h2 style={{ marginTop: 0 }}>{t("admin.certificates.detail.derivedUrls")}</h2>
        <ul>
          {detail.derivedCrls.map((link) => (
            <li key={link.id} style={{ marginBottom: "12px" }}>
              <div>{link.crlUrl}</div>
              <div style={{ color: "#94a3b8", fontSize: "12px" }}>
                {t("reporting.detail.derivedIgnored")}: {String(link.ignored)} | {t("admin.certificates.detail.runtimeTarget")}: {link.runtimeTargetId ?? "-"}
              </div>
              <form
                action={`/api/admin/certificates/${detail.certificate.id}/ignore-url`}
                method="post"
                style={{ display: "flex", gap: "8px", marginTop: "8px" }}
              >
                <input type="hidden" name="crlUrl" value={link.crlUrl} />
                <input type="hidden" name="ignored" value={String(!link.ignored)} />
                <button
                  type="submit"
                  style={{ padding: "6px 10px", borderRadius: "8px", border: 0, background: "#2563eb", color: "#eff6ff" }}
                >
                  {link.ignored ? t("admin.certificates.detail.markTracked") : t("admin.certificates.detail.markIgnored")}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section style={BOX_STYLE}>
        <h2 style={{ marginTop: 0 }}>{t("admin.certificates.detail.effectiveValues")}</h2>
        <ul>
          {detail.effectiveDefaults.map((item) => (
            <li key={item.groupId}>
              {item.groupId}: interval {item.intervalSeconds}s, timeout {item.timeoutSeconds}s,
              criticality {item.criticality}, alert {item.alertEmail ?? "-"}, extra recipients{" "}
              {item.extraRecipients.join(", ") || "-"}, retention {item.retentionPollsDays}/
              {item.retentionAlertsDays}/{item.retentionCoverageGapsDays}, enabled{" "}
              {String(item.enabled)}
            </li>
          ))}
        </ul>
      </section>

      <section style={BOX_STYLE}>
        <h2 style={{ marginTop: 0 }}>{t("admin.certificates.detail.templateClone")}</h2>
        <form
          action={`/api/admin/certificates/${detail.certificate.id}/template`}
          method="post"
          style={{ display: "grid", gap: "12px", maxWidth: "480px" }}
        >
          <input
            name="name"
            placeholder={t("admin.certificates.detail.templateName")}
            required
            style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0" }}
          />
          <button
            type="submit"
            style={{ padding: "10px 14px", borderRadius: "10px", border: 0, background: "#2563eb", color: "#eff6ff" }}
          >
            {t("admin.certificates.detail.templateSubmit")}
          </button>
        </form>
      </section>

      <section style={BOX_STYLE}>
        <h2 style={{ marginTop: 0 }}>{t("admin.certificates.detail.manualTitle")}</h2>
        <p style={{ color: "#94a3b8", marginBottom: 0 }}>
          {t("admin.certificates.detail.manualText")}
        </p>
        <form
          action={`/api/admin/certificates/${detail.certificate.id}/manual-check`}
          method="post"
          style={{ marginTop: "12px" }}
        >
          <button
            type="submit"
            style={{ padding: "10px 14px", borderRadius: "10px", border: 0, background: "#2563eb", color: "#eff6ff" }}
          >
            {t("admin.certificates.detail.manualSubmit")}
          </button>
        </form>
      </section>

      <section style={BOX_STYLE}>
        <h2 style={{ marginTop: 0 }}>{t("admin.certificates.detail.changeHistory")}</h2>
        <ul>
          {detail.changeHistory.map((event) => (
            <li key={event.id}>
              {event.occurredAt.toISOString()} — {event.eventType} — actor{" "}
              {event.actorUserId ?? "system"} — {JSON.stringify(event.details)}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
