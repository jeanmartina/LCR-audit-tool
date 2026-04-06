# Technology Stack: LCR Availability Dashboard

**Project:** LCR Availability Dashboard
**Researched:** 2026-04-05
**Overall confidence:** MEDIUM

## Recommended Stack

### Frontend & Visualization
- `Next.js 16` with the App Router and Server Actions keeps routing, metadata, and edge-ready rendering in one framework so the dashboard ships quickly and stays predictable for compliance viewers. citeturn4search0turn4search4
- React’s component model, Virtual DOM, and rich ecosystem shine for high-frequency dashboards where cards, tables, and charts must refresh without full reloads. citeturn2search0
- The default 2026 TypeScript + Tailwind combination lets us type-check contracts and style utility-first layouts while keeping the CSS surface small. citeturn4search1

### API, Polling & Task Orchestration
- `FastAPI` supplies the REST/GraphQL endpoints while `Celery` workers (with Celery Beat or APScheduler schedules) pull each EU trust-list at its configured cadence (10 minutes default), retry on failure, and hand verified metrics and hashes downstream. citeturn5search7
- Each polling task posts a heartbeat to Healthchecks so missing pings trigger alerts instead of letting fetchers fail silently. citeturn1search0

### Cryptographic Validation
- `pyhanko-certvalidator` 0.30.1 does signature verification, issuer chain resolution, and hash extraction for every downloaded LCR before we persist it or compare it to previous snapshots. citeturn5search5

### Storage & Historical Archive
- `TimescaleDB` hypertables capture availability, outage windows, and SLA statistics with automatic chunking, compression, and continuous aggregates so the dashboard can query decades of data without blowing up storage or query time. citeturn4view0
- Raw LCR blobs land in S3-compatible object storage with Object Lock/WORM semantics and stored cryptographic hashes so tampering is detectable and regulatory audits get a tamper-proof trail. citeturn2search10

### Alerts & Observability
- Healthchecks provides the heartbeat/period/grace model that turns every scheduled fetch into a dead-man switch, plus email/webhook/Slack integrations for our alert pipeline. citeturn1search0
- Route the alert payloads through a transactional email service like Postmark or SendGrid so compliance teams get deliverability, analytics, and retry guarantees. citeturn8search5
- Escalate high-severity incidents into a Slack-native incident manager so cross-functional responders collaborate where the team already works. citeturn6search11

## Avoid
- Relying on raw cron + `MAILTO` is risky because silent failures (dead cron jobs, hung processes, missing network) can persist undetected for a long time; always wrap scheduled tasks with heartbeat monitoring. citeturn1search0
- Over-engineering the front end with exotic frameworks; keep the “boring but reliable” React/Next.js stack so maintenance stays simple and we can ship features quickly. citeturn4search0
- Storing historic LCR snapshots in mutable stores without cryptographic hashing and WORM controls, because log-auditing requirements demand tamper-evident archives. citeturn2search10

## Installation

```bash
pip install fastapi[all] uvicorn celery redis pyhanko-certvalidator
npm install next@16 react react-dom typescript tailwindcss
```

## Sources
- Amplifi Labs “Modern Web App Tech Stack for 2026” and AppStack Builder’s praise of Next.js 16 for SaaS/SEO teams. citeturn4search0turn4search4
- TailyUI’s “Default Modern TypeScript Stack” for 2026 front ends. citeturn4search1
- Sparkle Web’s guide on why React is still the dashboard standard in 2026. citeturn2search0
- FastAPI scheduling guide comparing BackgroundTasks, APScheduler, and Celery. citeturn5search7
- PyPI entry for pyhanko-certvalidator 0.30.1 (March 2026 release). citeturn5search5
- TimescaleDB overview describing hypertables, compression, and continuous aggregates. citeturn4view0
- Tencent Cloud’s log auditing requirements on WORM storage and hashing. citeturn2search10
- Healthchecks documentation on heartbeat monitoring, integrations, and alert states. citeturn1search0
- Aegis Software’s comparison of top transactional email services. citeturn8search5
- incident.io’s Slack-friendly incident management guide. citeturn6search11
