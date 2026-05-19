# Phase 31: Dashboard and Reporting - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Improve clarity and consistency of dashboard/reporting surfaces for operational monitoring by:
- keeping healthy items visible without hiding risk
- making derived-source states explicit and readable
- making timelines/logs explain issues in human terms
- making actions appear as consistent controls
- turning detail views into diagnostic pages instead of raw data dumps

Scope is limited to presentation and interaction clarity for existing monitoring/reporting capabilities, not new monitoring engines.

</domain>

<decisions>
## Implementation Decisions

### Visibility Model
- **D-01:** Dashboard default must show healthy and problematic items together.
- **D-02:** Problematic items must be prioritized at the top while healthy items remain visible in the same view.

### Derived State Taxonomy
- **D-03:** Use a medium taxonomy with six operator-facing states: `ok`, `degraded`, `blocked`, `failed`, `not-checkable`, `unknown`.
- **D-04:** Keep this taxonomy consistent across dashboard list, summary badges, and detail diagnostics.

### Timeline and Log Explainability
- **D-05:** Timeline/log entries must default to human-readable phrasing.
- **D-06:** Technical evidence/details must be available via expandable drill-down per event.

### Action Consistency
- **D-07:** Use a hybrid action pattern:
  - global primary actions fixed at page level
  - contextual actions inline per item
- **D-08:** Action styling and hierarchy should remain consistent across dashboard and detail pages.

### the agent's Discretion
- Exact visual encoding for six-state badges/chips (colors/icons), as long as consistency and readability are preserved.
- Exact interaction pattern for technical detail expansion (accordion, drawer, inline expand), as long as human-first default is preserved.
- Internal read-model refactors needed to support the clarified view model.

</decisions>

<specifics>
## Specific Ideas

- Keep healthy visibility as a first-class behavior to avoid dashboards that only show broken items.
- Prioritization should come from clear ordering and emphasis, not by filtering healthy items out.
- Human-readable timeline copy should help non-specialists understand what happened before diving into technical evidence.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and requirement source
- `.planning/ROADMAP.md` — Phase 31 goal and success criteria.
- `.planning/REQUIREMENTS.md` — `UI-05` requirement definition.

### Existing reporting and read models
- `src/app/reporting/page.tsx` — dashboard/reporting entry surface.
- `src/app/reporting/[targetId]/page.tsx` — detail reporting page to be transformed into diagnostic-first view.
- `src/app/reporting/executive/page.tsx` — executive summary alignment constraints.
- `src/reporting/read-models.ts` — source for list/detail/executive state composition.
- `src/i18n/index.ts` — copy system for human-readable timeline/log language.

### Prior phase continuity
- `.planning/phases/25-monitoring-source-reporting-and-executive-visibility/25-CONTEXT.md` — prior decisions on derived-source reporting and executive card balance.
- `.planning/phases/29-trust-lists-and-diagnostics/29-CONTEXT.md` — diagnostics clarity and failure-layer communication expectations.
- `.planning/phases/30-import-review-and-safety/30-CONTEXT.md` — review/safety decision vocabulary that should remain consistent in downstream reporting.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Reporting read-model builders already aggregate operational and evidence data and should be reused rather than replaced.
- Existing localization scaffolding can carry the human-first timeline language and state taxonomy labels.

### Established Patterns
- Server-rendered reporting pages with translator-driven copy are already established and should be preserved.
- Authorization is principal/group scoped in read models and must remain unchanged.

### Integration Points
- Dashboard ordering and visibility logic should be centralized in reporting read models.
- State taxonomy mapping should be normalized in a single transformation layer and reused by dashboard/detail views.
- Timeline human copy + technical expansion should be wired in detail reporting views and shared components where possible.

</code_context>

<deferred>
## Deferred Ideas

- New dashboard capabilities outside UI-05 scope (e.g., brand-new analytics modules, new monitor types, cross-phase alerting features).
- Any new capability that changes monitoring collection behavior rather than reporting clarity.

</deferred>

---

*Phase: 31-dashboard-and-reporting*
*Context gathered: 2026-05-13*
