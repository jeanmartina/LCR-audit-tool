---
phase: 31-dashboard-and-reporting
plan: 01
subsystem: reporting
tags: [nextjs, typescript, i18n, read-models, validation]
requires:
  - phase: 25-monitoring-source-reporting-and-executive-visibility
    provides: principal-scoped reporting read models and executive/detail surfaces
provides:
  - canonical six-state UI taxonomy for reporting states
  - risk-first dashboard ordering while keeping healthy rows visible
  - narrative-first timeline events with technical drill-down payload
  - validator anchors that enforce UI-05 reporting contracts
affects: [dashboard, reporting-detail, executive-reporting, i18n, validation]
tech-stack:
  added: []
  patterns: [shared status normalization in read models, narrative-first timeline contracts, anchor-based regression validation]
key-files:
  created: [scripts/validate-reporting-ui05.js]
  modified: [src/reporting/read-models.ts, src/reporting/timeline.ts, src/i18n/index.ts, scripts/validate-reporting.js]
key-decisions:
  - "Normalize raw/legacy statuses into one exported six-state taxonomy and expose normalized fields directly in read-model contracts."
  - "Use risk score first in dashboard row sorting so problematic rows lead while healthy rows stay included."
  - "Extend timeline events with narrative and technical payload fields while preserving existing filter/date semantics."
patterns-established:
  - "Read-model contracts should expose normalized UI state rather than requiring per-page mapping."
  - "Timeline entries should default to human narrative and keep technical detail as structured drill-down data."
requirements-completed: [UI-05]
duration: 32min
completed: 2026-05-19
---

# Phase 31 Plan 01: Dashboard and Reporting Summary

**UI-05 reporting contracts now use one six-state taxonomy with risk-first ordering and narrative-first timeline events backed by validator regressions.**

## Performance
- **Duration:** 32 min
- **Started:** 2026-05-19T11:12:47-03:00
- **Completed:** 2026-05-19T14:33:36Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Added exported `UiDerivedState` and `normalizeUiDerivedState` in reporting read models and propagated normalized state through dashboard/detail/derived-source contracts.
- Preserved healthy row inclusion and enforced risk-priority ordering by scoring rows before fallback tie-breaks.
- Upgraded timeline event contract to include `narrative` and `technical` payload fields and added locale narrative keys in `en`, `pt-BR`, and `es`.
- Hardened reporting validator anchors for UI-05 normalization, risk-ordering hook, and timeline narrative/technical split.

## Task Commits
1. **Task 1: Define and wire canonical UI-05 state contracts in read models** - `5c5a878` (test), `1c76ceb` (feat)
2. **Task 2: Upgrade timeline events to human-first narrative with technical drill-down payload** - `a05fc11` (test), `b00628d` (feat)
3. **Task 3: Enforce UI-05 reporting foundation with validator anchors** - `6c9c1cf` (chore)

## Files Created/Modified
- `scripts/validate-reporting-ui05.js` - RED/GREEN anchor checks for UI-05 state + timeline contracts.
- `src/reporting/read-models.ts` - six-state taxonomy export, normalized fields, and risk-first row ordering.
- `src/reporting/timeline.ts` - narrative-first timeline payload (`narrative`, `technical`) while keeping existing event model.
- `src/i18n/index.ts` - UI state labels/descriptions and timeline narrative keys in three locales.
- `scripts/validate-reporting.js` - durable anchors for normalization and timeline payload contracts.

## Decisions Made
- Chose a single canonical normalization helper in read models so dashboard, detail, and executive layers consume consistent UI states.
- Kept legacy timeline `title/detail` fields and added narrative/technical payloads to avoid breaking existing consumers while delivering D-05/D-06.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed missing normalized field in detail summary fallback**
- **Found during:** Task 1 verification
- **Issue:** `DetailSummary` type required `normalizedState` but one return path omitted it.
- **Fix:** Added `normalizedState` in the detailed evidence summary path.
- **Files modified:** `src/reporting/read-models.ts`
- **Verification:** `npm run typecheck`
- **Committed in:** `1c76ceb`

**2. [Rule 3 - Blocking] Updated brittle reporting validator anchors for template-key status rendering**
- **Found during:** Task 3 full `npm run validate`
- **Issue:** Validator expected a hardcoded discovered-status translation call in detail page while implementation used dynamic key templating.
- **Fix:** Updated validator detail anchor to assert template-key mapping pattern.
- **Files modified:** `scripts/validate-reporting.js`
- **Verification:** `npm run validate`
- **Committed in:** `6c9c1cf`

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes were required for verification parity; no scope creep.

## Issues Encountered
- `apply_patch` was unavailable due sandbox `bwrap` restrictions, so edits were applied via controlled scripted file rewrites.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Reporting contracts and validators now enforce UI-05 foundation for subsequent dashboard/detail UI refinements.
- No active blocker remains for plan `31-02`.

## Self-Check: PASSED
- Summary file exists: `.planning/phases/31-dashboard-and-reporting/31-01-SUMMARY.md`
- Commits verified in history: `5c5a878`, `1c76ceb`, `a05fc11`, `b00628d`, `6c9c1cf`

---
*Phase: 31-dashboard-and-reporting*
*Completed: 2026-05-19*
