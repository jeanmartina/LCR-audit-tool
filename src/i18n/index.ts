import { headers } from "next/headers";
import type { AuthenticatedPrincipal } from "../auth/authorization";
import { findUserById } from "../storage/runtime-store";

export const SUPPORTED_LOCALES = ["en", "pt-BR", "es"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "en";

type Dictionary = Record<string, string>;
type TranslationValues = Record<string, string | number | boolean | null | undefined>;

const EN_DICTIONARY: Dictionary = {
  "common.actions.accept": "Accept",
  "common.actions.apply": "Apply",
  "common.actions.back": "Back",
  "common.actions.clear": "Clear",
  "common.actions.create": "Create",
  "common.actions.exportCsv": "Export filtered CSV",
  "common.actions.save": "Save",
  "common.filters.all": "All",
  "common.locale.label": "Language",
  "common.locale.en": "English",
  "common.locale.es": "Español",
  "common.locale.pt-BR": "Português (Brasil)",
  "common.none": "None",
  "common.status.active": "active",
  "common.status.degraded": "degraded",
  "common.status.disabled": "disabled",
  "common.status.healthy": "healthy",
  "common.status.offline": "offline",
  "common.yes": "yes",
  "common.no": "no",

  "auth.landing.kicker": "Identity & access foundation",
  "auth.landing.title": "Sign in with an invitation",
  "auth.landing.description":
    "This phase introduces invitation-only access, provider linking, and role-based group membership. Use a valid invite code to create or link an account.",
  "auth.landing.acceptInvite": "Accept invite",
  "auth.landing.loginTitle": "Email and password",
  "auth.landing.loginEmail": "Email",
  "auth.landing.loginPassword": "Password",
  "auth.landing.loginButton": "Sign in",
  "auth.landing.providerConfigured": "configured",
  "auth.landing.providerMissing": "missing environment configuration",
  "auth.landing.providerCallback": "Callback URL",
  "auth.invite.title": "Accept invitation",
  "auth.invite.description":
    "Submit the invitation code together with the invited email. For provider-based sign-in, the provider email must match the invited address.",
  "auth.invite.code": "Invitation code",
  "auth.invite.email": "Invited email",
  "auth.invite.displayName": "Display name",
  "auth.invite.password": "Password (for local auth)",
  "auth.invite.submit": "Accept invitation",
  "auth.invite.providerTitle": "Provider sign-in",
  "auth.invite.providerDescription":
    "Start real provider sign-in from the invite. The callback only succeeds after the provider email matches the invited address and the provider identity is verified server-side.",
  "auth.invite.providerEmail": "Verified provider email",
  "auth.invite.providerStart": "Continue with {provider}",
  "auth.invite.providerSubmit": "Complete {provider} access",
  "auth.provider.credentials": "Email and password",
  "auth.provider.google": "Google",
  "auth.provider.entra-id": "Microsoft Entra ID",
  "auth.provider.oidc": "Generic OIDC",

  "settings.title": "Predictive preferences, locale, and theme",
  "settings.kicker": "User settings",
  "settings.description":
    "This page controls per-user predictive notifications, language, and the active product theme. Group admins can also define default predictive windows and structured tags for their groups.",
  "settings.backToReporting": "Back to reporting",
  "settings.myPreferences": "My preferences",
  "settings.theme": "Theme",
  "settings.theme.dark": "Dark",
  "settings.theme.light": "Light",
  "settings.locale": "Language",
  "settings.predictiveEnabled": "Enable predictive alerts",
  "settings.groups": "Groups",
  "settings.severities": "Severities",
  "settings.predictiveTypes": "Predictive types",
  "settings.predictiveType.upcoming-expiration": "Upcoming expiration",
  "settings.predictiveType.publication-delayed": "Publication delayed",
  "settings.savePreferences": "Save preferences",
  "settings.groupDefaults": "Group defaults",
  "settings.group.trustSource": "trustSource",
  "settings.group.pki": "pki",
  "settings.group.jurisdiction": "jurisdiction",
  "settings.group.windowDays": "Predictive window (days)",
  "settings.group.enabled": "Enable predictive policy for this group",
  "settings.group.save": "Save group defaults",
  "settings.platformTitle": "Platform predictive policy",
  "settings.platform.windowDays": "Default predictive window (days)",
  "settings.platform.enabled": "Enable predictive policy globally",
  "settings.platform.save": "Save platform settings",
  "settings.providers.title": "Provider status",
  "settings.providers.description":
    "Provider credentials remain environment-only. Platform admins can inspect configuration presence, callback URLs, and the manually tracked verification state used for real public-HTTPS sign-in proof.",
  "settings.providers.callbackUrl": "Callback URL",
  "settings.providers.configured": "Configured from environment",
  "settings.providers.currentStatus": "Verification status",
  "settings.providers.verified": "Verified",
  "settings.providers.unverified": "Unverified",
  "settings.providers.markVerified": "Mark provider as verified",
  "settings.providers.notes": "Verification notes",
  "settings.providers.lastVerifiedAt": "Last verified at {verifiedAt} by {userId}",
  "settings.providers.notVerifiedYet": "No successful public-host verification has been recorded yet.",
  "settings.providers.save": "Save provider status",

  "reporting.kicker": "Group-scoped reporting and predictive monitoring",
  "reporting.title": "Availability dashboard",
  "reporting.description":
    "Certificate view stays the default. CRL view is available as a complementary mode and remains bound to the same authorization scope.",
  "reporting.exportExecutivePdf": "Executive PDF",
  "reporting.settings": "Settings",
  "reporting.summary.rows": "Rows in period",
  "reporting.summary.healthy": "Healthy",
  "reporting.summary.degraded": "Degraded",
  "reporting.summary.offline": "Offline",
  "reporting.summary.averageSla": "Average SLA",
  "reporting.summary.openAlerts": "Open alerts",
  "reporting.mode": "Mode",
  "reporting.mode.certificate": "Certificates",
  "reporting.mode.crl": "CRLs",
  "reporting.filter.source": "Source",
  "reporting.filter.issuer": "Issuer",
  "reporting.filter.criticality": "Criticality",
  "reporting.filter.status": "Status",
  "reporting.filter.trustSource": "trustSource",
  "reporting.filter.pki": "pki",
  "reporting.filter.jurisdiction": "jurisdiction",
  "reporting.filter.period": "Period",
  "reporting.filter.from": "From",
  "reporting.filter.to": "To",
  "reporting.filter.httpStatus": "HTTP status",
  "reporting.filter.severity": "Severity",
  "reporting.filter.eventType": "Event type",
  "reporting.filter.snapshotHash": "hash/snapshot",
  "reporting.filter.applyCustomPeriod": "Apply custom period",
  "reporting.table.certificate": "Certificate",
  "reporting.table.crl": "CRL",
  "reporting.table.source": "Source",
  "reporting.table.issuer": "Issuer",
  "reporting.table.criticality": "Criticality",
  "reporting.table.status": "Status",
  "reporting.table.predictive": "Predictive",
  "reporting.table.latestUnavailability": "Last unavailability",
  "reporting.table.slaPercent": "SLA (%)",
  "reporting.table.nextExpiration": "Next expiration",
  "reporting.table.openAlerts": "Open alerts",
  "reporting.table.trustSource": "trustSource",
  "reporting.table.pki": "pki",
  "reporting.table.jurisdiction": "jurisdiction",
  "reporting.detail.back": "Back to dashboard",
  "reporting.detail.description":
    "Certificate-scoped audit evidence with predictive events, structured tags, and export-safe filters.",
  "reporting.detail.export.polls": "CSV polls",
  "reporting.detail.export.coverage": "CSV coverage gaps",
  "reporting.detail.export.alerts": "CSV alerts",
  "reporting.detail.export.snapshots": "CSV snapshots",
  "reporting.detail.export.pdf": "Operational PDF",
  "reporting.detail.currentStatus": "Current status",
  "reporting.detail.lastIncident": "Last incident",
  "reporting.detail.sla": "SLA in period",
  "reporting.detail.nextExpiration": "Next expiration",
  "reporting.detail.openAlerts": "Open alerts",
  "reporting.detail.predictiveState": "Predictive state",
  "reporting.detail.structuredTags": "Structured tags",
  "reporting.detail.derivedCrls": "Derived CRLs",
  "reporting.detail.derivedIgnored": "ignored",
  "reporting.detail.derivedStatus": "status",
  "reporting.detail.notFound": "Certificate not found.",
  "reporting.tab.timeline": "Timeline",
  "reporting.tab.polls": "Polls",
  "reporting.tab.coverage-gaps": "Coverage gaps",
  "reporting.tab.alerts": "Alerts",
  "reporting.tab.validation": "Validation",
  "reporting.tab.snapshots": "Snapshots",
  "reporting.timeline.predictive": "predictive",

  "admin.certificates.title": "Certificate administration",
  "admin.certificates.description":
    "Certificates are the primary admin objects. Derived CRL URLs are shown as operational results, and shared runtime execution stays group-scoped.",
  "admin.certificates.backToReporting": "Back to reporting",
  "admin.certificates.importSingle": "Import single certificate",
  "admin.certificates.importBatch": "Batch import .zip",
  "admin.certificates.search": "Search by name, fingerprint, or tag",
  "admin.certificates.allStatuses": "All statuses",
  "admin.certificates.table.certificate": "Certificate",
  "admin.certificates.table.status": "Status",
  "admin.certificates.table.groups": "Groups",
  "admin.certificates.table.derivedCrls": "Derived CRLs",
  "admin.certificates.table.ignored": "Ignored",
  "admin.certificates.table.lastImport": "Last import",
  "admin.certificates.empty":
    "No visible certificates yet. Import one certificate or a `.zip` bundle to begin.",
  "admin.certificates.new.back": "Back to certificate administration",
  "admin.certificates.new.title": "Import single certificate",
  "admin.certificates.new.description":
    "This form imports one certificate, derives CRL URLs, previews the effective configuration inputs, and lets you predefine ignored URLs and per-group overrides.",
  "admin.certificates.new.displayName": "Display name",
  "admin.certificates.new.file": "Certificate file (.pem/.crt/.cer)",
  "admin.certificates.new.tags": "Tags (comma separated)",
  "admin.certificates.new.groupIds": "Group IDs (comma separated)",
  "admin.certificates.new.ignoredUrls": "Ignored derived URLs (comma separated)",
  "admin.certificates.new.groupOverrides": "Group overrides JSON",
  "admin.certificates.new.previewConfig": "Effective configuration preview",
  "admin.certificates.new.previewConfigText":
    "Platform defaults resolve to 10-minute polling, 5-second timeout, medium criticality, and 180-day retention unless a group override is provided. The imported certificate becomes the primary admin object and derived CRLs inherit from this resolved state.",
  "admin.certificates.new.previewRecipients": "Effective alert recipients preview",
  "admin.certificates.new.previewRecipientsText":
    "Recipients are resolved from group override alert email plus extra recipients. Operators can refine ignored URLs after import on the certificate detail screen.",
  "admin.certificates.new.submit": "Import certificate",
  "admin.certificates.batch.title": "Batch import certificates",
  "admin.certificates.batch.description":
    "Batch import is a separate flow so large `.zip` archives can be processed item-by-item with partial success reporting and shared defaults for the whole batch.",
  "admin.certificates.batch.archive": "ZIP archive",
  "admin.certificates.batch.sharedTags": "Shared tags (comma separated)",
  "admin.certificates.batch.behavior": "Batch behavior",
  "admin.certificates.batch.behaviorText":
    "Each certificate is fingerprint-deduplicated, updated by default when already known, and reported as imported, updated, ignored, or invalid in the final batch summary.",
  "admin.certificates.batch.submit": "Import ZIP bundle",
  "admin.certificates.detail.fingerprint":
    "Fingerprint {fingerprint}. Shared runtime CRL execution remains internal; visibility is controlled through this certificate and its linked groups.",
  "admin.certificates.detail.status": "Status",
  "admin.certificates.detail.groups": "Groups",
  "admin.certificates.detail.derived": "Derived CRLs",
  "admin.certificates.detail.templates": "Templates",
  "admin.certificates.detail.editTitle": "Edit certificate administration",
  "admin.certificates.detail.save": "Save administration changes",
  "admin.certificates.detail.derivedUrls": "Derived CRL URLs",
  "admin.certificates.detail.runtimeTarget": "runtime target",
  "admin.certificates.detail.markTracked": "Mark as tracked",
  "admin.certificates.detail.markIgnored": "Mark as ignored",
  "admin.certificates.detail.effectiveValues": "Effective values by group",
  "admin.certificates.detail.templateClone": "Template clone",
  "admin.certificates.detail.templateName": "Qualified root template",
  "admin.certificates.detail.templateSubmit": "Create template",
  "admin.certificates.detail.manualTitle": "Manual validation/connectivity test entry point",
  "admin.certificates.detail.manualText":
    "Use the derived CRL URLs above as the operational test surface. This phase keeps the manual test entry point on the certificate detail page so operators can correlate test actions with the same derived URLs and change history.",
  "admin.certificates.detail.manualSubmit": "Record manual connectivity check",
  "admin.certificates.detail.changeHistory": "Change history",
  "admin.certificates.detail.notFound": "Certificate not found.",

  "exports.csv.dashboard.rowType": "Row type",
  "exports.csv.dashboard.id": "ID",
  "exports.csv.dashboard.name": "Name",
  "exports.csv.dashboard.source": "Source",
  "exports.csv.dashboard.issuer": "Issuer",
  "exports.csv.dashboard.owner": "Owner",
  "exports.csv.dashboard.criticality": "Criticality",
  "exports.csv.dashboard.currentStatus": "Current status",
  "exports.csv.dashboard.latestUnavailabilityAt": "Latest unavailability",
  "exports.csv.dashboard.slaPercent": "SLA percent",
  "exports.csv.dashboard.errorBudgetUsed": "Error budget used",
  "exports.csv.dashboard.nextExpiration": "Next expiration",
  "exports.csv.dashboard.openAlerts": "Open alerts",
  "exports.csv.dashboard.recentAlerts": "Recent alerts",
  "exports.csv.dashboard.predictiveSeverity": "Predictive severity",
  "exports.csv.dashboard.predictiveType": "Predictive type",
  "exports.csv.dashboard.trustSource": "trustSource",
  "exports.csv.dashboard.pki": "pki",
  "exports.csv.dashboard.jurisdiction": "jurisdiction",
  "exports.csv.dashboard.linkedCertificateCount": "Linked certificate count",
  "exports.csv.dashboard.linkedCrlCount": "Linked CRL count",
  "exports.csv.polls.targetLabel": "Target label",
  "exports.csv.polls.occurredAt": "Occurred at",
  "exports.csv.polls.httpStatus": "HTTP status",
  "exports.csv.polls.timedOut": "Timed out",
  "exports.csv.polls.durationMs": "Duration (ms)",
  "exports.csv.polls.coverageLost": "Coverage lost",
  "exports.csv.polls.hash": "Hash",
  "exports.csv.coverage.startTs": "Start",
  "exports.csv.coverage.endTs": "End",
  "exports.csv.coverage.durationMs": "Duration (ms)",
  "exports.csv.alerts.sentAt": "Sent at",
  "exports.csv.alerts.severity": "Severity",
  "exports.csv.alerts.recipients": "Recipients",
  "exports.csv.alerts.deliveryState": "Delivery state",
  "exports.csv.alerts.resolvedAt": "Resolved at",
  "exports.csv.snapshots.issuer": "Issuer",
  "exports.csv.snapshots.thisUpdate": "thisUpdate",
  "exports.csv.snapshots.nextUpdate": "nextUpdate",
  "exports.csv.snapshots.statusLabel": "Status",
  "exports.pdf.executive.title": "Executive availability report",
  "exports.pdf.executive.generatedAt": "Generated at",
  "exports.pdf.executive.scope": "Report scope: dashboard executive summary",
  "exports.pdf.executive.period": "Period",
  "exports.pdf.operational.title": "Operational evidence report",
  "exports.pdf.operational.generatedAt": "Generated at",
  "exports.pdf.operational.target": "Target",
  "exports.pdf.operational.scope": "Report scope: target operational evidence",
  "exports.pdf.section.filters": "Filters applied",
  "exports.pdf.section.summary": "Availability summary",
  "exports.pdf.section.posture": "SLA and alert posture",
  "exports.pdf.section.targetSummary": "Target summary",
  "exports.pdf.section.timeline": "Timeline",
  "exports.pdf.section.coverage": "Coverage gaps",
  "exports.pdf.section.alerts": "Alerts",
  "exports.pdf.section.validation": "Validation failures",
  "exports.pdf.section.snapshots": "Snapshots",
  "exports.pdf.noFilters": "No filters applied",
  "exports.pdf.summary.targets": "Targets",
  "exports.pdf.summary.healthy": "Healthy",
  "exports.pdf.summary.degraded": "Degraded",
  "exports.pdf.summary.offline": "Offline",
  "exports.pdf.summary.averageSla": "Average SLA",
  "exports.pdf.summary.openAlerts": "Open alerts",
  "exports.pdf.summary.upcomingExpirations": "Upcoming expirations",
  "exports.pdf.target.status": "Status",
  "exports.pdf.target.latestIncident": "Latest incident",
  "exports.pdf.target.sla": "SLA",
  "exports.pdf.target.nextExpiration": "Next expiration",
  "exports.pdf.target.openAlerts": "Open alerts",
};

const PT_BR_DICTIONARY: Dictionary = {
  ...EN_DICTIONARY,
  "common.actions.accept": "Aceitar",
  "common.actions.apply": "Aplicar",
  "common.actions.back": "Voltar",
  "common.actions.clear": "Limpar",
  "common.actions.create": "Criar",
  "common.actions.exportCsv": "Exportar CSV filtrado",
  "common.actions.save": "Salvar",
  "common.filters.all": "Todos",
  "common.locale.label": "Idioma",
  "common.status.degraded": "degradado",
  "common.status.disabled": "desabilitado",
  "common.status.healthy": "saudável",
  "common.status.offline": "fora do ar",
  "common.yes": "sim",
  "common.no": "não",
  "auth.landing.title": "Entrar com um convite",
  "auth.landing.acceptInvite": "Aceitar convite",
  "auth.landing.loginButton": "Entrar",
  "auth.invite.title": "Aceitar convite",
  "auth.invite.code": "Código do convite",
  "auth.invite.email": "E-mail convidado",
  "auth.invite.displayName": "Nome de exibição",
  "auth.invite.submit": "Aceitar convite",
  "auth.invite.providerTitle": "Login com provedor",
  "auth.invite.providerDescription":
    "Inicie o login real do provedor a partir do convite. O callback só conclui quando o e-mail do provedor corresponde ao endereço convidado e a identidade é verificada no servidor.",
  "auth.invite.providerEmail": "E-mail verificado no provedor",
  "auth.invite.providerStart": "Continuar com {provider}",
  "settings.title": "Preferências preditivas, idioma e tema",
  "settings.kicker": "Configurações do usuário",
  "settings.backToReporting": "Voltar para reporting",
  "settings.myPreferences": "Minhas preferências",
  "settings.theme": "Tema",
  "settings.theme.dark": "Escuro",
  "settings.theme.light": "Claro",
  "settings.locale": "Idioma",
  "settings.groups": "Grupos",
  "settings.severities": "Severidades",
  "settings.predictiveTypes": "Tipos preditivos",
  "settings.predictiveType.upcoming-expiration": "Expiração próxima",
  "settings.predictiveType.publication-delayed": "Publicação atrasada",
  "settings.savePreferences": "Salvar preferências",
  "settings.groupDefaults": "Padrões do grupo",
  "settings.group.windowDays": "Janela preditiva (dias)",
  "settings.group.save": "Salvar padrões do grupo",
  "settings.platformTitle": "Política preditiva da plataforma",
  "settings.platform.windowDays": "Janela preditiva padrão (dias)",
  "settings.platform.save": "Salvar configurações da plataforma",
  "settings.providers.title": "Status dos provedores",
  "settings.providers.description":
    "As credenciais dos provedores continuam apenas no ambiente. Platform admins podem inspecionar a presença da configuração, URLs de callback e o estado manual de verificação usado para a prova de login com HTTPS público.",
  "settings.providers.callbackUrl": "URL de callback",
  "settings.providers.configured": "Configurado pelo ambiente",
  "settings.providers.currentStatus": "Status de verificação",
  "settings.providers.verified": "Verificado",
  "settings.providers.unverified": "Não verificado",
  "settings.providers.markVerified": "Marcar provedor como verificado",
  "settings.providers.notes": "Notas de verificação",
  "settings.providers.lastVerifiedAt": "Última verificação em {verifiedAt} por {userId}",
  "settings.providers.notVerifiedYet": "Nenhuma verificação bem-sucedida em host público foi registrada ainda.",
  "settings.providers.save": "Salvar status do provedor",
  "reporting.title": "Painel de disponibilidade",
  "reporting.exportExecutivePdf": "PDF executivo",
  "reporting.summary.rows": "Linhas no período",
  "reporting.summary.healthy": "Saudáveis",
  "reporting.summary.degraded": "Degradadas",
  "reporting.summary.offline": "Fora do ar",
  "reporting.summary.averageSla": "SLA médio",
  "reporting.summary.openAlerts": "Alertas abertos",
  "reporting.mode.certificate": "Certificados",
  "reporting.mode.crl": "LCRs",
  "reporting.filter.period": "Período",
  "reporting.filter.from": "De",
  "reporting.filter.to": "Até",
  "reporting.filter.snapshotHash": "hash/snapshot",
  "reporting.filter.applyCustomPeriod": "Aplicar período personalizado",
  "reporting.table.certificate": "Certificado",
  "reporting.table.crl": "LCR",
  "reporting.table.predictive": "Preditivo",
  "reporting.table.latestUnavailability": "Última indisponibilidade",
  "reporting.table.nextExpiration": "Próxima expiração",
  "reporting.table.openAlerts": "Alertas abertos",
  "reporting.detail.back": "Voltar para o dashboard",
  "reporting.detail.export.coverage": "CSV de gaps de cobertura",
  "reporting.detail.export.alerts": "CSV de alertas",
  "reporting.detail.export.snapshots": "CSV de snapshots",
  "reporting.detail.export.pdf": "PDF operacional",
  "reporting.detail.currentStatus": "Status atual",
  "reporting.detail.lastIncident": "Último incidente",
  "reporting.detail.sla": "SLA no período",
  "reporting.detail.nextExpiration": "Próxima expiração",
  "reporting.detail.openAlerts": "Alertas abertos",
  "reporting.detail.predictiveState": "Estado preditivo",
  "reporting.detail.structuredTags": "Tags estruturadas",
  "reporting.detail.derivedCrls": "LCRs derivadas",
  "reporting.detail.derivedIgnored": "ignorada",
  "reporting.detail.derivedStatus": "status",
  "reporting.detail.notFound": "Certificado não encontrado.",
  "reporting.tab.coverage-gaps": "Gaps de cobertura",
  "admin.certificates.title": "Administração de certificados",
  "admin.certificates.backToReporting": "Voltar para reporting",
  "admin.certificates.importSingle": "Importar certificado único",
  "admin.certificates.importBatch": "Importar .zip em lote",
  "admin.certificates.search": "Buscar por nome, fingerprint ou tag",
  "admin.certificates.allStatuses": "Todos os status",
  "admin.certificates.table.certificate": "Certificado",
  "admin.certificates.table.groups": "Grupos",
  "admin.certificates.table.derivedCrls": "LCRs derivadas",
  "admin.certificates.table.lastImport": "Última importação",
  "admin.certificates.empty":
    "Nenhum certificado visível ainda. Importe um certificado ou um pacote `.zip` para começar.",
  "admin.certificates.new.back": "Voltar para administração de certificados",
  "admin.certificates.new.title": "Importar certificado único",
  "admin.certificates.new.displayName": "Nome de exibição",
  "admin.certificates.new.file": "Arquivo do certificado (.pem/.crt/.cer)",
  "admin.certificates.new.tags": "Tags (separadas por vírgula)",
  "admin.certificates.new.groupIds": "IDs de grupo (separados por vírgula)",
  "admin.certificates.new.ignoredUrls": "URLs derivadas ignoradas (separadas por vírgula)",
  "admin.certificates.new.submit": "Importar certificado",
  "admin.certificates.batch.title": "Importação em lote de certificados",
  "admin.certificates.batch.archive": "Arquivo ZIP",
  "admin.certificates.batch.sharedTags": "Tags compartilhadas (separadas por vírgula)",
  "admin.certificates.batch.submit": "Importar pacote ZIP",
  "admin.certificates.detail.status": "Status",
  "admin.certificates.detail.groups": "Grupos",
  "admin.certificates.detail.derived": "LCRs derivadas",
  "admin.certificates.detail.templates": "Templates",
  "admin.certificates.detail.editTitle": "Editar administração do certificado",
  "admin.certificates.detail.save": "Salvar alterações de administração",
  "admin.certificates.detail.derivedUrls": "URLs de LCR derivadas",
  "admin.certificates.detail.markTracked": "Marcar como acompanhada",
  "admin.certificates.detail.markIgnored": "Marcar como ignorada",
  "admin.certificates.detail.effectiveValues": "Valores efetivos por grupo",
  "admin.certificates.detail.templateClone": "Clone de template",
  "admin.certificates.detail.templateSubmit": "Criar template",
  "admin.certificates.detail.manualSubmit": "Registrar verificação manual de conectividade",
  "admin.certificates.detail.changeHistory": "Histórico de mudanças",
  "admin.certificates.detail.notFound": "Certificado não encontrado.",
  "exports.pdf.executive.title": "Relatório executivo de disponibilidade",
  "exports.pdf.operational.title": "Relatório operacional de evidências",
  "exports.pdf.section.filters": "Filtros aplicados",
  "exports.pdf.section.summary": "Resumo de disponibilidade",
  "exports.pdf.section.coverage": "Gaps de cobertura",
};

const ES_DICTIONARY: Dictionary = {
  ...EN_DICTIONARY,
  "common.actions.accept": "Aceptar",
  "common.actions.apply": "Aplicar",
  "common.actions.back": "Volver",
  "common.actions.clear": "Limpiar",
  "common.actions.create": "Crear",
  "common.actions.exportCsv": "Exportar CSV filtrado",
  "common.actions.save": "Guardar",
  "common.filters.all": "Todos",
  "common.locale.label": "Idioma",
  "common.status.degraded": "degradado",
  "common.status.disabled": "deshabilitado",
  "common.status.healthy": "saludable",
  "common.status.offline": "fuera de servicio",
  "common.yes": "sí",
  "common.no": "no",
  "auth.landing.title": "Iniciar sesión con una invitación",
  "auth.landing.acceptInvite": "Aceptar invitación",
  "auth.landing.loginButton": "Iniciar sesión",
  "auth.invite.title": "Aceptar invitación",
  "auth.invite.code": "Código de invitación",
  "auth.invite.email": "Correo invitado",
  "auth.invite.displayName": "Nombre visible",
  "auth.invite.submit": "Aceptar invitación",
  "auth.invite.providerTitle": "Inicio de sesión con proveedor",
  "auth.invite.providerDescription":
    "Inicie el acceso real con proveedor desde la invitación. El callback solo finaliza cuando el correo del proveedor coincide con la dirección invitada y la identidad se verifica en el servidor.",
  "auth.invite.providerEmail": "Correo verificado del proveedor",
  "auth.invite.providerStart": "Continuar con {provider}",
  "settings.title": "Preferencias predictivas, idioma y tema",
  "settings.kicker": "Configuración del usuario",
  "settings.backToReporting": "Volver a reporting",
  "settings.myPreferences": "Mis preferencias",
  "settings.theme": "Tema",
  "settings.theme.dark": "Oscuro",
  "settings.theme.light": "Claro",
  "settings.locale": "Idioma",
  "settings.groups": "Grupos",
  "settings.severities": "Severidades",
  "settings.predictiveTypes": "Tipos predictivos",
  "settings.predictiveType.upcoming-expiration": "Próxima expiración",
  "settings.predictiveType.publication-delayed": "Publicación retrasada",
  "settings.savePreferences": "Guardar preferencias",
  "settings.platformTitle": "Política predictiva de la plataforma",
  "settings.platform.windowDays": "Ventana predictiva predeterminada (días)",
  "settings.platform.save": "Guardar configuración de la plataforma",
  "settings.providers.title": "Estado de proveedores",
  "settings.providers.description":
    "Las credenciales de los proveedores siguen viviendo solo en el entorno. Los platform admins pueden inspeccionar la presencia de configuración, las URLs de callback y el estado manual de verificación usado para la prueba de acceso con HTTPS público.",
  "settings.providers.callbackUrl": "URL de callback",
  "settings.providers.configured": "Configurado desde el entorno",
  "settings.providers.currentStatus": "Estado de verificación",
  "settings.providers.verified": "Verificado",
  "settings.providers.unverified": "No verificado",
  "settings.providers.markVerified": "Marcar proveedor como verificado",
  "settings.providers.notes": "Notas de verificación",
  "settings.providers.lastVerifiedAt": "Última verificación en {verifiedAt} por {userId}",
  "settings.providers.notVerifiedYet": "Todavía no se registró una verificación exitosa en host público.",
  "settings.providers.save": "Guardar estado del proveedor",
  "reporting.title": "Panel de disponibilidad",
  "reporting.exportExecutivePdf": "PDF ejecutivo",
  "reporting.summary.rows": "Filas en el período",
  "reporting.summary.healthy": "Saludables",
  "reporting.summary.degraded": "Degradadas",
  "reporting.summary.offline": "Fuera de servicio",
  "reporting.summary.averageSla": "SLA promedio",
  "reporting.summary.openAlerts": "Alertas abiertas",
  "reporting.mode.certificate": "Certificados",
  "reporting.mode.crl": "LCRs",
  "reporting.filter.period": "Período",
  "reporting.filter.from": "Desde",
  "reporting.filter.to": "Hasta",
  "reporting.filter.applyCustomPeriod": "Aplicar período personalizado",
  "reporting.table.certificate": "Certificado",
  "reporting.table.crl": "LCR",
  "reporting.table.predictive": "Predictivo",
  "reporting.table.latestUnavailability": "Última indisponibilidad",
  "reporting.table.nextExpiration": "Próxima expiración",
  "reporting.table.openAlerts": "Alertas abiertas",
  "reporting.detail.back": "Volver al dashboard",
  "reporting.detail.export.coverage": "CSV de huecos de cobertura",
  "reporting.detail.export.alerts": "CSV de alertas",
  "reporting.detail.export.snapshots": "CSV de snapshots",
  "reporting.detail.export.pdf": "PDF operativo",
  "reporting.detail.currentStatus": "Estado actual",
  "reporting.detail.lastIncident": "Último incidente",
  "reporting.detail.sla": "SLA en el período",
  "reporting.detail.nextExpiration": "Próxima expiración",
  "reporting.detail.openAlerts": "Alertas abiertas",
  "reporting.detail.predictiveState": "Estado predictivo",
  "reporting.detail.structuredTags": "Etiquetas estructuradas",
  "reporting.detail.derivedCrls": "LCRs derivadas",
  "reporting.detail.notFound": "Certificado no encontrado.",
  "admin.certificates.title": "Administración de certificados",
  "admin.certificates.backToReporting": "Volver a reporting",
  "admin.certificates.importSingle": "Importar certificado individual",
  "admin.certificates.importBatch": "Importar .zip en lote",
  "admin.certificates.search": "Buscar por nombre, fingerprint o etiqueta",
  "admin.certificates.allStatuses": "Todos los estados",
  "admin.certificates.table.certificate": "Certificado",
  "admin.certificates.table.groups": "Grupos",
  "admin.certificates.table.derivedCrls": "LCRs derivadas",
  "admin.certificates.table.lastImport": "Última importación",
  "admin.certificates.empty":
    "Todavía no hay certificados visibles. Importe un certificado o un paquete `.zip` para comenzar.",
  "admin.certificates.new.back": "Volver a la administración de certificados",
  "admin.certificates.new.title": "Importar certificado individual",
  "admin.certificates.new.displayName": "Nombre visible",
  "admin.certificates.new.file": "Archivo del certificado (.pem/.crt/.cer)",
  "admin.certificates.new.tags": "Etiquetas (separadas por comas)",
  "admin.certificates.new.groupIds": "IDs de grupo (separados por comas)",
  "admin.certificates.new.ignoredUrls": "URLs derivadas ignoradas (separadas por comas)",
  "admin.certificates.new.submit": "Importar certificado",
  "admin.certificates.batch.title": "Importación por lotes de certificados",
  "admin.certificates.batch.archive": "Archivo ZIP",
  "admin.certificates.batch.sharedTags": "Etiquetas compartidas (separadas por comas)",
  "admin.certificates.batch.submit": "Importar paquete ZIP",
  "admin.certificates.detail.status": "Estado",
  "admin.certificates.detail.groups": "Grupos",
  "admin.certificates.detail.derived": "LCRs derivadas",
  "admin.certificates.detail.templates": "Plantillas",
  "admin.certificates.detail.editTitle": "Editar administración del certificado",
  "admin.certificates.detail.save": "Guardar cambios de administración",
  "admin.certificates.detail.derivedUrls": "URLs de LCR derivadas",
  "admin.certificates.detail.effectiveValues": "Valores efectivos por grupo",
  "admin.certificates.detail.templateClone": "Clon de plantilla",
  "admin.certificates.detail.templateSubmit": "Crear plantilla",
  "admin.certificates.detail.manualSubmit": "Registrar verificación manual de conectividad",
  "admin.certificates.detail.changeHistory": "Historial de cambios",
  "admin.certificates.detail.notFound": "Certificado no encontrado.",
  "exports.pdf.executive.title": "Informe ejecutivo de disponibilidad",
  "exports.pdf.operational.title": "Informe operativo de evidencias",
  "exports.pdf.section.filters": "Filtros aplicados",
  "exports.pdf.section.summary": "Resumen de disponibilidad",
  "exports.pdf.section.coverage": "Huecos de cobertura",
};

const DICTIONARIES: Record<AppLocale, Dictionary> = {
  en: EN_DICTIONARY,
  "pt-BR": PT_BR_DICTIONARY,
  es: ES_DICTIONARY,
};

export function isSupportedLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function normalizeLocale(value: string | null | undefined): AppLocale | null {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === "en" || normalized.startsWith("en-")) {
    return "en";
  }
  if (normalized === "pt" || normalized === "pt-br" || normalized.startsWith("pt-")) {
    return "pt-BR";
  }
  if (normalized === "es" || normalized.startsWith("es-")) {
    return "es";
  }
  return null;
}

export function detectLocaleFromAcceptLanguage(value: string | null | undefined): AppLocale {
  if (!value) {
    return DEFAULT_LOCALE;
  }

  for (const entry of value.split(",")) {
    const locale = normalizeLocale(entry.split(";")[0]);
    if (locale) {
      return locale;
    }
  }

  return DEFAULT_LOCALE;
}

export async function resolveRequestLocale(explicitLocale?: string | null): Promise<AppLocale> {
  const fromExplicit = normalizeLocale(explicitLocale);
  if (fromExplicit) {
    return fromExplicit;
  }

  const requestHeaders = await headers();
  return detectLocaleFromAcceptLanguage(requestHeaders.get("accept-language"));
}

export async function resolveUserLocale(userId: string): Promise<AppLocale> {
  const user = await findUserById(userId);
  return normalizeLocale(user?.preferredLocale) ?? DEFAULT_LOCALE;
}

export async function resolvePrincipalLocale(
  principal?: AuthenticatedPrincipal | null
): Promise<AppLocale> {
  if (principal) {
    return resolveUserLocale(principal.userId);
  }
  return resolveRequestLocale();
}

export function translate(
  locale: AppLocale,
  key: string,
  values: TranslationValues = {}
): string {
  const template = DICTIONARIES[locale][key] ?? DICTIONARIES.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, variable) => {
    const value = values[variable];
    return value === undefined || value === null ? "" : String(value);
  });
}

export async function getRequestTranslator(explicitLocale?: string | null): Promise<{
  locale: AppLocale;
  t: (key: string, values?: TranslationValues) => string;
}> {
  const locale = await resolveRequestLocale(explicitLocale);
  return {
    locale,
    t: (key, values) => translate(locale, key, values),
  };
}

export async function getPrincipalTranslator(
  principal?: AuthenticatedPrincipal | null
): Promise<{
  locale: AppLocale;
  t: (key: string, values?: TranslationValues) => string;
}> {
  const locale = await resolvePrincipalLocale(principal);
  return {
    locale,
    t: (key, values) => translate(locale, key, values),
  };
}

export function getLocaleLabel(locale: AppLocale): string {
  return translate(locale, `common.locale.${locale}`);
}

export function getSupportedLocaleOptions(currentLocale: AppLocale): Array<{
  value: AppLocale;
  label: string;
}> {
  return SUPPORTED_LOCALES.map((locale) => ({
    value: locale,
    label: translate(currentLocale, `common.locale.${locale}`),
  }));
}
