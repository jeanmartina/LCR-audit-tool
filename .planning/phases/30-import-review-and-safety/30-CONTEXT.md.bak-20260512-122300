# Phase 30: Import Review and Safety - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning
**Source:** Direct user decisions in session

<domain>
## Phase Boundary

This phase adds a review-before-save import flow with server-side revalidation and preserved provenance.

The review step is part of the import flow, but it can also be run separately. The same review experience must apply to every import path in the product, including single-certificate import, ZIP import, and any trust-list-derived import flow that enters the certificate pipeline.

</domain>

<decisions>
## Implementation Decisions

### Review Placement
- The review step is part of the import flow.
- The review step can also be run separately.
- Review-before-save is the default behavior for this phase.

### Review Scope
- The same review experience must apply to all import types.
- This includes:
  - single certificate import
  - ZIP batch import
  - trust-list-derived import paths that enter the certificate pipeline

### Provenance Presentation
- The review screen should show only the final value the user is about to save.
- The review screen should not expose the full correction history inline.
- Historical provenance and correction details belong in the detail view or record history after save.

### the agent's Discretion
- Exact route structure for the review surface versus the main import submission surface.
- Whether the separate review mode is a dedicated page, a toggle, or a reusable panel.
- The detailed presentation of the history view that sits behind the review surface.
- The precise mechanics for mapping the review UI across single, ZIP, and trust-list-derived import paths.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Import and certificate pipeline
- `src/inventory/certificate-admin.ts` — certificate import preview/import pipeline and provenance helpers
- `src/app/admin/certificates/new/page.tsx` — single-certificate import entry point
- `src/app/admin/certificates/new/certificate-preview-form.tsx` — current preview-first import form
- `src/app/admin/certificates/batch/page.tsx` — ZIP batch import entry point
- `src/app/api/admin/certificates/import/preview/route.ts` — certificate preview API
- `src/app/api/admin/certificates/import/route.ts` — certificate import commit API
- `src/app/api/admin/certificates/import-zip/route.ts` — ZIP import commit API

### Trust-list and derived source integration
- `src/trust-lists/admin.ts` — trust-list operator flows and provenance-aware source summary data
- `src/trust-lists/sync.ts` — trust-list sync and projection paths that already feed the certificate pipeline
- `src/app/admin/trust-lists/trust-list-source-wizard.tsx` — current trust-list preview and create flow

### Shared UI and copy
- `src/components/ui/primitives.tsx` — shared form fields, notices, panels, and actions
- `src/i18n/index.ts` — copy for import flows, review labels, and validation/error strings

</canonical_refs>

<specifics>
## Specific Ideas

- Review is mandatory before final save.
- Review can be invoked separately from the import commit step.
- All import paths should share the same review language and the same decision model.
- The review screen should stay focused on the final chosen value.
- Provenance details should be discoverable later, not crowded into the review surface.

</specifics>

<deferred>
## Deferred Ideas

- Exact implementation shape for the separate review invocation.
- Detailed provenance/history UI beyond the final-value review screen.
- Any future AI-assisted normalization or explanation layer, which is out of scope for this phase.

</deferred>

---

*Phase: 30-import-review-and-safety*
*Context gathered: 2026-05-10 via direct user decisions*
