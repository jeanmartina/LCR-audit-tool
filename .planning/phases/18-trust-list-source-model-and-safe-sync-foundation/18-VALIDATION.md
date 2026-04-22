# Phase 18 Validation Strategy: Trust-List Source Model and Safe Sync Foundation

**Date:** 2026-04-22
**Status:** Ready for execution

## Validation Objective

Prove that trust-list sources can be registered, fetched, XMLDSig-validated, snapshotted, audited, initially imported, and run from the packaged worker without undeclared host dependencies.

## Automated Checks

Add `scripts/validate-trust-list-foundation.js` and wire it into `scripts/validate-all.js`.

The validator must assert:

1. `package.json` contains `@xmldom/xmldom`, `xpath`, and `xml-crypto`.
2. `src/storage/runtime-store.ts` contains schemas/helpers for:
   - `trust_list_sources`
   - `trust_list_snapshots`
   - `trust_list_sync_runs`
   - `trust_list_extracted_certificates`
3. `src/trust-lists/parser.ts` exists and extracts `sequenceNumber`, `territory`, `issueDate`, `nextUpdate`, and `x509Certificates`.
4. `src/trust-lists/xmldsig.ts` exists and uses `xml-crypto` to validate XMLDSig.
5. `src/trust-lists/sync.ts` blocks import when XMLDSig validation fails.
6. `src/trust-lists/sync.ts` calls the existing certificate-first import pipeline for validated extracted certificates.
7. API/admin source routes use `assertPlatformAdmin`.
8. `scripts/run-worker.js` invokes trust-list sync cycle.
9. Browser/admin UI uses Phase 16 primitives and localized copy.
10. `compose.yaml` still defines the worker and does not require external XML tooling.

## Manual/UAT Checks

1. Register an HTTPS ETSI trust-list source with group IDs.
2. Trigger sync now.
3. Confirm a sync run is persisted.
4. Confirm invalid XML/signature creates failed run and does not replace last accepted snapshot.
5. Confirm valid XMLDSig snapshot is accepted and extracted certificate items are recorded/imported.
6. Start Docker worker and confirm the trust-list sync cycle runs without missing host tools.

## Command Gate

Execution must pass:

```bash
node scripts/validate-trust-list-foundation.js
node scripts/validate-all.js
npm run typecheck
npm run build
```

## Failure Policy

- If unsigned or XMLDSig-invalid XML can import certificates, Phase 18 fails.
- If failed sync replaces the last accepted snapshot, Phase 18 fails.
- If worker requires a host command/package outside Node dependencies, Phase 18 fails.
