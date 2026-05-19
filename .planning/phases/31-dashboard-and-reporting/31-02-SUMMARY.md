---
phase: 31-dashboard-and-reporting
plan: 02
subsystem: ui
tags: [nextjs, typescript, reporting, i18n, validation]
requires:
  - phase: 31-dashboard-and-reporting
    provides: normalized reporting contracts and timeline fields from plan 31-01
provides:
  - shared reporting action hierarchy with global primary and contextual inline controls
  - diagnostic-first detail timeline rendering with narrative-first entries and expandable technical evidence
  - executive/detail/dashboard taxonomy parity using normalized UI state labels
  - validator anchors for UI-05 action and diagnostic behavior regressions
affects: [reporting-dashboard, reporting-detail, executive-reporting, ui-primitives, i18n, validation]
tech-stack:
  added: []
  patterns: [shared action primitives, normalized taxonomy rendering, narrative-first timeline with evidence expander]
key-files:
  created: []
  modified: [src/components/ui/primitives.tsx, src/app/reporting/page.tsx, src/app/reporting/[targetId]/page.tsx, src/app/reporting/executive/page.tsx, src/reporting/read-models.ts, src/i18n/index.ts, scripts/validate-reporting.js, scripts/validate-reporting-ui05.js]
key-decisions:
  - "Use shared ActionGroup/ActionLink primitives to enforce D-07 and D-08 across dashboard, detail, and executive surfaces."
  - "Render timeline narrative as primary text and keep technical evidence behind details expansion to satisfy D-05/D-06 without removing raw evidence."
patterns-established:
  - "Global page actions use one primary CTA plus secondary links; row/detail actions remain contextual and inline."
  - "Dashboard, detail, and executive status labels consume reporting.state.ui.* keys from normalizedState."
requirements-completed: [UI-05]
duration: 55min
completed: 2026-05-19
---

# Phase 31 Plan 02: Dashboard and Reporting Summary

**Reporting UI now uses one action hierarchy and one normalized state taxonomy across dashboard/detail/executive, with diagnostic-first timeline narratives and technical drill-down evidence.**

## Performance
- **Duration:** 55 min
- **Started:** 2026-05-19T17:20:00Z
- **Completed:** 2026-05-19T18:15:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- Added shared `ActionLink` and `ActionGroup` primitives and refactored reporting pages to fixed global actions plus contextual inline actions.
- Applied UI-SPEC copy contract for primary CTA and reporting empty/error states in all supported locales.
- Converted detail timeline rendering to narrative-first entries with expandable technical evidence lines and newest-first display.
- Propagated normalized reporting state to executive risk cards and detail summary labels to keep taxonomy consistent.
- Extended reporting validator anchors for action hierarchy, taxonomy usage, and diagnostic timeline behavior.

## Task Commits
1. **Task 1: Standardize reporting action controls and hierarchy** - `be39c5c` (test), `1ab8f89` (feat)
2. **Task 2: Convert reporting dashboard and detail into diagnostic-first surfaces** - `8e5f517` (test), `6029176` (feat)
3. **Task 3: Finalize UI-05 regression anchors and full quality verification** - `9b54894` (chore)

## Files Created/Modified
- `src/components/ui/primitives.tsx` - Added reusable action hierarchy primitives.
- `src/app/reporting/page.tsx` - Unified global and contextual actions, empty-state contract, normalized status labels.
- `src/app/reporting/[targetId]/page.tsx` - Narrative-first timeline with technical expansion; normalized detail labels.
- `src/app/reporting/executive/page.tsx` - Normalized taxonomy labels in top-risk cards and shared action control usage.
- `src/reporting/read-models.ts` - Added normalized state field to executive risk item contract.
- `src/i18n/index.ts` - Added UI-SPEC empty/error copy and primary CTA wording.
- `scripts/validate-reporting.js` - Added UI-05 regression anchors for actions/taxonomy/timeline.
- `scripts/validate-reporting-ui05.js` - TDD red/green anchor checks for UI-05 behavior.

## Decisions Made
- Kept CSV/PDF/export paths unchanged while re-skinning controls to avoid auth/scope regressions.
- Reused normalized read-model state instead of introducing page-level status mappers.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Sandbox loopback restrictions required escalated command execution for file edits and verification commands.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- UI-05 reporting behaviors now have deterministic validation anchors and pass full project quality checks.
- Ready for downstream UI consistency and PDF/reporting polish phases.

## Self-Check: PASSED
- Summary file exists: `.planning/phases/31-dashboard-and-reporting/31-02-SUMMARY.md`
- Commits verified in history: `be39c5c`, `1ab8f89`, `8e5f517`, `6029176`, `9b54894`

---
*Phase: 31-dashboard-and-reporting*
*Completed: 2026-05-19*
