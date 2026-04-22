# Phase 19: Trust-List Certificate Projection and Reimport - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning
**Source:** Roadmap scope plus Phase 18 implementation outcomes

<domain>
## Phase Boundary

Phase 19 hardens the Phase 18 trust-list import path. Phase 18 proved safe signed-source sync and initial certificate-first import. Phase 19 must add stable projection semantics: change detection, no duplicate unchanged assets, reimport only when trust-list-derived certificate data changes, and durable provenance from certificate/reporting records back to source URL, snapshot, sync run, and extracted item.
</domain>

<decisions>
## Implementation Decisions

### D-01 Preserve certificate-first inventory
- Continue using `certificates` and derived CRL links as the monitored inventory model.
- Do not introduce a second trust-list-only inventory model.
- Trust-list projection should enrich provenance and import policy around the existing certificate-first pipeline.

### D-02 Stable identity and duplicate policy
- Use certificate fingerprint as the primary stable identity for certificate assets.
- Use source/snapshot/run/extracted-item provenance to distinguish where the same certificate came from.
- Unchanged trust-list-derived certificates must be skipped and counted as skipped rather than duplicated or reimported.
- Changed trust-list-derived certificates should re-enter the existing `importCertificate` path so CRL links, group shares, and change events stay consistent.

### D-03 Provenance guarantee
- A trust-list-derived certificate must retain a durable link to source URL/source ID, snapshot ID, sync run ID, extracted certificate item ID, digest/sequence, and source path or ordinal.
- Reporting/admin surfaces may summarize provenance; Phase 20 can improve operator recovery UX, but Phase 19 must expose enough evidence to distinguish trust-list assets from manual/ZIP assets.

### D-04 Failure semantics carried from Phase 18
- XMLDSig validation remains a blocking gate before projection/import.
- Failed syncs do not replace/delete previous valid state.
- Per-certificate projection failures are item-level failures after a valid snapshot is accepted.

### D-05 Interaction policy
- The agent can read project files without asking.
- Ask only if a decision changes requirements, guarantees, security, or product behavior.
</decisions>

<canonical_refs>
## Canonical References

**Downstream implementation MUST read these before editing.**

### Phase 19 Scope
- `.planning/ROADMAP.md` — Phase 19 goal and success criteria.
- `.planning/REQUIREMENTS.md` — TSL-04 hardening, TSL-05, TSL-07.
- `.planning/STATE.md` — Phase 18 decisions and current milestone state.

### Phase 18 Foundation
- `.planning/phases/18-trust-list-source-model-and-safe-sync-foundation/18-CONTEXT.md` — trust-list format, XMLDSig gate, failure semantics.
- `.planning/phases/18-trust-list-source-model-and-safe-sync-foundation/18-01-SUMMARY.md` — implemented sync core and schema.
- `.planning/phases/18-trust-list-source-model-and-safe-sync-foundation/18-02-SUMMARY.md` — admin/worker implementation and validation results.
- `src/trust-lists/sync.ts` — current projection/import behavior to harden.
- `src/trust-lists/parser.ts` — extracted certificate candidate model.
- `src/storage/runtime-store.ts` — trust-list and certificate persistence helpers.
- `src/inventory/certificate-admin.ts` — certificate-first import pipeline.

### Surfaces to Update
- `src/app/admin/trust-lists/page.tsx` — admin trust-list list/status table.
- `src/reporting/read-models.ts` — reporting source filters and dashboard row projection.
- `scripts/validate-trust-list-foundation.js` — existing validator to extend or split.
</canonical_refs>

<specifics>
## Specific Implementation Direction

- Add explicit projection/provenance fields or a dedicated link table rather than encoding provenance only in tags.
- Add a deterministic candidate/projection key so unchanged source+fingerprint projections can be skipped across sync runs.
- Persist skipped/updated/imported/failed counts with reasons.
- Surface provenance in admin/reporting using existing UI primitives and i18n.
</specifics>

<deferred>
## Deferred Ideas

- Full operator recovery guidance remains Phase 20.
- Executive analytics remains Phase 21.
- Legal/eIDAS trust-policy validation remains outside Phase 19 unless already available through future requirements.
</deferred>

---
*Phase: 19-trust-list-certificate-projection-and-reimport*
*Context gathered: 2026-04-22*
