# Phase 6: Real PDF Export Delivery - Discussion Log

## PDF Engine

User decided:
- use server-side HTML -> PDF generation

## Fidelity To Screen

User decided:
- PDFs should be export-specific report layouts
- they must preserve the same scope and filters as the source screen

## Executive vs Operational Scope

User decided:
- executive PDF includes aggregated summary, period, filters applied, totals by status, average SLA, open alerts, and upcoming expirations
- operational PDF includes header, filters applied, target summary, and detailed evidence sections

## Validation Bar

User decided:
- milestone closure requires all of:
  - `application/pdf`
  - valid PDF signature bytes (`%PDF-`)
  - proof of minimum expected report content, not just route existence

## Deferred Ideas

- No additional export types or reporting scope were added during discussion.
