# Phase 17 Validation Strategy: First-Run Bootstrap and Certificate/ZIP Onboarding UX

**Date:** 2026-04-20
**Status:** Ready for execution

## Validation Objective

Prove that Phase 17 removes manual bootstrap and raw onboarding friction without weakening authentication, authorization, or certificate import safety.

## Required Automated Checks

Add `scripts/validate-first-run-onboarding.js` and wire it into `scripts/validate-all.js`.

The validator must assert:

1. `src/app/setup/page.tsx` exists.
2. `src/app/api/setup/platform-admin/route.ts` exists.
3. The setup API references:
   - `hashPassword`
   - `createSession`
   - `SESSION_COOKIE_NAME`
   - `platform-admin`
   - a no-existing-platform-admin guard such as `hasPlatformAdmin` or equivalent runtime-store query
   - `Location: "/` relative redirect syntax
4. The setup page uses shared UI primitives from `src/components/ui/primitives.tsx`.
5. `src/app/admin/certificates/new/page.tsx` uses shared primitives and contains preview UI copy keys.
6. `src/app/api/admin/certificates/import/preview/route.ts` or an equivalent preview endpoint exists.
7. `src/inventory/certificate-admin.ts` exposes a pure preview helper that derives fingerprint and CRL URLs without creating an import run.
8. `src/app/admin/certificates/batch/page.tsx` uses shared primitives and does not leave raw JSON as the operator result.
9. `src/app/admin/certificates/import-runs/[runId]/page.tsx` exists and renders persisted import item results.
10. `src/app/api/admin/certificates/import-zip/route.ts` redirects or otherwise links browser form submissions to an import-run result surface.
11. New i18n keys exist in all three locales.

## Manual/UAT Checks

A human should verify:

1. Fresh database: visit `/setup`, create `admin@example.test`, and confirm redirect creates a logged-in platform admin session.
2. Existing admin: revisit `/setup` and confirm it no longer allows a second bootstrap admin.
3. Single certificate: choose a PEM or DER certificate and confirm preview shows fingerprint and derived CRLs before import.
4. Single certificate with no CRLs: preview shows a warning and still explains the outcome.
5. ZIP: upload a ZIP containing at least one valid and one invalid certificate file; result page shows partial success and failed item detail.
6. Browser form submissions do not end on raw JSON.

## Command Gate

Execution must pass:

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

## Failure Policy

- If first-run bootstrap can create an admin after a platform admin already exists, Phase 17 fails.
- If preview mutates certificate/import tables, Phase 17 fails.
- If ZIP browser onboarding ends on raw JSON, Phase 17 fails.
- If group authorization is bypassed in preview or commit, Phase 17 fails.
