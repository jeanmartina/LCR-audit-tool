# Phase 19 Research: Trust-List Certificate Projection and Reimport

**Date:** 2026-04-22
**Phase:** 19 - Trust-List Certificate Projection and Reimport
**Requirements:** TSL-04 hardening, TSL-05, TSL-07

## Planning Question

How should the project harden Phase 18's trust-list import so validated certificates are projected into certificate-first inventory without duplicating unchanged assets, while preserving durable provenance back to source, snapshot, run, and extracted item?

## Current Implementation Baseline

Phase 18 added:

- `trust_list_sources` with label, URL, enabled flag, and group IDs.
- `trust_list_snapshots` with digest, sequence, territory, issue/next-update, XML size, and certificate count.
- `trust_list_sync_runs` with status, metadata, failure reason, and imported/skipped/failed counters.
- `trust_list_extracted_certificates` with source/snapshot/run, fingerprint, PEM, imported certificate ID, status, and failure reason.
- `syncTrustListSource()` that accepts XML only after XMLDSig validation and then calls `importCertificate(..., "trust-list")`.

Gaps for Phase 19:

- No cross-run unchanged detection before `importCertificate`.
- No durable certificate-to-trust-list provenance read model beyond extracted item rows.
- No reporting/admin provenance details beyond source type `trust-list` and snapshot metadata in source list.
- Per-certificate import uses display name by ordinal, which can change noisily across snapshots.

## Recommended Data Model

Add a projection/provenance table rather than overloading tags:

- `trust_list_certificate_projections`
  - `id`
  - `source_id`
  - `snapshot_id`
  - `run_id`
  - `extracted_certificate_id`
  - `certificate_id`
  - `fingerprint`
  - `candidate_key`
  - `candidate_digest`
  - `source_path`
  - `sequence_number`
  - `territory`
  - `status`: `imported | updated | skipped | failed`
  - `change_reason`: `new-fingerprint | changed-candidate | unchanged | import-failed | duplicate-in-run`
  - `created_at`

Why a table:

- Keeps certificate-first inventory intact.
- Allows many trust-list sources/snapshots to point to one certificate asset.
- Makes reporting provenance queryable without parsing JSON summaries.
- Supports future Phase 20 change summaries and recovery guidance.

## Change Detection Strategy

Use two levels:

1. **Inventory identity:** certificate fingerprint maps to one `certificates` row, consistent with existing certificate-first behavior.
2. **Projection identity:** `candidate_key = source_id + fingerprint + source_path-or-ordinal`, with `candidate_digest = sha256(pem + source_path + source metadata relevant to projection)`.

Algorithm:

- For every candidate in a validated snapshot:
  - Compute fingerprint.
  - Compute candidate key/digest.
  - Find the latest successful projection for the same `source_id` + `fingerprint` + `candidate_key`.
  - If latest digest matches and linked certificate still exists, record a skipped projection and do not call `importCertificate`.
  - If no prior projection, import as new projection.
  - If digest changed, call `importCertificate` and record `updated` or `imported` depending on certificate pipeline result.
- Within a single run, duplicate fingerprints should still be skipped unless source path makes a meaningful separate projection. The pragmatic default is fingerprint de-duplication within a run.

## Provenance Surface Strategy

Minimum Phase 19 UI/reporting exposure:

- Certificate admin/detail: show source type `trust-list`, trust-list source label/URL, latest snapshot sequence/territory/digest, latest run ID, and projection status.
- Trust-list admin source table: add change/import summary for latest successful run with imported/updated/skipped/failed counts and failure reasons.
- Reporting row/read model: expose provenance fields or a provenance label so users can distinguish manual/ZIP/trust-list-derived assets.
- Filter options already include source type; Phase 19 should make the display/copy explicit and avoid relying only on raw `trust-list` value.

## Validation Architecture

Extend `scripts/validate-trust-list-foundation.js` or add `scripts/validate-trust-list-projection.js` to assert:

- Projection table/schema exists.
- Projection helpers exist for finding latest projection and recording projection outcomes.
- Sync computes candidate keys/digests.
- Sync skips unchanged candidates before calling `importCertificate`.
- Sync records provenance with source/snapshot/run/extracted/certificate IDs.
- Admin/reporting surfaces include trust-list provenance labels.
- Phase 18 XMLDSig gate remains present.
- `node scripts/validate-all.js` includes the projection validator.

## Threat Model

| Risk | Mitigation |
|------|------------|
| Duplicate unchanged assets bloat inventory | Fingerprint identity plus projection digest skip before import. |
| Lost provenance for reimported certificates | Dedicated projection records linked to certificate/source/snapshot/run/extracted item. |
| False confidence from raw source type only | UI/reporting surfaces show source URL/sequence/digest/run where available. |
| Invalid XML mutates inventory | Preserve Phase 18 XMLDSig gate before projection. |
| Failed item masks successful snapshot | Keep item-level failure status and counts separate from snapshot acceptance. |
| Breaking manual/ZIP imports | Keep source-specific logic inside trust-list sync/projection helpers; do not alter non-trust-list import behavior beyond optional read-only provenance display. |

## Recommended Plan Split

1. **19-01 Projection Model and Change Detection** — schema, helpers, candidate key/digest, sync reimport/skip logic, validator foundation.
2. **19-02 Provenance Surfaces and Final Validation** — admin/reporting provenance read models, i18n/UI copy, validator integration, final build/typecheck/validate-all.
