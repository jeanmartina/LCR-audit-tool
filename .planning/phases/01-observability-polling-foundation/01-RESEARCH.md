# Phase 1 Research: Observability & Polling Foundation

**Gathered:** 2026-04-05

## Research Focus
- How to orchestrate per-list/per-certificate polling with configurable intervals, timeouts, and alert metadata.
- How to persist every poll result (success, failure, coverage gap) with the audit-friendly schema Timescale offers.
- How to emit heartbeat signals so expired or missing LCRs surface before downstream layers use stale data.

## Findings
1. **Scheduling:** Celery Beat (Python) or a similar scheduler paired with FastAPI background workers handles per-target intervals cleanly; tasks can read the inventory and compute when each target is due, then emit Healthchecks-style heartbeats for observability. Interval metadata (seconds) should live in a Timescale configuration table referenced each time the scheduler resumes.
2. **Storage:** Timescale hypertables support retention/compression for coverage metrics. Poll results should write to tables (e.g., `lcr_polls` with `status`, `duration`, `coverage_gap`, `hash`, `target_id`) while raw LCR blobs go into object storage with metadata for hash/signature comparisons.
3. **Coverage detection:** Each poll compares the HTTP status/timeouts against thresholds; if every target reports failure and no new LCR is present, the metrics layer must emit a “coverage lost” window (`start`, `end`, `targets`). Healthchecks (per-task) or synthetic monitors raise alerts when a task stops sending success heartbeats.

## Implications for Planning
- Design worker tasks that can run in parallel but respect the next-due interval per target; storing `next_check_at` avoids drifting schedules.
- Record coverage gaps with both per-target data and aggregated windows used by Phase 2's SLA metrics.
- Keep inventory editable so new lists/certificates appear in the scheduler without redeploying code.

## Next Steps
- Implement inventory/config tables and CLI for adding targets.
- Build scheduler worker that reads inventory, executes HTTP checks, validates status/timeouts, writes Timescale rows, and emits Healthchecks heartbeats.
- Persist coverage gaps to help Phases 2/3 story and share metadata with alerting.
