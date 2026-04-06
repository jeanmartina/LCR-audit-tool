# Architecture: LCR Availability Dashboard

**Domain:** Availability monitoring for EU trust lists and individual certificates
**Drafted:** 2026-04-05

## Component Boundaries
| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| Scheduler & Polling (Celery + Celery Beat/APScheduler) | Maintains per-LCR/certificate cadence, submits fetch jobs, retries, enforces configurable timeout, emits heartbeat for Healthchecks and alerting state | Verifier, FastAPI job queue, Healthchecks, Redis broker |
| Verification & Integrity (pyhanko-certvalidator + hash compare) | Parses fetched payloads, validates signature/chain, computes stable hash, compares to last good snapshot, flags coverage gaps | Polling jobs, TimescaleDB, S3 archive |
| Metrics & Historical Storage (TimescaleDB hypertables + S3 object archive) | Persists availability events, outage windows, SLA aggregates, and immutable LCR blobs with hash metadata; exposes read views for dashboard/alerts | FastAPI read APIs, UI queries, reporting workflows |
| Alerts & Observability (Healthchecks + Postmark/SendGrid + incident Slack bridge) | Watches heartbeat timestamps, surfaces downtimes, keeps email alerts flowing until recovery, escalates via incident.io when thresholds hit | Scheduler, FastAPI reporting, Pager/Slack conduits |
| API Layer (FastAPI) | Orchestrates configuration CRUD, exposes summary endpoints/timeseries, surfaces SLA reports, and delivers signal to UI components | Storage cluster, verification metadata, UI frontend, automation hooks |
| UI Layer (Next.js 16 + Tailwind) | Renders compliance tables/charts, polls summary endpoints, handles admin controls for intervals/alerts | FastAPI, optional feature flags, auth/session storage |

## Data Flow
1. **Trigger:** Celery Beat/APS scheduler reads configuration rows (interval, timeout, alert overrides) and enqueues a fetch job every configured cadence (10 min default).
2. **Fetch job:** Task hits the LCR/ certificate URL, respects timeout, and publishes a heartbeat to Healthchecks. Failed fetches immediately update the job state for alerting.
3. **Verification:** After download, the job hands the blob to `pyhanko-certvalidator` for signature/chain verification; only signed, validated blobs proceed. A hash is computed and compared to the last persisted LCR to detect drift or (re)issuance.
4. **Storage:** Validated blobs go to S3-compatible object storage (with WORM semantics) along with hash metadata. TimescaleDB hypertables receive availability events, outage timestamps, coverage-gap windows, and SLA aggregates via stored procedures or ORM hooks.
5. **Metrics & Alerts:** Each successful fetch updates SLA counters (e.g., time offline, window length) and triggers e-mail alerts via Postmark/SendGrid until recovery. Missed heartbeats or persistent non-200 responses mark the target as “permanently down” and feed incident escalation.
6. **API surface:** FastAPI queries the hypertables for current status, coverage histories, and SLA views, then surfaces them through REST/GraphQL endpoints that the dashboard consumes.
7. **UI consumption:** Next.js pages poll these endpoints, render tables/charts, and allow admins to adjust intervals, timeouts, and alert destinations; any change writes back to FastAPI which updates the scheduler config cache.

## Build Order (Polling → Verification → Storage → UI)
1. **Foundational storage & config layer** – Model LCR/certificate targets, intervals, alert overrides, and SLA events in TimescaleDB; provision S3 archive bucket and enable Healthchecks project. Includes schema migrations and config service so other layers can bootstrap from a single source of truth.
2. **Polling infrastructure** – Stand up Celery workers with Beat/APS schedules referencing TimescaleDB configs, wired to the Redis broker and Healthchecks heartbeats. This lets the system start exercising actual fetch cycles before payload validation or dashboard wiring exists.
3. **Verification + hashing** – Implement the integrity worker that takes fetched blobs, runs `pyhanko-certvalidator`, compares hashes, writes metadata to TimescaleDB, archives blobs, and surfaces audit-friendly telemetry. Ensures stored data is trustworthy before dashboards read it.
4. **Alerting hooks** – Tie verification outcomes and Healthchecks events into Postmark/SendGrid for email and incident.io Slack flows, so alerts exist as soon as outages are detected. This layer depends on the preceding step’s verified state.
5. **API & reporting** – Build FastAPI endpoints that aggregate TimescaleDB views (SLAs, outage windows) and expose configuration control surfaces. This layer reads from verified storage and drives UI flows and automation.
6. **Dashboard UI** – Deliver Next.js screens that poll the FastAPI summaries, trend SLA metrics, visualize coverage gaps, and handle admin adjustments; incremental hydration keeps tables fresh without full page reloads. UI also shows telemetries (last heartbeat time, active alerts) pulling directly from API.

## Supporting Patterns
- **One-way flow:** Poller → Verifier → Storage → API → UI ensures each layer has a clear upstream dependency and can be tested in isolation.
- **Configuration as code:** Store interval/timeout/alert overrides alongside metadata so pollers can rebuild schedules without manual intervention.
- **Observability-first:** Heartbeats, SLA events, and alerting metadata are treated as first-class data points so each layer emits signals to Healthchecks and incident tooling.

## Next steps for roadmap planning
1. Phase 1 should prioritize storage + polling so short-lived outages are captured early.
2. Phase 2 layers verification + alerting to ensure data integrity before exposing it.
3. Phase 3 focuses on API surfaces and UI polish, once backend signals are stabilized.
