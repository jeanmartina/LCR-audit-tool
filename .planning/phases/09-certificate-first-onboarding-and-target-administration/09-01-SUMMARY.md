---
phase: 09-certificate-first-onboarding-and-target-administration
plan: 01
subsystem: onboarding-admin
tags: [certificates, import, admin-ui, group-overrides]
requires:
  - phase: 08-identity-invitations-and-access-foundation
    provides: invitation-only auth and backend permission enforcement
provides:
  - certificate-centric persistence and runtime projection for derived CRLs
  - single-certificate and zip-based onboarding with fingerprint deduplication
  - admin UI for certificate list, detail, update, template clone, ignored URLs, and batch import entry
affects: [runtime, authz, admin-ui, inventory]
key-files:
  created:
    - src/inventory/certificate-admin.ts
    - src/app/admin/certificates/page.tsx
    - src/app/admin/certificates/new/page.tsx
    - src/app/admin/certificates/batch/page.tsx
    - src/app/admin/certificates/[certificateId]/page.tsx
    - src/app/api/admin/certificates/import/route.ts
    - src/app/api/admin/certificates/import-zip/route.ts
    - src/app/api/admin/certificates/[certificateId]/ignore-url/route.ts
    - src/app/api/admin/certificates/[certificateId]/update/route.ts
    - src/app/api/admin/certificates/[certificateId]/template/route.ts
    - src/app/api/admin/certificates/[certificateId]/manual-check/route.ts
    - scripts/validate-onboarding-admin.js
  modified:
    - src/storage/runtime-store.ts
    - scripts/validate-all.js
    - .planning/PROJECT.md
    - .planning/ROADMAP.md
    - .planning/REQUIREMENTS.md
    - .planning/STATE.md
completed: 2026-04-07
---

# Phase 9: Certificate-First Onboarding and Target Administration Summary

## Outcome

- Added certificate-centric persistence for certificates, import runs/items, derived CRL links, certificate-group sharing, group-specific overrides, change history, and templates in `src/storage/runtime-store.ts`.
- Added a certificate admin service layer in `src/inventory/certificate-admin.ts` to fingerprint certificates, derive CRL URLs, deduplicate runtime CRL execution, and project shared runtime targets without widening group visibility.
- Added operator-facing admin surfaces for certificate listing, single import, separate batch `.zip` import, certificate detail, ignored derived URLs, template cloning, manual connectivity-check logging, and administrative updates under `src/app/admin/certificates/`.
- Added admin route handlers for single import, batch import, update, ignore-url toggling, template creation, and manual check recording under `src/app/api/admin/certificates/`.
- Added `scripts/validate-onboarding-admin.js` and wired it into the project-wide validation suite.

## Validation Run

- `node scripts/validate-onboarding-admin.js schema`
- `node scripts/validate-onboarding-admin.js import`
- `node scripts/validate-onboarding-admin.js ui`
- `node scripts/validate-all.js`
- `npm run typecheck`
- `npm run build`

## Residual Notes

- Batch `.zip` import currently depends on the `unzip` binary being available in the runtime environment.
- CRL derivation currently uses URL extraction from decoded certificate bytes; this is practical for Phase 9 but not yet a full ASN.1-aware parsing pipeline.
