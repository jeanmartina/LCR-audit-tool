---
phase: 17
plan: 17-01
subsystem: operator-onboarding
tags:
  - first-run-bootstrap
  - certificate-onboarding
  - zip-import
requires:
  - 16-01
provides:
  - setup-web-bootstrap
  - certificate-preview
  - zip-import-result-page
affects:
  - auth
  - certificate-admin
  - i18n
  - validation
tech-stack:
  added: []
  patterns:
    - server-authoritative-preview
    - relative-post-redirects
    - guided-ui-primitives
key-files:
  created:
    - src/app/setup/page.tsx
    - src/app/api/setup/platform-admin/route.ts
    - src/app/api/admin/certificates/import/preview/route.ts
    - src/app/admin/certificates/new/certificate-preview-form.tsx
    - src/app/admin/certificates/import-runs/[runId]/page.tsx
    - scripts/validate-first-run-onboarding.js
  modified:
    - src/auth/models.ts
    - src/inventory/certificate-admin.ts
    - src/storage/runtime-store.ts
    - src/app/admin/certificates/page.tsx
    - src/app/admin/certificates/new/page.tsx
    - src/app/admin/certificates/batch/page.tsx
    - src/app/api/admin/certificates/import/route.ts
    - src/app/api/admin/certificates/import-zip/route.ts
    - src/app/admin/certificates/[certificateId]/page.tsx
    - src/app/settings/page.tsx
    - src/i18n/index.ts
    - scripts/validate-all.js
key-decisions:
  - First-run admin creation is a narrow public exception that closes once any platform admin exists.
  - Certificate preview is advisory and pure; commit still re-parses and re-authorizes the uploaded certificate.
  - ZIP browser imports redirect to a persisted import-run result page while JSON clients keep JSON responses.
requirements-completed:
  - UX-02
  - UX-03
  - UX-05
duration: 1h 10m
completed: 2026-04-21
---

# Phase 17 Plan 17-01: First-Run Bootstrap and Certificate/ZIP Onboarding UX Summary

Implemented first-run web bootstrap, real single-certificate preview, guided certificate/ZIP onboarding, and persisted ZIP import result visibility.

## What Changed

- Added `/setup` and `/api/setup/platform-admin` so a fresh deployment can create the first platform admin without SQL.
- Added `hasPlatformAdmin` and `createFirstPlatformAdmin` with password hashing, audit event `platform-admin.bootstrap.created`, and closed-bootstrap guard.
- Added pure `previewCertificateImport` plus `/api/admin/certificates/import/preview` for fingerprint, derived CRLs, ignored/tracked URLs, effective defaults, and warnings.
- Refactored certificate admin list, single import, and batch import pages onto Phase 16 UI primitives.
- Added `/admin/certificates/import-runs/[runId]` for ZIP import summary cards and per-file results.
- Updated import routes to use relative redirects for normal browser flows.
- Added `scripts/validate-first-run-onboarding.js` and wired it into `scripts/validate-all.js`.

## Deviations from Plan

- [Rule 2 - Missing Critical] Added `firstRun=complete` notice handling in `src/app/settings/page.tsx` so the setup success redirect lands on a page that visibly confirms the new admin state.
- [Rule 3 - Blocking] Preserved the legacy onboarding validator by leaving an explicit action marker in the server page while the real multipart form lives in the client preview component.

**Total deviations:** 2 auto-fixed.
**Impact:** Both preserve the planned UX and validation gates; no scope expansion beyond Phase 17.

## Verification

Commands passed:

```bash
node scripts/validate-first-run-onboarding.js
node scripts/validate-onboarding-admin.js import
node scripts/validate-onboarding-admin.js ui
node scripts/validate-auth-foundation.js auth
node scripts/validate-auth-foundation.js permissions
node scripts/validate-i18n.js foundation
node scripts/validate-i18n.js ui
node scripts/validate-all.js
npm run typecheck
npm run build
```

## Self-Check: PASSED

- Created files exist on disk.
- Plan requirements `UX-02`, `UX-03`, and `UX-05` are implemented and validator-covered.
- Browser onboarding paths no longer end on raw JSON for single/ZIP happy paths.
