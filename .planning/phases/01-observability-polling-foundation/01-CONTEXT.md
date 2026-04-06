# Phase 1: Observability & Polling Foundation - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary
Build the telemetry foundation that keeps every configured LCR or supplemental certificate under scheduled polling, records availability/outage details, and feeds the SLA coverage metrics used by compliance and engineering. Everything else (validation, alerting, dashboarding) depends on this data layer.

</domain>

<decisions>
## Implementation Decisions

### Scheduling & interval metadata
- **D-01:** Default polling cadence is 10 minutes when the administrator does not override it; every target (LCR or certificate) stores its own interval, timeout, and alert metadata so the scheduler treats them individually.
- **D-02:** Timeouts are short (on the order of a few seconds) and configurable per target; any timeout or HTTP status ≠ 200 marks the attempt as unavailable.

### Availability recording & coverage tracking
- **D-03:** Each poll writes a record with availability (up/down), outage start/duration, and recovery lag so the metrics service can compute coverage windows and SLA percentages; coverage-loss periods (no valid LCR) get separate recordings for reporting.
- **D-04:** Healthchecks/Celery heartbeats or equivalent must be emitted alongside poll results so silent failures or expired LCRs surface immediately before downstream layers consume stale data.

### Inventory & onboarding targets
- **D-05:** The inventory tool covers TSL-derived LCRs and independently added certificates, exposing editing for intervals/timeouts/alerts without code changes; the scheduler reads from this inventory to know what to poll.

### the agent's Discretion
- How searchable the inventory UI is (tags, filters) and the exact formatting of coverage records.
- Choice of storage schema names/tables beyond Timescale hypertables described in research.
- How to persist raw LCR blobs (S3 bucket naming, lifecycle rules) as long as hash+signature metadata is retained.

</decisions>

<specifics>
## Specific Ideas

- Alerting sits on top of this phase, so include metadata that downstream phases can reuse (e.g., last-success timestamp, next-update from LCR) when computing SLA.
- Tracking of coverage gaps should include the name of each list involved and a timestamp for when the coverage window starts/ends.

</specifics>

<canonical_refs>
## Canonical References

### Project context
- `.planning/PROJECT.md` — defines the SLA-focused dashboard, alert behavior, coverage requirements, and out-of-scope items.

### Requirements
- `.planning/REQUIREMENTS.md` — MON-01, MON-02, CFG-01 describe what this phase must deliver and which capabilities belong later phases.

### Research
- `.planning/research/SUMMARY.md` — recommits the Next.js/FastAPI/Celery/Timescale/pyhanko stack and explains why establishing data plumbing precedes verification.
- `.planning/research/ARCHITECTURE.md` — details the scheduler→verification→storage→API→UI flow, emphasizing the need for telemetry first.

### Roadmap
- `.planning/ROADMAP.md` — phase goal, success criteria, and dependencies for Phase 1.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet; this is a new project.

### Established Patterns
- Use Celery/Healthchecks-style heartbeats and Timescale hypertables as described in the architecture research.

### Integration Points
- The polling layer must feed downstream FastAPI+Timescale services, so tasks should write to shared tables the verification and alerting phases will read.

</code_context>

<deferred>
## Deferred Ideas

- Detailed alert cooldown rules, SLA burn-rate dashboards, and cross-PKI tagging are reserved for Phases 2 and 3 (Differentiators section in REQUIREMENTS.md).
- Compliance export formatting, auditor snapshots, and multi-channel notifications live in Phase 3.

</deferred>

---
*Phase: 01-observability-polling-foundation*
*Context gathered: 2026-04-05*
