# Phase 2: Integrity & Alerting Core - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary
Validate each LCR with signature/hash checks, store only verified artifacts, and implement alerting/SLA warning logic that keeps notifying until coverage recovers.

</domain>

<decisions>
## Implementation Decisions

### Signature and hash validation
- **D-01:** If signature or hash validation fails, reject the LCR, mark it unavailable, and trigger alerts immediately.

### LCR persistence
- **D-02:** Do not store duplicate LCR blobs when the hash matches the last valid version; only record that a verification happened.
- **D-03:** Persist LCR blobs with metadata: `hash`, `issuer`, `thisUpdate`, `nextUpdate`, `status`.

### Alerting policy
- **D-04:** Use cooldowns by severity: `warning` every 30 minutes, `critical` every 10 minutes.
- **D-05:** Trigger warning alerts based on both error-budget usage and absolute time without coverage; whichever fires first.

### the agent's Discretion
- Exact thresholds for warning vs. critical classification (as long as it honors both error-budget and time-based triggers).
- Email templates and message formatting.

</decisions>

<canonical_refs>
## Canonical References

### Project context
- `.planning/PROJECT.md` — overall behavior expectations for alerts, coverage gaps, and validation.

### Requirements
- `.planning/REQUIREMENTS.md` — INT-01, ALT-01, ALT-02 scope and constraints.

### Roadmap
- `.planning/ROADMAP.md` — Phase 2 goal and success criteria.

### Research
- `.planning/research/SUMMARY.md` — integrity + alerting sequencing and pitfalls to avoid.
- `.planning/research/PITFALLS.md` — alert storms and proactive warning guidance.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/inventory/targets.ts` — per-target interval/timeout metadata.
- `src/polling/scheduler.ts` — poll loop and heartbeat wiring.
- `src/storage/coverage-records.ts` — coverage gap storage primitives and schema reference.

### Established Patterns
- Coverage loss is marked on any HTTP status != 200 or timeout, and gaps are persisted for SLA use.

### Integration Points
- Validation must hook into the scheduler output before persistence and alerting; alerting must read from coverage gaps and SLA metrics derived from poll results.

</code_context>

<specifics>
## Specific Ideas

- Alerts should continue firing until coverage returns, honoring per-list overrides and admin disables.

</specifics>

<deferred>
## Deferred Ideas

- SLA burn-rate dashboards and cross-PKI tagging are Phase 3+ concerns.

</deferred>

---
*Phase: 02-integrity-alerting-core*
*Context gathered: 2026-04-05*
