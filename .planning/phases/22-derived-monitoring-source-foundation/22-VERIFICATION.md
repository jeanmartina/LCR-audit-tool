---
phase: 22
status: passed
verified_at: 2026-04-30
requirements: [SRC-05, SRC-06, SRC-07, SRC-08]
---

# Phase 22 Verification: Derived Monitoring Source Foundation

## Verdict

PASS. Phase 22 delivers the derived monitoring-source foundation for OCSP and policy-document candidates without adding network polling/fetching behavior.

## Requirement Coverage

- SRC-05: OCSP monitoring-source candidates derive from certificate AIA OCSP URLs, with explicit missing/uncheckable fallback states.
- SRC-06: Policy-document monitoring-source candidates derive from Certificate Policies CPS URI qualifiers, with room for future CP/DPC sources.
- SRC-07: Source identity is deterministic via fingerprint, source type, normalized URL, document role, and policy OID, with `source_key` uniqueness.
- SRC-08: Missing and parse-failed metadata produce `not_discovered` and `not_checkable` monitoring-source records.

## Evidence

- `src/monitoring-sources/types.ts` defines source types, lifecycle states, document roles, input provenance, and persisted record shape.
- `src/monitoring-sources/model.ts` normalizes URLs and builds deterministic `msrc-*` keys.
- `src/storage/runtime-store.ts` persists `monitoring_sources` with source-key uniqueness and inline trust-list provenance.
- `src/monitoring-sources/derive.ts` derives candidates from local certificate bytes and upserts them without fetch/request calls.
- `src/inventory/certificate-admin.ts` invokes derivation after certificate upsert.
- `src/trust-lists/sync.ts` passes trust-list source, snapshot, and run provenance into imports.

## Verification Commands

- `node scripts/validate-derived-monitoring-sources.js` — passed
- `node scripts/validate-all.js` — passed
- `npm run typecheck` — passed
- `npm run build` — passed

## Residual Scope

- Phase 22 stores derived sources only; document fetching, OCSP checks, and reporting are intentionally deferred to later v1.3 phases.
