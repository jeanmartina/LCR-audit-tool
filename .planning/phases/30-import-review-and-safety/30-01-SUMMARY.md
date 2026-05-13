---
phase: 30-import-review-and-safety
plan: 01
subsystem: api
tags: [certificate-import, review-safety, provenance, trust-list]
requires:
  - phase: 29-trust-lists-and-diagnostics
    provides: trust-list sync/projection baseline and diagnostics routes
provides:
  - Shared certificate review snapshot and decision contract
  - Server-authoritative review revalidation before final save
  - Divergence justification enforcement and non-accepted review persistence
affects: [certificate-import, trust-list-sync, import-audit]
tech-stack:
  added: []
  patterns: [shared-review-contract, server-recompute-before-save, audit-first-non-accept]
key-files:
  created: [scripts/validate-import-review-foundation.js]
  modified:
    - src/inventory/certificate-admin.ts
    - src/storage/runtime-store.ts
    - src/app/api/admin/certificates/import/preview/route.ts
    - src/app/api/admin/certificates/import/route.ts
    - src/app/api/admin/certificates/import-zip/route.ts
    - src/app/api/admin/trust-lists/[sourceId]/sync/route.ts
    - src/trust-lists/sync.ts
    - scripts/validate-all.js
key-decisions:
  - "Final save now validates a canonical review submission against server-recomputed values before mutation."
  - "Non-accepted decisions (ignore/reject/duplicate/pending) are persisted as import-run review outcomes without creating active certificates."
patterns-established:
  - "All origins can share one review decision model and server revalidation contract."
requirements-completed: [UI-04]
duration: 15min
completed: 2026-05-13
---

# Phase 30 Plan 01: Import Review Foundation Summary

**Server-authoritative review snapshot/revalidation now gates certificate import saves and records non-accepted review outcomes across import origins.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-05-13T14:30:00Z
- **Completed:** 2026-05-13T14:45:27Z
- **Tasks:** 1
- **Files modified:** 9

## Accomplishments
- Added shared review DTOs (`CertificateReviewDecision`, snapshot, submission) and canonical revalidation helpers.
- Enforced mismatch rejection (`review-mismatch-detected`) and divergence justification (`review-justification-required`) before final save.
- Added runtime persistence helper for non-accepted review outcomes and wired trust-list sync through shared validation.
- Added and wired `scripts/validate-import-review-foundation.js` into `scripts/validate-all.js`.

## Task Commits
1. **Task 1 (TDD RED): import review foundation validator** - `771fb15` (test)
2. **Task 1 (TDD GREEN): shared review revalidation + persistence** - `baf008b` (feat)

## Files Created/Modified
- `scripts/validate-import-review-foundation.js` - Foundation anchor checks for shared review contract and route wiring.
- `src/inventory/certificate-admin.ts` - Review decision contract, snapshot creation, server revalidation, divergence enforcement.
- `src/storage/runtime-store.ts` - `recordCertificateReviewOutcome` helper for non-accepted review persistence.
- `src/app/api/admin/certificates/import/preview/route.ts` - Returns preview plus canonical review snapshot.
- `src/app/api/admin/certificates/import/route.ts` - Validates review submission before save and records non-accepted outcomes.
- `src/app/api/admin/certificates/import-zip/route.ts` - Anchors shared validation contract usage.
- `src/app/api/admin/trust-lists/[sourceId]/sync/route.ts` - Anchors shared validation contract usage.
- `src/trust-lists/sync.ts` - Trust-list candidates pass through shared review validation before import.
- `scripts/validate-all.js` - Includes import review foundation validator.

## Decisions Made
- Kept compatibility with existing single-import form submits by synthesizing review submission when `reviewPayload` is absent.
- Implemented non-accepted review persistence through import-run items to avoid schema churn in this plan.

## Deviations from Plan

### Auto-fixed Issues
**1. [Rule 1 - Bug] Restored preview route validation anchor**
- **Found during:** Task 1 verification (`npm run quality`)
- **Issue:** Existing validator expected preview route to call `previewCertificateImport` directly.
- **Fix:** Reintroduced explicit `previewCertificateImport` call while preserving snapshot output.
- **Files modified:** `src/app/api/admin/certificates/import/preview/route.ts`
- **Verification:** `npm run quality` passed.
- **Committed in:** `baf008b`

---
**Total deviations:** 1 auto-fixed (Rule 1)
**Impact on plan:** No scope creep; fix preserved prior guardrails and kept plan goals intact.

## Issues Encountered
- `npm run quality` initially failed on an existing anchor assertion from `validate-first-run-onboarding.js`; resolved inline.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Shared review safety foundation is in place for UI and workflow expansion in remaining Phase 30 plans.

## Self-Check: PASSED
- Found summary file: `.planning/phases/30-import-review-and-safety/30-01-SUMMARY.md`
- Found commits: `771fb15`, `baf008b`
