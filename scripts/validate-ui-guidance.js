const fs = require("fs");

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function assertIncludes(haystack, needle, label) {
  if (!haystack.includes(needle)) {
    throw new Error(`${label} missing ${needle}`);
  }
}

function assertNotIncludes(haystack, needle, label) {
  if (haystack.includes(needle)) {
    throw new Error(`${label} must not include ${needle}`);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const primitives = read("src/components/ui/primitives.tsx");
for (const exportName of [
  "PageShell",
  "PageHeader",
  "Panel",
  "Field",
  "CheckboxField",
  "Notice",
  "EmptyState",
  "StatusPill",
]) {
  assertIncludes(primitives, `export function ${exportName}`, "UI primitives");
}

// Phase 33 D-01: compact density tokens must stay centralized.
for (const token of [
  "export const UX_DENSITY",
  "shellPadding",
  "sectionGap",
  "controlHeight",
  "controlPadding",
]) {
  assertIncludes(primitives, token, "D-01 compact density contract");
}

// Phase 33 D-02: explicit action hierarchy mapping.
assertIncludes(primitives, "tone?: \"primary\" | \"secondary\" | \"context\"", "D-02 action hierarchy type");
assertIncludes(primitives, "if (tone === \"primary\")", "D-02 primary action mapping");
assertIncludes(primitives, "else if (tone === \"secondary\")", "D-02 secondary action mapping");
assertIncludes(primitives, "style.textDecoration = \"underline\"", "D-02 tertiary/context link mapping");

// Phase 33 D-04: empty/error composition helper must provide primary + recovery actions.
for (const marker of [
  "export function EmptyStateWithActions",
  "primaryHref",
  "recoveryHref",
  "tone=\"primary\"",
  "tone=\"context\"",
]) {
  assertIncludes(primitives, marker, "D-04 empty/error action contract");
}

const shell = read("src/components/public-shell.tsx");
// Phase 33 D-03: global top navigation + local sub-navigation hooks.
for (const marker of [
  "actions: PublicShellAction[]",
  "localSubnavLabel?: string",
  "localSubnav?: ReactNode",
  "<nav style={{ display: \"flex\", alignItems: \"center\", gap: \"10px\", flexWrap: \"wrap\" }}>",
  "<LocalSubnav label={localSubnavLabel ?? \"Local navigation\"}",
]) {
  assertIncludes(shell, marker, "D-03 hybrid navigation contract");
}

const layout = read("src/app/layout.tsx");
for (const marker of [
  "[\"--density-shell-padding\" as string]",
  "[\"--density-section-gap\" as string]",
  "[\"--density-control-height\" as string]",
  "[\"--nav-global-gap\" as string]",
  "[\"--nav-local-gap\" as string]",
]) {
  assertIncludes(layout, marker, "D-01/D-03 layout tokens");
}

const settingsPage = read("src/app/settings/page.tsx");
for (const required of [
  "../../components/ui/primitives",
  "settings.saved.title",
  "settings.group.trustSource.hint",
  "settings.group.pki.hint",
  "settings.group.jurisdiction.hint",
  "settings.providers.callbackUrl.hint",
  "settings.providers.markVerified.hint",
  "settings.empty.noManageableGroups.title",
]) {
  assertIncludes(settingsPage, required, "settings page guidance");
}
assertNotIncludes(settingsPage, "const PANEL", "settings page guidance");

const i18n = read("src/i18n/index.ts");
for (const requiredKey of [
  "settings.myPreferences.description",
  "settings.saved.provider",
  "settings.group.trustSource.example",
  "settings.group.pki.example",
  "settings.group.jurisdiction.example",
  "settings.group.windowDays.hint",
  "settings.platform.enabled.hint",
  "settings.providers.notes.example",
  "common.ui.recovery",
  "common.ui.tryAgain",
  "common.ui.localSubnav",
]) {
  const count = (i18n.match(new RegExp(`\"${escapeRegExp(requiredKey)}\"`, "g")) || []).length;
  if (count !== 3) {
    throw new Error(`${requiredKey} must exist exactly once per locale; found ${count}`);
  }
}

for (const routePath of [
  "src/app/api/settings/profile/route.ts",
  "src/app/api/settings/platform/route.ts",
  "src/app/api/settings/platform/providers/[provider]/route.ts",
  "src/app/api/settings/groups/[groupId]/route.ts",
]) {
  const route = read(routePath);
  assertNotIncludes(route, "Response.redirect(new URL(\"/settings", routePath);
  assertIncludes(route, "Location: \"/settings?saved=", routePath);
}

const validateAll = read("scripts/validate-all.js");
assertIncludes(validateAll, "scripts/validate-ui-guidance.js", "validate-all");

console.log("UI guidance validation passed");


const majorRoutes = [
  "src/app/page.tsx",
  "src/app/auth/page.tsx",
  "src/app/reporting/page.tsx",
  "src/app/reporting/[targetId]/page.tsx",
  "src/app/admin/certificates/page.tsx",
  "src/app/settings/settings-page.tsx",
  "src/app/admin/trust-lists/page.tsx",
];

for (const routePath of majorRoutes) {
  const route = read(routePath);
  assertIncludes(route, "ActionLink", `${routePath} must use shared action hierarchy`);
}

for (const navPath of [
  "src/app/reporting/page.tsx",
  "src/app/reporting/[targetId]/page.tsx",
  "src/app/admin/certificates/page.tsx",
  "src/app/settings/settings-page.tsx",
]) {
  const route = read(navPath);
  assertIncludes(route, "LocalSubnav", `${navPath} must expose local sub-navigation`);
}

for (const emptyPath of [
  "src/app/page.tsx",
  "src/app/auth/page.tsx",
  "src/app/reporting/page.tsx",
  "src/app/reporting/[targetId]/page.tsx",
  "src/app/admin/certificates/page.tsx",
]) {
  const route = read(emptyPath);
  if (route.includes("EmptyState")) {
    assertIncludes(route, "EmptyStateWithActions", `${emptyPath} empty state must include recovery composition`);
  }
}
