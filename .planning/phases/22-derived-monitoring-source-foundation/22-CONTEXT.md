# Phase 22: Derived Monitoring Source Foundation - Context

**Gathered:** 2026-04-28  
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 22 delivers the deterministic derived monitoring-source foundation for OCSP and CP/CPS/DPC document candidates tied to existing certificates and trust-list provenance. It creates the source model, derivation behavior, deduplication rules, provenance fields, and validators that later phases will use.

This phase does **not** implement document fetching/snapshot polling, OCSP responder polling, reporting UI, or manual source entry. Those are covered by later phases or future milestones.

</domain>

<decisions>
## Implementation Decisions

### Source State Model
- **D-01:** Use explicit derivation/source lifecycle states: `discovered`, `not_discovered`, `not_checkable`, and `disabled`.
- **D-02:** Do not mix future polling health into the source lifecycle state. Health states such as healthy/degraded/unavailable belong to later polling/event records in Phases 23-24.
- **D-03:** The system should be able to represent absence or incomplete checkability explicitly without failing certificate import or trust-list sync.

### Deduplication Key
- **D-04:** Deduplicate derived monitoring sources by `fingerprint + sourceType + normalizedUrl + role/policyOid`.
- **D-05:** The current `certificateId` remains provenance/parentage, not the stable source identity, so reimports of the same certificate fingerprint do not create duplicate derived sources unnecessarily.
- **D-06:** Trust-list/projection provenance should be retained, but not part of the primary deduplication key for Phase 22. This avoids duplicating the same source across origins while still preserving audit context.

### Provenance Fields
- **D-07:** Store all currently available provenance on the derived source record: `certificateId`, `fingerprint`, `sourceType`, `sourceUrl`, `trustListSourceId`, `trustListSnapshotId`, `trustListRunId`, `policyOid`, `documentRole`, and `derivationReason`.
- **D-08:** Provenance must be sufficient for future AI-assisted PKI compliance analysis, especially document snapshots linked to certificates, policy OIDs, and trust-list origin.
- **D-09:** Do not split provenance into a separate multi-origin table in Phase 22 unless implementation research shows it is necessary for correctness. Prefer one pragmatic record now and evolve later if multiple simultaneous provenances become a real requirement.

### Parser Scope
- **D-10:** Add a X.509/ASN.1 parsing library in Phase 22 if it keeps the Docker/Next.js build simple and allows reliable extraction of AIA OCSP and CPS URI values.
- **D-11:** Parser output should initially focus on metadata needed for source derivation: OCSP URL candidates, CPS/document URL candidates, policy OIDs, document roles, and derivation reasons.
- **D-12:** If a certificate cannot be parsed sufficiently or lacks relevant extensions, record `not_discovered` or `not_checkable` as appropriate instead of failing import.

### the agent's Discretion
- Exact table/function names and TypeScript module layout are left to the planning/implementation agents, as long as they respect the lifecycle, deduplication, provenance, and parser decisions above.
- The implementation agent may choose the specific X.509/ASN.1 library after checking current package compatibility and build impact.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and phase scope
- `.planning/PROJECT.md` — Current v1.3 milestone goal, constraints, and project-level decisions.
- `.planning/REQUIREMENTS.md` — Phase 22 requirements `SRC-05` through `SRC-08` and out-of-scope boundaries.
- `.planning/ROADMAP.md` — Phase 22 goal, success criteria, and sequencing with Phases 23-26.
- `.planning/research/SUMMARY.md` — Research summary for OCSP/document monitoring source expansion.
- `.planning/research/ARCHITECTURE.md` — Proposed derived monitoring-source architecture and storage direction.
- `.planning/research/STACK.md` — Stack/library considerations for X.509/ASN.1 parsing.
- `.planning/research/PITFALLS.md` — Risks around OCSP semantics, missing issuer context, SSRF, and scope creep.

### Existing implementation references
- `src/inventory/certificate-admin.ts` — Certificate import/update flow where source derivation should connect.
- `src/trust-lists/sync.ts` — Trust-list projection/import flow and existing SSRF-safe URL posture to reuse later.
- `src/storage/runtime-store.ts` — Existing Postgres schema/helper pattern for new derived-source records.
- `scripts/run-worker.js` — Existing worker topology that later phases will extend.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/inventory/certificate-admin.ts`: existing certificate fingerprint extraction, certificate upsert, group sharing, CRL derivation, and audit-event flow are the natural hook points for derived source creation.
- `src/trust-lists/sync.ts`: trust-list sync already tracks source/snapshot/run/projection data and should pass that provenance into source derivation when certificates are imported from trust lists.
- `src/storage/runtime-store.ts`: existing schema string + helper function pattern should be extended for `monitoring_sources` or equivalent tables.
- `src/trust-lists/sync.ts`: URL safety helpers added in v1.2.1 should be generalized or reused in later phases for certificate-derived URLs.

### Established Patterns
- Runtime persistence is Postgres-backed with in-memory fallback where possible.
- Source-of-truth remains certificate-first; trust-list data projects into certificate inventory rather than becoming a separate inventory.
- Import/sync failures should be explicit and auditable, not silent mutations.
- Authorization and reporting should follow parent certificate/group visibility, not independent derived-source ACLs.

### Integration Points
- Single certificate import and ZIP import should call the derivation helper after certificate parse/upsert.
- Trust-list certificate projection/import should call the same derivation helper with trust-list provenance.
- Validators should prove schema presence, derivation call sites, deduplication behavior, and explicit `not_discovered`/`not_checkable` handling.

</code_context>

<specifics>
## Specific Ideas

- User explicitly wants documents preserved now so a future AI agent can analyze PKI policy compliance and whether certificates conform to CP/CPS/DPC content.
- User selected fingerprint-based deduplication so reimports do not create unnecessary duplicate monitoring sources.
- User selected rich provenance now, even before the future AI analysis exists.

</specifics>

<deferred>
## Deferred Ideas

- Actual CP/CPS/DPC document fetching, snapshotting, metadata extraction, and change detection belong to Phase 23.
- Actual OCSP technical polling and response evidence capture belong to Phase 24.
- Operator/executive reporting for derived source health belongs to Phase 25.
- Manual OCSP/document source entry and web crawling are future/out-of-scope items.
- Full OCSP semantic validation and AI-assisted policy compliance analysis are future milestones.

</deferred>

---

*Phase: 22-derived-monitoring-source-foundation*  
*Context gathered: 2026-04-28*
