# Phase 3: Reporting & Compliance Governance - Discussion Log

## Dashboard Information Hierarchy

User required the main dashboard to surface:
- current status per list/certificate with detail
- latest unavailability event
- SLA by period with time slicing
- upcoming LCR expirations
- open alerts and recent alerts
- filters by source, issuer, criticality, and responsible party

## Drill-Down And Audit Trail

User required all suggested evidence views:
- poll history
- coverage loss windows
- alert history
- latest valid LCR metadata and prior snapshots
- exact validation failure reason
- unified event timeline

## Export Formats

User requested:
- CSV exports for filtered dashboard data
- CSV/detail exports per list or certificate
- CSV exports for coverage gaps
- CSV exports for alert history
- CSV exports for LCR inventory and snapshots
- two PDF types: operational and executive
- export metadata must include applied filters and generation timestamp

## Retention And Evidence Access

User decided:
- polls, alerts, and coverage gaps use configurable retention per certificate/target
- defaults should exist and should not be overly conservative
- LCR snapshots are retained permanently
- the UI must support date-range search and compound filters

## The Agent's Discretion

- Planning should define the initial default retention window because the user did not provide a numeric value.
- Planning can decide whether the reporting surface is a single page with drawers or multiple dedicated views, as long as the required evidence is easy to access.

## Deferred Ideas

- Anything predictive or benchmarking-oriented stays out unless it directly supports REP-01 or REP-02.
