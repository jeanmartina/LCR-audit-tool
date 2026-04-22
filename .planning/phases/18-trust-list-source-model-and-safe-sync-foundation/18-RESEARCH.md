# Phase 18 Research: Trust-List Source Model and Safe Sync Foundation

**Date:** 2026-04-22
**Phase:** 18 - Trust-List Source Model and Safe Sync Foundation
**Requirements:** TSL-01, TSL-02, TSL-03, TSL-04 initial import, OPS-04, OPS-05

## Planning Question

How should the project implement a safe ETSI TS 119 612 trust-list foundation that validates XMLDSig before accepting/importing extracted certificates, persists auditable sync runs, and runs in the existing Docker worker topology?

## Standards Baseline

### ETSI TS 119 612

The current ETSI TS 119 612 V2.3.1 (2024-11) defines the trusted-list format and mechanisms for establishing, locating, accessing, and authenticating trusted lists. Its table of contents and scope identify the relevant data areas for Phase 18: TSL tag, scheme information, TSL sequence number, scheme territory, issue date/time, next update, pointers/distribution points, trust service provider list, service information, and service digital identities.

Primary source: https://www.etsi.org/deliver/etsi_ts/119600_119699/119612/02.03.01_60/ts_119612v020301p.pdf

### XMLDSig

W3C XML Signature core validation requires both reference validation and signature validation. Reference validation checks digest values for each signed reference; signature validation verifies the `SignatureValue` over canonicalized `SignedInfo`. XMLDSig also separates cryptographic validation from application trust decisions such as signer trust policy.

Primary source: https://www.w3.org/TR/xmldsig-core/

Phase 18 guarantee should therefore be explicit:

- **Blocking gate:** an accepted snapshot/import requires XMLDSig core validation success.
- **Signer trust policy:** record signer certificate/fingerprint where available. If a chain/trust-anchor policy is not fully implemented in this phase, the plan must not claim full legal/eIDAS trust anchoring; it must claim XMLDSig cryptographic integrity validation.

## Existing Code Baseline

- Persistence lives in `src/storage/runtime-store.ts`, with SQL schema fragments and in-memory cache mirrors.
- Certificate import lives in `src/inventory/certificate-admin.ts`, with `importCertificate`, `normalizeCertificatePem`, fingerprint dedup, CRL derivation, import runs/items, and group authorization.
- Worker loop is `scripts/run-worker.js`, currently loading `src/polling/scheduler.ts` and running `runScheduledPolls()` on `WORKER_LOOP_INTERVAL_MS`.
- Docker packaging already includes `worker`, `web`, `postgres`, and Caddy; Phase 18 should extend this worker without requiring OS XML tooling.
- UI primitives from Phase 16 and guided onboarding patterns from Phase 17 are available.

## Recommended Implementation Shape

### Dependencies

Native Node does not provide XMLDSig validation. Plan to add package dependencies:

- `@xmldom/xmldom` for DOM parsing.
- `xpath` for namespace-aware XML queries.
- `xml-crypto` for XMLDSig validation.

Execution must update `package.json` and `package-lock.json` with `npm install @xmldom/xmldom xpath xml-crypto`.

### Persistence Model

Add trust-list tables and cache helpers in `src/storage/runtime-store.ts`:

- `trust_list_sources`: source identity, URL, label, status, created/updated metadata, last successful sync, last failed sync.
- `trust_list_snapshots`: immutable fetched/validated document snapshots with digest, sequence number, territory, issue date, next update, signer fingerprint, XMLDSig status, accepted flag, raw XML or compact blob.
- `trust_list_sync_runs`: every attempt with status `running|completed|failed`, failure reason, fetch status, digest, validation details, snapshot id, started/completed timestamps.
- `trust_list_extracted_certificates`: extracted service digital identity certificates tied to source/snapshot/run and optional imported certificate id/result.

### Domain Module

Add `src/trust-lists/`:

- `types.ts`: domain types.
- `parser.ts`: namespace-aware metadata and certificate extraction.
- `xmldsig.ts`: XMLDSig validation wrapper.
- `sync.ts`: fetch, validate, persist run/snapshot, extract certs, import through certificate-first path.
- `admin.ts`: platform-admin source registration/list/sync-now operations.

### Import Behavior

Because the user selected initial import in Phase 18:

- After XMLDSig succeeds, extract certificate bytes from supported `X509Certificate` nodes under service digital identities.
- Convert to PEM with existing normalization helpers.
- Import each supported certificate through `importCertificate` using `sourceType: "trust-list"` after extending the certificate source type union/schema validation to allow it.
- Apply group ownership by requiring the source registration to specify one or more group IDs; imported certificates are shared with those groups.
- Persist per-item extraction/import result. Partial item failures should fail the item but should not invalidate the signed snapshot if XMLDSig and metadata validation succeeded.

### Failure Semantics

- Fetch/network/XML/signature failures create failed sync runs.
- Failed runs do not modify last accepted snapshot, do not delete previous snapshot, and do not import certificates.
- Successful sync creates an accepted snapshot and import item records.

### UI/API/Worker

- Add platform-admin UI under settings or a new admin trust-list page. Since Phase 20 owns richer UX, Phase 18 UI can be minimal but guided.
- Add API routes to register source, list source/sync state, and trigger sync now.
- Extend `scripts/run-worker.js` to load both scheduler polling and trust-list sync cycle. The worker should call a safe no-op when no sources exist.

## Security Threat Model

### Assets

- Trust-list source URLs and source configuration.
- Raw signed XML snapshots.
- XMLDSig validation status and signer certificate/fingerprint.
- Extracted certificate material.
- Existing certificate inventory and group sharing.

### Threats and Mitigations

- **Unsigned/malformed trust list mutates inventory**
  - Mitigation: sync must fail before snapshot acceptance/import unless XMLDSig validation succeeds.
- **SSRF through source URL registration**
  - Mitigation: require `https://` URLs by default; reject `localhost`, loopback, private IP literals, and non-HTTP(S) schemes unless an explicit development override exists.
- **XML parser entity expansion / XXE**
  - Mitigation: use parser settings/dependency behavior that does not resolve external entities; reject DOCTYPE if present.
- **Stale failed sync hides prior valid state**
  - Mitigation: failed sync run records reason but leaves last accepted snapshot untouched.
- **Certificate import bypasses group authorization**
  - Mitigation: source registration must store authorized group IDs; platform admin can register; imported certificates use those group IDs through existing certificate-first pipeline.
- **Claiming stronger legal trust than implemented**
  - Mitigation: record XMLDSig cryptographic status separately from any legal/eIDAS trust anchor policy; Phase 18 verifier must check wording.

## Validation Architecture

Add `scripts/validate-trust-list-foundation.js` and wire it into `scripts/validate-all.js`.

Required checks:

- Dependencies exist in `package.json`: `@xmldom/xmldom`, `xpath`, `xml-crypto`.
- `src/storage/runtime-store.ts` contains trust-list source/snapshot/sync-run/extracted-certificate schemas and helpers.
- `src/trust-lists/parser.ts` extracts sequence, territory, issue date, next update, and X509 certificates.
- `src/trust-lists/xmldsig.ts` uses XMLDSig validation and exposes blocking validation result.
- `src/trust-lists/sync.ts` fails before import when XMLDSig is invalid.
- `src/trust-lists/sync.ts` calls existing certificate-first import for validated extracted certs.
- Admin/API routes require `assertPlatformAdmin`.
- `scripts/run-worker.js` invokes trust-list sync without host tools.
- `compose.yaml` still uses the same worker service and no new undeclared host dependency.

## Planning Recommendation

Split into two plans:

1. **18-01 Data model, parser, XMLDSig validation, and sync core** — schema, dependencies, domain module, blocking validation, initial import path, validator.
2. **18-02 Admin source registration, sync-now API/UI, worker packaging integration** — platform admin API/UI, worker loop, i18n, final validation.

This split isolates the high-risk integrity/import core before UI/worker integration.
