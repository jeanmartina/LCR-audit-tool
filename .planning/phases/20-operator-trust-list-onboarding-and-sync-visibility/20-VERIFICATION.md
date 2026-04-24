---
phase: 20
status: passed
verified: 2026-04-24
requirements:
  - TSL-06
  - UX-04
  - OPS-06
---

# Phase 20 Verification: Operator Trust-List Onboarding and Sync Visibility

## Verdict

PASSED - Phase 20 goal is achieved.

## Requirement Verification

- [x] `TSL-06`: trust-list operation is no longer platform-admin-only; platform admins and scoped group-admins can operate sources within their authorized group boundaries.
- [x] `UX-04`: `/admin/trust-lists` now provides a guided onboarding wizard, optional preview/test, readable timeline/status output, and actionable recovery guidance.
- [x] `OPS-06`: operator documentation explains trust-list setup, preview behavior, worker-driven sync execution, failure handling, and recovery actions.

## Automated Checks

Passed:

```bash
node scripts/validate-trust-list-operator-ux.js
node scripts/validate-i18n.js foundation
node scripts/validate-i18n.js ui
node scripts/validate-all.js
npm run typecheck
npm run build
```

## Implementation Evidence

- `src/trust-lists/admin.ts` adds `ensureTrustListOperator`, group-scope enforcement, preview orchestration, and latest recovery guidance on source summaries.
- `src/trust-lists/sync.ts` adds `previewTrustListXmlSource()` and `getTrustListRecoveryGuidance()` while keeping preview logic non-mutating and reusing the trust-list safety gates.
- `src/app/api/admin/trust-lists/preview/route.ts` exposes preview/test through an authenticated operator route, while the existing list/create/sync routes use the trust-list domain helpers.
- `src/app/admin/trust-lists/trust-list-source-wizard.tsx` provides guided source details, preview/test, and save-without-test warning behavior.
- `src/app/admin/trust-lists/page.tsx` renders the wizard plus per-source timeline, next update, last success/failure, projection counts, raw failure, and recommended recovery action.
- `src/i18n/index.ts` contains the onboarding, preview, timeline, and recovery strings in `en`, `pt-BR`, and `es`.
- `docs/operators.md` documents trust-list source onboarding, preview, recovery guidance, and worker expectations.

## Security And Operations Notes

- Preview stays non-mutating and must not create sources, runs, snapshots, projections, or imported certificates.
- Recovery guidance augments raw failure evidence; it does not replace it.
- UI and docs remain evidence-oriented and do not claim legal or eIDAS trust-policy validation.

## Residual Manual UAT

Recommended on Docker or staging when closing the milestone:

1. As platform admin, preview, save, and sync a valid trust-list source and confirm timeline/status updates.
2. As group-admin, create a source for an allowed group and confirm unmanaged group IDs are rejected.
3. Exercise invalid URL, HTTP URL, unreachable URL, XML signature failure, and empty-certificate cases and confirm the recommended action matches the raw failure.
4. Confirm saving without preview remains possible and clearly warned.
