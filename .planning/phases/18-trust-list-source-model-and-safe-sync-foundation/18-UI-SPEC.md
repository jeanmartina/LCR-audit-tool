# Phase 18 UI Specification: Trust-List Source Registration and Sync Foundation

**Date:** 2026-04-22
**Status:** Design contract for planning and execution

## UX Goal

Allow a platform admin to register an ETSI trust-list URL, see whether the source is configured/synced/failed, and trigger a manual sync without needing shell or SQL access. This is a foundation UI, not the full Phase 20 operator recovery surface.

## Required Surface

Recommended route: `/admin/trust-lists`

Required elements:

- Page header explaining that this registers ETSI TS 119 612 trust-list sources.
- Registration form with fields:
  - label/name
  - source URL
  - group IDs to receive imported certificates
  - enabled flag
- Field hints:
  - URL must be HTTPS.
  - Source must publish ETSI TS 119 612 XML.
  - XMLDSig validation is required before inventory import.
  - Failed sync keeps the previous accepted snapshot.
- Source list showing:
  - label
  - URL
  - status
  - last successful sync
  - last failed sync/failure reason
  - last accepted digest/sequence/territory/next update where available
  - action: sync now

## Visual Contract

Use Phase 16 primitives:

- `PageShell`
- `PageHeader`
- `Panel`
- `Field`
- `TextInput`
- `CheckboxField`
- `ActionButton`
- `Notice`
- `StatusPill`
- `EmptyState`

Do not introduce a separate design system.

## Post-Action States

- `?created=source` shows source registration success.
- `?sync=started` or immediate sync result state shows that a sync run was recorded.
- Failed sync must show failure reason from the persisted run/source status, not a generic error only.

## Acceptance Criteria

- Platform admin can access the trust-list source page.
- Non-platform users cannot register/sync sources.
- Form copy communicates HTTPS, ETSI XML, XMLDSig requirement, and failure semantics.
- Empty state tells the admin to register the first source.
- Source list exposes enough status to prove the sync foundation works.
