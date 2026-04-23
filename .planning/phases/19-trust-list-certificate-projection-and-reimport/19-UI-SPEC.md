# Phase 19 UI Specification: Trust-List Provenance and Projection Visibility

**Date:** 2026-04-22
**Status:** Design contract for execution

## UX Goal

Make trust-list-derived assets identifiable and auditable without creating a separate inventory UI. Operators should see where a certificate came from and whether the latest sync imported, updated, skipped, or failed projection items.

## Required Surfaces

### Trust-List Admin Page

Route remains `/admin/trust-lists`.

Add per-source/latest-run details:

- Imported count
- Updated count
- Skipped unchanged count
- Failed count
- Latest snapshot digest/sequence/territory
- Latest run ID
- Last projection failure reason when available

### Certificate Admin / Detail

For trust-list-derived certificates, show a compact provenance panel:

- Source label and URL
- Snapshot sequence/digest
- Sync run ID
- Projection status and change reason
- Extracted source path/ordinal when available

### Reporting Read Model

No enriched reporting filter or label is required in Phase 19. Reporting must not regress: trust-list-derived certificates should remain distinguishable through existing source type data if already present, but the user-selected Phase 19 UI scope is admin source/run counters plus certificate-level provenance. Richer reporting labels and executive analytics remain later milestone work.

## Copy Requirements

- Do not claim legal/eIDAS trust validation.
- Phrase validation as XML signature/integrity validation.
- Explain skipped unchanged items as successful no-op behavior.
- Explain failed projection items separately from failed source sync.

## UI Primitives

Use existing Phase 16 primitives: `Panel`, `Field`, `Notice`, `StatusPill`, `EmptyState`, and `ActionButton`. Avoid adding a new design system.

## Acceptance

- Trust-list-derived assets are distinguishable from single/ZIP imports in admin/certificate detail.
- Provenance is visible without SQL access.
- Counts make skipped unchanged syncs look expected, not broken.
- Reporting behavior does not regress, but enriched reporting filters/labels are not required in Phase 19.
