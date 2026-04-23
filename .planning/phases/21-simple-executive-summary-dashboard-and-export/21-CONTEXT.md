# Phase 21: Simple Executive Summary Dashboard and Export - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning
**Source:** Roadmap scope, current reporting/export implementation, and required user consultation on 2026-04-23

<domain>
## Phase Boundary

Phase 21 adds an executive-facing summary surface on top of the existing group-scoped reporting model. It must serve any authorized user within their allowed groups, provide a distinct executive view while also being reachable from the current reporting flow, and ship with both PDF and browser-print paths in the packaged Docker runtime.
</domain>

<decisions>
## Implementation Decisions

### D-01 Surface strategy
- User selected `1C`: deliver both a dedicated executive dashboard surface and an integrated entry inside the existing reporting area.
- Recommended shape: add a dedicated route such as `/reporting/executive` while linking/toggling to it from `/reporting`.
- The executive view must remain clearly simpler than the operational table.

### D-02 Audience
- User selected `2B`: any authorized user with access to the underlying groups can open the executive view.
- No platform-admin-only restriction is allowed in this phase.
- Existing group-scoped authorization boundaries must be preserved for summary cards, top risks, trends, print, and PDF export.

### D-03 Export contract
- User selected `3C`: deliver both executive PDF export and browser-print support in this phase.
- Existing executive PDF route should be upgraded to use the richer executive summary model instead of only high-level counts.
- Browser-print should produce a management-readable page without requiring a separate service.

### D-04 Detail level
- User selected `4C`: executive visibility should be more complete, including cards, top risks, short trend, and useful breakdowns/links.
- Even with more detail, the screen should stay management-readable rather than reverting to the operational data grid.

### D-05 Operations and packaging
- User selected `5C`: Phase 21 must include Docker/runtime validation plus an executive-summary-specific compose smoke path.
- This closes the remaining `OPS-05` scope for executive summary packaging, not just functional UI delivery.
</decisions>

<canonical_refs>
## Canonical References

### Scope
- `.planning/ROADMAP.md` - Phase 21 goal and success criteria.
- `.planning/REQUIREMENTS.md` - `EXEC-01`..`EXEC-05`, `OPS-05`.
- `.planning/STATE.md` - accumulated decisions through Phase 20.

### Existing Reporting and Export Surfaces
- `src/app/reporting/page.tsx` - operational dashboard route and existing export links.
- `src/app/reporting/export/executive.pdf/route.ts` - current executive PDF route.
- `src/reporting/read-models.ts` - dashboard rows/summary and group-scoped reporting read models.
- `src/reporting/query-state.ts` - filter parsing/serialization.
- `src/reporting/predictive.ts` - predictive events and severity signals.
- `src/exports/pdf.ts` - executive/operational PDF builders.
- `src/exports/pdf-templates.js` - executive PDF HTML template.
- `docs/operators.md` - packaged runtime/operator doc surface.
- `scripts/validate-reporting.js`, `scripts/validate-packaging.js`, `scripts/validate-all.js` - existing validation entry points.
</canonical_refs>

<specifics>
## Specific Ideas

- Introduce a dedicated executive read model rather than forcing the operational row model directly into executive cards.
- Reuse existing authorization-scoped certificate visibility logic from reporting read models so executive summaries inherit the same boundaries.
- Add a dedicated executive route and a lightweight mode switch/link from `/reporting`.
- Keep executive filters shallow: likely date period plus a few structured tags, not the full operational filter matrix.
- Include top-risk lists based on current status, predictive severity, open alerts, upcoming expiration/publication delays, and possibly recent incidents.
- Add a short trend component derived from existing polls/coverage gaps/alerts over a limited recent window.
- Rework executive PDF export to render the richer summary, not just totals.
- Add print styles and a compose/runtime smoke validator for the executive dashboard/export path.
</specifics>

<deferred>
## Deferred Ideas

- Full SLO/burn-rate/error-budget analytics remain out of scope for this phase.
- Cross-group benchmarking and dense BI-style breakdowns remain out of scope.
- Separate external reporting service or BI stack remains out of scope.
</deferred>

---

*Phase: 21-simple-executive-summary-dashboard-and-export*
*Context gathered: 2026-04-23 via required planning consultation*
