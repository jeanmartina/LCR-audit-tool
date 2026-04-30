# Plan 22-02 Summary: X.509 Extension Parser and Source Derivation

**Status:** Complete  
**Completed:** 2026-04-30

## Dependency Evaluation

- Checked current registry versions: `@peculiar/x509` 2.0.0, `pkijs` 3.4.0, `asn1js` 3.0.10, `@peculiar/asn1-x509` 2.6.1.
- Installed the smallest selected dependency, `@peculiar/x509`, while keeping parsing local and build-safe with Node certificate parsing plus a constrained DER extension decoder.

## Changes

- Added `deriveMonitoringSourceCandidatesFromCertificate()` for AIA OCSP and Certificate Policies CPS URI source derivation.
- Added explicit `not_discovered` candidates for missing OCSP/document metadata.
- Added `not_checkable` candidates for parse failures instead of failing imports.
- Added `deriveAndUpsertMonitoringSourcesForCertificate()` service for the next integration plan.
- Extended the Phase 22 validator to assert parser literals, selected package dependency, and no network fetch/request boundary.

## Verification

- `node scripts/validate-derived-monitoring-sources.js`
- `npm run typecheck`
