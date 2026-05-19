---
phase: 30
slug: import-review-and-safety
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-12
---

# Phase 30 — Validation Strategy

## Test Infrastructure
- Quick run: `npm run typecheck`
- Full run: `npm run quality`

## Sampling Rate
- After every task commit: `npm run typecheck`
- After every plan wave: `npm run quality`

## Validation Sign-Off
- [ ] All tasks include automated verification or explicit manual verification
- [ ] `nyquist_compliant: true` set when phase validation is complete
