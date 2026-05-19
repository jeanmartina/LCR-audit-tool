const fs = require("fs");

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function assertIncludes(content, fragment, message) {
  if (!content.includes(fragment)) {
    throw new Error(message);
  }
}

const readModels = read("src/reporting/read-models.ts");
const i18n = read("src/i18n/index.ts");

assertIncludes(readModels, 'export type UiDerivedState =', "Missing exported six-state UI taxonomy type");
assertIncludes(readModels, 'export function normalizeUiDerivedState(', "Missing exported UI taxonomy normalization helper");
assertIncludes(readModels, 'normalizedState: UiDerivedState', "Missing normalized state field in reporting contracts");
assertIncludes(i18n, '"reporting.state.ui.ok"', "Missing UI state translation key: ok");
assertIncludes(i18n, '"reporting.state.ui.not-checkable"', "Missing UI state translation key: not-checkable");
assertIncludes(i18n, '"reporting.state.ui.description.unknown"', "Missing UI state description translation key: unknown");

console.log("UI-05 state contract anchors present");
