# Phase 5: Reporting E2E Wiring and Audit UX Completion - Context

## Phase Boundary

This phase closes the reporting gap identified by the milestone audit. It is responsible for wiring the existing reporting screens, filters, exports, and audit views to the persisted runtime data introduced in Phase 4.

This phase does not reopen runtime inventory, polling, validation, or alert persistence design. It consumes the durable runtime records and turns them into a complete reporting and evidence UX.

## Implementation Decisions

### Dashboard Filters And Behavior

- The main dashboard must expose filters for source, issuer, criticality, owner, status, and reporting period.
- Dashboard filters must apply automatically as the user changes them.
- Dashboard filter state must remain reproducible through URL/query parameters so the rendered view and exported artifacts refer to the same scope.

### Drill-Down Filters And Behavior

- The drill-down page must expose filters for period, HTTP status, severity, event type, and hash/snapshot.
- Drill-down filters must use explicit `Apply` and `Clear` actions rather than auto-applying.
- Drill-down filter state must also be represented in URL/query parameters so audit views can be reproduced and exported exactly.

### Export Actions In The UI

- The dashboard must expose export actions for:
  - CSV of the currently filtered table
  - executive PDF for the currently filtered dashboard scope
- Each drill-down page must expose export actions for:
  - CSV poll history
  - CSV coverage gaps
  - CSV alert history
  - CSV snapshots
  - operational PDF for the selected target
- Every export must use the same filters currently visible in the UI.

### Drill-Down Audit Layout

- Each target detail page must start with a fixed summary block showing:
  - current status
  - latest incident
  - SLA in the selected period
  - next expiration
  - open alerts
- Evidence navigation below the summary must use tabs.
- The tab set must include:
  - Timeline
  - Polls
  - Coverage gaps
  - Alerts
  - Validation
  - Snapshots
- The default tab must be Timeline because it is the primary audit reconstruction view.

### SLA Defaults And Time Slicing

- The default reporting range must be the last 30 days.
- Quick presets must include:
  - 24h
  - 7d
  - 30d
  - 90d
  - custom
- The dashboard must show SLA per target for the selected period.
- The dashboard must also show an aggregated summary for the selected period at the top of the page.

### The Agent's Discretion

- Planning can decide the exact visual form of the dashboard summary area as long as it clearly exposes the selected-period aggregate.
- Planning can choose the exact tab implementation and route/query mechanics, as long as the state is reproducible and shared by exports.
- Planning can decide whether export actions are buttons or menus, provided the screen-level grouping above is preserved.

### Folded Todos

None.

## Canonical References

### Gap-Closure Drivers

- `.planning/v1.0-MILESTONE-AUDIT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`

### Upstream Phase Artifacts

- `.planning/phases/03-reporting-compliance-governance/03-CONTEXT.md`
- `.planning/phases/03-reporting-compliance-governance/03-01-SUMMARY.md`
- `.planning/phases/04-runtime-inventory-polling-persistence-wiring/04-CONTEXT.md`
- `.planning/phases/04-runtime-inventory-polling-persistence-wiring/04-01-SUMMARY.md`
- `.planning/phases/04-runtime-inventory-polling-persistence-wiring/04-VERIFICATION.md`

## Existing Code Insights

### Reusable Assets

- `src/reporting/read-models.ts` already exposes async read models that can be extended to honor real query/filter state from runtime data.
- `src/reporting/timeline.ts` already builds a unified event feed and is the natural source for the default audit tab.
- `src/exports/csv.ts` and `src/exports/pdf.ts` already generate artifacts with `filtersApplied` and `generatedAt`, but they are not yet connected to UI actions.

### Known Gaps To Close

- `src/app/reporting/page.tsx` still renders filter placeholders instead of functional controls.
- `src/app/reporting/[targetId]/page.tsx` still renders evidence as a simple stacked page instead of summary + tabbed audit navigation.
- The exports exist as builders but are not yet reachable from the UI flow.
- SLA and reporting views must now prove they operate on Phase 4 persisted data rather than placeholder-local structures.

### Integration Points

- UI filter state, read-model queries, and export payloads must share the same filter contract.
- The dashboard and drill-down surfaces must consume the durable runtime evidence produced by Phase 4 without bypassing the runtime store contracts.

## Specific Ideas

- Put the aggregate period summary above the table so compliance can read the global state before drilling into targets.
- Make Timeline the default evidence tab so auditors reconstruct incidents from a single narrative first, then inspect raw slices as needed.
- Keep exports attached to the screen the user is already on so the exported scope is obvious.

## Deferred Ideas

- Saved filter views or named report presets.
- Background export jobs or large-report queueing.
- Additional chart-heavy executive visualizations beyond what is required to close REP-01 and REP-02.
