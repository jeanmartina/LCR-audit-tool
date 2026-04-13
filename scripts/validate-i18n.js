const fs = require("fs");

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function assertIncludes(content, fragment, message) {
  if (!content.includes(fragment)) {
    throw new Error(message);
  }
}

function validateFoundation() {
  const i18n = read("src/i18n/index.ts");
  const layout = read("src/app/layout.tsx");
  const preferences = read("src/settings/preferences.ts");
  const profileRoute = read("src/app/api/settings/profile/route.ts");
  const settingsPage = read("src/app/settings/page.tsx");
  const inviteRoute = read("src/app/api/auth/invite/accept/route.ts");
  const loginRoute = read("src/app/api/auth/login/route.ts");

  assertIncludes(i18n, 'SUPPORTED_LOCALES = ["en", "pt-BR", "es"]', "Missing supported locales");
  assertIncludes(i18n, "getRequestTranslator", "Missing request-scoped translator");
  assertIncludes(i18n, "getPrincipalTranslator", "Missing principal-scoped translator");
  assertIncludes(layout, "resolvePrincipalLocale", "Layout is not locale-aware");
  assertIncludes(preferences, "preferredLocale", "User settings do not persist locale");
  assertIncludes(settingsPage, 'name="preferredLocale"', "Settings page is missing preferredLocale selector");
  assertIncludes(profileRoute, "preferredLocale", "Settings profile flow is missing preferredLocale wiring");
  assertIncludes(inviteRoute, "preferredLocale", "Invite accept route is missing locale wiring");
  assertIncludes(loginRoute, "preferredLocale", "Login route is missing locale persistence");
  console.log("I18n foundation ready");
}

function validateUi() {
  const authLanding = read("src/app/auth/page.tsx");
  const authInvite = read("src/app/auth/accept-invite/page.tsx");
  const settings = read("src/app/settings/page.tsx");
  const reporting = read("src/app/reporting/page.tsx");
  const reportingDetail = read("src/app/reporting/[targetId]/page.tsx");
  const adminList = read("src/app/admin/certificates/page.tsx");

  assertIncludes(authLanding, "getRequestTranslator", "Auth landing is not translated");
  assertIncludes(authLanding, 'name="locale"', "Auth landing is missing locale selector");
  assertIncludes(authInvite, 'name="locale"', "Invite page is missing locale selector");
  assertIncludes(settings, 'name="preferredLocale"', "Settings page is missing locale selector");
  assertIncludes(reporting, 't("reporting.title")', "Reporting page is not localized");
  assertIncludes(reportingDetail, 't("reporting.detail.export.pdf")', "Reporting detail is not localized");
  assertIncludes(adminList, 't("admin.certificates.title")', "Certificate admin list is not localized");
  console.log("I18n UI surfaces ready");
}

function validateExports() {
  const csv = read("src/exports/csv.ts");
  const pdf = read("src/exports/pdf.ts");
  const templates = read("src/exports/pdf-templates.js");

  assertIncludes(csv, "getPrincipalTranslator", "CSV exports are not localized");
  assertIncludes(csv, 't("exports.csv.dashboard.rowType")', "Dashboard CSV headers are not localized");
  assertIncludes(pdf, "getPrincipalTranslator", "PDF exports are not localized");
  assertIncludes(pdf, 't("exports.pdf.executive.title")', "Executive PDF labels are not localized");
  assertIncludes(templates, "labels.sections.filters", "PDF templates are not label-driven");
  console.log("I18n exports ready");
}

const mode = process.argv[2];

if (mode === "foundation") {
  validateFoundation();
} else if (mode === "ui") {
  validateUi();
} else if (mode === "exports") {
  validateExports();
} else {
  throw new Error(`Unknown validation mode: ${mode}`);
}
