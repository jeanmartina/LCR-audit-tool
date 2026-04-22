---
phase: 17
status: passed
verified: 2026-04-21
requirements:
  - UX-02
  - UX-03
  - UX-05
---

# Phase 17 Verification: First-Run Bootstrap and Certificate/ZIP Onboarding UX

## Verdict

PASSED — Phase 17 goal is achieved.

## Requirement Verification

- [x] UX-02: Single certificate onboarding now has a guided UI and real preview via `previewCertificateImport` plus `/api/admin/certificates/import/preview`.
- [x] UX-03: ZIP onboarding now uses guided UI and redirects browser users to `/admin/certificates/import-runs/[runId]` with summary/per-file results.
- [x] UX-05: Fresh deployment bootstrap is available through `/setup` and closes after the first platform admin exists.

## Automated Checks

Passed:

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

## Security Check

- Bootstrap API refuses after a platform admin exists and does not derive redirects from `request.url`.
- Preview helper does not mutate certificate/import state.
- Commit routes re-parse uploaded content server-side.
- Import browser redirects use relative `Location` headers.

## Residual Manual UAT

Recommended on Docker/staging before milestone closure:

1. Fresh database: visit `/setup`, create first admin, confirm redirect to `/settings?firstRun=complete` and authenticated session.
2. Existing admin: revisit `/setup`, confirm setup is closed.
3. Single certificate: preview PEM/DER certificate and confirm fingerprint/derived CRLs display before import.
4. ZIP: upload a mixed valid/invalid ZIP and confirm result page shows partial failure details.
