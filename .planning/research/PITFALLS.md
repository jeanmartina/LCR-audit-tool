# v1.2 Research: PITFALLS

**Research date:** 2026-04-13
**Milestone focus:** ETSI trust-list ingestion, executive summaries, and simpler operator UX

## Trust-list ingestion pitfalls

### Treating trust lists as plain XML imports

Risk:
- parsing XML without signature validation or update semantics creates false trust in the source

Prevention:
- validate signature and preserve sequence/update metadata before certificate extraction
- record sync failure states explicitly instead of partially accepting untrusted data

### Creating a second onboarding model

Risk:
- trust-list assets behave differently from certificate-import assets, multiplying operator confusion

Prevention:
- keep one certificate inventory model and add provenance/source metadata on top
- reuse the existing certificate import/run abstraction where possible

### Over-importing everything on every sync

Risk:
- full re-imports every cycle create noisy audit trails, wasted work, and confusing asset churn

Prevention:
- use sequence number / digest / snapshot comparison to identify real changes first
- design re-import around changed source snapshots, not blind periodic rebuilds

## Executive dashboard pitfalls

### Building operator dashboards with executive labels

Risk:
- leadership still gets too much detail and cannot quickly answer “Are we safe?”

Prevention:
- keep executive summaries small: current status, top risks, trend, and required attention
- move investigation detail behind links to the operator surface

### Too many charts

Risk:
- visual noise and false precision make the product harder to trust

Prevention:
- prefer fewer cards, concise tables, and one or two trend visuals with clear interpretation

## UX pitfalls

### Redesign without workflow simplification

Risk:
- the product looks newer but still requires too many steps and too much domain knowledge

Prevention:
- evaluate redesign success by task completion friction, not just appearance
- redesign onboarding paths before polishing isolated screens

### Hint text that turns into documentation dumps

Risk:
- users ignore large help blocks; forms become harder to scan

Prevention:
- keep help text short, example-oriented, and adjacent to the field
- use progressive disclosure for deeper guidance

### First-run bootstrap mixed with normal admin settings

Risk:
- setup becomes confusing because initial-system concerns and ongoing-operations concerns are different tasks

Prevention:
- treat first-run bootstrap as a dedicated guided flow with a clear finish line

## Milestone risk

v1.2 spans:
- new ingestion source type
- executive read models
- substantial UX redesign

That is enough scope to drift. Requirements should protect against trying to ship:
- Entra/OIDC live proof
- OCSP
- trust-list ingestion
- redesign
- onboarding simplification
- executive analytics

all at the same depth in one milestone.

Recommended discipline:
- make trust-list ingestion + operator UX the core delivery
- keep executive summaries intentionally simple in v1.2
- defer deep executive analytics / burn-rate sophistication until the trust-list model is stable

## Sources

- ETSI TS 119 612 entry: https://standards.iteh.ai/catalog/standards/etsi/a3a0a50d-2b1d-4707-b772-7f8bb5d2a09d/etsi-ts-119-612-v1-2-1-2018-10
- EU trusted lists overview: https://ec.europa.eu/digital-building-blocks/sites/display/DIGITAL/Trusted+Lists
- GOV.UK text input guidance: https://design-system.service.gov.uk/components/text-input/
- Microsoft dashboard design tips: https://learn.microsoft.com/power-bi/create-reports/service-dashboards-design-tips
