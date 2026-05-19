# Phase 32: Executive PDF - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the executive PDF read like a professional executive report, keep Unicode/accent rendering safe, enforce fixed/predictable sections, and keep the PDF aligned with the same executive read model used by the web executive view.

</domain>

<decisions>
## Implementation Decisions

### Report visual language
- **D-01:** Use a classic corporate appearance for the executive PDF (clean and sober typography, simple tables/lists, restrained visual decoration).

### Fixed section order
- **D-02:** Use this exact section order in the executive PDF: cover/scope -> executive summary -> derived source status -> top risks -> trend -> final notes.

### Unicode and accent safety gate
- **D-03:** Unicode/accent rendering is a hard gate: release is blocked if executive PDF output shows broken characters.

### Read-model parity
- **D-04:** Executive PDF must use exactly the same underlying executive read model and fields as the web executive view; no parallel data logic.

### the agent's Discretion
- Minor typography sizing/spacing values within the selected corporate style.
- Exact wording of final notes section while preserving executive tone.

</decisions>

<specifics>
## Specific Ideas

- The report should feel professional first, not marketing-like.
- Predictable fixed sections are mandatory so leadership can quickly find the same information in every export.
- No tolerance for accent/Unicode regressions in exported PDF text.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirement mapping
- `.planning/ROADMAP.md` — Defines Phase 32 goal and success criteria for UI-06.
- `.planning/REQUIREMENTS.md` — Defines UI-06 requirement semantics and milestone traceability.

### Executive read model and web surface
- `src/reporting/read-models.ts` — Executive summary/read-model contracts used by reporting surfaces.
- `src/app/reporting/executive/page.tsx` — Current web executive view structure and section semantics.

### Executive PDF export pipeline
- `src/app/reporting/export/executive.pdf/route.ts` — Executive PDF route and response contract.
- `src/exports/pdf.ts` — `buildExecutivePdf()` assembly and read-model usage.
- `src/exports/pdf-templates.js` — Executive PDF HTML template and section rendering order.
- `src/exports/pdf-engine.js` — HTML-to-PDF rendering behavior relevant to Unicode output.

### Validation guards
- `scripts/validate-reporting.js` — Reporting/PDF audit anchors including executive PDF checks.
- `scripts/validate-i18n.js` — i18n/PDF localization anchors.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `buildExecutiveSummary(filters, principal)` in `src/reporting/read-models.ts`: already provides executive-level aggregates/risk/trend data.
- `buildExecutivePdf()` in `src/exports/pdf.ts`: existing orchestrator that should remain the single PDF assembly path.
- `renderExecutiveReportHtml()` in `src/exports/pdf-templates.js`: existing executive PDF section renderer, currently simple and predictable.

### Established Patterns
- Principal-scoped translators and labels are resolved through `getPrincipalTranslator()` and `t(...)` keys.
- Executive web and export routes already share filter parsing via `parseReportFilters`.
- Validation scripts assert key reporting/PDF contracts and should be extended rather than bypassed.

### Integration Points
- Web executive view (`src/app/reporting/executive/page.tsx`) and PDF assembly (`src/exports/pdf.ts`) must remain aligned through shared read-model fields.
- Export route (`src/app/reporting/export/executive.pdf/route.ts`) is the delivery point for binary PDF and should preserve auth/principal behavior.

</code_context>

<deferred>
## Deferred Ideas

- Rich chart-heavy visual redesign for executive PDF beyond the selected conservative corporate style.
- Any independent PDF data pipeline differing from the web executive read model.

</deferred>

---

*Phase: 32-executive-pdf*
*Context gathered: 2026-05-19*
