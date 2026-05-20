---
phase: 27
slug: public-shell-and-identity
status: ready
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-20
updated: 2026-05-20
---

# Phase 27 — Validation Strategy

Per-phase Nyquist validation contract for Phase 27 governance backfill.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Script-based validators + TypeScript checks |
| **Config file** | `package.json` scripts + `scripts/validate-all.js` |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `node scripts/validate-all.js && npm run typecheck` |
| **Estimated quick runtime** | ~10-20s |

## Sampling Rate

- After every task commit: `npm run typecheck`
- After every plan wave: `node scripts/validate-all.js && npm run typecheck`
- Before `/gsd-verify-work`: full suite must be green
- Max feedback latency target: < 30s

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Automated Command | Status |
|---------|------|------|-------------|-------------------|--------|
| 27-01-01 | 01 | 1 | UI-01 | `node scripts/validate-all.js` | ✅ green |
| 27-01-02 | 01 | 1 | UI-01 | `npm run typecheck` | ✅ green |

## Requirement Coverage Matrix

| Requirement | Covered By | Automated Evidence |
|-------------|------------|--------------------|
| UI-01 | Shared public shell + auth entry flow | `node scripts/validate-all.js`; `npm run typecheck` |

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual consistency of `/` and `/auth` shell | UI-01 | Requires browser visual confirmation | Open both routes and confirm shared shell chrome and login affordance visibility. |

## Validation Sign-Off

- [x] All tasks have automated verification
- [x] No watch-mode flags
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready 2026-05-20
