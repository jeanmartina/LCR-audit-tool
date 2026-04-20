# v1.2 Research Summary

**Research date:** 2026-04-13
**Milestone:** v1.2 Trust Lists, Executive Visibility, and Operator UX

## Executive summary

The highest-value v1.2 direction is coherent:
- trust-list ingestion should be added as a new source type in the existing certificate inventory model
- executive reporting should stay intentionally simple and reuse existing evidence/read-model foundations
- UX work should target workflow friction first, not visual polish alone

The strongest architectural constraint is consistency. Trust-list ingestion must not create a second product inside the product. The strongest UX constraint is simplicity. The redesign must reduce steps, reduce ambiguity, and give users field-level help exactly where decisions are made.

## Recommended product shape

### Trust lists

Build ETSI TS 119 612 support around:
- trust-list URL registration
- source snapshot persistence
- sequence/update-aware sync
- extracted certificate projection into the current certificate pipeline
- operator-visible sync status, change summaries, and failures

### Executive visibility

Keep v1.2 executive reporting intentionally narrow:
- overall healthy / degraded / down summary
- top current risks
- upcoming expiration / publication-risk summary
- short trend snapshot
- direct links into operator reporting for investigation

### UX/operator workflow

Prioritize these in order:
1. redesign visual system around clearer hierarchy and calmer forms
2. simplify certificate and ZIP onboarding into guided, low-friction flows
3. add a dedicated first-run platform-admin bootstrap flow
4. add concise field-level hints and examples on settings/admin forms

## Implementation guidance

### What to build first

1. trust-list source model and sync metadata
2. trust-list validation / change-detection pipeline
3. projection into current certificate import
4. operator sync status and provenance UI
5. simple executive summary read models
6. redesign and onboarding consolidation
7. first-run bootstrap and field guidance pass

### What to keep simple in v1.2

- executive analytics depth
- chart count
- number of onboarding entry paths
- advanced settings exposed during first-run flows

## Watch-outs

- do not treat trust-list XML as generic import data; validation and update semantics matter
- do not build a separate admin surface for trust-list assets
- do not confuse a prettier UI with a simpler workflow
- do not over-scope executive analytics before trust-list ingestion is stable

## Source list

- ETSI TS 119 612 entry: https://standards.iteh.ai/catalog/standards/etsi/a3a0a50d-2b1d-4707-b772-7f8bb5d2a09d/etsi-ts-119-612-v1-2-1-2018-10
- EU trusted lists / LOTL overview: https://ec.europa.eu/digital-building-blocks/sites/display/DIGITAL/Trusted+Lists
- DSS trusted lists documentation: https://ec.europa.eu/digital-building-blocks/DSS/webapp-demo/doc/dss-documentation.html#_trusted_lists
- GOV.UK Design System text input: https://design-system.service.gov.uk/components/text-input/
- GOV.UK Design System file upload: https://design-system.service.gov.uk/components/file-upload/
- Material 3 text fields: https://m3.material.io/components/text-fields/overview
- Microsoft dashboard design tips: https://learn.microsoft.com/power-bi/create-reports/service-dashboards-design-tips
