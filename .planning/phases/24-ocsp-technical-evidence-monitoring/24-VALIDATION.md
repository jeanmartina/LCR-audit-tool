---
phase: 24
slug: ocsp-technical-evidence-monitoring
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-04
---

# Phase 24 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | static Node.js validators + TypeScript compiler + Next build |
| **Config file** | `scripts/validate-all.js` |
| **Quick run command** | `node scripts/validate-ocsp-monitoring.js` |
| **Full suite command** | `node scripts/validate-all.js && npm run typecheck && npm run build` |
| **Estimated runtime** | ~12 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node scripts/validate-ocsp-monitoring.js`
- **After every plan wave:** Run `node scripts/validate-all.js && npm run typecheck`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 24-01-T1 | 01 | 1 | OCSP-02/OCSP-03 | T-24-01 | OCSP events/evidence persist raw bounded request/response and hashes | static | `node scripts/validate-ocsp-monitoring.js` | ❌ W0 | ⬜ pending |
| 24-01-T2 | 01 | 1 | OCSP-02/OCSP-04 | T-24-02 | Technical statuses exclude semantic `good/revoked/unknown` health | static | `node scripts/validate-ocsp-monitoring.js` | ❌ W0 | ⬜ pending |
| 24-02-T1 | 02 | 2 | OCSP-01 | T-24-03 | Dependency choice can generate DER OCSP requests in Node 22 | command | `npm run typecheck` | ✅ | ⬜ pending |
| 24-02-T2 | 02 | 2 | OCSP-01 | T-24-04 | Missing issuer context records `not_checkable` instead of weak checks | static | `node scripts/validate-ocsp-monitoring.js` | ❌ W0 | ⬜ pending |
| 24-02-T3 | 02 | 2 | OCSP-01/OCSP-02/OCSP-03/OCSP-04 | T-24-05 | OCSP check service sends real request, stores evidence, and avoids semantic health claims | static + typecheck | `node scripts/validate-ocsp-monitoring.js && npm run typecheck` | ❌ W0 | ⬜ pending |
| 24-03-T1 | 03 | 3 | OCSP-01/OCSP-02 | T-24-06 | Worker checks only due discovered OCSP sources and catches per-source errors | static | `node scripts/validate-ocsp-monitoring.js` | ❌ W0 | ⬜ pending |
| 24-03-T2 | 03 | 3 | OCSP-01/OCSP-03 | T-24-07 | Runtime limits are env-configurable and compose-wired | static | `node scripts/validate-ocsp-monitoring.js` | ❌ W0 | ⬜ pending |
| 24-04-T1 | 04 | 4 | OCSP-01..OCSP-04 | T-24-08 | Final validator and proof cover all requirements and future-scope boundaries | full suite | `node scripts/validate-all.js && npm run typecheck && npm run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/validate-ocsp-monitoring.js` — focused OCSP validator stub created in Plan 24-01.
- [ ] `src/monitoring-sources/ocsp-types.ts` — OCSP status/evidence type surface created in Plan 24-01.
- [ ] `src/monitoring-sources/ocsp.ts` — OCSP request/check service created in Plan 24-02.

---

## Manual-Only Verifications

All phase behaviors have automated verification through static validators, typecheck, and production build. Live external OCSP calls are intentionally not required because responder availability and certificate fixtures are network-dependent.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-04
