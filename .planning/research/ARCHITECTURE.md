# v1.2 Research: ARCHITECTURE

**Research date:** 2026-04-13
**Milestone focus:** ETSI trust-list ingestion, executive summaries, and simpler operator UX

## Recommended architectural direction

### 1. Trust-list ingestion as a first-class source type

Add a new inventory source type alongside the existing certificate import modes:
- manual certificate upload
- ZIP certificate upload
- trust-list URL source

This keeps one inventory system with multiple source types rather than splitting the product into separate ingest subsystems.

### 2. LOTL / TSL sync pipeline

Recommended stages:
1. register trust-list source URL and operator metadata
2. fetch LOTL / TSL document
3. validate XML signature and structural metadata
4. record source snapshot (digest, sequence number, issue date, next update)
5. detect change vs previous snapshot
6. extract affected certificates / services
7. feed extracted certificates into the existing certificate-admin import pipeline
8. write import and sync audit events
9. project resulting monitored assets into reporting

### 3. Extend, do not replace, current certificate import

The current certificate pipeline already knows how to:
- normalize PEM / DER
- fingerprint certificates
- derive CRL URLs
- create batch import runs
- project runtime targets

That should remain the central path. Trust-list ingestion should supply certificate payloads into that pipeline and add source metadata around it.

### 4. New persisted entities likely needed

- trust-list sources
- trust-list snapshots
- trust-list sync runs
- trust-list extracted certificate mappings
- source-to-certificate provenance records

Core fields to persist:
- source URL
- source type (`lotl`, `tsl`)
- territory / scheme information
- sequence number
- issue date
- next update
- digest / canonical identity
- sync status and failure reason
- last successful sync timestamp

### 5. Executive reporting path

Do not build executive summaries as a second analytics engine.
Build them as:
- summary read models over existing monitoring evidence
- role-safe, group-scoped executive views
- executive-focused PDF/export variants if needed

A good split is:
- operator reporting = investigation and action
- executive reporting = current risk, trend, and exposure summary

### 6. UX architecture direction

Use progressive disclosure:
- step-based first-run admin bootstrap
- guided onboarding wizard for certificate / ZIP / trust-list source creation
- advanced settings collapsed behind an explicit reveal
- inline help and examples attached to the field itself

Avoid mixing:
- platform setup
- group defaults
- source onboarding
- advanced monitoring overrides

into the same initial screen.

## Suggested build order

1. trust-list source persistence and sync metadata
2. trust-list fetch / validation / change-detection pipeline
3. certificate extraction into existing import pipeline
4. operator sync visibility and failure states
5. executive summary read models
6. redesign + onboarding flow consolidation
7. first-run bootstrap and field guidance pass

## Sources

- EU LOTL / trusted lists overview: https://ec.europa.eu/digital-building-blocks/sites/display/DIGITAL/Trusted+Lists
- DSS trusted lists and validation docs: https://ec.europa.eu/digital-building-blocks/DSS/webapp-demo/doc/dss-documentation.html#_trusted_lists
- Microsoft dashboard design tips: https://learn.microsoft.com/power-bi/create-reports/service-dashboards-design-tips
- GOV.UK progressive disclosure patterns: https://design-system.service.gov.uk/
