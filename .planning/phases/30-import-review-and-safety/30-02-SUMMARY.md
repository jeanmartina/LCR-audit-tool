---
phase: 30-import-review-and-safety
plan: 02
subsystem: ui
tags: [certificate-import, review-safety, zip-review, revalidation]
requires:
  - phase: 30-import-review-and-safety
    provides: shared review snapshot and server-side review submission validation
provides:
  - Embedded single-certificate review-before-save UI with six decisions
  - Dedicated ZIP review route with per-candidate decisions and edits
  - Save-time revalidation return flow that highlights actionable errors
affects: [certificate-import, import-runs, i18n]
tech-stack:
  added: []
  patterns: [review-first-submit, server-revalidation-error-return, per-candidate-zip-decisions]
key-files:
  created:
    - scripts/validate-import-review-ux.js
    - src/app/admin/certificates/batch/batch-review-form.tsx
    - src/app/admin/certificates/batch/batch-review-page-client.tsx
    - src/app/admin/certificates/batch/review/page.tsx
  modified:
    - src/app/admin/certificates/new/page.tsx
    - src/app/admin/certificates/new/certificate-preview-form.tsx
    - src/app/admin/certificates/batch/page.tsx
    - src/app/admin/certificates/import-runs/[runId]/page.tsx
    - src/app/api/admin/certificates/import-zip/route.ts
    - src/i18n/index.ts
    - src/inventory/certificate-admin.ts
key-decisions:
  - "Single-certificate review stays embedded in the existing import page, while ZIP review moves to a dedicated route."
  - "ZIP final save reuses shared server review validation per candidate and returns first actionable revalidation error index."
patterns-established:
  - "Single and ZIP origins submit explicit review payloads and never bypass server revalidation at save time."
requirements-completed: [UI-04]
duration: 62min
completed: 2026-05-13
---

# Phase 30 Plan 02: Import Review UX Summary

**Review-before-save now ships as an embedded single-import flow plus dedicated ZIP candidate review route with server revalidation error return handling.**

## Performance

- **Duration:** 62 min
- **Started:** 2026-05-13T15:00:00Z
- **Completed:** 2026-05-13T16:02:00Z
- **Tasks:** 1
- **Files modified:** 11

## Accomplishments
- Added a decision-capable single-certificate review flow on the existing import page with editable fields and mandatory divergence justification.
- Added a dedicated ZIP review route/surface with per-candidate decisions (`accept|edit|ignore|reject|duplicate|pending`) and row persistence while navigating candidates.
- Extended ZIP import API to support `preview` and `review-save` modes with per-candidate server revalidation and first-error index return.
- Added `scripts/validate-import-review-ux.js` and validated anchors for single and ZIP review surfaces.

## Task Commits
1. **Task 1: Ship single+ZIP review UI with divergence reason and revalidation return behavior** - `e6abc08` (feat)
2. **Task 1 follow-up fix: remove ZIP review placeholder archive stub** - `c8f01ea` (fix)

## Files Created/Modified
- `scripts/validate-import-review-ux.js` - Validates review UX anchors for single and ZIP flows.
- `src/app/admin/certificates/new/certificate-preview-form.tsx` - Embedded single review UI, decisions, divergence justification, and save/revalidation handling.
- `src/app/admin/certificates/new/page.tsx` - Injects review copy keys for new UI strings.
- `src/app/admin/certificates/batch/page.tsx` - Swaps direct ZIP submit for preview-to-review entry component.
- `src/app/admin/certificates/batch/batch-review-form.tsx` - ZIP preview form that stages review candidates and routes to dedicated review page.
- `src/app/admin/certificates/batch/review/page.tsx` - Dedicated ZIP review route wrapper.
- `src/app/admin/certificates/batch/batch-review-page-client.tsx` - Candidate-by-candidate ZIP review state, decisions, and save submission.
- `src/app/api/admin/certificates/import-zip/route.ts` - Adds preview/review-save modes and server revalidation error return payload.
- `src/app/admin/certificates/import-runs/[runId]/page.tsx` - Displays review outcome/save handoff context banners.
- `src/i18n/index.ts` - Adds review decision/safety/error copy keys.
- `src/inventory/certificate-admin.ts` - Adds `previewCertificateZip` helper for candidate snapshot generation.

## Decisions Made
- Kept single import on the existing route/surface to honor the UI spec lock while still forcing review payload submission before save.
- Implemented ZIP review as a dedicated route with staged client state and server-side final validation, instead of direct archive commit.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed placeholder archive stub from ZIP review save**
- **Found during:** Task 1 verification stub scan
- **Issue:** ZIP review save used a synthetic placeholder file to satisfy route requirements.
- **Fix:** Updated API route so `review-save` mode consumes only `reviewPayload`; removed client placeholder file injection.
- **Files modified:** `src/app/api/admin/certificates/import-zip/route.ts`, `src/app/admin/certificates/batch/batch-review-page-client.tsx`
- **Verification:** `node scripts/validate-import-review-ux.js`, `npm run typecheck`, `npm run quality`
- **Committed in:** `c8f01ea`

---
**Total deviations:** 1 auto-fixed (Rule 1)
**Impact on plan:** Safety and correctness improved without scope expansion.

## Issues Encountered
- Initial typecheck failed on missing `Panel` children and invalid `ActionButton` props; fixed inline before final verification.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Review-first policy is now visible and operable for single and ZIP origins.
- Remaining Phase 30 work can focus on trust-list-derived review UX parity and reporting polish.

## Self-Check: PENDING

## Self-Check: PASSED
- Found summary file and both task commits (e6abc08, c8f01ea).
