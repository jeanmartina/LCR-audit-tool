# Project State

## Project Reference
See: .planning/PROJECT.md (updated 2026-04-13)

**Core value:** Never allow a trusted certificate to operate without valid revocation coverage
**Current focus:** Define the next milestone after shipping v1.1

## Current Position

Milestone: none active
Phase: n/a
Plan: n/a
Status: v1.1 archived and shipped
Last activity: 2026-04-13 — Archived milestone v1.1 after Google public-host proof and final re-audit

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**
- Total plans completed: 15
- Average duration: 43 min
- Total execution time: 2.4 hours

**Completed Milestones:**

| Milestone | Phases | Plans | Status |
|-----------|--------|-------|--------|
| v1.0 | 1-7 | 7 | Shipped |
| v1.1 | 8-15 | 8 | Shipped |

**Recent Trend:**
- Last 10 plans: [06-01, 07-01, 08-01, 09-01, 10-01, 11-01, 12-01, 13-01, 14-01, 15-01]
- Trend: Stable

## Accumulated Context

### Decisions
- [Phase 1]: Prioritize continuous coverage tracking and historical recording so audits can prove when CRLs were unavailable.
- [Phase 2]: Keep email alerts firing until coverage recovers while respecting overrides/cooldowns to avoid alert storms.
- [Phase 3]: Reporting must provide compliance-ready tables, full evidence drill-down, and differentiated PDF exports.
- [Phase 4]: Database-backed runtime store is the source of truth, and alert events are persisted before delivery.
- [Phase 6]: PDF routes return real `application/pdf` artifacts, not mislabeled text payloads.
- [Phase 7]: Local readiness uses one gate plus a reproducible live-Postgres smoke test.
- [Phase 8]: Access is invitation-only, group-scoped, and enforced from backend/read-model/export paths.
- [Phase 10]: Reporting is certificate-first by default, with a complementary CRL mode, predictive monitoring, structured tags, and user preferences.
- [Phase 11]: The product surface is localized for `en`, `pt-BR`, and `es`, with per-user locale preference and English-first active documentation/code conventions.
- [Phase 12]: The product ships with a compose topology, Caddy-managed HTTPS ingress, and English setup/operator documentation.
- [Phase 13]: Provider auth uses real invite-gated OAuth/OIDC redirect and callback flows, while platform admins manually track verification status.
- [Phase 14]: Packaged ZIP onboarding uses in-process extraction, supports PEM/DER certificate files, and records archive-level failures explicitly.
- [Phase 15]: Google public-host proof closed the shipped v1.1 auth scope on the packaged Docker/Caddy deployment.

### Roadmap Evolution
- v1.0 archived to `.planning/milestones/v1.0-ROADMAP.md`
- v1.1 archived to `.planning/milestones/v1.1-ROADMAP.md`
- backlog items 999.1-999.4 captured for admin bootstrap, redesign, onboarding UX, and form guidance

### Pending Todos

- Start the next milestone with `$gsd-new-milestone`
- Decide whether to address the settings redirect bug as immediate cleanup or carry it forward
- Rotate the Google client secret used during the proof because it was exposed during testing

### Blockers/Concerns

- No active delivery blocker is open for shipped scope.
- The main near-term risk is leaving the next milestone undefined while backlog and deferred auth-provider proof remain outstanding.

## Session Continuity

Last session: 2026-04-13 23:59
Stopped at: v1.1 archived and ready for next-milestone definition
Resume file: .planning/ROADMAP.md
