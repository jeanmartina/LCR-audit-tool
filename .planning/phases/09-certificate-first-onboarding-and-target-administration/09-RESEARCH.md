# Phase 9: Certificate-First Onboarding and Target Administration - Research

**Researched:** 2026-04-07
**Status:** Ready for planning

## Scope

This research is limited to Phase 9 concerns:
- certificate-first onboarding instead of manual CRL URL entry
- single-certificate upload and `.zip` batch import
- certificate fingerprint deduplication and CRL derivation
- group-shared certificates with per-group overrides
- certificate admin UX, change history, clone/template flow, and effective-value previews
- internal CRL execution deduplication without breaking group authorization boundaries

## Recommended Direction

### Domain model
- Introduce a **certificate-centric admin model** rather than expanding `runtime_targets` directly as the only admin abstraction.
- Recommended entities for Phase 9:
  - `certificates`
  - `certificate_import_runs`
  - `certificate_import_items`
  - `certificate_crl_links`
  - `certificate_group_overrides`
  - `certificate_change_events`
  - `certificate_templates`
- Keep `runtime_targets` as the execution/runtime projection that downstream polling already consumes.

Why:
- The product requirement is now certificate-first.
- The current runtime model is still target-centric and too thin for admin UX, imports, and audit-grade change history.
- A projection model lets Phase 9 add operator workflows without breaking Phases 1-8 runtime/reporting assumptions.

### Certificate identity and deduplication
- Use a **stable certificate fingerprint** as the primary dedup key for uploaded certificates.
- Re-importing a known certificate should update the certificate record and regenerate the derived CRL projection instead of creating duplicates.
- `.zip` imports should be modeled as one import run with many item-level results so partial success is first-class.

Why:
- The context explicitly wants update-by-default behavior for known certificates.
- Batch import needs auditable results for imported, updated, ignored, and invalid items.

### Derived CRLs and runtime reuse
- Treat derived CRL URLs as **runtime-execution assets** that can be reused across certificates internally.
- Keep a link table from certificate -> derived CRL URL with an `ignored` flag.
- Reuse CRL runtime evidence/history when the same public URL is already being monitored, but keep read access certificate/group-scoped.

Why:
- The user wants runtime deduplication to avoid double-monitoring the same public CRL.
- The user explicitly does **not** want this to widen visibility across groups.

### Configuration and overrides
- Keep three levels of configuration resolution:
  - platform defaults
  - group defaults
  - certificate config
- Add **group-specific overrides** for shared certificates rather than duplicating the certificate object.
- Expose effective values in the UI by resolving and labeling where each value came from.

Why:
- The milestone already locked the default hierarchy.
- Shared certificates with group-specific behavior are part of the product model, not just an implementation detail.

### UX structure
- Use three main surfaces:
  1. certificate list
  2. single-certificate create/edit/detail
  3. separate batch import flow
- Clone should create a reusable **template** object rather than a live duplicated certificate.
- Change history should be stored as durable events with actor, timestamp, and diff-like payload.

Why:
- This matches the decisions captured in `09-CONTEXT.md`.
- The current project has no admin UX, so planning should deliberately separate list/detail/batch flows instead of bolting everything onto one screen.

### Integration shape
- Phase 9 should add:
  - admin read-models for certificate list/detail
  - admin route handlers or server actions for upload/import/edit/share/template operations
  - validation script(s) proving:
    - no manual-primary CRL onboarding path
    - certificate fingerprint dedup exists
    - group override structures exist
    - batch import surface exists

Why:
- The project already uses Next.js App Router and `scripts/validate-*` as the standard verification mechanism.
- Phase 10 depends on Phase 9 preserving group boundaries while enriching onboarding/admin state.

## Pitfalls to avoid in this phase

1. **Forcing the runtime target model to act as the only admin model**
   - It does not currently encode imports, templates, change history, or group overrides well.

2. **Letting CRL runtime dedup leak into authorization**
   - Shared runtime execution must not imply shared visibility.

3. **Mixing single-certificate and batch-import UX into one overloaded form**
   - The user explicitly wants batch import as a separate flow because large `.zip` archives need iterative handling.

4. **Using only certificate-level global config for shared certificates**
   - The product requires per-group overrides.

5. **Treating clone as a live duplicate**
   - The product wants templates, not duplicate live monitoring state.

## Implications for Planning

The plan should be sequenced in this order:
1. persistence/domain model for certificates, derived CRLs, group overrides, import runs, templates, and history
2. certificate ingestion, fingerprint deduplication, CRL derivation, and batch import processing
3. admin UI/read-model surfaces for list/detail/template/import with effective-value previews and sharing controls

That sequence keeps runtime projection and admin UX aligned while preserving group authorization from Phase 8.

## References Used

- `.planning/phases/09-certificate-first-onboarding-and-target-administration/09-CONTEXT.md`
- `.planning/phases/08-identity-invitations-and-access-foundation/08-CONTEXT.md`
- `.planning/phases/08-identity-invitations-and-access-foundation/08-VERIFICATION.md`
- `.planning/research/ARCHITECTURE.md`
- `.planning/research/PITFALLS.md`
- `.planning/research/SUMMARY.md`
- `src/storage/runtime-store.ts`
- `src/inventory/targets.ts`
- `src/inventory/target-admin.ts`
- `src/auth/authorization.ts`

---
*Phase: 09-certificate-first-onboarding-and-target-administration*
*Research completed: 2026-04-07*
