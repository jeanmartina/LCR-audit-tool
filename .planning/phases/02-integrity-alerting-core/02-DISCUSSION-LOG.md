# Phase 2: Integrity & Alerting Core - Discussion Log

> Audit trail only. Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 02-integrity-alerting-core
**Areas discussed:** Validation, Persistence, Alerting, SLA Thresholds

---

## Validation

| Option | Description | Selected |
|--------|-------------|----------|
| Reject and mark unavailable | Do not persist invalid LCR; alert immediately | ✓ |
| Persist as invalid | Store for audit, mark invalid, alert | |
| Reject without alert | Mark invalid without alert | |

**User's choice:** Reject and mark unavailable
**Notes:** Validation failures must trigger alerts immediately.

---

## Persistence

| Option | Description | Selected |
|--------|-------------|----------|
| No duplicate blobs | Record verification, keep last valid blob | ✓ |
| Store duplicates | Archive every fetch | |

**User's choice:** No duplicate blobs
**Notes:** Persist metadata: hash, issuer, thisUpdate, nextUpdate, status.

---

## Alerting

| Option | Description | Selected |
|--------|-------------|----------|
| Global cooldown | Single interval for all alerts | |
| Cooldown by severity | Different cadence for warning/critical | ✓ |
| No cooldown | Alert on every failure | |

**User's choice:** Cooldown by severity
**Notes:** Warning 30m, Critical 10m.

---

## SLA Thresholds

| Option | Description | Selected |
|--------|-------------|----------|
| Error budget | Warn at percent budget consumed | |
| Time without coverage | Warn after N minutes down | |
| Both | Warn when either condition triggers | ✓ |

**User's choice:** Both
**Notes:** Warning triggers on error-budget or time-without-coverage thresholds.

## the agent's Discretion
- Exact warning vs critical classification thresholds beyond the selected cooldown policy.
- Email templates and formatting details.

## Deferred Ideas
None.
