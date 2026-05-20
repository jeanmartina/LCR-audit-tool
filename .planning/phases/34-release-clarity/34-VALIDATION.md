---
phase: 34
slug: release-clarity
status: ready
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-19
updated: 2026-05-20
---

# Phase 34 — Validation Strategy

Per-phase Nyquist validation contract for Phase 34 execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Script-based validators + TypeScript compiler checks |
| **Config file** | `package.json` scripts + `scripts/validate-reporting.js` |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `npm run validate && npm run typecheck && npm run build` |
| **Estimated quick runtime** | ~10-20s (machine-dependent) |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck`
- **After every plan wave:** Run `npm run validate && npm run typecheck`
- **Before `/gsd-verify-work`:** Run `npm run validate && npm run typecheck && npm run build`
- **Max feedback latency (task loop):** target < 30s

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 34-01-01 | 01 | 1 | UI-08 | T-34-02, T-34-03 | `/api/version` uses shared resolver and returns only minimal version contract (no extended metadata). | type/contract | `npm run typecheck` | ✅ | ⬜ pending |
| 34-01-02 | 01 | 1 | UI-08 | T-34-01, T-34-03 | Global topbar renders `vX.Y.Z` only; hides indicator when resolver returns null. | type/integration | `npm run typecheck` | ✅ | ⬜ pending |
| 34-01-03 | 01 | 1 | UI-08 | T-34-03, T-34-04 | Validator anchors and operator docs enforce UI/API parity and packaged-runtime verification steps. | validator/docs-contract | `node scripts/validate-reporting.js && npm run validate` | ✅ | ⬜ pending |

Status legend: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky

---

## Requirement Coverage Matrix

| Requirement | Covered By Task(s) | Automated Evidence |
|-------------|--------------------|--------------------|
| UI-08 | 34-01-01, 34-01-02, 34-01-03 | `npm run typecheck`; `node scripts/validate-reporting.js && npm run validate`; phase gate build |

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

- Existing script validation framework in `scripts/`
- Existing `typecheck`, `validate`, `build` scripts in `package.json`
- No missing `<automated>` verify entries in plan tasks

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Operator confirms topbar version visibility in packaged runtime UI | UI-08 | Visual confirmation in running packaged environment is user-facing and environment-specific | Start packaged runtime, open operator/reporting flow, confirm visible topbar label `vX.Y.Z`; if runtime metadata is missing, confirm indicator is absent. |
| Operator compares UI label to `/api/version` response | UI-08 | Runtime parity check across UI and endpoint in deployed package | Query `GET /api/version`, compare returned version value with topbar label, confirm exact match and no extra metadata fields used for operator-visible label. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency target for task loop is < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready 2026-05-20
