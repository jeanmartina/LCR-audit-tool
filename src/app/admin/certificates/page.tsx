import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import { assertAuthenticated } from "../../../auth/authorization";
import { getPrincipalTranslator } from "../../../i18n";
import { listVisibleCertificates } from "../../../inventory/certificate-admin";
import {
  ActionButton,
  ActionGroup,
  ActionLink,
  EmptyStateWithActions,
  LocalSubnav,
  PageHeader,
  PageShell,
  Panel,
  SelectInput,
  TextInput,
} from "../../../components/ui/primitives";

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
    <PageShell>
      <PageHeader
        backHref="/reporting"
        backLabel={t("admin.certificates.backToReporting")}
        kicker={t("admin.certificates.title")}
        title={t("admin.certificates.title")}
        description={t("admin.certificates.description")}
      />

      <LocalSubnav label={t("common.ui.localSubnav")}>
        <ActionLink href="/admin/certificates/new" tone="primary">
          {t("admin.certificates.importSingle")}
        </ActionLink>
        <ActionLink href="/admin/certificates/batch">
          {t("admin.certificates.importBatch")}
        </ActionLink>
      </LocalSubnav>

      <Panel>
        <form action="/admin/certificates" method="get" style={{ display: "grid", gap: "12px", gridTemplateColumns: "2fr 1fr auto" }}>
          <TextInput name="q" placeholder={t("admin.certificates.search")} defaultValue={query} />
          <SelectInput name="status" defaultValue={status}>
            <option value="">{t("admin.certificates.allStatuses")}</option>
            <option value="active">{t("common.status.active")}</option>
            <option value="disabled">{t("common.status.disabled")}</option>
          </SelectInput>
          <ActionButton>{t("common.actions.apply")}</ActionButton>
        </form>
      </Panel>

      <Panel>
        {certificates.length ? (
          <div style={{ overflowX: "auto" }}>
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
                  ].map((label) => (
                    <th key={label} style={{ textAlign: "left", padding: "12px", borderBottom: "1px solid var(--panel-border)" }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {certificates.map((item) => (
                  <tr key={item.certificate.id}>
                    <td style={{ padding: "12px", borderBottom: "1px solid var(--panel-border)" }}>
                      <ActionGroup>
                        <ActionLink href={`/admin/certificates/${item.certificate.id}`} tone="context">
                          {item.certificate.displayName}
                        </ActionLink>
                      </ActionGroup>
                    </td>
                    <td style={{ padding: "12px", borderBottom: "1px solid var(--panel-border)" }}>
                      {t(`common.status.${item.certificate.status}`)}
                    </td>
                    <td style={{ padding: "12px", borderBottom: "1px solid var(--panel-border)" }}>
                      {item.groupIds.join(", ") || "-"}
                    </td>
                    <td style={{ padding: "12px", borderBottom: "1px solid var(--panel-border)" }}>
                      {item.derivedCrlCount}
                    </td>
                    <td style={{ padding: "12px", borderBottom: "1px solid var(--panel-border)" }}>
                      {item.ignoredCrlCount}
                    </td>
                    <td style={{ padding: "12px", borderBottom: "1px solid var(--panel-border)" }}>
                      {item.lastImportAt.toISOString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyStateWithActions
            title={t("admin.certificates.empty.title")}
            message={t("admin.certificates.empty")}
            primaryHref="/admin/certificates/new"
            primaryLabel={t("admin.certificates.importSingle")}
            recoveryHref="/reporting"
            recoveryLabel={t("common.ui.recovery")}
          />
        )}
      </Panel>
    </PageShell>
  );
}
