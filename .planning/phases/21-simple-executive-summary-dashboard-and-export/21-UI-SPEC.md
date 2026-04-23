# Phase 21 UI Specification: Simple Executive Summary Dashboard and Export

**Date:** 2026-04-23
**Status:** Design contract for execution

## UX Goal

Give leadership and non-operator stakeholders a short path to understand current coverage posture, biggest active risks, and immediate next concerns without forcing them through the operational data grid.

## Required Surfaces

### Dedicated executive route

Add a dedicated executive summary route, expected shape `/reporting/executive`, accessible to any authorized user.

### Reporting integration

Add a visible entry point from `/reporting` so users can move between operational and executive views without guessing URLs.

### Executive summary sections

The executive page should include, at minimum:

1. **Top summary cards**
   - healthy
   - degraded
   - offline
   - at risk
   - open alerts
   - average SLA or equivalent posture metric

2. **Top risks**
   - current highest-risk assets/groups
   - links to operational evidence/details

3. **Upcoming risks**
   - expiration/publication-delay focused list
   - enough metadata to understand urgency

4. **Short trend**
   - compact recent trend over a short fixed window
   - should visually show posture movement, not raw event logs

5. **Breakdowns**
   - simple grouped breakdowns by structured dimensions already supported by the data model when meaningful (for example trust source / PKI / jurisdiction)

### Print/export behavior

- The executive page must be printable from the browser with a readable layout.
- Executive PDF export must mirror the same summary model and stay management-oriented.

## Copy requirements

- Executive text should stay simpler than operator copy.
- UI should explain when the user is seeing group-scoped data instead of platform-wide data.
- Links to evidence should use operator language only where needed.

## Acceptance

- An authorized non-admin user can open the executive route and see only their allowed scope.
- Executives can understand the current posture from the page header and summary cards alone.
- Top risks and upcoming issues provide a clear path into evidence.
- Browser print and executive PDF both produce a concise management-facing artifact.
