---
phase: 25
plan: 25-01
name: Derived Source Reporting Model and Operator/Executive Surfaces
wave: 1
depends_on:
  - 22
  - 23
  - 24
requirements_addressed: [REP-04, REP-05, REP-06]
requirements:
  - REP-04
  - REP-05
  - REP-06
autonomous: true
files_modified:
  - src/reporting/read-models.ts
  - src/reporting/query-state.ts
  - src/app/reporting/[targetId]/page.tsx
  - src/app/reporting/executive/page.tsx
  - src/i18n/index.ts
  - scripts/validate-reporting.js
  - .planning/phases/25-monitoring-source-reporting-and-executive-visibility/25-PROOF.md
---

# Phase 25 Plan 25-01: Monitoring Source Reporting and Executive Visibility

**Created:** 2026-05-09  
**Status:** Ready for execution

## Objective

Expose derived OCSP and policy-document source health in the operator drill-down and executive summary while preserving existing authorization rules, print/PDF stability, and the current certificate-centric reporting flow.

## Scope

### In Scope

- Extend the reporting read-models to assemble derived-source detail and executive summaries from OCSP and policy-document evidence.
- Add a single derived-source section to the certificate drill-down page that groups OCSP before policy-documents and links to full history.
- Add compact executive cards for OCSP and policy-document visibility, including counts, latest event, and evidence shortcuts.
- Keep reporting access bound to parent certificate/group visibility.
- Extend validation to cover the new reporting contract and semantic boundaries.

### Out of Scope

- Derived-source derivation or worker execution.
- Manual OCSP or document source management.
- New analytics such as SLOs, burn rates, or error budgets.
- Operations/configuration docs and compose/env wiring.

## Canonical References

- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/phases/25-monitoring-source-reporting-and-executive-visibility/25-CONTEXT.md`
- `src/reporting/read-models.ts`
- `src/app/reporting/[targetId]/page.tsx`
- `src/app/reporting/executive/page.tsx`
- `src/app/reporting/page.tsx`
- `src/i18n/index.ts`
- `src/storage/runtime-store.ts`
- `src/monitoring-sources/ocsp-types.ts`
- `src/monitoring-sources/document-types.ts`
- `src/monitoring-sources/types.ts`

## Threat Model

<threat_model>
T-25-01: Derived-source evidence can be surfaced without obeying parent certificate/group visibility and leak data across principals. Mitigation: reporting read-models must reuse the existing certificate visibility checks and group-scoped filtering before assembling any derived-source rows.

T-25-02: Reporting copy can accidentally imply that OCSP reachability or policy-document availability is full compliance validation. Mitigation: UI copy and executive cards must stay evidence-oriented and use the phase 24 technical boundary language.

T-25-03: Adding source-health cards can disrupt the current reporting and PDF/print surfaces. Mitigation: extend the existing layouts incrementally and keep the current dashboard/executive entry points intact.
</threat_model>

## Implementation Tasks

<task id="25-01-T1" title="Extend reporting read-models for derived sources">
  <read_first>
    - `src/reporting/read-models.ts`
    - `src/storage/runtime-store.ts`
    - `src/monitoring-sources/ocsp-types.ts`
    - `src/monitoring-sources/document-types.ts`
    - `src/monitoring-sources/types.ts`
    - `src/reporting/query-state.ts`
  </read_first>
  <action>
    Extend `src/reporting/read-models.ts` with derived-source-aware read models.

    Add helper types and data assembly for:
    - certificate-scoped OCSP source rows
    - certificate-scoped policy-document source rows
    - latest event / latest evidence metadata
    - source history links
    - executive source-health summaries

    The data model must:
    - reuse the existing certificate visibility checks
    - keep OCSP sources listed before policy-documents
    - preserve the latest event per source as the primary summary
    - expose enough metadata for a disabled history link when the source is `not_checkable` or `blocked`
    - keep the executive summary compact enough for the current page and PDF surfaces
  </action>
  <acceptance_criteria>
    - `src/reporting/read-models.ts` contains derived-source reporting helpers or types.
    - `src/reporting/read-models.ts` contains `ocsp` and `policy-document` reporting data paths.
    - `src/reporting/read-models.ts` preserves parent certificate/group visibility when assembling derived-source rows.
    - `src/reporting/read-models.ts` exposes latest event and evidence metadata for reporting.
    - `src/reporting/read-models.ts` exposes executive source-health aggregates for OCSP and policy-documents.
  </acceptance_criteria>
</task>

<task id="25-01-T2" title="Render derived sources in operator and executive pages">
  <read_first>
    - `src/app/reporting/[targetId]/page.tsx`
    - `src/app/reporting/executive/page.tsx`
    - `src/app/reporting/page.tsx`
    - `src/i18n/index.ts`
    - `src/reporting/read-models.ts`
  </read_first>
  <action>
    Update the operator and executive reporting surfaces.

    Operator drill-down:
    - add one derived-source section per certificate
    - group sources by type, with OCSP first
    - show type, status, last check, URL, failure reason, raw evidence, and a history link
    - keep the history link visible but disabled for `not_checkable` and `blocked`
    - use the agreed user-facing labels: `OCSP`, `documentos de política`, and `não verificável`

    Executive summary:
    - add compact OCSP and policy-document card groups near the top
    - show counts by status, latest event, and a shortcut to evidence
    - keep policy-document cards balanced between availability and risk
    - preserve the current top risks, upcoming risks, trend, and breakdown sections
  </action>
  <acceptance_criteria>
    - `src/app/reporting/[targetId]/page.tsx` renders a derived-source section for the certificate drill-down.
    - `src/app/reporting/[targetId]/page.tsx` keeps history links disabled for `not_checkable` and `blocked`.
    - `src/app/reporting/[targetId]/page.tsx` uses OCSP before policy-documents.
    - `src/app/reporting/executive/page.tsx` renders compact OCSP and policy-document cards.
    - `src/app/reporting/executive/page.tsx` preserves the existing executive sections.
    - `src/i18n/index.ts` includes copy for the new reporting labels and card text.
  </acceptance_criteria>
</task>

<task id="25-01-T3" title="Validate reporting contract and phase boundary">
  <read_first>
    - `scripts/validate-reporting.js`
    - `src/reporting/read-models.ts`
    - `src/app/reporting/[targetId]/page.tsx`
    - `src/app/reporting/executive/page.tsx`
    - `src/i18n/index.ts`
  </read_first>
  <action>
    Extend `scripts/validate-reporting.js` to cover the phase 25 contract.

    The validator should assert:
    - the operator drill-down contains the derived-source section
    - the executive summary contains the new OCSP and policy-document cards
    - the agreed user-facing labels are present
    - reporting still references the current parent-certificate authorization path
    - the disabled history-link behavior is represented in the operator surface
    - the reporting validator remains the single source of truth for the new reporting contract
  </action>
  <acceptance_criteria>
    - `scripts/validate-reporting.js` contains phase 25 markers for REP-04, REP-05, and REP-06.
    - `scripts/validate-reporting.js` contains the derived-source section assertions.
    - `node scripts/validate-reporting.js` exits 0 after this phase is complete.
    - `npm run typecheck` exits 0 after this phase is complete.
    - `npm run build` exits 0 after this phase is complete.
  </acceptance_criteria>
</task>

## Verification Commands

```bash
node scripts/validate-reporting.js
npm run typecheck
npm run build
```

## Must Haves

- Derived-source reporting must remain principal-scoped to the parent certificate/group boundary.
- Operator reporting must present OCSP and policy-document sources as evidence, not as semantic compliance validation.
- Executive reporting must stay compact and readable while adding the new source-health cards.
