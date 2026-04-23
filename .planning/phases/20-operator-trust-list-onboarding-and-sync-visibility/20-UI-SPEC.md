# Phase 20 UI Specification: Guided Trust-List Onboarding and Sync Visibility

**Date:** 2026-04-23
**Status:** Design contract for execution

## UX Goal

Make trust-list setup and sync health understandable without SQL access or code knowledge. Operators should know what to enter, whether a source is likely valid, what happened during the last sync, what changed, and what action to take after a failure.

## Route

Use existing route: `/admin/trust-lists`.

## Required Surfaces

### Guided Source Wizard

Add a guided source onboarding section with steps:

1. **Source details** — label, XML URL, groups, enabled state.
2. **Test source** — optional pre-save test button that fetches/parses/validates and shows metadata.
3. **Save and sync** — save source, then optionally run sync now.

Saving without a successful test is allowed but should display risk guidance.

### Preview/Test Result

Show:

- validation status;
- digest;
- sequence number;
- territory;
- issue date;
- next update;
- XML size;
- certificate count;
- failure reason and recommended action when failed.

### Sync Timeline

For each source, show a compact timeline/stack:

- current enabled/disabled state;
- last run status;
- last successful sync;
- last failure;
- next expected update;
- imported/updated/skipped unchanged/skipped duplicate/failed counts;
- recommended action based on last failure.

### Permissions

- Platform admins see all sources and can create/sync for any group.
- Group-admins see and operate sources scoped to groups they administer.
- Non-admin users should not access source management.

## Copy Requirements

- Explain that XMLDSig is integrity validation, not legal trust-policy validation.
- Explain that testing a source is recommended but saving without testing is allowed.
- Explain skipped unchanged as expected successful no-op behavior.
- Recovery guidance must be prescriptive, not just raw error display.

## UI Primitives

Use existing Phase 16 primitives: `PageShell`, `PageHeader`, `Panel`, `Field`, `Notice`, `StatusPill`, `EmptyState`, `ActionButton`, `TextInput`, `CheckboxField`.

## Acceptance

- A first-time operator can understand how to add and test a trust-list source from the page itself.
- A group-admin cannot accidentally configure unmanaged groups.
- Failed syncs include a visible recommended next action.
- Existing manual sync and source listing behavior still works.
