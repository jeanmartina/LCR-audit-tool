# Project Research Summary

**Project:** LCR Availability Dashboard
**Domain:** Certificate revocation list availability and SLA coverage monitoring
**Researched:** 2026-04-05
**Confidence:** MEDIUM

## Executive Summary

The product is a compliance-grade dashboard that proves trust-list coverage, tracks SLA health, and alerts before shameful revocation failures hit downstream consumers. Experts build this kind of system by leaning on a predictable full-stack (Next.js 16 + TypeScript + FastAPI) wired to time-series and object storage so telemetry is immutable, observable, and safe for audits.

The recommended approach is to start with the data plumbing: model every target, stand up TimescaleDB hypertables, versioned object archives, and observability heartbeats before layering on polling, verification, and UI. A phased rollout keeps each dependency clear (poller → verifier → storage → API → UI) and lets the team stabilize one concern before extending trust boundaries.

Key risks are silent CRL expirations, renewal tsunamis, and alerts that only fire at SLA breach time. We mitigate them through early observability (scheduled fetches plus Healthchecks heartbeats), proactive alert tiers (50% of budget plus cooldowns), automatic verification, and layered reporting that ties every coverage dip to contract impact.

## Key Findings

### Recommended Stack

The research endorses a conservative but modern stack: Next.js 16 with the App Router for the UI, FastAPI + Celery for orchestration, TimescaleDB for SLA telemetry, and pyhanko for cryptographic verification. Healthchecks and documented alerting services close the observability loop.

**Core technologies:**
- `Next.js 16` + Tailwind + TypeScript: predictable, hydrated dashboards that stay edge-ready and easy to maintain.
- `FastAPI` + `Celery` (with APScheduler or Beat): orchestrates fetch jobs, retries, and exposes APIs tied to the scheduler configuration.
- `TimescaleDB` + S3-type object storage: hypertables for events/SLA aggregates and WORM archives for verified LCR blobs.
- `pyhanko-certvalidator` 0.30.1: enforces signature validation, issuer chains, and hash comparison before data enters storage.
- `Healthchecks` + Postmark/SendGrid + incident.io: heartbeat monitoring, email/webhook alerts, and Slack escalation for observable failures.

### Expected Features

Launch must deliver per-LCR availability monitoring, signature validation, automated alerts, SLA metrics, compliance-ready dashboards, and an inventory registry.

**Must have (table stakes):**
- LCR freshness/availability status per list with next update tracking.
- Integrity/signature validation for every downloaded list.
- Automated email alerts when coverage degrades.
- SLA metrics (availability %, MTTR) with drill-down reporting.
- Compliance-ready dashboard with exportable snapshots.
- Registry of every monitored certificate/CRL with editable configurations.

**Should have (competitive):**
- Pre-failure publish/expiration detection to notify before a list expires.
- Workflow-driven alert automation that turns incidents into remediation sequences.
- Multi-channel alerts with cooldowns and contextual enrichment.
- Advanced SLA/SLO insights (error budgets, burn rates, historical SLIs).
- Cross-PKI visibility with tagging for org/regulatory slices.
- Compliance export templates for auditors (PDF/CSV narratives).

**Defer (v2+):**
- Self-service workflow automation across remediation steps (can start with manual playbooks).
- Full cross-PKI federation (aggregate feeds beyond initial trust lists).

### Architecture Approach

The architecture follows a one-way flow: scheduler/poller → verification → storage → API → UI, with configuration-as-code and observability-first signals. Each component has a clear responsibility and can be validated before the dependent layers consume its outputs.

**Major components:**
1. Scheduler & Polling — Celery workers (Beat/APScheduler) run fetches, emit heartbeats, and enqueue verification tasks.
2. Verification & Integrity — pyhanko analyzes payloads, validates signatures, hashes blobs, and rejects bad data.
3. Metrics & Storage — TimescaleDB captures availability events/SLA aggregates while S3 stores WORM-protected LCR archives.
4. Alerts & Observability — Healthchecks, email services, and incident bridges turn missed fetches into actionable alerts.
5. API Layer — FastAPI exposes configuration surfaces, SLA summaries, and hooks for automation.
6. UI Layer — Next.js dashboard renders coverage, exposes admin controls, and surfaces telemetry.

### Critical Pitfalls

1. **Silent CRL expiration** — Monitor next-publish/expiration windows, push alerts before warning periods, and add retries/failover per list.
2. **Renewal tsunamis** — Keep a golden inventory and layered alerts (60/30/14/7/1 days) so mass renewals do not slip through the cracks.
3. **Alerts that only fire at SLA breach** — Layer warning alerts at 50% of the budget, escalate at limits, and track rate-of-change to catch slow degradations.
4. **Revocation checking ignored/fail-soft** — Treat ignored revocations as failures, scale OCSP/CRL responders, and alert on enforcement gaps.
5. **SLA tracking disconnected from coverage** — Correlate synthetic revocation checks with SLA dashboards and document business impact for stakeholders.

## Implications for Roadmap

### Phase 1: Observability & Polling Foundation
**Rationale:** Data collection must precede verification and UI; modeling every target, provisioning TimescaleDB hypertables, and wiring Healthchecks lets fetches and heartbeats prove the system works early.
**Delivers:** Target/config schemas, scheduler + poller jobs, storage buckets, Healthchecks integration, and baseline availability events.
**Addresses:** Must-have availability monitoring, inventory registry, and CRL freshness tracking.
**Avoids:** Silent expiration (Pitfall 1) by capturing next-update windows and emitting warnings via heartbeats.

### Phase 2: Integrity & Alerting Core
**Rationale:** Once fetches flow, add pyhanko verification, hash comparisons, and alert plumbing so only trusted data is stored and alerted on before SLA violations occur.
**Delivers:** Signature validation pipeline, hash metadata writes, SLA counters, Postmark/SendGrid + incident.io alerts, and cooldown-aware state machines.
**Uses:** Stack elements: FastAPI (for job/meta APIs), pyhanko, Healthchecks heartbeats, alert services, Celery brokers.
**Implements:** Architecture components verification, storage updates, and observability-first telemetry.
**Addresses:** Alert automation, pre-failure detection, multi-channel cooldowns; mitigates Pitfalls 3, 4, and 5.

### Phase 3: Reporting, SLA Governance, and Differentiators
**Rationale:** With trusted data and alerts, focus on the consumer experience: dashboards, exports, advanced SLA/SLO insights, and workflow hooks.
**Delivers:** Next.js dashboards with trend views, compliance exports, error-budget visualizations, multi-PKI tagging, and workflow automation scaffolding.
**Addresses:** Differentiators such as advanced SLA insights, compliance exports, and cross-PKI visibility.
**Avoids:** SLA tracking disconnects (Pitfall 5) by tying coverage dips to contractual context.

### Phase Ordering Rationale
- Storage/polling before verification because downtime and coverage gaps are hardest to detect once the data isn’t flowing.
- Verification/alerting before UI so only accurate, auditable records surface to stakeholders.
- Reporting last to allow UI iteration on stable APIs and verified SLA metrics provided by the earlier phases.
- Architecture’s one-way flow maps cleanly to these phases, and each pitfall is addressed as its dependencies come online.

### Research Flags
- **Phase 2:** Needs `/gsd-research-phase` on alert automation state (cooldowns, multi-channel orchestration) and certificate renewal playbooks.
- **Phase 3:** Focused research on auditor expectations for compliance exports and workflow automation formatting (PDF narratives, CSV schemas).
- **Phase 1:** Standard patterns (TimescaleDB + Celery + Healthchecks) already documented; no additional research required.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Stack choices cite multiple 2026 sources but rely on community guidance rather than official roadmaps. |
| Features | MEDIUM | Table stakes/differentiators drawn from domain reports but lacking customer interviews. |
| Architecture | MEDIUM | Flow and component design are documented but need validation with engineering constraints. |
| Pitfalls | MEDIUM | Catalogued from multiple case studies; still warrants validation with legal/compliance teams. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Alert choreography:** Need to validate cooldown logic and workflow tie-ins before Phase 2 implementation to avoid noisy incidents.
- **Compliance exports:** Clarify auditor templates (PDF, CSV, narrative) and data retention expectations in planning.
- **Certificate inventory depth:** Confirm whether the catalog must include OCSP responders, external vendors, and SLA owners beyond initial trust lists.

## Sources

### Primary (HIGH confidence)
- `.planning/research/STACK.md` — stack and observability guidance from 2026 dashboards and security sources.

### Secondary (MEDIUM confidence)
- `.planning/research/FEATURES.md` — feature tables stakes, differentiators, and anti-features grounded in compliance research.
- `.planning/research/ARCHITECTURE.md` — component boundaries, data flow, and build order recommendations.

### Tertiary (LOW confidence)
- `.planning/research/PITFALLS.md` — domain pitfalls and prevention strategies needing stakeholder validation.

---
*Research completed: 2026-04-05*
*Ready for roadmap: yes*
