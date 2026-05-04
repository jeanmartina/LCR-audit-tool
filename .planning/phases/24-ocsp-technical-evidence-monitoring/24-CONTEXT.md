# Phase 24: OCSP Technical Evidence Monitoring - Context

**Gathered:** 2026-05-04  
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 24 delivers bounded technical OCSP responder checks for already-derived `ocsp` monitoring sources. It should generate and submit real OCSP requests when enough issuer/check context exists, retain technical evidence, and record explicit events for reachable, unavailable, blocked, oversized, malformed, and not-checkable outcomes.

This phase does **not** implement full semantic OCSP revocation validation. It must not present OCSP reachability or a parseable response as authoritative `good`, `revoked`, or `unknown` certificate status. Full responder authorization, response signature validation, freshness semantics, and certificate status interpretation remain future `OCSP-F01`/`OCSP-F02` scope.

</domain>

<decisions>
## Implementation Decisions

### OCSP Check Depth
- **D-01:** Phase 24 should send a real DER-encoded OCSP request when sufficient certificate and issuer context exists.
- **D-02:** The check result is technical evidence only: request attempted, responder reachable/unreachable, response received, response bounded/stored, and response parseability where feasible.
- **D-03:** Do not reduce Phase 24 to HTTP reachability-only unless implementation research proves real OCSP request generation is not viable in the current stack.

### Issuer Context Minimum
- **D-04:** A derived OCSP source is checkable only when the system can locate the issuer certificate context needed to build a real OCSP request.
- **D-05:** If issuer context is unavailable, record a `not_checkable` event/reason such as `issuer-certificate-not-found` rather than sending partial or low-confidence requests.
- **D-06:** Issuer context may come from existing certificate inventory or trust-list-derived inventory if the implementation can reliably match issuer/subject or authority key identifiers. Exact matching mechanics are left to research/planning.

### OCSP Event Semantics
- **D-07:** Use technical event statuses only: `available`, `unavailable`, `blocked`, `oversized`, `malformed`, and `not_checkable`.
- **D-08:** Do not use OCSP semantic statuses (`good`, `revoked`, `unknown`) as monitoring health labels in Phase 24.
- **D-09:** If the response can be minimally parsed, store parse metadata as evidence only; UI/reporting copy must avoid implying full revocation-status validation.

### Evidence Retention
- **D-10:** Store raw OCSP request bytes and raw OCSP response bytes within env-configurable byte limits.
- **D-11:** Store hashes, sizes, content type, HTTP status, duration, responder URL, certificate fingerprint, issuer fingerprint, and failure reason.
- **D-12:** Preserve enough raw evidence for future semantic/signature validation work without implementing that validation now.
- **D-13:** Oversized responses should record an explicit `oversized` event/failure reason and must not retain unbounded content.

### Worker and Runtime Controls
- **D-14:** Integrate OCSP checks into the existing `worker` process; do not add a new service.
- **D-15:** Keep OCSP scheduling separate from policy-document scheduling so cadence and limits can diverge.
- **D-16:** Add dedicated OCSP env vars for timeout, maximum response bytes, check interval, and explicit localhost allowance for local development fixtures.
- **D-17:** Reuse the Phase 23 SSRF posture: private/internal/link-local targets and unsafe redirects remain blocked by default.

### the agent's Discretion
- Exact table/helper names, module boundaries, OCSP library choice, response metadata shape, and issuer matching implementation are left to research/planning.
- The planner may split work into storage/events, OCSP request generation, issuer-context resolution, worker integration, and validation/proof plans.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and phase scope
- `.planning/PROJECT.md` — Current v1.3 milestone goal, constraints, and project-level evidence principles.
- `.planning/REQUIREMENTS.md` — Phase 24 requirements `OCSP-01` through `OCSP-04` and future `OCSP-F01`/`OCSP-F02` boundaries.
- `.planning/ROADMAP.md` — Phase 24 goal, success criteria, sequencing before reporting/operations phases.

### Prior phase decisions
- `.planning/phases/22-derived-monitoring-source-foundation/22-CONTEXT.md` — Locked source lifecycle, deduplication, provenance, and `ocsp` source derivation boundaries.
- `.planning/phases/23-cp-cps-dpc-document-snapshot-monitoring/23-CONTEXT.md` — Fetch safety, worker integration, event-per-check, bounded evidence, and future-analysis boundary patterns to mirror.

### Existing implementation references
- `src/monitoring-sources/types.ts` — Existing `MonitoringSourceType`, source lifecycle, and provenance model.
- `src/monitoring-sources/derive.ts` — Current AIA OCSP URL derivation from certificate extensions.
- `src/monitoring-sources/fetch-safety.ts` — Phase 23 public URL safety, timeout, redirect, private-address blocking, and byte-limit helpers that should be reused or generalized for OCSP.
- `src/monitoring-sources/document-types.ts` — Existing monitoring source event type pattern, likely to be extended or mirrored for OCSP.
- `src/monitoring-sources/documents.ts` — Event-per-check and bounded raw-evidence service pattern from Phase 23.
- `src/monitoring-sources/worker.ts` — Current scheduled policy-document worker pass; OCSP should integrate similarly but on separate cadence/limits.
- `src/storage/runtime-store.ts` — Runtime schema/helper pattern and current `monitoring_sources`, `monitoring_source_events`, and document snapshot storage.
- `src/inventory/certificate-admin.ts` — Certificate PEM/fingerprint handling and import flow; likely source for issuer/certificate lookup support.
- `scripts/run-worker.js` — Existing worker topology to extend without adding a new service.
- `scripts/validate-derived-monitoring-sources.js` — Existing static validator pattern for source derivation.
- `scripts/validate-document-snapshots.js` — Existing Phase 23 validator pattern for safety, storage, worker wiring, and scope boundaries.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/monitoring-sources/types.ts`: already defines `ocsp` as a monitoring source type and carries certificate/trust-list provenance.
- `src/monitoring-sources/derive.ts`: already extracts AIA OCSP URLs and creates `discovered` or `not_discovered` OCSP sources.
- `src/monitoring-sources/fetch-safety.ts`: provides timeout, redirect, byte-limit, DNS/IP public-target validation, and localhost dev exception patterns.
- `src/monitoring-sources/documents.ts`: shows how to record event-per-check and bounded raw evidence while keeping future semantic analysis out of scope.
- `src/storage/runtime-store.ts`: contains the schema migration and helper style for adding new event/evidence records.
- `scripts/run-worker.js`: loads TypeScript modules into the single worker process and already calls scheduler, trust-list sync, and document-source checks.

### Established Patterns
- Runtime persistence is Postgres-backed with in-memory fallback where practical.
- Derived source lifecycle state is separate from polling/check health.
- Worker integration should reuse the existing Docker `worker` service instead of adding a process.
- Failed or uncheckable work should become explicit events/failure reasons, not silent skips.
- New behavior should have a focused static validator wired into `scripts/validate-all.js`.

### Integration Points
- Add OCSP-specific service modules under `src/monitoring-sources/`.
- Extend `src/storage/runtime-store.ts` with OCSP evidence/event storage or extend existing monitoring-source event storage if appropriate.
- Add issuer-context lookup helpers using certificate inventory/trust-list provenance.
- Extend `src/monitoring-sources/worker.ts` or a sibling worker module to process due discovered `ocsp` sources.
- Add `.env.example` and `compose.yaml` OCSP-specific limits if needed for runtime validation.

</code_context>

<specifics>
## Specific Ideas

- User selected real DER OCSP requests when issuer context exists, not mere endpoint reachability.
- User selected issuer certificate as mandatory context; missing issuer should be `not_checkable`.
- User selected technical health states only and explicitly rejected `good/revoked/unknown` as Phase 24 health.
- User selected retaining both raw OCSP request and raw OCSP response evidence, plus hashes and provenance.
- User selected existing-worker integration with dedicated OCSP env vars and separate cadence from document checks.

</specifics>

<deferred>
## Deferred Ideas

- Full OCSP semantic validation remains future `OCSP-F01`/`OCSP-F02`: responder authorization, signature validation, certificate status, and freshness windows.
- Operator/executive reporting for OCSP health remains Phase 25.
- Milestone-wide operations/docs/proof closure remains Phase 26.
- Manual OCSP source entry remains future/out-of-scope.

</deferred>

---

*Phase: 24-ocsp-technical-evidence-monitoring*  
*Context gathered: 2026-05-04*
