# Phase 25: Monitoring Source Reporting and Executive Visibility - Context

**Gathered:** 2026-05-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Expose derived OCSP and policy-document source health in operator reporting and executive summary views under the existing authorization model. This phase is limited to reporting and visibility for already-derived sources; derivation, fetching, and worker execution are handled in earlier phases.

</domain>

<decisions>
## Implementation Decisions

### Operator drill-down
- **D-01:** Show derived OCSP and policy-document sources in a single section per certificate.
- **D-02:** Group sources by type, with OCSP listed before policy-documents.
- **D-03:** Show the latest state for each derived source and a direct link to the full history.
- **D-04:** Use more legible interface labels: `OCSP`, `documentos de política`, and `não verificável`.
- **D-05:** Render each derived source with type, status, last check, URL, failure reason, raw evidence, and history link.
- **D-06:** When a source is `não verificável` or `bloqueada`, keep the history link visible but disabled.

### Executive summary
- **D-07:** Keep the executive summary balanced rather than making OCSP/policy-doc cards dominant.
- **D-08:** Add compact OCSP and policy-document card groups near the top of the executive summary.
- **D-09:** The new executive cards should show counts by status, the latest event, and a shortcut to the evidence.
- **D-10:** The policy-document executive card should balance availability and risk together instead of emphasizing only one side.

### the agent's Discretion
- Exact visual treatment of the new reporting sections and cards.
- How to map the new source health data into the existing reporting read models and copy system.
- How to preserve print/PDF stability while adding the new reporting surfaces.

</decisions>

<specifics>
## Specific Ideas

- The operator drill-down should feel like an extension of the current certificate detail page, not a separate source-management console.
- The executive summary should stay compact and readable for management use.

</specifics>

<canonical_refs>
## Canonical References

### Milestone scope
- `.planning/ROADMAP.md` - Defines v1.3 Phase 25 as reporting and executive visibility for derived sources.
- `.planning/REQUIREMENTS.md` - Defines REP-04, REP-05, and REP-06.

### Existing reporting surfaces
- `src/app/reporting/page.tsx` - Current operational reporting layout.
- `src/app/reporting/[targetId]/page.tsx` - Current certificate drill-down page.
- `src/app/reporting/executive/page.tsx` - Current executive summary surface.
- `src/reporting/read-models.ts` - Reporting and executive read models that phase 25 will extend.
- `src/i18n/index.ts` - Existing reporting copy and translations.

### Monitoring source context
- `src/monitoring-sources/types.ts` - Derived source type and lifecycle state definitions.
- `src/monitoring-sources/ocsp-types.ts` - OCSP event/evidence types.
- `src/monitoring-sources/document-types.ts` - Policy-document event/snapshot types.
- `src/storage/runtime-store.ts` - Persistence helpers for derived source evidence and history.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `buildDetailEvidence` in `src/reporting/read-models.ts` already assembles the certificate drill-down evidence view and is the natural place to attach derived-source reporting.
- `buildExecutiveSummary` already provides top risks, trend, and breakdown sections that can be extended with compact source-health cards.

### Established Patterns
- The reporting pages use server-rendered React with inline layout objects and translator-driven copy.
- Visibility is already enforced by principal-scoped read models, so new source reporting should follow the same authorization boundaries.

### Integration Points
- Derived-source drill-down belongs in `src/app/reporting/[targetId]/page.tsx` and the corresponding read model.
- Executive source cards belong in `src/app/reporting/executive/page.tsx` and the executive summary read model.
- Copy additions belong in `src/i18n/index.ts`.

</code_context>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 25-monitoring-source-reporting-and-executive-visibility*
*Context gathered: 2026-05-09*
