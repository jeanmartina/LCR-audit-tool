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
duration: 0min
completed: 2026-05-09
---

# Phase 27: Public Shell and Identity Summary

Shared public-shell planning for `/` and `/auth`, with direct login visibility, enabled-provider-only public entry, and a compact top-left locale selector.

## Performance

- **Duration:** planning only
- **Started:** 2026-05-09T21:39:26-0300
- **Completed:** 2026-05-09T21:39:26-0300
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Defined a shared public shell for the root landing page and auth page.
- Preserved direct local username/password login on `/auth`.
- Locked public identity-provider visibility to enabled providers only.

## Files Created/Modified

- `.planning/phases/27-public-shell-and-identity/27-CONTEXT.md` - user decisions captured for the phase
- `.planning/phases/27-public-shell-and-identity/27-RESEARCH.md` - implementation research and stack guidance
- `.planning/phases/27-public-shell-and-identity/27-01-PLAN.md` - executable plan for Phase 27

## Decisions Made

- Use one shared public shell for `/` and `/auth` instead of duplicating login chrome.
- Keep the login form visible directly on `/auth`.
- Filter public identity providers to enabled deployments only.
- Place the locale selector in the top-left shell chrome.
- Preserve authenticated-user redirect behavior away from the public entry.

## Deviations from Plan

None - planning completed as written.

## Issues Encountered

- The phase did not have a pre-existing `CONTEXT.md`, so discussion was required before planning.
- Research returned the current entry split and confirmed the shared-shell approach.

## Next Phase Readiness

Phase 27 is ready for execution. The plan is scoped to the shared public shell, direct login visibility, enabled-provider filtering, and the official entry treatment for the public routes.

---
*Phase: 27-public-shell-and-identity*
*Completed: 2026-05-09*
