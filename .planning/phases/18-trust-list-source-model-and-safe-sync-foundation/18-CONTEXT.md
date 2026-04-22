# Phase 18: Trust-List Source Model and Safe Sync Foundation - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning
**Source:** User decisions in planning session

<domain>
## Phase Boundary

Phase 18 must implement trust-list source registration, safe sync, blocking XMLDSig validation, auditable sync runs, Docker/worker integration, and an initial extracted-certificate import path. This intentionally pulls the first usable import behavior into Phase 18 while leaving change detection, dedup/reimport refinement, and richer provenance UX for Phase 19.
</domain>

<decisions>
## Implementation Decisions

### D-01 Trust-list format scope
- Support ETSI TS 119 612 XML trust lists by URL.
- Support real-world XML variations best-effort where they still fit the ETSI trusted-list model.
- Do not add non-ETSI trust-source formats in this phase.

### D-02 Integrity guarantee
- Block acceptance unless XMLDSig cryptographic validation succeeds in Phase 18.
- A fetched document that is unsigned, malformed, or fails XMLDSig validation must persist a failed sync run and must not affect accepted snapshot/import state.

### D-03 Inventory mutation
- Phase 18 must import at least the extracted supported certificates through the existing certificate-first path after validation succeeds.
- Phase 19 will still own robust change detection, reimport policy, duplicate handling refinements, and full provenance surfaces.

### D-04 Sync execution
- Provide both manual `sync now` via admin/API and worker-ready sync execution in Docker.
- Packaged runtime must not require undeclared host tools.

### D-05 Failure semantics
- Failed sync never deletes/replaces the previous valid state.
- Failed sync persists run status and failure reason.
- Last valid snapshot remains the basis for accepted state.

### D-06 Interaction policy
- The agent can read any project file without asking.
- Ask the user only when a decision changes requirements, guarantees, security, or product behavior.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope
- `.planning/REQUIREMENTS.md` - v1.2 requirement IDs and traceability.
- `.planning/ROADMAP.md` - Phase 18/19 boundaries and milestone sequence.
- `.planning/STATE.md` - accumulated product decisions, especially Phase 16/17 UI and onboarding decisions.

### Existing implementation patterns
- `src/storage/runtime-store.ts` - database/cache schema pattern and persistence helpers.
- `src/inventory/certificate-admin.ts` - existing certificate-first import pipeline to reuse.
- `src/app/admin/certificates/*` - guided onboarding UI patterns from Phase 17.
- `scripts/run-worker.js` - packaged worker execution pattern.
- `compose.yaml` and `Dockerfile` - packaged Docker runtime contract.

### Standards and primary references
- `https://www.etsi.org/deliver/etsi_ts/119600_119699/119612/02.03.01_60/ts_119612v020301p.pdf` - ETSI TS 119 612 V2.3.1 (2024-11), Trusted Lists.
- `https://www.w3.org/TR/xmldsig-core/` - W3C XML Signature Syntax and Processing, core validation model.
</canonical_refs>

<specifics>
## Specific Ideas

- Add a trust-list domain module under `src/trust-lists/`.
- Add persisted records for source, snapshot, sync run, extracted certificate items, and source/group sharing if needed.
- Add validator script `scripts/validate-trust-list-foundation.js`.
- Add `npm` dependencies for XML parsing/signature validation if native Node APIs are not sufficient.
</specifics>

<deferred>
## Deferred Ideas

- Phase 19: robust trust-list change detection and reimport of affected certificates without duplicating unchanged assets.
- Phase 19: full provenance UX from report/admin surfaces back to source URL, snapshot, and import run.
- Phase 20: richer operator trust-list onboarding/status UX and documentation.
</deferred>

---

*Phase: 18-trust-list-source-model-and-safe-sync-foundation*
*Context gathered: 2026-04-22 via targeted requirements/guarantees discussion*
