# Phase 23: CP/CPS/DPC Document Snapshot Monitoring - Context

**Gathered:** 2026-05-01  
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 23 delivers safe CP/CPS/DPC policy-document monitoring for already-derived `policy-document` monitoring sources. It fetches discovered document URLs, records one event for each check, stores bounded document snapshots when content changes, extracts bounded metadata/text when feasible, and preserves certificate/policy/trust-list provenance for future AI-assisted PKI compliance analysis.

This phase does **not** add manual source entry, CA website crawling, OCSP polling, operator/executive reporting, or AI compliance interpretation. Those are later phases or future milestones.

</domain>

<decisions>
## Implementation Decisions

### Fetch Safety and URL Policy
- **D-01:** Accept both HTTPS and public HTTP document URLs. Public HTTP is allowed because real CP/CPS/DPC URLs may still be published over HTTP.
- **D-02:** Even when HTTP is allowed, document fetches must enforce the same safety posture as trust-list fetches: timeout, redirect limit, private/internal/link-local address blocking, and redirect-target revalidation.
- **D-03:** Localhost/dev exceptions may exist only for explicit local testing modes; production behavior must not allow private/internal targets.
- **D-04:** Unsafe URLs, blocked redirects, oversized responses, invalid schemes, and fetch failures should become explicit document monitoring events/failure reasons, not silent skips.

### Snapshot Storage and Retention
- **D-05:** Store bounded raw document bytes in Postgres, plus SHA-256 hash, declared content type, content size, source URL, captured timestamp, metadata JSON, and bounded extracted text.
- **D-06:** Raw storage must be strictly limited by env-configurable byte caps. If a document exceeds the limit, record an event/failure reason and do not retain unbounded content.
- **D-07:** Snapshot records must preserve provenance from the parent monitoring source: certificate ID, fingerprint, policy OID, document role, trust-list source ID, trust-list snapshot ID, and trust-list run ID.
- **D-08:** This evidence is stored for future AI compliance analysis, but Phase 23 must not analyze compliance or score certificate-policy conformance.

### Text and Metadata Extraction
- **D-09:** Extract text and basic metadata from `text/plain` and HTML responses without executing or rendering content.
- **D-10:** Attempt PDF text extraction using a lightweight Docker-safe dependency if research confirms build/runtime compatibility.
- **D-11:** PDF extraction failure must not fail the snapshot. Store raw/hash/metadata and record extraction failure or truncation explicitly.
- **D-12:** Extracted text must be bounded by an env-configurable maximum byte/character limit and record whether extraction was truncated.
- **D-13:** Content type is not fully trusted. Store declared content type and sniff only enough to choose safe extraction; never execute HTML or active document content.

### Events and Change Semantics
- **D-14:** Create a `monitoring_source_events` record for every document check, including success, unchanged, changed, unavailable, blocked, oversized, and extraction-failed outcomes.
- **D-15:** Create a new `document_snapshots` record only when the document content hash changes or when no prior snapshot exists.
- **D-16:** An unchanged check should still be auditable through an event that references the existing latest snapshot/hash.
- **D-17:** Failed checks must not delete or overwrite the last valid snapshot; historical evidence remains intact.

### Worker Execution
- **D-18:** Phase 23 should integrate document monitoring into the existing worker loop so the feature is demonstrable end-to-end in Docker.
- **D-19:** Worker behavior must be controlled by conservative env defaults for fetch timeout, maximum document bytes, maximum extracted text bytes, and redirect count.
- **D-20:** The worker should process discovered enabled `policy-document` monitoring sources and leave OCSP sources to Phase 24.
- **D-21:** No new service should be introduced; reuse the existing `web + worker + postgres + caddy` topology.

### the agent's Discretion
- Exact table names, helper names, module boundaries, status labels, and extraction metadata schema are left to planning/implementation as long as they satisfy the decisions above.
- The planner/researcher may choose the PDF extraction library after checking current package compatibility and Docker build impact.
- The planner may split Phase 23 into multiple execution plans if needed: safety/fetch utilities, storage/events/snapshots, extraction, worker integration, and validation.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and phase scope
- `.planning/PROJECT.md` — Current v1.3 milestone goal, constraints, and project-level monitoring/evidence principles.
- `.planning/REQUIREMENTS.md` — Phase 23 requirements `DOCS-01` through `DOCS-05` and `SEC-01`.
- `.planning/ROADMAP.md` — Phase 23 goal, success criteria, and sequencing before OCSP/reporting phases.
- `.planning/research/SUMMARY.md` — v1.3 research summary for document monitoring and future AI readiness.
- `.planning/research/ARCHITECTURE.md` — Suggested `monitoring_source_events` and `document_snapshots` architecture.
- `.planning/research/STACK.md` — Stack guidance for document fetch/extraction, bounded Postgres storage, and env limits.
- `.planning/research/PITFALLS.md` — SSRF, unbounded storage, content-type trust, DPC discoverability, and AI over-promise risks.

### Prior phase foundation
- `.planning/phases/22-derived-monitoring-source-foundation/22-CONTEXT.md` — Locked source lifecycle, deduplication, provenance, and parser boundaries.
- `.planning/phases/22-derived-monitoring-source-foundation/22-VERIFICATION.md` — Confirms Phase 22 storage/derivation/import integration is available.

### Existing implementation references
- `src/monitoring-sources/types.ts` — Existing derived source type/state/provenance shapes.
- `src/monitoring-sources/model.ts` — Existing URL normalization and deterministic source-key behavior.
- `src/monitoring-sources/derive.ts` — Current derivation/upsert service and policy-document candidate creation.
- `src/storage/runtime-store.ts` — Runtime schema/helper pattern and existing `monitoring_sources` persistence.
- `src/trust-lists/sync.ts` — Existing URL safety, redirect, timeout, byte-limit, and private-address blocking pattern to generalize for document fetches.
- `scripts/run-worker.js` — Existing worker topology to extend for policy-document checks.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/storage/runtime-store.ts`: schema strings, row mappers, Postgres helpers, and in-memory fallback patterns should be reused for `monitoring_source_events` and `document_snapshots`.
- `src/trust-lists/sync.ts`: `assertPublicFetchTarget`, redirect handling, timeout control, and byte-limit checks are the closest existing security pattern.
- `src/monitoring-sources/derive.ts`: already creates `policy-document` sources with `documentRole`, `policyOid`, source URL, normalized URL, and trust-list provenance.
- `scripts/validate-derived-monitoring-sources.js`: Phase-specific static validator pattern can be mirrored by a document snapshot validator.

### Established Patterns
- Postgres-backed runtime store is the source of truth, with in-memory fallback where practical.
- Failed runtime operations should record explicit events/failure reasons rather than silently mutating or deleting state.
- The existing worker runs inside the packaged Docker topology; Phase 23 should extend that worker rather than add a new process.
- Authorization for derived sources follows parent certificate/group visibility; Phase 23 stores evidence but reporting authorization lands more fully in Phase 25.

### Integration Points
- Add document fetch/check modules under `src/monitoring-sources/` or a closely related namespace.
- Extend `src/storage/runtime-store.ts` with document event/snapshot persistence helpers.
- Extend `scripts/run-worker.js` or the worker-called runtime path to process `policy-document` sources.
- Add environment variables and validation/docs hooks in Phase 23 if required for runtime demonstration, while broader operator docs may continue in Phase 26.

</code_context>

<specifics>
## Specific Ideas

- User selected accepting public HTTP in addition to HTTPS for policy documents, provided private/internal targets and unsafe redirects are still blocked.
- User selected bounded raw byte retention in Postgres because future AI/conformance analysis must be able to reprocess the original evidence.
- User selected attempting lightweight PDF extraction now, with safe fallback to raw/hash/metadata if extraction fails.
- User selected event-per-check plus snapshot-on-hash-change to balance auditability and storage growth.
- User selected worker integration in Phase 23 so the document monitoring path is demonstrable in Docker.

</specifics>

<deferred>
## Deferred Ideas

- OCSP technical monitoring remains Phase 24.
- Operator/executive reporting for document source health remains Phase 25.
- Compose/docs closure and final operational documentation remain Phase 26 unless minimal env/docs changes are needed to validate Phase 23.
- Manual document source entry, CA website crawling, and AI policy compliance scoring remain future/out-of-scope items.

</deferred>

---

*Phase: 23-cp-cps-dpc-document-snapshot-monitoring*  
*Context gathered: 2026-05-01*
