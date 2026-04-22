# Phase 18 Plan Check

**Checked:** 2026-04-22
**Verdict:** PASSED

## Scope Fit

| Requirement | Covered By | Notes |
|-------------|------------|-------|
| TSL-01 | 18-01 data model, 18-02 admin UI/API | Platform admin can register URL sources. |
| TSL-02 | 18-01 parser/snapshot model | Metadata persisted: territory, sequence, issue date, next update, digest. |
| TSL-03 | 18-01 XMLDSig gate, sync failure semantics | Extracted data cannot affect inventory before signature validation. |
| TSL-04 | 18-01 initial certificate import | User explicitly pulled initial import into Phase 18; Phase 19 keeps reimport/provenance hardening. |
| OPS-04 | 18-01 sync runs | Every attempt records success/failure and reasons. |
| OPS-05 | 18-01 dependencies, 18-02 worker | Docker runtime owns parser/signature deps and worker integration. |

## Quality Gates

- Plans have explicit read-first files and acceptance criteria.
- XMLDSig validation is blocking before snapshot acceptance/import.
- Failed sync policy is explicit: no replacement/deletion of last valid state.
- Trust-list imports extend the certificate-first pipeline instead of creating a second inventory model.
- UI plan uses Phase 16 primitives and field-level hints.
- Worker plan preserves separate web/worker Docker topology.

## Risks Accepted

- `xml-crypto` integration may require implementation-time adjustment for ETSI signatures; the plan mitigates this with a dedicated validator and explicit failure behavior.
- Phase 18 imports an initial subset of supported certificates but does not claim robust cross-run change detection, duplicate handling, or full provenance. Those remain Phase 19.
- XMLDSig cryptographic validation is not equivalent to complete legal/eIDAS trust-policy validation. UI and docs must avoid overclaiming.

## Result

The plans are executable and aligned with the user's decisions: ETSI XML best-effort support, mandatory XMLDSig validation, initial import in Phase 18, manual sync-now plus worker-ready sync, and failure-safe snapshot preservation.
