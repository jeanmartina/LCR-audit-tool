---
phase: 22
slug: derived-monitoring-source-foundation
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-28
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node validator scripts + TypeScript build |
| **Config file** | `package.json` scripts |
| **Quick run command** | `node scripts/validate-derived-monitoring-sources.js` |
| **Full suite command** | `node scripts/validate-all.js && npm run typecheck && npm run build` |
| **Estimated runtime** | ~45-90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node scripts/validate-derived-monitoring-sources.js`
- **After every plan wave:** Run `node scripts/validate-all.js && npm run typecheck`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 22-01-T1 | 01 | 1 | SRC-07 | T-22-01 | Deterministic source key prevents duplicate reimports | script | `node scripts/validate-derived-monitoring-sources.js` | ❌ W0 | ⬜ pending |
| 22-01-T2 | 01 | 1 | SRC-08 | T-22-02 | Source lifecycle states are explicit and separate from health | script | `node scripts/validate-derived-monitoring-sources.js` | ❌ W0 | ⬜ pending |
| 22-01-T3 | 01 | 1 | SRC-05/SRC-06 | T-22-03 | Provenance persists parent certificate/trust-list context | script | `node scripts/validate-derived-monitoring-sources.js` | ❌ W0 | ⬜ pending |
| 22-02-T1 | 02 | 2 | SRC-05/SRC-06 | T-22-04 | Parser dependency is build-safe and lockfile-pinned | command | `npm run typecheck` | ✅ | ⬜ pending |
| 22-02-T2 | 02 | 2 | SRC-05 | T-22-05 | AIA OCSP candidates derive without fetching URLs | script | `node scripts/validate-derived-monitoring-sources.js` | ❌ W0 | ⬜ pending |
| 22-02-T3 | 02 | 2 | SRC-06 | T-22-06 | CPS/document candidates preserve policy/document metadata | script | `node scripts/validate-derived-monitoring-sources.js` | ❌ W0 | ⬜ pending |
| 22-03-T1 | 03 | 3 | SRC-05/SRC-06 | T-22-07 | Certificate import calls derivation after successful upsert | script | `node scripts/validate-derived-monitoring-sources.js` | ❌ W0 | ⬜ pending |
| 22-03-T2 | 03 | 3 | SRC-05/SRC-06 | T-22-08 | Trust-list import passes source/snapshot/run provenance | script | `node scripts/validate-derived-monitoring-sources.js` | ❌ W0 | ⬜ pending |
| 22-03-T3 | 03 | 3 | SRC-05/SRC-08 | T-22-09 | Validators prove no polling/fetching is introduced in Phase 22 | full suite | `node scripts/validate-all.js && npm run typecheck && npm run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/validate-derived-monitoring-sources.js` — focused validator for Phase 22 source schema, helper exports, parser, call sites, source states, provenance, and no polling leakage.
- [ ] `scripts/validate-all.js` — invokes `validate-derived-monitoring-sources.js`.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [x] All tasks have automated verification or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-28
