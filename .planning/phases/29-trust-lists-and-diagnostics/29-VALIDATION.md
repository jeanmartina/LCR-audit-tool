---
phase: 29
slug: trust-lists-and-diagnostics
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-10
---

# Phase 29 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node scripts + next build/typecheck |
| **Config file** | none |
| **Quick run command** | `node scripts/validate-trust-list-foundation.js` |
| **Full suite command** | `node scripts/validate-trust-list-foundation.js && node scripts/validate-trust-list-operator-ux.js && node scripts/validate-all.js && npm run typecheck && npm run build` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- After every task commit: run `node scripts/validate-trust-list-foundation.js`
- After every plan wave: run the full suite
- Before `/gsd-verify-work`: full suite must be green
- Max feedback latency: 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 29-01-01 | 01 | 1 | UI-03 | T-29-01 / — | Compact inventory exposes state, last success/failure, and open-details action | script | `node scripts/validate-trust-list-operator-ux.js` | ✅ / ❌ W0 | ⬜ pending |
| 29-02-01 | 02 | 1 | UI-03 | T-29-02 / — | Hierarchy is visible in badge/grouping/detail | script | `node scripts/validate-trust-list-operator-ux.js` | ✅ / ❌ W0 | ⬜ pending |
| 29-03-01 | 03 | 1 | UI-03 | T-29-03 / — | Failure layers are explicit and actionable | script | `node scripts/validate-trust-list-operator-ux.js` | ✅ / ❌ W0 | ⬜ pending |
| 29-04-01 | 04 | 1 | UI-03 | T-29-04 / — | Archive and permanent delete remain safe and history-preserving | script | `node scripts/validate-trust-list-foundation.js` | ✅ / ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/` stubs for trust-list diagnostics UX coverage if needed
- [ ] shared fixtures for hierarchy and removal semantics if needed
- [ ] no additional framework install expected

*If none: Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| quick expand on the card | UI-03 | visual interaction is easier to verify in browser | Open trust lists, expand a card, confirm the detail bridge is readable and does not break layout |
| detail page diagnostics | UI-03 | requires reviewing presentation and not just data presence | Open a source detail page and confirm all layers are visible and legible |
| archive vs permanent delete | UI-03 | safety and copy need browser verification | Confirm both actions are visible and that permanent delete is clearly guarded |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
