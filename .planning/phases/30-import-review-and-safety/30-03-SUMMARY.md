---
phase: 30-import-review-and-safety
plan: 03
subsystem: trust-list-review
tags: [certificate-import, trust-list, review-safety, provenance]
requires:
  - phase: 30-import-review-and-safety
    provides: shared review submission validation and single/ZIP review UX
provides:
  - Trust-list sync enforces explicit per-candidate review payload decisions
  - Non-accepted trust-list outcomes persist as audited review outcomes without activation
  - Safety validator coverage for full-origin review parity
affects: [trust-list-sync, certificate-import, certificate-detail-history, i18n]
tech-stack:
  added: []
  patterns: [review-required-sync, non-accepted-audit-persistence, origin-parity-validation]
key-files:
  created:
    - scripts/validate-import-review-safety.js
  modified:
    - scripts/validate-all.js
    - src/app/api/admin/trust-lists/[sourceId]/sync/route.ts
    - src/trust-lists/sync.ts
    - src/trust-lists/admin.ts
    - src/app/admin/trust-lists/trust-list-source-wizard.tsx
    - src/app/admin/trust-lists/page.tsx
    - src/app/admin/certificates/[certificateId]/page.tsx
    - src/i18n/index.ts
decisions:
  - "Trust-list sync save now requires reviewPayload.candidateDecisions and rejects missing payload with review-required:candidate-decisions."
  - "ignore/reject/duplicate/pending trust-list decisions are persisted via recordCertificateReviewOutcome and do not create active certificates."
metrics:
  duration: 35min
  completed: 2026-05-13
requirements-completed: [UI-04]
---

# Phase 30 Plan 03: Import Review and Safety Summary

Trust-list-derived imports now follow explicit review-before-save decisions with non-accepted outcomes persisted for audit without activating certificates.

## Accomplishments
- Added Phase 30 safety validator (`scripts/validate-import-review-safety.js`) and wired it into aggregate validation.
- Enforced review payload parsing/validation in trust-list sync route and forwarded payload through admin sync orchestration.
- Updated trust-list sync to require candidate decisions, apply `accept|edit|ignore|reject|duplicate|pending`, and persist non-accepted outcomes through review-audit records.
- Added review payload copy/hooks in trust-list admin UI and localized keys.
- Surfaced review-tagged history markers in certificate detail change history output.

## Task Commits
1. `c080671` - `test(30-03): add failing trust-list review safety validator`
2. `c72b793` - `feat(30-03): enforce trust-list review payload and audit-safe outcomes`

## Verification
- `node scripts/validate-import-review-safety.js`
- `npm run quality`

## Deviations from Plan

### Auto-fixed Issues
1. [Rule 1 - Bug] Relaxed brittle validator anchor tied to exact `decision: "accept"` literal.
- Found during: TDD GREEN verification
- Issue: Trust-list decision dispatch became dynamic and invalidated a literal-only assertion.
- Fix: Updated validator to assert review payload and decision-state anchors without requiring a fixed literal.
- Files modified: `scripts/validate-import-review-safety.js`
- Commit: `c72b793`

## Known Stubs
- `src/app/admin/trust-lists/trust-list-source-wizard.tsx` includes a raw `reviewPayload` JSON field as an interim operator input surface. It is intentionally explicit for this plan’s policy enforcement and validator parity.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: review-payload-gate | src/app/api/admin/trust-lists/[sourceId]/sync/route.ts | New trust boundary at sync save now enforces candidate decision payload before mutation. |

## Self-Check: PASSED
- Found summary file: `.planning/phases/30-import-review-and-safety/30-03-SUMMARY.md`
- Found commits: `c080671`, `c72b793`
