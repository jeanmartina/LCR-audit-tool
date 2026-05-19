# Phase 30: Import Review and Safety - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement a unified review-before-save flow for three import origins:
- single-certificate import
- ZIP batch import
- trust-list-derived candidates

The phase must enforce server-authoritative final save, preserve operational provenance, and keep operator decisions auditable without activating rejected/ignored/duplicate outcomes.

</domain>

<decisions>
## Implementation Decisions

### Review Scope
- Operators may edit all reviewable fields before final save, including technical fields and administrative metadata.

### Divergence Handling
- If an operator-edited value diverges from the derived/original value, final save is blocked until the operator provides a mandatory justification.

### Final Save Revalidation
- Final save is blocked if server-side revalidation finds new errors; the flow must return to review with highlighted errors.

### Non-accepted Outcomes
- Items marked duplicate/rejected/ignored are not persisted as active certificates.
- These outcomes must be recorded in provenance/audit history with decision and reason.

### Origin Policy Consistency
- The same review-and-save policy applies across single import, ZIP import, and trust-list-derived candidates.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap and requirements
- `.planning/ROADMAP.md` — phase goal and success criteria for Phase 30.
- `.planning/REQUIREMENTS.md` — requirement `UI-04` definition and mapping.

### Existing import/admin surfaces
- `src/app/admin/certificates/new/page.tsx` — single-certificate import UI and current prevalidation/commit behavior.
- `src/app/admin/certificates/batch/page.tsx` — ZIP batch import UI and commit behavior.
- `src/app/admin/trust-lists/trust-list-admin-panel.tsx` — trust-list operations surface and sync actions.

### Existing import APIs and persistence
- `src/app/api/admin/certificates/import/preview/route.ts` — current preview/prevalidation path.
- `src/app/api/admin/certificates/import/route.ts` — single import save path.
- `src/app/api/admin/certificates/import-zip/route.ts` — ZIP import save path.
- `src/app/api/admin/trust-lists/[sourceId]/sync/route.ts` — trust-list sync/import path.
- `src/lib/certificates/admin-store.ts` — certificate persistence and history/audit helpers.

</canonical_refs>

<specifics>
## Specific Ideas

- Introduce a staged review payload contract that is revalidated server-side at final save time.
- Do not trust client-mutated review data without server recomputation/validation.
- Capture per-item review decisions (`accept`, `edit`, `ignore`, `reject`, `duplicate`, `pending`) with mandatory reason fields where required.
- Record original vs final value transitions in provenance history for accepted edits.

</specifics>

<deferred>
## Deferred Ideas

- Advanced policy exceptions per origin (manual vs trust-list) are out of scope; policy is unified in this phase.
- Any role-based secondary approval workflow for edits is out of scope for this phase.

</deferred>

---

*Phase: 30-import-review-and-safety*
*Context gathered: 2026-05-12*
