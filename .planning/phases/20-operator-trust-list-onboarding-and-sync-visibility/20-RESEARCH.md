# Phase 20 Research: Operator Trust-List Onboarding and Sync Visibility

**Date:** 2026-04-23
**Phase:** 20 - Operator Trust-List Onboarding and Sync Visibility
**Requirements:** TSL-06, UX-04, OPS-06

## Planning Question

How should the product make trust-list onboarding and ongoing sync understandable to operators while preserving the Phase 18/19 safety model and adding group-admin scoped operation?

## Current Implementation Baseline

Implemented by Phase 18/19:

- `src/trust-lists/admin.ts` provides platform-admin-only source list/create/sync helpers.
- `src/app/admin/trust-lists/page.tsx` has a single form and a source table.
- `src/app/api/admin/trust-lists/route.ts` supports `GET` and `POST` source creation.
- `src/app/api/admin/trust-lists/[sourceId]/sync/route.ts` supports manual sync.
- `src/trust-lists/sync.ts` fetches HTTPS/localhost URLs, enforces timeout/size, parses XML, blocks invalid XMLDSig, snapshots valid XML, imports/projects certificates, and persists sync run state.
- Phase 19 exposes projection counters and certificate provenance but not a guided onboarding wizard or recovery guidance.
- `docs/operators.md` covers Docker, auth proof, and batch import, but not trust-list source setup/recovery in operational detail.

## Key Gap Analysis

### Authorization

Current trust-list admin surface is platform-admin-only. User selected group-admin operation for sources limited to their administered groups. This requires a trust-list-specific authorization helper:

- platform admin: can list/create/sync all sources;
- group-admin: can list sources where `source.groupIds` intersects/administered groups and create/sync only sources whose groups are all administered;
- non-admin/operator/viewer: no trust-list source management in this phase.

This should live in `src/trust-lists/admin.ts` to keep route/page code simple and consistent.

### Optional Preview/Test

The sync core currently couples fetch+validate with persistence. Phase 20 needs a non-mutating test path. Recommended pattern:

- Extract or add a helper that performs URL assertion, fetch with timeout/size limit, parse, XMLDSig validation, and returns a preview object.
- Preview must not create source, sync run, snapshot, extracted certificate, projection, target, or certificate records.
- Preview response should include: `ok`, `digestSha256`, `sequenceNumber`, `territory`, `issueDate`, `nextUpdate`, `certificateCount`, `xmlSizeBytes`, `validationStatus`, `failureReason`, `recovery`.
- The same known error mapping should be reused by preview and sync status UI.

### Guided UI

Existing certificate onboarding has a client component (`CertificatePreviewForm`) that performs preview then commit. Trust-list onboarding should reuse this pattern:

- keep `/admin/trust-lists` as the route;
- split the form into a client wizard component for URL/groups/test/save;
- show three conceptual steps: source details, test/preview, save and sync;
- use existing primitives: `PageShell`, `PageHeader`, `Panel`, `Field`, `Notice`, `StatusPill`, `EmptyState`, `ActionButton`;
- include field hints/examples in i18n;
- show preview result and warning that saving without successful test is allowed but riskier.

### Status/Timeline UI

TSL-06 requires status, last successful sync, next expected update, failure reason, and change summary. Phase 19 already gives projection counts; Phase 20 should repackage into an operator timeline:

- current source enabled/disabled;
- last run status;
- last success timestamp;
- last failure timestamp and reason;
- next expected update from latest accepted snapshot;
- projection/import summary: imported, updated, skipped unchanged, duplicate skipped, failed;
- recommendation from recovery mapping.

A simple per-source vertical timeline/stack is sufficient and avoids a separate run-history surface.

### Recovery Guidance Mapping

Known failure strings currently include:

- `trust-list-invalid-url`
- `trust-list-url-must-use-https`
- `trust-list-xml-too-large`
- `trust-list-fetch-failed:<status>`
- `xml-signature-missing`
- `xml-signature-invalid` or XMLDSig validation reasons
- parser/import failures that can be treated as generic XML/certificate extraction failures

Recommended helper:

- `getTrustListRecoveryGuidance(reason?: string | null)` returns a stable `code`, localized key base or English-neutral code, severity, title key, body key, and action key.
- UI can translate keys or use a code-to-copy map in i18n.
- Docs should use the same cases.

### Documentation

`docs/operators.md` should gain:

- trust-list setup prerequisites;
- who can manage sources;
- how to test a source before save;
- what sync does and does not do;
- worker behavior in Docker;
- failure/recovery table;
- proof checklist for a packaged deployment.

## Recommended Plan Split

1. **20-01 Trust-List Operator Permissions, Preview, and Recovery Model**
   - group-admin scoped authorization;
   - non-mutating preview/test helper and route;
   - recovery guidance mapping;
   - validator foundation.

2. **20-02 Guided Trust-List Onboarding UI, Timeline, Docs, and Final Validation**
   - guided client wizard on `/admin/trust-lists`;
   - per-source timeline/status/recovery display;
   - i18n updates;
   - `docs/operators.md` trust-list section;
   - final build/typecheck/validate-all.

## Validation Architecture

Add `scripts/validate-trust-list-operator-ux.js` and wire it into `scripts/validate-all.js`.

Required assertions:

- trust-list admin helper supports group-admin scoped operation, not just `assertPlatformAdmin`.
- preview/test helper exists and does not call persistence mutation helpers.
- preview API route exists.
- recovery guidance helper covers required known errors.
- `/admin/trust-lists` uses a guided wizard/client component and shows timeline/status/recovery copy.
- i18n contains required trust-list onboarding/recovery keys in all locales.
- `docs/operators.md` contains trust-list setup, sync behavior, failure handling, and recovery steps.
- Existing trust-list foundation/projection validators still pass.

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Group-admin can attach sources to groups they do not manage | Centralize all source create/sync checks in `src/trust-lists/admin.ts`. |
| Preview mutates inventory accidentally | Validator must assert preview path does not call source/snapshot/import/projection mutation helpers. |
| UI overclaims legal validation | Reuse XMLDSig/integrity-only wording from Phases 18/19. |
| Sync status remains too technical | Map known failures to prescriptive action copy and keep raw error as secondary evidence. |
| Scope creep into full run history | Deliver simple timeline only; defer full history unless trivial. |
