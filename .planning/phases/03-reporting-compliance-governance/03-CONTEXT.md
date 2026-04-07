# Phase 3: Reporting & Compliance Governance - Context

## Phase Boundary

This phase is responsible for turning the recorded monitoring, validation, alerting, and coverage data into compliance-ready reporting surfaces. It covers the dashboard, drill-down views, exports, and evidence access patterns required to justify SLA performance and coverage continuity.

This phase does not expand polling, validation, or alert delivery rules beyond what Phases 1 and 2 already implemented. It consumes those records and presents them with audit-oriented navigation, filtering, and export formats.

## Implementation Decisions

### Dashboard Information Hierarchy

- The main dashboard must show current status per list/certificate with detail.
- The main dashboard must show the latest unavailability event.
- SLA must be explorable by period, with time-based slicing.
- Upcoming LCR expirations must be visible without drill-down.
- Open alerts and recent alerts must be visible from the main view.
- The dashboard must support filters by source, issuer, criticality, and owner/responsible party.

### Drill-Down And Audit Trail

- Detail views for a list or certificate must include poll history with timestamp, HTTP status, and timeout outcomes.
- Coverage loss windows must be shown with start, end, and duration.
- Alert history must show severity and recipients.
- The UI must expose the latest valid LCR metadata and previous snapshots.
- Validation failures must show the exact failure reason.
- A unified timeline must combine poll, alert, expiration, validation failure, recovery, and coverage-loss events.

### Export Formats

- CSV exports must support the filtered main table.
- CSV exports must support per-list or per-certificate detail reports.
- CSV exports must support coverage gap history.
- CSV exports must support alert history.
- CSV exports must support the inventory of LCR artifacts and snapshots.
- The system must generate two PDF variants:
  - operational PDF with detailed evidence
  - executive PDF with consolidated summary
- Every CSV and PDF must record the applied filters and the export generation timestamp.

### Retention And Evidence Access

- Polls, alerts, and coverage gaps must use a configurable retention policy per certificate/target.
- The system must define a non-conservative default retention when no per-target override exists.
- LCR snapshots are retained permanently.
- The UI must support date-range search and compound filters over evidence records.

### The Agent's Discretion

- The exact default retention window can be chosen during planning, as long as it is pragmatic and clearly documented as the system default.
- The exact dashboard composition can be split across summary cards, tables, and detail drawers/pages during planning, as long as the required information hierarchy remains intact.
- Export generation can be implemented synchronously or asynchronously depending on stack constraints, provided the user-facing audit guarantees remain the same.

### Folded Todos

None.

## Canonical References

### Reporting Requirements

- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`

### Upstream Phase Artifacts

- `.planning/phases/01-observability-polling-foundation/01-CONTEXT.md`
- `.planning/phases/01-observability-polling-foundation/01-VERIFICATION.md`
- `.planning/phases/02-integrity-alerting-core/02-CONTEXT.md`
- `.planning/phases/02-integrity-alerting-core/02-VERIFICATION.md`

## Existing Code Insights

### Reusable Assets

- `src/storage/coverage-records.ts` already defines poll and coverage-gap data structures plus metadata fields needed by reporting.
- `src/metrics/sla-metrics.ts` already provides helpers for SLA-oriented calculations.
- `src/alerting/alert-policy.ts` already defines severity and cooldown semantics that reporting can surface.

### Established Patterns

- Per-target configuration already exists in `src/inventory/targets.ts`, which is the natural home for default/override retention settings if Phase 3 needs them.
- Phase summaries and verification files are already used as the source of truth for milestone state transitions.

### Integration Points

- Reporting must consume data written by the scheduler and storage layers rather than duplicating event derivation.
- Export artifacts must remain traceable back to the filtered evidence shown in the dashboard.

## Specific Ideas

- Make the main dashboard table the primary operational surface, with filters and expandable detail paths.
- Use the unified event timeline as the main audit narrative for a single list/certificate.
- Separate executive PDF content from operational PDF content instead of trying to make one report serve both audiences.

## Deferred Ideas

- Advanced executive benchmarking across issuers or countries.
- Predictive risk scoring beyond the currently recorded SLA and coverage evidence.

