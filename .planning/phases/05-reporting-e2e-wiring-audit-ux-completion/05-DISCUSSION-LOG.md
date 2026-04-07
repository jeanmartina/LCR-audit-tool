# Phase 5: Reporting E2E Wiring and Audit UX Completion - Discussion Log

## Dashboard Filters

User decided:
- dashboard filters must cover source, issuer, criticality, owner, status, and period
- dashboard filters apply automatically

## Drill-Down Filters

User decided:
- drill-down filters must cover period, HTTP status, severity, event type, and hash/snapshot
- drill-down filters use explicit `Apply` / `Clear`

## Export Placement

User decided:
- dashboard exposes CSV for the filtered table and executive PDF
- drill-down exposes CSVs for polls, coverage gaps, alerts, and snapshots, plus an operational PDF
- all exports must use the exact filters currently visible in the UI

## Audit Detail Layout

User decided:
- each target page starts with a fixed summary block
- evidence is organized in tabs
- default tab is `Timeline`
- required tabs are `Timeline`, `Polls`, `Coverage gaps`, `Alerts`, `Validation`, and `Snapshots`

## SLA Defaults

User decided:
- default period is the last 30 days
- period presets are `24h`, `7d`, `30d`, `90d`, and `custom`
- dashboard must show SLA per target plus an aggregate summary for the selected period

## Deferred Ideas

- No additional reporting capabilities were added during discussion; scope remains limited to Phase 5 gap closure.
