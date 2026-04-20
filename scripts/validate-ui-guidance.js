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
]) {
  const count = (i18n.match(new RegExp(`"${escapeRegExp(requiredKey)}"`, "g")) || []).length;
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
