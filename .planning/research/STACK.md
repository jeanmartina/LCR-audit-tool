# v1.2 Research: STACK

**Research date:** 2026-04-13
**Milestone focus:** ETSI trust-list ingestion, executive summaries, and simpler operator UX

## Current stack fit

The current product is a good fit for a TypeScript-first v1.2:
- Next.js + React for product UI
- Postgres for persistent operational state
- Node runtime for polling/import workers
- existing certificate/ZIP import pipeline in `src/inventory/certificate-admin.ts`
- existing i18n surface and settings/admin pages ready for UX expansion

The main constraint is to keep v1.2 native to this stack. Pulling in a Java-based DSS runtime or a second UI stack would raise operational cost without matching the current product shape.

## Recommended additions

### Trust-list ingestion

- **XML parsing:** stay in Node/TypeScript with a streaming-safe XML parser rather than introducing a second runtime.
- **Digest/signature verification:** add a focused XML signature validation capability for ETSI trust lists instead of treating trust-list XML as untrusted metadata.
- **Fetch + cache discipline:** persist trust-list source metadata such as territory, sequence number, issue date, next update, and digest values.
- **Change detection:** use sequence-number / next-update semantics from the trust-list model first, with digest-based fallback for safety.

### Executive dashboards

- do not introduce a BI tool dependency for v1.2
- keep executive surfaces in the existing app and PDF/export path
- build summary read models inside the current reporting layer, reusing the same authorization and evidence sources

### UX / operator workflow

- stay inside the current Next.js app
- invest in design-system-like primitives inside the codebase: consistent cards, spacing, field help, onboarding steps, and empty states
- avoid a major external component library migration during the same milestone as trust-list ingestion

## Stack recommendation

### Keep

- Next.js / React / TypeScript / Postgres / Tailwind
- in-process worker model
- current CSV/PDF export foundation

### Add carefully

- one XML parser with namespace support
- one XML signature validation path appropriate for ETSI trust-list signatures
- stronger UI primitives and form patterns in the app itself

### Avoid in v1.2

- introducing a second backend runtime just for trust lists
- introducing a full BI platform
- introducing a new frontend framework or heavy component dependency migration

## Source-backed notes

- ETSI TS 119 612 defines sequence-numbered trust-service status lists and update metadata; ingestion should respect those semantics rather than treating feeds as generic XML blobs.
- The EU list-of-lists model means LOTL -> territory TSL discovery is a first-class concern, not a side detail.
- GOV.UK and Material guidance both reinforce concise supporting/help text close to fields rather than long explanatory pages for routine form entry.

## Sources

- ETSI TS 119 612 catalogue entry: https://standards.iteh.ai/catalog/standards/etsi/a3a0a50d-2b1d-4707-b772-7f8bb5d2a09d/etsi-ts-119-612-v1-2-1-2018-10
- EU LOTL / trusted lists overview: https://ec.europa.eu/digital-building-blocks/sites/display/DIGITAL/Trusted+Lists
- GOV.UK guidance and hints: https://design-system.service.gov.uk/components/text-input/
- Material text fields / supporting text: https://m3.material.io/components/text-fields/overview
