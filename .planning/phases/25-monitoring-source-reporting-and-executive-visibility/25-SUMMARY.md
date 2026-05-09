---
phase: 25-monitoring-source-reporting-and-executive-visibility
plan: 25-01
subsystem: reporting
tags: [ocsp, policy-document, nextjs, i18n, validation]

requires:
  - phase: 22
    provides: derived monitoring-source records and provenance
  - phase: 23
    provides: bounded CP/CPS/DPC snapshot evidence
  - phase: 24
    provides: technical OCSP evidence and status records
provides:
  - derived-source read models for reporting
  - operator drill-down for OCSP and policy documents
  - executive OCSP/policy-document aggregate cards
  - reporting contract validation markers
affects: [phase 26, reporting, executive-summary]

tech-stack:
  added: []
  patterns: [principal-scoped derived-source reporting, validator-backed reporting contract, localized source-health labels]

key-files:
  created:
    - .planning/phases/25-monitoring-source-reporting-and-executive-visibility/25-PROOF.md
  modified:
    - src/reporting/read-models.ts
    - src/reporting/query-state.ts
    - src/app/reporting/[targetId]/page.tsx
    - src/app/reporting/executive/page.tsx
    - src/i18n/index.ts
    - scripts/validate-reporting.js
    - package-lock.json

key-decisions:
  - "Expose derived OCSP and policy-document health in the existing reporting surfaces rather than adding a separate source console."
  - "Keep derived-source visibility bound to the parent certificate/group authorization model."
  - "Treat technical OCSP reachability and policy-document snapshots as evidence, not semantic compliance validation."

patterns-established:
  - "Pattern 1: principal-scoped read models can safely assemble derived source health summaries from existing monitoring evidence."
  - "Pattern 2: reporting contract checks live in the validator script so UI copy and data-model expectations stay synchronized."

requirements-completed: [REP-04, REP-05, REP-06]

# Metrics
duration: 1h 30m
completed: 2026-05-09
---

# Phase 25: Monitoring Source Reporting and Executive Visibility Summary

**Derived OCSP and policy-document health now appears in the operator drill-down and executive summary without weakening the parent-certificate authorization boundary.**

## Performance

- **Duration:** 1h 30m
- **Started:** 2026-05-09T17:31:34-0300
- **Completed:** 2026-05-09T19:01:34-0300
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Added principal-scoped derived-source read models that aggregate OCSP and policy-document evidence.
- Rendered OCSP and policy-document source-health sections in the certificate drill-down and executive summary.
- Extended the reporting validator so the phase 25 contract is enforced by tests instead of copy alone.
- Verified the finished phase with `validate-all`, `typecheck`, and `build`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend reporting read-models for derived sources** - `d3bfad8` (feat)
2. **Task 2: Render derived sources in operator and executive pages** - `12d7a24` (feat)
3. **Task 3: Validate reporting contract and phase boundary** - `e6982cd` (test)

## Files Created/Modified
- `src/reporting/read-models.ts` - Derived-source read models and executive health summaries.
- `src/reporting/query-state.ts` - Added the `sources` reporting tab.
- `src/app/reporting/[targetId]/page.tsx` - Operator drill-down source-health sections and sources tab.
- `src/app/reporting/executive/page.tsx` - Executive OCSP and policy-document cards.
- `src/i18n/index.ts` - New reporting copy and labels in `en`, `pt-BR`, and `es`.
- `scripts/validate-reporting.js` - Phase 25 contract validation markers.
- `package-lock.json` - Updated package metadata after local dependency install.

## Decisions Made
- Derived source visibility stays bound to the parent certificate and its authorized groups.
- The reporting surfaces stay evidence-oriented and do not claim semantic validation.
- A dedicated `sources` tab was added to the certificate detail page for per-source history.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing local dependencies blocked `typecheck`**
- **Found during:** verification
- **Issue:** `tsc` was unavailable because `node_modules` was not installed.
- **Fix:** Installed dependencies with `npm install`, then reran `typecheck` and `build`.
- **Files modified:** `package-lock.json`
- **Verification:** `npm run typecheck`, `npm run build`, and `node scripts/validate-all.js` all passed.
- **Committed in:** `package-lock.json` update bundled with the phase closure docs.

**2. [Rule 1 - Bug] Derived-source evidence rendering needed type narrowing**
- **Found during:** final `typecheck`
- **Issue:** the detail page accessed OCSP and document evidence fields without narrowing the union type.
- **Fix:** added evidence type guards and corrected the `MonitoringSourceRecord` import source.
- **Files modified:** `src/app/reporting/[targetId]/page.tsx`, `src/reporting/read-models.ts`
- **Verification:** `npm run typecheck` and `npm run build` passed after the fix.
- **Committed in:** part of the task commits above.

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes were required for a clean, type-safe closure. No scope creep.

## Issues Encountered
- The workspace initially lacked installed dependencies, so typechecking could not run until `npm install` completed.
- Next.js emitted a workspace-root warning because of multiple lockfiles; it did not block the build.

## Next Phase Readiness
- Phase 25 is fully closed and validated.
- Phase 26 is ready to plan/execute with the context and plan already prepared in the phase directory.

---
*Phase: 25-monitoring-source-reporting-and-executive-visibility*
*Completed: 2026-05-09*

