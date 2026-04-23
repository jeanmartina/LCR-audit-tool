# Phase 19 Validation Strategy: Trust-List Certificate Projection and Reimport

**Date:** 2026-04-22
**Status:** Ready for execution

## Validation Objective

Prove that trust-list certificates are projected into certificate-first inventory with stable change detection, no duplicate unchanged imports, and durable provenance from reporting/admin records back to source, snapshot, sync run, and extracted item.

## Automated Checks

Add `scripts/validate-trust-list-projection.js` and wire it into `scripts/validate-all.js`.

Required checks:

1. `src/storage/runtime-store.ts` includes `trust_list_certificate_projections` schema.
2. Runtime store exports projection helpers for latest projection lookup and projection outcome recording.
3. `src/trust-lists/types.ts` includes candidate key/digest/provenance fields.
4. `src/trust-lists/sync.ts` computes candidate keys/digests.
5. `src/trust-lists/sync.ts` checks latest projection before calling `importCertificate`.
6. `src/trust-lists/sync.ts` records source ID, snapshot ID, run ID, extracted item ID, certificate ID, fingerprint, and status.
7. Existing XMLDSig blocking validation remains present before snapshot/projection.
8. Admin source/run and certificate-detail surfaces expose trust-list provenance labels/metadata.
9. i18n validation covers new provenance copy in `en`, `pt-BR`, and `es`.
10. `npm run build`, `npm run typecheck`, and `node scripts/validate-all.js` pass.

## Manual/UAT Checks

- Register a trust-list source and sync a valid signed test fixture.
- Sync the same signed fixture again and confirm unchanged candidates are skipped, not duplicated.
- Change a candidate PEM in a signed fixture and confirm only affected projection reimports/updates.
- Confirm trust-list-derived certificate detail shows source label/URL, snapshot sequence/digest, run ID, and projection status.
- Confirm manual/ZIP imports still work and do not require trust-list provenance.

## Failure Conditions

- If unchanged trust-list candidates call `importCertificate` repeatedly, Phase 19 fails.
- If a trust-list-derived certificate lacks source/snapshot/run provenance, Phase 19 fails.
- If admin/certificate-detail surfaces cannot distinguish trust-list-derived assets from manual/ZIP assets, Phase 19 fails.
- If XMLDSig-invalid XML can project/import certificates, Phase 19 fails.
