# Phase 5 Research: Reporting E2E Wiring and Audit UX Completion

## Objective

Identify what must change so the reporting UX, filters, exports, and audit views operate on the persisted runtime evidence introduced in Phase 4 and close the remaining milestone gaps for `MON-02`, `ALT-02`, `REP-01`, and `REP-02`.

## Current Code Findings

### 1. Read models are only partially filter-aware

- `src/reporting/read-models.ts` already exposes `buildDashboardRows()` and `buildDetailEvidence()`.
- The current `ReportFilters` contract only supports dashboard-style fields: `source`, `issuer`, `criticality`, `owner`, `status`, `dateFrom`, `dateTo`.
- Phase 5 context requires additional drill-down filters: HTTP status, severity, event type, and hash/snapshot.
- `buildDetailEvidence()` currently filters poll dates, coverage-gap dates, and alert dates, but:
  - snapshots are not filtered
  - validation failures only expose invalid rows, not richer event-type filtering
  - there is no shared query parser/serializer for URL-driven reporting state

Planning implication:
- Phase 5 needs a single shared filter contract used by dashboard, detail, timeline, and export flows.

### 2. UI is scaffolded, not wired

- `src/app/reporting/page.tsx` shows hardcoded placeholder filter cards instead of functional controls.
- `src/app/reporting/[targetId]/page.tsx` renders one long stacked page with placeholder evidence filters.
- The context requires:
  - dashboard filters that auto-apply
  - drill-down filters with explicit `Apply` / `Clear`
  - a fixed summary block
  - tabs with `Timeline` as default

Planning implication:
- The UI work is not cosmetic; it must establish the query-string contract that the exports and read-models also consume.

### 3. Exports exist as pure builders but are disconnected from delivery

- `src/exports/csv.ts` and `src/exports/pdf.ts` already build payloads with `filtersApplied` and `generatedAt`.
- There is no route handler, server action, or UI trigger that turns those builders into downloadable artifacts.
- The context explicitly requires screen-scoped exports:
  - dashboard: filtered table CSV + executive PDF
  - target detail: polls/gaps/alerts/snapshots CSVs + operational PDF

Planning implication:
- Phase 5 must add a delivery layer for exports, not just button placeholders.
- Export handlers must consume the exact same parsed filters as the page read-models.

### 4. SLA reporting is per-row only; aggregate summary is missing

- `buildDashboardRows()` already computes `slaPercent`, `errorBudgetUsed`, `openAlerts`, `recentAlerts`, and `nextExpiration`.
- The context requires a top-level period summary for the selected time window, but there is no aggregate read model yet.
- `src/metrics/sla-metrics.ts` already exposes `calculateErrorBudget()` and `shouldWarn()`, which are enough to build selected-period aggregates without reopening Phase 2 policy.

Planning implication:
- Phase 5 should add a dashboard summary read model rather than recomputing aggregates directly inside the page component.

### 5. Runtime evidence is durable enough to consume, but the reporting layer still allows fallback behavior

- `src/storage/runtime-store.ts` persists targets, polls, validation events, alerts, snapshots, and coverage gaps.
- `src/storage/coverage-records.ts` still keeps in-memory arrays and falls back to them when persisted rows are absent.
- This is acceptable for local/dev fallback, but the milestone gap requires reporting to prove it is wired to the runtime evidence path.

Planning implication:
- The plan should make reporting explicitly consume the persisted/read-contract path, while preserving the current fallback only as an implementation detail if no DB is configured.

### 6. Validation coverage is too shallow for Phase 5 acceptance

- `scripts/validate-reporting.js` currently checks for headings, strings, and placeholder text.
- That was enough for the original scaffold, but not for end-to-end closure.

Planning implication:
- Phase 5 must upgrade the validation script to assert functional filter wiring, tab/export presence, and aggregate reporting support.

## Recommended Implementation Direction

### Shared reporting filter contract

- Extend `ReportFilters` with detail-level filter fields:
  - `httpStatus`
  - `severity`
  - `eventType`
  - `snapshotHash`
  - period preset metadata as needed
- Add a shared parser/serializer module so:
  - dashboard pages read filters from `searchParams`
  - detail pages read filters from `searchParams`
  - export handlers reuse the same filter parsing

### URL-driven reporting UX

- Dashboard auto-apply fits server-rendered query strings well: filter controls can write query parameters and let the page rerender.
- Drill-down explicit apply/clear also fits URL state: a form submits the selected filters, and `Clear` resets to the default 30-day view.
- Tab state should also live in the query string to keep audit links reproducible.

### Screen-scoped export routes

- Keep the existing builder functions and add thin route handlers or equivalent server-side entrypoints that:
  - parse the current query filters
  - call the matching export builder
  - return downloadable content
- This keeps export behavior aligned with the visible reporting scope instead of duplicating export logic in the UI.

### Dedicated dashboard summary read model

- Build an aggregate summary function over the selected period, for example:
  - total targets
  - healthy/degraded/offline counts
  - average SLA
  - open alerts
  - targets with upcoming expirations
- This matches the Phase 5 requirement without entangling summary logic with JSX.

## Planning Constraints

- Do not reopen persistence or scheduler design; Phase 5 consumes Phase 4 contracts.
- Do not add new reporting capabilities beyond the scope decisions already captured in `05-CONTEXT.md`.
- Keep exports and UI tied to the same query/filter contract, otherwise `filtersApplied` becomes misleading.
- Replace placeholder validation checks with behavior-oriented checks that can fail if the UX is not truly wired.

## Deliverables The Plan Should Produce

- functional filter/query contract shared by dashboard, detail, timeline, and exports
- aggregate dashboard summary read model for the selected period
- dashboard page wired to functional filters and export actions
- detail page wired to summary + tabs + explicit filter application
- export delivery layer for CSV/PDF actions
- stronger `scripts/validate-reporting.js` coverage for real Phase 5 behavior

## Risks To Watch

- If filter parsing is duplicated between pages and export handlers, the evidence view and exported data will drift.
- If tabs are implemented only in the UI and not reflected in query state, audit links will not be reproducible.
- If reporting continues to rely on placeholder-local arrays implicitly, the milestone gap around end-to-end evidence wiring will remain open.

## Bottom Line

Phase 5 is not a visual polish phase. It is a contract-wiring phase: shared query state, real read-model consumption, screen-level export delivery, and audit-friendly navigation over the runtime evidence already persisted in Phase 4.
