# Phase 4: Runtime Inventory, Polling, and Persistence Wiring - Context

## Phase Boundary

This phase closes the runtime wiring gaps identified in the v1.0 milestone audit. It replaces the scaffolded inventory and in-memory monitoring path with a real end-to-end runtime pipeline that loads targets from the database, validates LCRs during polling, persists evidence and alerts, and exposes the minimum backend contracts needed for downstream consumers.

This phase does not finish dashboard UX, filters, or export wiring. Those remain in Phase 5. Phase 4 is responsible for backend/runtime closure and read contracts only.

## Implementation Decisions

### Inventory Source Of Truth

- The inventory source of truth is the database.
- Targets must no longer depend on `DEFAULT_TARGETS` or any placeholder in-memory list as the runtime source.
- Per-target runtime configuration continues to live with the target record, including intervals, timeouts, alert routing, and retention settings.

### Persistence Scope

- Persistence introduced in this phase must be production-grade, not just local/dev scaffolding.
- Polls, alerts, coverage gaps, snapshots, and verification events must be modeled so they can support later reporting and audit queries without redesign.
- The runtime path must survive process restarts and provide durable evidence for later phases.

### Validation And Snapshot Handling

- When validation fails, the invalid artifact is still persisted for audit purposes.
- A validation failure also marks the resource unavailable in the runtime flow.
- When a newly fetched artifact has the same hash as the last valid one, the system must not store a duplicate blob.
- Hash repeats still produce a verification/event record so the runtime history remains visible.

### Alert Emission Ordering

- Alert events must be persisted before delivery is attempted.
- Delivery outcomes can be recorded afterward, but the system of record is the persisted alert event.
- This ordering is required so reporting and audit trails never depend on mail delivery success.

### Phase 4 / Phase 5 Boundary

- Phase 4 delivers backend/runtime closure plus minimal read contracts for downstream consumers.
- Phase 5 owns UI consumption, filters, exports, and full reporting surface wiring.
- If endpoints or read adapters are needed now, they exist only to expose the persisted runtime data cleanly to Phase 5.

### The Agent's Discretion

- The specific schema split between poll records, validation events, alert events, and snapshot/blob records can be decided during planning as long as the audit requirements above hold.
- The exact transport for email delivery can remain implementation-defined, provided alert persistence remains first.
- The exact shape of the minimal read contracts can be decided during planning as long as they are sufficient for Phase 5 reporting work.

## Canonical References

### Audit And Gap Closure

- `.planning/v1.0-MILESTONE-AUDIT.md`
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`

### Upstream Phase Artifacts

- `.planning/phases/01-observability-polling-foundation/01-CONTEXT.md`
- `.planning/phases/01-observability-polling-foundation/01-VERIFICATION.md`
- `.planning/phases/02-integrity-alerting-core/02-CONTEXT.md`
- `.planning/phases/02-integrity-alerting-core/02-VERIFICATION.md`
- `.planning/phases/03-reporting-compliance-governance/03-CONTEXT.md`
- `.planning/phases/03-reporting-compliance-governance/03-VERIFICATION.md`

## Existing Code Insights

### Reusable Assets

- `src/inventory/targets.ts` already defines the target shape and retention metadata, but still uses placeholder loading.
- `src/polling/scheduler.ts` already contains the polling loop shape and timeout handling, but not the runtime wiring to validation or alert persistence.
- `src/validation/lcr-validator.ts` already defines the validation contract.
- `src/alerting/alert-policy.ts` already defines severity and cooldown helpers.
- `src/storage/coverage-records.ts` already defines poll/gap/snapshot-oriented structures, but still operates in memory.

### Established Patterns

- Earlier phases already separated monitoring, validation, alerting, and reporting concerns into modules; Phase 4 should preserve that separation while closing the runtime wiring.
- Reporting now assumes persisted evidence exists, so schema and runtime event design here must support Phase 5 without another rewrite.

### Integration Points

- Database-backed inventory feeds the scheduler.
- Scheduler calls validation and persistence layers, then records/publishes alerts from persisted alert events.
- Minimal read contracts from the persistence layer will feed Phase 5 reporting adapters/endpoints.

## Specific Ideas

- Treat invalid artifacts as first-class audit evidence instead of dropping them.
- Keep duplicate-hash fetches cheap by recording the event without storing a second blob.
- Make persisted alert events the canonical record, with delivery as a side effect.

## Deferred Ideas

- UI wiring, filter controls, and export actions remain in Phase 5.
- Full reporting endpoints/pages remain in Phase 5 unless a minimal backend contract is required as part of runtime closure.

---
*Phase: 04-runtime-inventory-polling-persistence-wiring*
*Context gathered: 2026-04-06*
