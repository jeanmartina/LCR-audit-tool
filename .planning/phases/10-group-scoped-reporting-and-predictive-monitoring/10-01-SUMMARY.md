---
phase: 10-group-scoped-reporting-and-predictive-monitoring
plan: 01
subsystem: reporting-settings
tags: [reporting, predictive-alerts, tags, settings, themes]
requires:
  - phase: 09-certificate-first-onboarding-and-target-administration
    provides: certificate-centric persistence, shared CRL runtime projection, and admin onboarding
provides:
  - group-safe certificate and CRL reporting projections with structured-tag filters
  - predictive monitoring state, persistence, and export-aware reporting context
  - dedicated settings surface for theme and predictive preferences plus admin defaults
affects: [reporting, exports, authz, settings, runtime]
key-files:
  created:
    - src/reporting/predictive.ts
    - src/settings/preferences.ts
    - src/app/settings/page.tsx
    - src/app/api/settings/profile/route.ts
    - src/app/api/settings/groups/[groupId]/route.ts
    - src/app/api/settings/platform/route.ts
  modified:
    - src/storage/runtime-store.ts
    - src/auth/authorization.ts
    - src/reporting/query-state.ts
    - src/reporting/read-models.ts
    - src/reporting/timeline.ts
    - src/exports/csv.ts
    - src/exports/pdf.ts
    - src/app/layout.tsx
    - src/app/reporting/page.tsx
    - src/app/reporting/[targetId]/page.tsx
    - src/app/reporting/export/dashboard.csv/route.ts
    - src/app/reporting/export/executive.pdf/route.ts
    - src/app/reporting/[targetId]/export/polls.csv/route.ts
    - src/app/reporting/[targetId]/export/coverage-gaps.csv/route.ts
    - src/app/reporting/[targetId]/export/alerts.csv/route.ts
    - src/app/reporting/[targetId]/export/snapshots.csv/route.ts
    - src/app/reporting/[targetId]/export/operational.pdf/route.ts
    - scripts/validate-reporting.js
    - scripts/validate-auth-foundation.js
    - scripts/validate-all.js
    - .planning/ROADMAP.md
    - .planning/REQUIREMENTS.md
    - .planning/STATE.md
completed: 2026-04-07
---

# Phase 10: Group-Scoped Reporting and Predictive Monitoring Summary

## Outcome

- Added durable Phase 10 persistence in `src/storage/runtime-store.ts` for user settings, group/platform predictive policy, predictive events, and structured-tag fields on certificates and group overrides.
- Added predictive evaluation and sync logic in `src/reporting/predictive.ts`, using `nextUpdate` plus the configured 3-day window and persisting authorization-safe predictive events.
- Reworked reporting in `src/reporting/read-models.ts`, `src/reporting/query-state.ts`, and `src/reporting/timeline.ts` so the default view is certificate-centric, the complementary CRL view exists, structured tags filter correctly, and predictive context flows into drill-down and exports.
- Added a dedicated settings surface in `src/app/settings/page.tsx` plus backing routes under `src/app/api/settings/` for per-user predictive preferences, light/dark theme choice, and admin-managed group/platform defaults.
- Updated the app shell and reporting/export routes so theme choice affects the product surface and export authorization stays backend-enforced at the certificate/group boundary.

## Validation Run

- `node scripts/validate-reporting.js read-models`
- `node scripts/validate-reporting.js dashboard`
- `node scripts/validate-reporting.js detail`
- `node scripts/validate-reporting.js settings`
- `node scripts/validate-all.js`
- `npm run typecheck`
- `npm run build`

## Residual Notes

- Predictive events are derived during reporting reads in this phase; a future background recomputation job could make that evaluation fully proactive instead of read-triggered.
- Structured tags now support effective group defaults and certificate overrides, but the richer editing UX for those fields is still expected to evolve in later admin/i18n phases.
