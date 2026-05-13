---
phase: 30-import-review-and-safety
plan: 04
subsystem: trust-list-review-ui-gap-closure
tags: [certificate-import, trust-list, review-ui, review-safety]
requires:
  - phase: 30-import-review-and-safety
    provides: trust-list review payload safety and review decision contract
provides:
  - Trust-list preview now exposes per-candidate review identifiers for UI review state
  - Trust-list wizard now performs preview -> per-candidate review -> save sync without manual JSON authoring
  - Route and validators enforce structured candidate decision flow and regressions
affects: [trust-list-ui, trust-list-sync-route, i18n, validation]
tech-stack:
  added: []
  patterns: [candidate-decision-state, structured-review-payload, regression-validation]
key-files:
  created:
    - scripts/validate-trust-list-review-ui-gap.js
  modified:
    - src/app/admin/trust-lists/trust-list-source-wizard.tsx
    - src/app/admin/trust-lists/page.tsx
    - src/app/api/admin/trust-lists/[sourceId]/sync/route.ts
    - src/trust-lists/sync.ts
    - src/trust-lists/types.ts
    - src/i18n/index.ts
    - scripts/validate-import-review-safety.js
decisions:
  - "Trust-list review decisions are now generated from preview-derived candidate state in UI, not manual textarea JSON."
  - "Sync route accepts JSON structured review payloads while preserving required candidate decision enforcement."
metrics:
  duration: 42min
  completed: 2026-05-13
requirements-completed: [UI-04]
---

# Phase 30 Plan 04: Trust-List Review UI Gap Closure Summary

Trust-list review-before-save now uses real per-candidate decision UI wired from preview through sync save, removing manual `reviewPayload` JSON authoring.

## Accomplishments
- Extended trust-list preview data to include candidate fingerprints and deterministic `reviewKey` values for review-row identity.
- Replaced manual textarea payload entry in the trust-list wizard with per-candidate decision (`accept|edit|ignore|reject|duplicate|pending`) and reason controls.
- Wired save flow to create source, generate structured `candidateDecisions` from UI state, and submit sync save with JSON payload.
- Updated sync route parsing to accept structured JSON review payloads and keep server-side `candidate-decisions` validation.
- Added gap guard `scripts/validate-trust-list-review-ui-gap.js` and aligned existing safety validator anchors with the new UI flow.

## Task Commits
1. `9e32531` - `feat(30-04): replace trust-list manual JSON review with candidate UI`
2. `ebea7c0` - `test(30-04): guard structured trust-list review payload flow`

## Verification
- `npm run typecheck`
- `node scripts/validate-trust-list-review-ui-gap.js`
- `npm run quality`

## Deviations from Plan

### Auto-fixed Issues
1. [Rule 1 - Bug] Updated brittle safety validator anchors that still expected hidden `reviewDecision` and `reviewJustification` fields.
- Found during: Task 2 verification (`npm run quality`)
- Issue: `scripts/validate-import-review-safety.js` failed after UI refactor because it asserted removed manual-field anchors.
- Fix: Switched assertions to new review state anchors (`candidateDecisions`, `setCandidateReason`).
- Files modified: `scripts/validate-import-review-safety.js`
- Commit: `ebea7c0`

## Known Stubs
None.

## Self-Check: PASSED
- Found summary file: `.planning/phases/30-import-review-and-safety/30-04-SUMMARY.md`
- Found commits: `9e32531`, `ebea7c0`
