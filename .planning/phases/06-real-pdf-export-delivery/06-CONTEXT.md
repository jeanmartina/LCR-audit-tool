# Phase 6: Real PDF Export Delivery - Context

## Phase Boundary

This phase closes the final milestone blocker identified by the `v1.0` audit: the reporting UI currently exposes `.pdf` exports, but the routes return plain-text payloads instead of actual PDF documents.

This phase does not reopen the broader reporting/filtering scope from Phase 5. It is specifically responsible for delivering real PDF artifacts for the existing executive and operational export flows while preserving the same filter scope already defined by the reporting UI.

## Implementation Decisions

### PDF Generation Strategy

- PDF export must be generated from server-side HTML rendered into PDF.
- This phase should not switch to a fully programmatic PDF model unless planning discovers a hard blocker in the chosen HTML-to-PDF path.

### Relationship To Current UI

- PDF exports do not need to be literal visual mirrors of the current screen.
- PDF exports must be purpose-built report layouts.
- Even though the PDF layout is report-specific, it must preserve the exact same filter scope and data scope as the screen from which the export is triggered.

### Executive vs Operational Report Scope

- The executive PDF must include:
  - summary header
  - reporting period
  - filters applied
  - totals by status
  - average SLA
  - open alerts
  - upcoming expirations
- The operational PDF must include:
  - report header
  - filters applied
  - target summary
  - evidence sections for timeline, coverage gaps, alerts, validation failures, and snapshots

### Validation Bar For Milestone Closure

- The phase is only complete when the export routes deliver real PDF artifacts.
- Validation must check all of the following:
  - `content-type` is `application/pdf`
  - returned bytes begin with a valid PDF signature such as `%PDF-`
  - the export path proves minimum expected report content is present, not only route existence

### The Agent's Discretion

- Planning can choose the concrete HTML-to-PDF tooling, provided it fits the current Next.js project structure and does not reopen unrelated reporting work.
- Planning can decide whether PDF templates live inline or in dedicated report-rendering modules, as long as executive and operational outputs remain distinct.
- Planning can choose the most practical validation mechanism for content assertions, as long as it proves more than MIME type alone.

### Folded Todos

None.

## Canonical References

### Gap Drivers

- `.planning/v1.0-MILESTONE-AUDIT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`

### Upstream Reporting Artifacts

- `.planning/phases/05-reporting-e2e-wiring-audit-ux-completion/05-CONTEXT.md`
- `.planning/phases/05-reporting-e2e-wiring-audit-ux-completion/05-RESEARCH.md`
- `.planning/phases/05-reporting-e2e-wiring-audit-ux-completion/05-01-SUMMARY.md`
- `.planning/phases/05-reporting-e2e-wiring-audit-ux-completion/05-VERIFICATION.md`

## Existing Code Insights

### Reusable Assets

- `src/exports/pdf.ts` already defines separate executive and operational export builders.
- `src/reporting/query-state.ts` already serializes the active filter scope shared by reporting pages and export routes.
- Existing export routes in `src/app/reporting/export/` and `src/app/reporting/[targetId]/export/` already define the route shape that should now deliver real PDFs.

### Known Gap To Close

- The current `.pdf` routes stream `text/plain` payloads instead of `application/pdf`, which is the direct blocker recorded in the milestone audit.

### Integration Points

- The real PDF generation path must consume the same parsed filters used by the reporting UI.
- The executive and operational report content should remain aligned with the current reporting read-models rather than inventing a second reporting data path.

## Specific Ideas

- Keep executive and operational templates distinct instead of forcing one PDF layout to serve both audiences.
- Validate both the route headers and the returned bytes so the audit cannot regress back to fake `.pdf` downloads.

## Deferred Ideas

- Pixel-perfect mirroring of the live dashboard UI inside PDF output.
- Advanced branding/layout polish beyond what is required to close the milestone blocker.
