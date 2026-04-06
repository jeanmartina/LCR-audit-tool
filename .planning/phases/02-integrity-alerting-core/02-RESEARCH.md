# Phase 2 Research: Integrity & Alerting Core

**Gathered:** 2026-04-05

## Research Focus
- Validate LCR signatures and hashes before persistence; reject invalid artifacts.
- Alerting logic that continues until recovery with severity-based cooldowns.
- SLA warning thresholds based on error budget and time-without-coverage.

## Findings
1. **Validation gate:** Store verified LCR metadata and blobs only after signature + hash validation passes. Invalid artifacts should be rejected and trigger alerting with an unavailable state.
2. **Alerting cadence:** Severity-based cooldowns avoid alert storms while still keeping compliance/engineering informed. Warning and critical channels can share templates but must preserve per-list overrides.
3. **SLA warnings:** Use a dual trigger: error-budget usage OR absolute time without coverage. Alert when either condition is met, and continue until coverage is restored.

## Implications for Planning
- Add a validation module that sits between polling and storage and emits a validation result for alerting.
- Extend storage schema to include LCR metadata fields: hash, issuer, thisUpdate, nextUpdate, status.
- Add alert routing with cooldown by severity and persistence until recovery.

## Next Steps
- Implement validation module and metadata persistence.
- Implement alerting policy with cooldowns and warning/critical thresholds.
- Add SLA metric calculations for error budget + time-without-coverage.
