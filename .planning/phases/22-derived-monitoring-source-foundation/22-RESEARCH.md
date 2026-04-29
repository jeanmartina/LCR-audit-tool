# Phase 22 Research: Derived Monitoring Source Foundation

**Date:** 2026-04-28  
**Phase:** 22 - Derived Monitoring Source Foundation  
**Question:** What must be known to plan a deterministic derived-source layer for OCSP and CP/CPS/DPC candidates?

## Research Summary

Phase 22 should add a certificate-child `monitoring_sources` model and derivation pipeline, not polling. The safest plan is to split work into storage, parser/dependency, and integration/validator plans. This keeps schema and identity stable before adding X.509 parsing and then call-site integration.

## Relevant Standards and Library Findings

- RFC 5280 defines AIA `id-ad-ocsp` as the OCSP responder access method and Certificate Policies CPS Pointer qualifiers as URI pointers to CPS documents: https://www.ietf.org/rfc/rfc5280.html
- RFC 6960 defines OCSP requests/responses and is the baseline for later technical OCSP request generation: https://www.rfc-editor.org/rfc/rfc6960
- PKIjs provides TypeScript PKI primitives and exposes `OCSPRequest.createForCertificate` and `OCSPResponse` classes; current npm search result shows `pkijs` 3.2.5: https://www.npmjs.com/package/pkijs and https://pkijs.org/docs/api/classes/OCSPRequest/
- `@peculiar/x509` is a smaller X.509-focused TypeScript library; npm search result shows 1.13.0 while project docs/Snyk show 2.0.0, so execution should verify the package version with `npm view @peculiar/x509 version` before installing: https://www.npmjs.com/package/%40peculiar/x509 and https://peculiarventures.github.io/x509/
- `@peculiar/asn1-x509` directly models RFC 5280 ASN.1 structures and may be useful if `@peculiar/x509` does not expose enough extension detail: https://www.npmjs.com/package/%40peculiar/asn1-x509

## Recommended Implementation Direction

### Storage

Add a single `monitoring_sources` table with provenance inline for Phase 22. This matches the user's 4A decision and avoids over-normalizing provenance before real multi-origin behavior is proven necessary.

Minimum fields:

- `id text primary key`
- `source_key text not null unique`
- `certificate_id text null`
- `fingerprint text not null`
- `source_type text not null` with values initially `ocsp` and `policy-document`
- `source_url text null`
- `normalized_url text null`
- `document_role text null` with values such as `cp`, `cps`, `dpc`, `unknown-policy-document`
- `policy_oid text null`
- `state text not null` with values `discovered`, `not_discovered`, `not_checkable`, `disabled`
- `derivation_reason text not null`
- `trust_list_source_id text null`
- `trust_list_snapshot_id text null`
- `trust_list_run_id text null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

The source key should be deterministic:

```text
sha256(fingerprint + "\0" + sourceType + "\0" + normalizedUrl + "\0" + documentRole + "\0" + policyOid)
```

For `not_discovered` sources without URL, use a stable pseudo URL component such as empty string plus document role/source type.

### Parser and Derivation

Create a focused parser module under `src/monitoring-sources/`. The planner should require an evaluation task before installing dependencies:

1. Check current package versions with `npm view @peculiar/x509 version pkijs version asn1js version @peculiar/asn1-x509 version`.
2. Prefer `@peculiar/x509` if it exposes raw extension data enough to parse AIA and Certificate Policies with minimal dependencies.
3. Use `pkijs` + `asn1js` if OCSP structures and extension extraction are materially easier and build/typecheck remain clean.
4. Fall back to `@peculiar/asn1-x509` alongside `@peculiar/x509` if raw RFC 5280 structures are needed.

Derivation outputs should be simple records, not runtime DB records directly:

```ts
type DerivedMonitoringSourceCandidate = {
  sourceType: "ocsp" | "policy-document";
  sourceUrl: string | null;
  normalizedUrl: string | null;
  documentRole: "cp" | "cps" | "dpc" | "unknown-policy-document" | null;
  policyOid: string | null;
  state: "discovered" | "not_discovered" | "not_checkable" | "disabled";
  derivationReason: string;
};
```

### Integration

Call source derivation after certificate upsert/import, not before. Existing certificate import should remain successful if source derivation fails or finds nothing. Trust-list imports should pass provenance (`trustListSourceId`, `trustListSnapshotId`, `trustListRunId`) into the same helper.

### Validation Architecture

Validation should be script-based, matching project convention:

- Add `scripts/validate-derived-monitoring-sources.js`.
- Wire it into `scripts/validate-all.js`.
- Validate schema strings, helper exports, parser module, import call sites, trust-list call sites, source states, deduplication key, provenance fields, and no polling implementation leakage.

## Threat Model

- Certificate extensions and trust-list-derived certificate metadata are untrusted input.
- Derived URLs must not be fetched in Phase 22; fetching belongs to later phases with SSRF controls.
- Source derivation must not fail certificate import or trust-list sync unless it corrupts persisted state.
- `not_discovered` and `not_checkable` must be explicit evidence states, not silent absence.
- Provenance must be sufficient for audit and later AI analysis without leaking unauthorized data; visibility remains inherited from the parent certificate.

## Plan Shape Recommendation

- **22-01:** Storage/model helpers and source-key behavior.
- **22-02:** Dependency evaluation and X.509 extension parser/derivation module.
- **22-03:** Integration into certificate/trust-list flows and validators.

## Validation Architecture

Automated validation should use existing Node script patterns. No manual-only checks are needed for this phase.

Expected commands:

```bash
node scripts/validate-derived-monitoring-sources.js
node scripts/validate-all.js
npm run typecheck
npm run build
```
