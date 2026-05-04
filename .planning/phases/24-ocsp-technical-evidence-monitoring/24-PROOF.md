# Phase 24 Proof - OCSP Technical Evidence Monitoring

## Requirement Checklist

- `OCSP-01` - real DER OCSP request generation exists when issuer context is available.
  - Implemented in `src/monitoring-sources/ocsp.ts` through `buildOcspRequestDer`, PKIjs certificate parsing, issuer lookup, and `checkOcspSource`.
  - Worker scheduling is implemented in `src/monitoring-sources/worker.ts` and wired by `scripts/run-worker.js`.
- `OCSP-02` - missing issuer or target context is explicit and not misleading.
  - Implemented in `src/monitoring-sources/ocsp.ts` with `certificate-not-found`, `issuer-certificate-not-found`, `source-not-ocsp`, and `ocsp-source-not-discovered` mapped to `not_checkable` events.
- `OCSP-03` - raw request/response evidence is retained for future validation.
  - Implemented in `src/storage/runtime-store.ts` tables `ocsp_check_events` and `ocsp_response_evidence`, with request/response bytes, SHA-256 hashes, HTTP metadata, issuer provenance, and parse metadata.
- `OCSP-04` - semantic OCSP status is not represented as product health.
  - Implemented in `src/monitoring-sources/ocsp-types.ts` with technical statuses only: `available`, `unavailable`, `blocked`, `oversized`, `malformed`, and `not_checkable`.
  - Guarded by `scripts/validate-ocsp-monitoring.js` forbidden semantic-status checks.

## Validation Commands

- `node scripts/validate-ocsp-monitoring.js`
- `node scripts/validate-all.js`
- `npm run typecheck`
- `npm run build`

## Scope Boundary

Phase 24 captures technical OCSP evidence only. Semantic OCSP signature validation, response status interpretation, freshness evaluation, reporting UI, and manual OCSP source entry remain out of scope for this milestone.

## Evidence Files

- `src/monitoring-sources/ocsp.ts`
- `src/monitoring-sources/ocsp-types.ts`
- `src/monitoring-sources/fetch-safety.ts`
- `src/monitoring-sources/worker.ts`
- `src/storage/runtime-store.ts`
- `scripts/validate-ocsp-monitoring.js`
- `.env.example`
- `compose.yaml`
- `README.md`
- `docs/operators.md`
