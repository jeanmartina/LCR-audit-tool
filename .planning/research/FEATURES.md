# v1.2 Research: FEATURES

**Research date:** 2026-04-13
**Milestone focus:** ETSI trust-list ingestion, executive summaries, and simpler operator UX

## Trust-list ingestion

### Table stakes

- add a trust-list source by URL
- fetch and parse LOTL / TSL metadata safely
- extract certificates and service metadata from supported trust lists
- re-import affected certificates when the tracked trust list changes
- preserve operator visibility into source status, last sync, next update, and sync failures

### Differentiators

- unify trust-list ingestion with the existing certificate-first admin model instead of creating a separate product island
- make the resulting assets traceable back to their trust-list source, sequence number, and import run
- expose safe re-sync behavior and change summaries instead of opaque background ingestion

### Anti-features

- forcing operators to understand raw XML structure to use the feature
- creating a second admin UI unrelated to certificate onboarding
- silently mutating monitored inventory without an audit trail

## Executive visibility

### Table stakes

- high-level coverage summary at a glance
- trend or snapshot of healthy / degraded / down assets
- most critical active issues
- upcoming expiration / publication risk summary
- easy PDF or screen-friendly executive summary

### Differentiators

- tie executive summaries to the same evidence trail as operator reporting
- keep the surface simple: fewer charts, stronger status narrative, and clearer risk blocks
- separate executive questions from operator questions explicitly

### Anti-features

- crowded analytics surfaces with every metric from the operator dashboard
- BI-style controls that require training
- exposing raw CRL mechanics where leadership only needs business risk and status

## UX and operator workflow

### Table stakes

- clearer first-run setup
- simpler certificate and ZIP onboarding
- field hints and examples on editable forms
- clearer group defaults and onboarding consequences
- stronger empty states and next-step guidance

### Differentiators

- one coherent onboarding path from first admin setup to first monitored artifact
- minimal-step flows with progressive disclosure for advanced settings
- predictable information hierarchy for admins vs operators vs viewers

### Anti-features

- dumping all configuration on one screen
- using untranslated or overly technical field names in primary flows
- making operators switch between multiple disconnected surfaces to finish one task

## Priority order from user guidance

1. visual redesign
2. easier certificate / ZIP onboarding
3. first-run platform-admin bootstrap in the web UI
4. field-level hints and contextual guidance
5. trust-list ingestion and re-import
6. executive dashboards / summaries

## Sources

- EU trusted lists overview: https://ec.europa.eu/digital-building-blocks/sites/display/DIGITAL/Trusted+Lists
- GOV.UK file upload: https://design-system.service.gov.uk/components/file-upload/
- GOV.UK text input: https://design-system.service.gov.uk/components/text-input/
- Material text fields: https://m3.material.io/components/text-fields/overview
- Microsoft Power BI dashboard design guidance: https://learn.microsoft.com/power-bi/create-reports/service-dashboards-design-tips
