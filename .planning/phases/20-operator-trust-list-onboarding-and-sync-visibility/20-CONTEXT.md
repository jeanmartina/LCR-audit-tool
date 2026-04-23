# Phase 20: Operator Trust-List Onboarding and Sync Visibility - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning
**Source:** Roadmap scope, Phase 18/19 implementation outcomes, and user planning consultation on 2026-04-23

<domain>
## Phase Boundary

Phase 20 turns the Phase 18/19 trust-list ingestion foundation into an operator-understandable workflow. It does not change the certificate-first projection semantics from Phase 19. It adds guided trust-list source onboarding, optional pre-save source testing, group-admin scoped operation, visible sync timeline/status/failure guidance, and operator/admin documentation.
</domain>

<decisions>
## Implementation Decisions

### D-01 Guided onboarding model
- User selected `1A`: implement the trust-list onboarding flow as a guided wizard on the existing `/admin/trust-lists` page.
- The wizard should follow the certificate/ZIP onboarding style: clear steps, field hints, preview/test feedback, post-action next steps.
- Do not create a separate `/admin/trust-lists/new` route unless implementation discovers the existing page cannot remain maintainable.

### D-02 Operator authorization scope
- User selected `2B`: platform admins and group-admins can operate trust-list sources.
- Group-admins are limited to sources whose `groupIds` are within groups they administer.
- Group-admin source creation must reject unmanaged group IDs; platform admins can continue to use any valid group.
- Existing platform-admin behavior must remain valid.

### D-03 Optional pre-save test
- User selected `3B`: add an optional test/preview action before saving.
- The test should fetch the URL, enforce HTTPS/localhost rules, parse/validate XMLDSig, and return metadata such as digest, sequence, territory, issue date, next update, and certificate count.
- Saving without a successful test is still allowed, but UI should make the risk explicit.

### D-04 Sync status and timeline
- User selected `4A`: show a simple timeline per source with last success, last failure, next update, counters, error, and recommended action.
- Avoid a full detailed run history UI unless it is a low-cost supporting detail.

### D-05 Recovery guidance
- User selected `5A`: map known errors to prescriptive operator guidance.
- Required known cases: invalid URL, HTTPS required, XMLDSig invalid/missing, XML too large, fetch failed, no certificates found.
- Raw error strings can remain visible as secondary evidence but should not be the only guidance.

### D-06 Documentation
- User selected `6A`: update operator/admin documentation with setup, sync behavior, failure handling, and recovery steps.
- Documentation should reference the Docker/worker packaged behavior and explain the same recovery cases as the UI.

### D-07 Research requirement
- User selected `7A`: perform local/codebase-focused research before planning.
</decisions>

<canonical_refs>
## Canonical References

**Downstream implementation MUST read these before editing.**

### Phase 20 Scope
- `.planning/ROADMAP.md` - Phase 20 goal and success criteria.
- `.planning/REQUIREMENTS.md` - TSL-06, UX-04, OPS-06.
- `.planning/STATE.md` - accumulated decisions, especially Phase 16/17/18/19.

### Trust-List Foundation
- `.planning/phases/18-trust-list-source-model-and-safe-sync-foundation/18-CONTEXT.md` - source model, XMLDSig gate, worker topology.
- `.planning/phases/18-trust-list-source-model-and-safe-sync-foundation/18-02-SUMMARY.md` - existing admin/API/worker surface.
- `.planning/phases/19-trust-list-certificate-projection-and-reimport/19-CONTEXT.md` - projection/reimport decisions.
- `.planning/phases/19-trust-list-certificate-projection-and-reimport/19-02-SUMMARY.md` - projection counters/provenance surface.

### Code Surfaces
- `src/trust-lists/admin.ts` - source listing/creation/sync helpers and authorization to extend.
- `src/trust-lists/sync.ts` - fetch, XMLDSig, sync error strings, summaries.
- `src/app/admin/trust-lists/page.tsx` - existing trust-list page to turn into a guided wizard/status view.
- `src/app/api/admin/trust-lists/route.ts` - list/create route.
- `src/app/api/admin/trust-lists/[sourceId]/sync/route.ts` - manual sync route.
- `src/auth/authorization.ts` - platform/group permission helpers.
- `src/i18n/index.ts` - all user-facing copy in en, pt-BR, es.
- `docs/operators.md` - operator documentation to extend.
- `scripts/validate-trust-list-foundation.js` and `scripts/validate-trust-list-projection.js` - validators to extend or complement.
</canonical_refs>

<specifics>
## Specific Ideas

- Add a `previewTrustListSource`/`testTrustListSource` domain helper that reuses the same URL/fetch/XML parse/XMLDSig checks as sync without mutating sources, snapshots, projections, or inventory.
- Add `POST /api/admin/trust-lists/preview` or similar JSON-only endpoint for the wizard test action.
- Add group-admin trust-list permission helper rather than overloading `assertPlatformAdmin` everywhere.
- Keep redirects relative to avoid reintroducing public-origin issues.
- Keep docs and UI language clear: XMLDSig/integrity validation is not legal trust-policy validation.
</specifics>

<deferred>
## Deferred Ideas

- Full historical run drill-down across all sync runs can be deferred unless simple timeline support needs it.
- Executive summaries remain Phase 21.
- Legal/eIDAS trust-policy validation remains out of scope.
- Separate trust-list-only product surface remains out of scope.
</deferred>

---

*Phase: 20-operator-trust-list-onboarding-and-sync-visibility*
*Context gathered: 2026-04-23 via required planning consultation*
