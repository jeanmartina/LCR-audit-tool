# ROADMAP

## Phases
- [x] **Phase 1: Observability & Polling Foundation** - Deliver the monitored data pipeline, including inventory, so every LCR/cert emits measurable availability records before we layer integrity checks. (completed 2026-04-05)
- [ ] **Phase 2: Integrity & Alerting Core** - Validate, hash, and alert on every fetched LCR so only trusted data feeds calculations and every outage raises timely warnings before SLA breaches.
- [ ] **Phase 3: Reporting & Compliance Governance** - Present the data with compliance-ready dashboards, exports, and audit trails so teams can prove coverage and follow differentiated SLA insights.

## Research & Architecture
- **Stack evidence:** Next.js 16 + Tailwind + TypeScript for dashboards, FastAPI + Celery/Beat for orchestration, TimescaleDB for hypertables, object storage for WORM archives, pyhanko-certvalidator 0.30.1 for signatures, and Healthchecks/Postmark (or SendGrid)/incident.io for observable alerts.
- **Features guided by research:** Must ship per-LCR availability monitoring, signature validation, automated alerts, SLA metrics, compliance dashboards, and inventory configurability before layering differentiators such as advanced error budgets or cross-PKI tags.
- **Architecture flow:** Scheduler/poller → verification → storage → API → UI, so Phase 1 lays the telemetry foundation, Phase 2 secures the data with alerts, and Phase 3 builds the consumer experience; this order mitigates silent expirations, renewal tsunamis, and alert lag described in the pitfalls.
- **Pitfalls addressed:** Each phase explicitly closes gaps from research—Phase 1 detects silent CRL expiration with heartbeats, Phase 2 prevents alert storms via cooldown-aware email upgrades, and Phase 3 ties coverage drops to contractual context to avoid SLA tracking disconnects.

## Phase Details

### Phase 1: Observability & Polling Foundation
**Goal**: Provide a resilient poller + inventory pipeline that enforces the configured 10-minute default cadence, writes availability/coverage events into TimescaleDB hypertables, and emits Healthchecks heartbeats so silent CRL expirations are detected before downstream logic consumes bad data.
**Depends on**: Nothing (foundation for every downstream phase).
**Requirements**: MON-01, MON-02, CFG-01
**Success Criteria** (what must be TRUE):
  1. Every configured LCR or certificate target is polled on its configured interval (default 10 minutes) and each result (availability, outage duration, recovery lag) is persisted for SLA reporting (MON-01).
  2. Continuous outages create coverage-lost records with start timestamp, duration, and affected lists so SLA reports and dashboards know exactly who lost coverage (MON-02).
  3. The inventory layer lets admins add/edit certificates and lists with interval, timeout, and alert metadata without touching code, feeding the scheduler with new targets on demand (CFG-01).
  4. Healthchecks/Celery heartbeats plus stored next-publish metadata surface impending expirations so silent CRL drops (Pitfall 1) are flagged before a coverage gap turns into an SLA incident.
**Plans**: 01-01

### Phase 2: Integrity & Alerting Core
**Goal**: Build the verification and alerting pipeline (FastAPI + Celery + pyhanko) that admits only signed, hashed LCRs into storage and drives configurable email alerts until coverage recovers, with cooldowns and warning thresholds to avoid noisy incidents.
**Depends on**: Phase 1
**Requirements**: INT-01, ALT-01, ALT-02
**Success Criteria** (what must be TRUE):
  1. Each downloaded LCR is validated with pyhanko against its issuer signature and compared with the previous hash before persisting to the archive, keeping the data auditably correct (INT-01).
  2. Alerts fire whenever HTTP ≠ 200, a timeout expires, or a list can’t find a substitute, and they persist until coverage returns while honoring per-list overrides, admin disables, and cooldown windows so we do not trigger renewal tsunamis (ALT-01).
  3. SLA metrics (availability %, MTTR, coverage gap frequency) are computed for every list and aggregates, feeding warning thresholds (e.g., 50% budget) so dashboards can surface proactive alerts instead of waiting for breaches (ALT-02).
**Plans**: TBD

### Phase 3: Reporting & Compliance Governance
**Goal**: Surface everything in a Next.js 16 dashboard (Tailwind/TypeScript) with tables, drill-downs, exports, and audit trails that prove coverage, tie dips to contracts, and support advanced SLA insights and cross-PKI tagging.
**Depends on**: Phase 2
**Requirements**: REP-01, REP-02
**Success Criteria** (what must be TRUE):
  1. The dashboard shows per-list status, SLA indicators, coverage history, and export actions (CSV/PDF) so compliance and engineering teams can interrogate availability at a glance (REP-01).
  2. Logs of alerts, coverage loss windows, and snapshot archives are queryable/downloadable for auditors, keeping the narrative of every SLA event intact (REP-02).
  3. Compliance views surface contextual metadata (SLO burn rates, policy tags) so coverage dips are tied back to the business impact, aligning with research differentiators while staying grounded in recorded data (REP-01 + REP-02).
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Observability & Polling Foundation | 1/1 | Complete | 2026-04-05 |
| 2. Integrity & Alerting Core | 0/0 | Not started | - |
| 3. Reporting & Compliance Governance | 0/0 | Not started | - |
