---
phase: 19
status: passed
verified: 2026-04-24
requirements:
  - TSL-04
  - TSL-05
  - TSL-07
---

# Phase 19 Verification: Trust-List Certificate Projection and Reimport

## Verdict

PASSED - Phase 19 goal is achieved.

## Requirement Verification

- [x] `TSL-04`: trust-list-derived certificates continue to enter the existing certificate-first pipeline, now with projection records that preserve source/snapshot/run provenance.
- [x] `TSL-05`: unchanged trust-list candidates are skipped before re-import, duplicate-in-run candidates are recorded explicitly, and changed candidates re-enter import with a different change reason.
- [x] `TSL-07`: admin trust-list summaries and certificate detail pages expose trust-list provenance without requiring SQL access.

## Automated Checks

Passed:

```bash
node scripts/validate-trust-list-projection.js
node scripts/validate-i18n.js foundation
node scripts/validate-i18n.js ui
node scripts/validate-all.js
npm run typecheck
npm run build
```

## Implementation Evidence

- `src/storage/runtime-store.ts` adds `trust_list_certificate_projections` plus helpers for latest-projection lookup, projection recording, and provenance reads.
- `src/trust-lists/sync.ts` computes `candidateKey` and `candidateDigest`, checks the latest prior projection before `importCertificate`, records `unchanged`, `duplicate-in-run`, `new-fingerprint`, `changed-candidate`, and `import-failed` outcomes, and keeps XMLDSig validation ahead of snapshot/import work.
- `src/trust-lists/admin.ts` summarizes projection counts and exposes `findTrustListCertificateProvenance()` for admin surfaces.
- `src/app/admin/trust-lists/page.tsx` renders projection counters and latest projection failure context for each source.
- `src/app/admin/certificates/[certificateId]/page.tsx` renders a trust-list provenance panel with source, URL, snapshot sequence/territory/digest, run ID, projection status/change reason, and source path.
- `src/i18n/index.ts` contains the projection/provenance strings in `en`, `pt-BR`, and `es`.

## Security And Operations Notes

- XMLDSig remains the blocking integrity gate before projection/import logic runs.
- Provenance wording stays evidence-oriented and does not overclaim legal trust-policy validation.
- Reporting compatibility stays preserved because Phase 19 did not introduce enriched reporting filters or cross-group provenance leaks.

## Residual Manual UAT

Recommended on Docker or staging when closing the milestone:

1. Sync the same valid signed fixture twice and confirm the second run records `unchanged` projections without duplicating imports.
2. Change one candidate in a signed fixture, re-sync, and confirm only the affected projection is recorded as changed/reimported.
3. Open a trust-list-derived certificate detail page and confirm source, snapshot, run, and source-path provenance render correctly.
4. Confirm manual and ZIP imports still behave normally and do not require trust-list provenance.
