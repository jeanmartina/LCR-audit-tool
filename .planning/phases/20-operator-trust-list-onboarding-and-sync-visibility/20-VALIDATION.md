# Phase 20 Validation Strategy: Operator Trust-List Onboarding and Sync Visibility

**Date:** 2026-04-23
**Status:** Ready for execution

## Validation Objective

Prove that platform admins and group-admins can understand and operate trust-list onboarding/sync through guided UI, optional pre-save testing, actionable failure guidance, and operator documentation without weakening the Phase 18/19 trust-list safety guarantees.

## Automated Checks

Add `scripts/validate-trust-list-operator-ux.js` and wire it into `scripts/validate-all.js`.

Required checks:

1. `src/trust-lists/admin.ts` includes a trust-list authorization helper supporting platform admins and group-admins.
2. Group-admin source creation rejects unmanaged group IDs.
3. Non-mutating preview/test helper exists for source URL validation, parsing, XMLDSig validation, and metadata preview.
4. Preview route exists under `src/app/api/admin/trust-lists/preview/route.ts` or an equivalent explicit path.
5. Preview helper does not call source/snapshot/sync run/certificate/projection mutation helpers.
6. Recovery guidance mapping covers invalid URL, HTTPS required, XMLDSig missing/invalid, XML too large, fetch failed, and no certificates found.
7. `/admin/trust-lists` uses guided onboarding structure and shows sync timeline/status/recovery guidance.
8. i18n contains Phase 20 trust-list onboarding and recovery keys in `en`, `pt-BR`, and `es`.
9. `docs/operators.md` explains trust-list setup, sync behavior, failure handling, and recovery steps.
10. `npm run build`, `npm run typecheck`, and `node scripts/validate-all.js` pass.

## Manual/UAT Checks

- As platform admin, open `/admin/trust-lists`, test a valid source URL, save it, sync it, and confirm timeline/status updates.
- As group-admin, create a source for a managed group and confirm unmanaged group IDs are rejected.
- Test invalid URL, HTTP URL, unreachable URL, XMLDSig-invalid XML, and too-large XML if fixtures are available; confirm guidance is actionable.
- Confirm saving without test is still possible but the UI warns about the risk.
- Confirm docs match the UI recovery language.

## Failure Conditions

- If trust-list source management remains platform-admin-only, Phase 20 fails.
- If preview/test mutates persisted sources, snapshots, runs, certificates, or projections, Phase 20 fails.
- If failures are visible only as raw error strings without recommended action, Phase 20 fails.
- If docs do not explain setup, sync behavior, failure handling, and recovery, Phase 20 fails.
