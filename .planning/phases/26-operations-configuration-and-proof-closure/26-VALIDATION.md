---
phase: 26
slug: operations-configuration-and-proof-closure
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-09
---

# Phase 26 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Static Node.js validators + TypeScript build |
| Config file | `scripts/validate-operations-closure.js` and `scripts/validate-all.js` |
| Quick run command | `node scripts/validate-operations-closure.js` |
| Full suite command | `node scripts/validate-all.js && npm run typecheck && npm run build` |
| Estimated runtime | ~60-120 seconds |

## Sampling Rate

- After every task commit: run `node scripts/validate-operations-closure.js`
- After every plan wave: run `node scripts/validate-all.js && npm run typecheck`
- Before `/gsd-verify-work`: full suite must be green
- Max feedback latency: 120 seconds

## Validation Sign-Off

- [x] All tasks have automated verification or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-09
