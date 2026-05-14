import type { ReactElement } from "react";
import { TrustListAdminPanel } from "../../admin/trust-lists/trust-list-admin-panel";
import type { TrustListSourceSummary } from "../../../trust-lists/admin";

type TranslationValues = Record<string, string | number | boolean | null | undefined>;
type SettingsTranslator = (key: string, values?: TranslationValues) => string;

export function TrustListsTab({
  t,
  sources,
}: {
  t: SettingsTranslator;
  sources: TrustListSourceSummary[] | null;
}): ReactElement {
  return (
    <TrustListAdminPanel
      t={t}
      sources={sources}
      title={t("settings.trustLists.title")}
      description={t("settings.trustLists.description")}
      noAccessTitle={t("settings.trustLists.noAccess.title")}
      noAccessBody={t("settings.trustLists.noAccess.body")}
    />
  );
}
