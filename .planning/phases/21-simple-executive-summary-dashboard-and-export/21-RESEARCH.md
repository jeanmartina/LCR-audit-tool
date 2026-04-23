# Phase 21 Research: Simple Executive Summary Dashboard and Export

**Date:** 2026-04-23
**Phase:** 21 - Simple Executive Summary Dashboard and Export
**Requirements:** EXEC-01, EXEC-02, EXEC-03, EXEC-04, EXEC-05, OPS-05 (executive summary packaging)

## Planning Question

How should the product add an executive-facing summary surface that is materially simpler than the operational reporting grid while preserving the same group-scoped authorization model and packaged Docker runtime guarantees?

## Current Implementation Baseline

Existing assets already in place:

- `src/app/reporting/page.tsx` renders an operational dashboard with summary cards, chip filters, and a dense table of certificate/CRL rows.
- `src/reporting/read-models.ts` already computes authorization-scoped `DashboardRow` and `DashboardSummary` data.
- `src/reporting/predictive.ts` provides predictive severity signals tied to upcoming expiration and publication delay logic.
- `src/app/reporting/export/executive.pdf/route.ts` and `src/exports/pdf.ts` already provide an executive PDF export path, but the current payload is still very shallow: counts, open alerts, upcoming expirations, and the selected period.
- Packaging validators already prove the general reporting/export topology and compose layout, but there is no executive-summary-specific packaged smoke path yet.

## Gap Analysis

### Executive surface gap

The current `/reporting` page is still operator-first. It exposes many chip filters and a broad evidence table. Executives need a smaller number of strong signals:

- current posture by health/risk category;
- top current risks;
- upcoming expiration/publication risk;
- short-term trend;
- direct links into evidence when something needs deeper inspection.

A dedicated executive route is the cleanest way to keep the operational table intact while still allowing an obvious entry point from `/reporting`.

### Read-model gap

`DashboardSummary` is too shallow for `4C`. Phase 21 needs a dedicated executive summary read model that likely includes:

- top-line counts (`healthy`, `degraded`, `offline`, `atRisk`, `openAlerts`);
- risk buckets or prioritized lists;
- upcoming expirations and publication-delay items;
- short trend slices over recent windows;
- filtered scope metadata for export/print.

This should build on existing visible certificates/targets instead of re-implementing authorization.

### Export gap

The executive PDF route exists, so Phase 21 should not invent a second export mechanism. Instead:

- expand `buildExecutivePdf()` to render the richer executive model;
- align on-page executive sections with PDF sections to keep parity;
- add print-friendly page structure/CSS so browser print is a first-class output path.

### Authorization gap

The user chose `2B`, so the executive surface must be available to any authenticated principal with authorized groups. That means the route should rely on the same reporting principal checks already used by `/reporting`, not a stricter admin gate.

### Packaging/OPS gap

`OPS-05` remains partial because executive summary packaging has not yet been proven. Phase 21 therefore needs:

- validator coverage that the executive route/export live inside the packaged app topology;
- operator documentation or proof notes for the packaged executive path;
- a compose smoke path proving route/export availability under the shipped runtime.

## Recommended Plan Split

1. **21-01 Executive Read Models, Authorization, and Export Foundation**
   - executive summary read model;
   - top risks/trends/breakdowns;
   - authorization-scoped route/export plumbing;
   - upgraded executive PDF payload.

2. **21-02 Executive UI, Print Surface, and Reporting Integration**
   - dedicated executive route/page;
   - entry point from `/reporting`;
   - print-friendly layout;
   - links to operational evidence.

3. **21-03 Packaging Proof, Validation, and Docs Closure**
   - executive-specific validators;
   - compose/runtime smoke path;
   - docs/proof updates;
   - close `OPS-05`.

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Executive screen grows into a second operational dashboard | Keep a distinct executive route with a small, fixed set of sections and defer dense breakdowns. |
| Authorization accidentally broadens visibility | Build on the existing reporting visibility model and add validator coverage for principal-scoped routes/exports. |
| PDF and print drift from the UI | Use one executive read model shared by page and export builders. |
| Packaged proof is treated as an afterthought | Reserve a dedicated plan for validators, smoke path, and docs. |
| Trend logic becomes overly analytical | Limit Phase 21 to short recent windows and actionable posture signals, not full SLO analytics. |
