---
phase: 19
plan: 19-01
subsystem: trust-list-projection-core
tags:
  - trust-lists
  - runtime-store
  - provenance
requires:
  - 18-02
provides:
  - trust-list projection persistence
  - stable candidate key and digest computation
  - unchanged trust-list candidate skip-before-import
  - projection outcome audit records
affects:
  - src/storage/runtime-store.ts
  - src/trust-lists/types.ts
  - src/trust-lists/sync.ts
  - scripts/validate-trust-list-projection.js
  - scripts/validate-all.js
tech-stack:
  added: []
  patterns:
    - certificate-first projection records
    - source/fingerprint/candidate-key change detection
    - XMLDSig-before-projection gate
key-files:
  created:
    - scripts/validate-trust-list-projection.js
  modified:
    - src/storage/runtime-store.ts
    - src/trust-lists/types.ts
    - src/trust-lists/sync.ts
    - scripts/validate-all.js
key-decisions:
  - Certificate fingerprint remains the inventory identity.
  - Candidate key and digest determine source-scoped projection changes.
  - Unchanged candidates are recorded as skipped unchanged and do not call importCertificate.
  - Duplicate fingerprints within a run are recorded as skipped duplicate projections.
requirements-completed:
  - TSL-04
  - TSL-05
  - TSL-07
duration: 35 min
completed: 2026-04-23
---

# Phase 19 Plan 19-01: Trust-List Projection Model and Change Detection Summary

Implemented the trust-list projection core: persistence schema/helpers, candidate key/digest computation, cross-run unchanged detection, duplicate-in-run projection outcomes, and validator coverage.

## Execution

- **Start:** 2026-04-23T12:20:00Z
- **End:** 2026-04-23T12:55:00Z
- **Duration:** 35 min
- **Tasks completed:** 5/5
- **Files changed:** 5
- **Code commit:** `de55b21`

## What Changed

- Added `trust_list_certificate_projections` schema, cache, row mapping, and runtime helpers.
- Added `TrustListProjectionCandidate` typing for `candidateKey` and `candidateDigest`.
- Updated `syncTrustListSource()` to compute candidate keys/digests after XMLDSig-accepted snapshots.
- Added skip-before-import for unchanged source/fingerprint/candidate projections.
- Recorded projection rows for imported, updated, skipped unchanged, duplicate-in-run, and failed outcomes.
- Added `scripts/validate-trust-list-projection.js` and wired it into `scripts/validate-all.js`.

## Verification

- `node scripts/validate-trust-list-projection.js` — passed
- `node scripts/validate-trust-list-foundation.js` — passed
- `npm run typecheck` — passed

## Deviations from Plan

None.

## Issues Encountered

None.

## Next Plan Readiness

Ready for `19-02`: expose projection counts and certificate-level trust-list provenance in admin UI, add i18n, and run final validation.

## Self-Check: PASSED
