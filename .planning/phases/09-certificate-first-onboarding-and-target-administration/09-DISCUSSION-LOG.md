# Phase 9 Discussion Log

**Date:** 2026-04-07
**Phase:** 09 - Certificate-First Onboarding and Target Administration

## Decisions captured

1. Administration unit
   - the certificate is the primary admin object
   - derived CRLs are operational results, not primary editable objects
   - operators configure at certificate level
   - operators can mark a derived URL as ignored

2. Import and deduplication
   - certificates are deduplicated by stable fingerprint
   - re-import of known certificate should update/reprocess by default
   - `.zip` imports support partial success
   - batch result must distinguish imported, updated, ignored, and invalid
   - reprocessing recalculates derived CRLs and preserves history
   - the worker should monitor a public CRL once even if many certificates reference it
   - runtime reuse of CRL history must not break group-scoped visibility

3. Configuration and overrides
   - certificate fields include label, tags, shared groups, enabled, polling interval, timeout, criticality, alert policy, extra recipients, retention, and ignored URLs
   - defaults resolve as platform -> group -> certificate
   - shared certificates must support group-specific overrides
   - the UI must show effective values before save

4. Admin surface
   - main list shows search/filtering, status, groups, derived CRL count, last import, and quick actions
   - single-certificate create/edit includes derived URL preview, ignore controls, and effective-value previews
   - `.zip` import is a separate flow
   - clone creates a template
   - change history must include full audit metadata: what changed, who changed it, and when
   - certificate detail includes metadata, derived CRLs, shared groups, history, manual validation/connectivity test, and clone/template actions

## Deferred to later phases

- ETSI TS 119 612 trust-list import
- OCSP monitoring
- CP/CPS/DPC monitoring
- multi-region execution
- full i18n rollout
