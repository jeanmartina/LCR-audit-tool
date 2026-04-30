# Plan 22-01 Summary: Monitoring Source Storage and Identity Model

**Status:** Complete  
**Completed:** 2026-04-30

## Changes

- Added monitoring-source domain types for source type, lifecycle state, policy document role, provenance input, and persisted record shape.
- Added URL normalization and deterministic `msrc-*` source-key generation based on fingerprint, source type, normalized URL, document role, and policy OID.
- Added `monitoring_sources` runtime schema with inline trust-list provenance columns and unique `source_key` identity.
- Added runtime-store helpers to upsert, list, list by certificate, and find by source key.
- Added `scripts/validate-derived-monitoring-sources.js` and wired it into `scripts/validate-all.js`.

## Verification

- `node scripts/validate-derived-monitoring-sources.js`
- `npm run typecheck`
