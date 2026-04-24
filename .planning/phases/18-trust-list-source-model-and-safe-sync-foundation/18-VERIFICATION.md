---
phase: 18
status: passed
verified: 2026-04-23
requirements:
  - TSL-01
  - TSL-02
  - TSL-03
  - TSL-04
  - OPS-04
  - OPS-05
---

# Phase 18 Verification: Trust-List Source Model and Safe Sync Foundation

## Verdict

PASSED - Phase 18 goal is achieved.

## Requirement Verification

- [x] `TSL-01`: platform operators can register trust-list URL sources through the admin domain/API surface, and source creation is wired into the shipped admin route.
- [x] `TSL-02`: accepted snapshots persist trust-list metadata including sequence number, territory, issue date, next update, and digest.
- [x] `TSL-03`: unsigned or invalidly signed XML is blocked by the XMLDSig gate before snapshot acceptance or certificate import.
- [x] `TSL-04`: validated extracted certificates flow through the existing certificate-first import pipeline rather than a parallel inventory model.
- [x] `OPS-04`: every sync attempt is persisted as a trust-list sync run with status and failure metadata, preserving auditability.
- [x] `OPS-05`: the packaged worker invokes trust-list sync from Node-based runtime code and does not depend on undeclared host XML tooling.

## Automated Checks

Passed:

```bash
node scripts/validate-trust-list-foundation.js
node scripts/validate-all.js
npm run typecheck
npm run build
```

## Implementation Evidence

- `src/storage/runtime-store.ts` defines trust-list source, snapshot, sync-run, and extracted-certificate persistence plus helper functions used by the sync layer.
- `src/trust-lists/parser.ts` extracts trust-list metadata and certificate candidates while computing SHA-256 digests for XML and PEM payloads.
- `src/trust-lists/xmldsig.ts` enforces XMLDSig validation and returns explicit reasons such as `xml-signature-missing`.
- `src/trust-lists/sync.ts` rejects non-HTTPS sources, applies fetch timeout control, validates XMLDSig before accepting snapshots, records failure reasons, and imports validated certificates through `importCertificate`.
- `src/trust-lists/admin.ts`, `src/app/api/admin/trust-lists/route.ts`, and `src/app/api/admin/trust-lists/[sourceId]/sync/route.ts` expose the operator/admin registration and manual sync-now surface.
- `scripts/run-worker.js` invokes `syncEnabledTrustListSources`, proving the packaged worker owns the trust-list sync cycle.

## Security And Operations Notes

- Invalid XML/signature input fails closed before mutating accepted snapshot state.
- Failed syncs are recorded with failure reason and do not replace the last accepted snapshot.
- The import path stays inside the existing certificate-first administration pipeline, avoiding a second inventory model.

## Residual Manual UAT

Recommended on Docker or staging when closing the milestone:

1. Register a valid HTTPS ETSI trust-list source and confirm a sync run plus accepted snapshot are created.
2. Re-run with malformed or unsigned XML and confirm the run fails while the previous accepted snapshot remains unchanged.
3. Confirm imported trust-list certificates appear through the existing certificate administration flow.
4. Start the packaged worker and confirm trust-list sync cycles run without host-level XML utilities.
