# Phase 6 Research: Real PDF Export Delivery

## Objective

Determine the smallest, defensible path to replace the current fake `.pdf` exports with actual PDF artifacts while preserving the existing reporting filter scope and the separate executive/operational report models.

## Current State

### 1. The current PDF path is not a PDF path

- `src/exports/pdf.ts` currently returns structured metadata plus a plain text `body`.
- `src/app/reporting/export/executive.pdf/route.ts` returns that text body with `content-type: text/plain; charset=utf-8`.
- `src/app/reporting/[targetId]/export/operational.pdf/route.ts` does the same.

This matches the milestone audit finding exactly: the UI advertises a PDF export, but the route does not produce a PDF artifact.

### 2. The data scope problem is already solved

- `src/reporting/query-state.ts` already gives Phase 6 what it needs for audit-safe scope handling:
  - parsed filters from query parameters
  - default reporting window
  - serialized filters for traceability
- `src/exports/pdf.ts` already distinguishes executive vs operational outputs and already depends on the same read-model layer as the UI.

Planning implication:
- Phase 6 should preserve this contract and only replace the rendering/delivery layer.

### 3. The project has no PDF dependency yet

- `package.json` only includes `next`, `react`, `react-dom`, `tailwindcss`, `typescript`, and `pg`.
- There is no existing HTML-to-PDF or PDF renderer in the repo.

Planning implication:
- The phase must introduce one PDF-capable dependency or an equivalent rendering strategy.
- Because the user already chose HTML -> PDF, the plan should explicitly include dependency installation and rendering integration.

### 4. There is no compile/build safety net in the repo

- No `tsconfig.json` is present.
- Phase verification so far relies on focused validation scripts rather than a full Next build or typecheck.

Planning implication:
- Phase 6 verification should not depend on a full project build suddenly existing.
- The validation path should be explicit and local to PDF delivery: route contract, MIME type, and PDF byte signature.

### 5. HTML -> PDF is the correct scope fit here

Given the user decisions:
- PDF should be a report-specific export, not a literal mirror of the live page.
- Executive and operational outputs should remain distinct.

That makes a template-based HTML -> PDF path the most coherent option because it:
- reuses current report/read-model inputs
- supports fixed headers/sections better than trying to mirror interactive UI
- avoids inventing a second data model just for PDF output

## Recommended Direction

### Separate report templates from route handlers

- Keep route handlers thin.
- Move PDF-specific HTML rendering into dedicated export/template functions or modules.
- Keep executive and operational templates separate so they remain clear and auditable.

### Replace text-body builders with PDF-oriented result builders

- `src/exports/pdf.ts` should stop modeling output as freeform text.
- It should instead build:
  - rendered HTML (or an intermediate report model plus HTML renderer)
  - PDF bytes/buffer
  - file metadata and serialized filters

### Upgrade validation to close the audit gap directly

The validation bar from `06-CONTEXT.md` implies three checks:
- route/handler emits `application/pdf`
- returned bytes start with `%PDF-`
- content validation proves expected report structure exists

Because the repo does not have a full E2E test harness, the most practical path is:
- expose PDF rendering helpers from `src/exports/pdf.ts`
- validate their returned bytes and minimal text/content markers from a dedicated script
- also validate that the route files set `application/pdf`

## Planning Constraints

- Do not reopen dashboard filtering, read-model scope, or CSV export behavior.
- Do not collapse executive and operational exports into one report.
- Keep all PDF exports tied to the same filter scope already serialized by `query-state.ts`.
- Validation must be strong enough that the milestone audit cannot fail on “fake PDFs” again.

## Deliverables The Plan Should Produce

- real PDF generation integrated into executive and operational export flows
- route handlers returning `application/pdf`
- dedicated report HTML/template path for executive and operational variants
- updated validation proving MIME type, PDF signature bytes, and minimum content expectations

## Risks To Watch

- Adding a PDF dependency may require environment-specific setup; the plan should keep this contained and explicit.
- If the PDF renderer is coupled directly to page JSX, Phase 6 may accidentally reopen Phase 5 UI scope.
- If validation only checks headers, the milestone can regress back to non-PDF payloads with misleading metadata.

## Bottom Line

Phase 6 is a narrow delivery phase. The filter and reporting contracts already exist. The missing work is a real HTML-to-PDF rendering path plus validation strict enough to prove the exported artifacts are genuine PDFs.
