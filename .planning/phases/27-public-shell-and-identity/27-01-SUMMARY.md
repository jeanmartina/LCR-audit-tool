---
phase: 27-public-shell-and-identity
plan: 01
subsystem: ui
tags: [nextjs, app-router, auth, i18n, branding]
requires:
  - phase: 26
    provides: public-facing runtime context and app-wide theme/language helpers
provides:
  - shared public shell design for `/` and `/auth`
  - direct login entry with enabled-provider-only visibility
  - compact top-left locale selector guidance for the public shell
affects:
  - phase 28
  - phase 31
  - phase 33
requirements-completed: [UI-01]
duration: implementation + validation
completed: 2026-05-10
---

# Phase 27: Public Shell and Identity Summary

Shared public-shell implementation for `/` and `/auth`, with direct login visibility, enabled-provider-only public entry, and a compact top-left locale selector.

## Performance

- **Duration:** implementation + validation
- **Started:** 2026-05-09T21:39:26-0300
- **Completed:** 2026-05-10T01:10:06.060Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Created a reusable shared public shell for the root landing page and auth page.
- Preserved direct local username/password login on `/auth`.
- Filtered public identity providers down to enabled deployments only.
- Removed callback URLs and other operator-only provider diagnostics from the public shell.
- Added the authenticated redirect guard to `/auth` so signed-in users leave the public entry.
- Refreshed public-entry copy to make the product front door feel official and non-technical.

## Files Created/Modified

- `src/components/public-shell.tsx` - shared public shell composition for `/` and `/auth`
- `src/app/page.tsx` - official landing page using the shared shell
- `src/app/auth/page.tsx` - direct login page with visible local credentials form
- `src/i18n/index.ts` - refreshed public-entry copy in English, pt-BR, and es
- `.planning/STATE.md` - phase status updated to ready/executed state

## Decisions Applied

- Use one shared public shell for `/` and `/auth` instead of duplicating login chrome.
- Keep the login form visible directly on `/auth`.
- Filter public identity providers to enabled deployments only.
- Place the locale selector in the top-left shell chrome.
- Preserve authenticated-user redirect behavior away from the public entry.

## Deviations from Plan

None. The implementation followed the planed shell composition and public-entry filtering strategy.

## Validation

- `npm run typecheck`
- `npm run build`
- `node scripts/validate-all.js`

## Next Phase Readiness

Phase 27 is complete and ready for the next milestone phase.

---
*Phase: 27-public-shell-and-identity*
*Completed: 2026-05-10*
