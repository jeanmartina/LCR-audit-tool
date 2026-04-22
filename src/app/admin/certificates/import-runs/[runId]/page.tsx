import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import { assertAuthenticated } from "../../../../../auth/authorization";
import { getPrincipalTranslator } from "../../../../../i18n";
import { getCertificateImportRunDetail } from "../../../../../inventory/certificate-admin";
import {
  ActionButton,
  EmptyState,
  PageHeader,
  PageShell,
  Panel,
  StatusPill,
  stackStyle,
} from "../../../../../components/ui/primitives";

function metricValue(summary: Record<string, unknown>, key: string): number {
  const value = summary[key];
  return typeof value === "number" ? value : 0;
}

function toneForResult(result: string): "neutral" | "success" | "warning" {
  if (result === "imported" || result === "updated") {
    return "success";
  }
  if (result === "invalid" || result === "ignored") {
    return "warning";
  }
  return "neutral";
}

export default async function CertificateImportRunPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}): Promise<ReactElement> {
  const { runId } = await params;
  let principal;
  try {
    principal = await assertAuthenticated();
  } catch {
    redirect("/auth");
  }
  const { t } = await getPrincipalTranslator(principal);
  const detail = await getCertificateImportRunDetail(principal, runId);

  if (!detail) {
    return (
      <PageShell>
        <PageHeader
          backHref="/admin/certificates"
          backLabel={t("admin.certificates.new.back")}
          kicker={t("admin.certificates.title")}
          title={t("admin.certificates.importRun.notFound")}
          description={t("admin.certificates.importRun.notFoundBody")}
        />
      </PageShell>
    );
  }

  const { run, items } = detail;
  const summary = run.summary;
  const cards = ["imported", "updated", "invalid", "ignored"].map((key) => ({
    key,
    value: metricValue(summary, key),
  }));

  return (
    <PageShell>
      <PageHeader
        backHref="/admin/certificates"
        backLabel={t("admin.certificates.new.back")}
        kicker={t("admin.certificates.title")}
        title={t("admin.certificates.importRun.title")}
        description={t("admin.certificates.importRun.description", { runId: run.id })}
      />

      <section style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {cards.map((card) => (
          <Panel key={card.key} compact>
            <div style={{ color: "var(--muted-color)", fontSize: "12px" }}>
              {t(`admin.certificates.importRun.${card.key}`)}
            </div>
            <strong style={{ fontSize: "28px" }}>{card.value}</strong>
          </Panel>
        ))}
        <Panel compact>
          <div style={{ color: "var(--muted-color)", fontSize: "12px" }}>
            {t("admin.certificates.importRun.archiveStatus")}
          </div>
          <StatusPill tone={run.status === "completed" ? "success" : "warning"}>{run.status}</StatusPill>
        </Panel>
      </section>

      <Panel title={t("admin.certificates.importRun.items")} description={t("admin.certificates.importRun.itemsDescription")}>
        {items.length ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {[
                    t("admin.certificates.importRun.table.filename"),
                    t("admin.certificates.importRun.table.result"),
                    t("admin.certificates.importRun.table.fingerprint"),
                    t("admin.certificates.importRun.table.message"),
                  ].map((label) => (
                    <th key={label} style={{ textAlign: "left", padding: "10px", borderBottom: "1px solid var(--panel-border)" }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ padding: "10px", borderBottom: "1px solid var(--panel-border)" }}>{item.filename}</td>
                    <td style={{ padding: "10px", borderBottom: "1px solid var(--panel-border)" }}>
                      <StatusPill tone={toneForResult(item.result)}>{item.result}</StatusPill>
                    </td>
                    <td style={{ padding: "10px", borderBottom: "1px solid var(--panel-border)", overflowWrap: "anywhere" }}>
                      {item.fingerprint ?? "-"}
                    </td>
                    <td style={{ padding: "10px", borderBottom: "1px solid var(--panel-border)" }}>{item.message ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={t("admin.certificates.importRun.empty.title")}>
            {t("admin.certificates.importRun.empty.body")}
          </EmptyState>
        )}
      </Panel>

      <Panel title={t("admin.certificates.importRun.nextActions")}>
        <div style={{ ...stackStyle("10px"), gridTemplateColumns: "repeat(auto-fit, minmax(220px, max-content))" }}>
          <form action="/admin/certificates" method="get"><ActionButton>{t("admin.certificates.importRun.viewCertificates")}</ActionButton></form>
          <form action="/admin/certificates/batch" method="get"><ActionButton>{t("admin.certificates.importRun.importAnotherZip")}</ActionButton></form>
          <form action="/admin/certificates/new" method="get"><ActionButton>{t("admin.certificates.importRun.importSingle")}</ActionButton></form>
        </div>
      </Panel>
    </PageShell>
  );
}
