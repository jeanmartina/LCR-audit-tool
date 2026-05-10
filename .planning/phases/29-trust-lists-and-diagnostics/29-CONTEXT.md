# Phase 29: Trust Lists and Diagnostics - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning
**Source:** Direct user decisions in session

<domain>
## Phase Boundary

This phase improves the trust-list operational surface so the operator can understand hierarchy, compact inventory state, failure diagnostics, and safe removal behavior without losing provenance.

The user wants the trust-list area to remain compact at a glance, but to expose quick expansion on each card and a dedicated detail page for full diagnostics. Hierarchy must remain visible in the list, the quick expand view, and the full detail page. The list should emphasize the current source state, the last success or failure, and a direct action to open details.

</domain>

<decisions>
## Implementation Decisions

### Compact Inventory
- The main trust-list surface must stay compact and legible.
- Each item must show the source state.
- Each item must show the last success or failure.
- Each item must show a primary action.
- The primary action in the compact view must be opening details.

### Detail Navigation
- The trust-list detail interaction must support both quick expansion on the card and a dedicated detail page.
- The dedicated detail page must show the complete diagnostic breakdown for the selected source.

### Hierarchy Visibility
- LOTL and subordinate relationships must be visible.
- Hierarchy must appear in three places:
  - as a badge on the card
  - as indentation or grouped structure in the list
  - as the full hierarchy view in the detail page
- Parent/child structure must be explicit rather than inferred.

### Failure Diagnostics
- The first failure layer highlighted in the compact view must be `download/fetch`.
- The detail page must expose all failure layers explicitly:
  - `download/fetch`
  - `XML/parse`
  - `XMLDSig/assinatura`
  - `projection/import`
  - `hierarquia/LOTL`
- Diagnostics must be technical and actionable for an operator or technician.
- Failure explanations should be concise in the compact view and more detailed in hover or detail views.

### Removal and History
- Removal must be visible both on the compact card and on the detail page.
- The user wants two removal modes:
  - archive without losing history
  - permanent removal
- Archive is the normal safe path and must preserve history.
- Permanent removal must remain explicit and should be blocked when children or relevant historical records still exist.

### Operational Clarity
- The compact view should not try to expose every diagnostic detail inline.
- Detail expansion is the bridge between quick scanning and full diagnosis.
- The trust-list experience must help the operator understand how to recover from a failure, not just that a failure exists.

### the agent's Discretion
- Exact component decomposition for the compact card, quick-expansion surface, and detail page.
- Whether the quick-expansion view is a popover, inline expansion, or drawer as long as the user-visible behavior is preserved.
- The visual treatment for badges, indentation, and failure severity indicators.
- The exact technical presentation of the failure layer breakdown, provided the required layers remain explicit.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Trust-list UI and shared administration
- `src/app/admin/trust-lists/trust-list-admin-panel.tsx` — shared trust-list panel used by admin and settings
- `src/app/settings/sections/trust-lists-tab.tsx` — settings tab embedding the shared trust-list panel
- `src/app/admin/trust-lists/page.tsx` — dedicated admin wrapper around the shared trust-list panel

### Trust-list storage and operations
- `src/trust-lists/admin.ts` — archive/remove helpers and hierarchy-aware trust-list operations
- `src/storage/runtime-store.ts` — trust-list source records, hierarchy fields, and runtime persistence
- `src/app/api/admin/trust-lists/route.ts` — create flow for trust-list sources
- `src/app/api/admin/trust-lists/[sourceId]/route.ts` — update/delete flow for trust-list sources

### Validation scripts
- `scripts/validate-trust-list-foundation.js` — structural validation for trust-list foundation rules
- `scripts/validate-trust-list-operator-ux.js` — operator-facing trust-list UX validation

</canonical_refs>

<specifics>
## Specific Ideas

- Keep the inventory compact at first glance.
- Show source status, last success/failure, and open-details as the primary card affordances.
- Show hierarchy in the card, grouped list, and detail page.
- Highlight `download/fetch` first in the compact failure summary.
- Expose every failure layer in the detail page.
- Make archive the normal safe removal flow and preserve historical records.
- Make permanent removal explicit and guarded.

</specifics>

<deferred>
## Deferred Ideas

- Exact visual treatment for the quick-expand state.
- Precise error copy and technician-facing remediation text for each failure layer.
- Any additional aggregation or filtering controls for the compact list beyond the required visibility rules.

</deferred>

---

*Phase: 29-trust-lists-and-diagnostics*
*Context gathered: 2026-05-10 via direct user decisions*
