---
phase: 23
slug: cp-cps-dpc-document-snapshot-monitoring
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-01
---

# Phase 23 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node validator scripts + TypeScript build |
| **Config file** | `package.json` scripts |
| **Quick run command** | `node scripts/validate-document-snapshots.js` |
| **Full suite command** | `node scripts/validate-all.js && npm run typecheck && npm run build` |
| **Estimated runtime** | ~60-120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node scripts/validate-document-snapshots.js`
- **After every plan wave:** Run `node scripts/validate-all.js && npm run typecheck`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 23-01-T1 | 01 | 1 | DOCS-01/SEC-01 | T-23-01 | Public HTTP/HTTPS are allowed only after private-target and redirect validation | script | `node scripts/validate-document-snapshots.js` | ❌ W0 | ⬜ pending |
| 23-01-T2 | 01 | 1 | DOCS-02/DOCS-05 | T-23-02 | Events and snapshots persist hash, metadata, raw evidence, and provenance | script | `node scripts/validate-document-snapshots.js` | ❌ W0 | ⬜ pending |
| 23-01-T3 | 01 | 1 | DOCS-01/SEC-01 | T-23-03 | Focused validator proves safe-fetch and storage boundaries | script | `node scripts/validate-document-snapshots.js` | ❌ W0 | ⬜ pending |
| 23-02-T1 | 02 | 2 | DOCS-03 | T-23-04 | PDF dependency is evaluated before install and build/typecheck-safe | command | `npm run typecheck` | ✅ | ⬜ pending |
| 23-02-T2 | 02 | 2 | DOCS-02/DOCS-03/DOCS-04 | T-23-05 | Check service records event-per-check and snapshot-on-hash-change | script | `node scripts/validate-document-snapshots.js` | ❌ W0 | ⬜ pending |
| 23-02-T3 | 02 | 2 | DOCS-03 | T-23-06 | Extraction failures are recorded without losing raw/hash evidence | script | `node scripts/validate-document-snapshots.js` | ❌ W0 | ⬜ pending |
| 23-03-T1 | 03 | 3 | DOCS-01/DOCS-04 | T-23-07 | Worker checks only due discovered policy-document sources | script | `node scripts/validate-document-snapshots.js` | ❌ W0 | ⬜ pending |
| 23-03-T2 | 03 | 3 | DOCS-01/SEC-01 | T-23-08 | Env defaults control timeout, size, extraction, redirects, and cadence | script | `node scripts/validate-document-snapshots.js` | ❌ W0 | ⬜ pending |
| 23-04-T1 | 04 | 4 | DOCS-01..DOCS-05/SEC-01 | T-23-09 | Full validator and docs prove the complete Phase 23 contract | full suite | `node scripts/validate-all.js && npm run typecheck && npm run build` | ❌ W0 | ⬜ pending |
| 23-04-T2 | 04 | 4 | DOCS-05 | T-23-10 | Proof report captures future AI boundary and retained provenance | full suite | `node scripts/validate-all.js && npm run typecheck && npm run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/validate-document-snapshots.js` — focused validator for safe fetch, schema, extraction, worker wiring, env vars, provenance, and no OCSP leakage.
- [ ] `scripts/validate-all.js` — invokes `validate-document-snapshots.js`.

---

## Manual-Only Verifications

All phase behaviors have automated verification through static validators, typecheck, and production build. Live external document fetching is intentionally not required for validation because URLs are untrusted and network-dependent.

---

## Validation Sign-Off

- [x] All tasks have automated verification or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-01
