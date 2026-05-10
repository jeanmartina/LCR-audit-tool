# Phase 29: Trust Lists and Diagnostics - Research

**Gathered:** 2026-05-10
**Status:** Research complete
**Source:** Local codebase inspection for the current workspace

<findings>
## Current Implementation Snapshot

The trust-list stack already has strong backend primitives:

- `src/trust-lists/sync.ts` performs blocking fetch, HTTPS/public-host checks, redirect limits, XML size limits, XML parsing, XMLDSig validation, snapshot creation, projection recording, and per-candidate import bookkeeping.
- `src/trust-lists/parser.ts` extracts `digestSha256`, `sequenceNumber`, `territory`, `issueDate`, `nextUpdate`, and certificate candidates from supported trust-list XML.
- `src/trust-lists/xmldsig.ts` can distinguish missing signatures from invalid signatures and exposes the signer certificate when present.
- `src/storage/runtime-store.ts` persists trust-list sources, snapshots, sync runs, extracted certificates, and projections.
- `src/trust-lists/admin.ts` already summarizes the latest run, latest snapshot, projection counts, and recovery guidance for the admin list view.

The current admin page is compact and already operator-oriented, but it is still a single list surface:

- `src/app/admin/trust-lists/page.tsx` shows status pills, last run, last success/failure, metadata, projection counts, and recovery notices.
- There is no dedicated trust-list detail route in the current repo state.
- There is no inline expansion model in the current repo state.
- There is no visible hierarchy badge or grouped parent/child tree in the current repo state.
- There is no archive/delete UI in the current repo state.

The current settings page only links out to the admin trust-list page:

- `src/app/settings/page.tsx` links to `/admin/trust-lists`.
- There is no embedded trust-list diagnostics experience under settings in the current repo state.

</findings>

<analysis>
## What This Means for Phase 29

The backend already has the failure data needed for diagnostics, but the operator UX is still shallow. Phase 29 should focus on presenting the existing state in a compact inventory-first surface, then exposing deeper diagnostics only when the operator asks for them.

The key implementation challenge is not inventing new sync behavior. It is connecting the existing run/snapshot/projection records to a better hierarchy-aware UI and adding the missing source lifecycle controls that the user explicitly requested:

- visible LOTL/subordinate hierarchy
- quick expansion from the compact list
- a dedicated detail page for full failure analysis
- safe archive vs permanent delete behavior

</analysis>

<technical_notes>
## Technical Notes

### Failure layers already available in sync code
- Fetch / transport failures
- HTTPS requirement failures
- Private/internal address blocking
- Redirect issues
- XML size limit failures
- XML parse failures
- XMLDSig missing/invalid/validation errors
- No certificates found
- Import failures
- Duplicate-in-run and unchanged projection cases

### Data already available for compact cards
- source state
- last run status
- last success / last failure timestamps
- snapshot metadata
- projection counts
- recovery guidance

### Data missing from the current model
- parent/child trust-list hierarchy
- archive/delete source lifecycle
- per-source detail route
- quick-expand state
- explicit list grouping by hierarchy

### Recommended implementation direction
- Keep the main inventory compact and card-based.
- Reuse the existing summary record for the card view.
- Add a hierarchy-aware source model so LOTL and subordinate links can be rendered explicitly.
- Add a detail route that explains the failure chain from fetch through projection/import.
- Separate archive from permanent delete so history is preserved by default.

</technical_notes>

<validation_architecture>
## Validation Architecture

The phase needs both automated and manual coverage because the primary risk is UX clarity, not just code correctness.

Recommended automated checks:

- `node scripts/validate-trust-list-foundation.js`
- `node scripts/validate-trust-list-operator-ux.js`
- `node scripts/validate-all.js`
- `npm run typecheck`
- `npm run build`

Recommended manual/browser checks:

- Confirm the compact trust-list inventory shows state, last success/failure, and open-details as the primary action.
- Confirm hierarchy appears as badge, grouping/indentation, and detail disclosure.
- Confirm the detail page exposes all failure layers.
- Confirm archive and permanent delete are both visible and behave safely.

</validation_architecture>

<risks>
## Risks

- The current code already exposes a lot of technical state, so the UI can become dense quickly if the detail page tries to show everything inline.
- A hierarchy model introduced late in the phase could create validation and routing churn if the detail page is built before the data shape is settled.
- Permanent delete needs explicit guards to avoid losing historical provenance or orphaning subordinate sources.

</risks>

<conclusion>
## Conclusion

Phase 29 is mostly a presentation and lifecycle gap-closing effort on top of an already capable trust-list sync pipeline.
The plan should prioritize compact inventory reading, explicit hierarchy, recoverable failure diagnostics, and safe source removal semantics.

</conclusion>

---

*Phase: 29-trust-lists-and-diagnostics*
*Research gathered: 2026-05-10*
