# v1.3 Research: Stack Additions for OCSP and CP/CPS/DPC Monitoring

**Milestone:** v1.3 Monitoring Source Expansion  
**Date:** 2026-04-28  
**Scope:** stack changes only for automatically derived OCSP and CP/CPS/DPC monitoring sources in the existing TypeScript/Next.js/Postgres/Docker runtime.

## Existing Stack Fit

The current stack is sufficient for v1.3 if we keep the milestone bounded:

- TypeScript/Node worker can perform HTTP(S) availability checks, OCSP POST/GET probes, document downloads, hashing, and metadata extraction.
- Postgres is already the runtime source of truth and should also store derived-source definitions, poll events, document snapshot metadata, and bounded extracted text.
- Existing certificate-first import and trust-list projection flows are the correct derivation points; v1.3 should not introduce a separate source-of-truth.
- Existing SSRF protections in `src/trust-lists/sync.ts` should be generalized/reused for document downloads and OCSP responder URLs.

## Primary Standards and References

- RFC 6960 defines OCSP request/response behavior, including DER encoded request/response bodies and the `application/ocsp-request` and `application/ocsp-response` content types: https://www.rfc-editor.org/rfc/rfc6960
- RFC 5280 defines AIA `id-ad-ocsp` as the location of an OCSP responder and Certificate Policies CPS Pointer qualifiers as URI pointers to CPS documents: https://www.ietf.org/rfc/rfc5280.html
- CA/Browser Forum Baseline Requirements define current operational expectations for public TLS OCSP/CRL services and CPS disclosure practices: https://cabforum.org/working-groups/server/baseline-requirements/requirements/
- ETSI EN 319 411-1 explains CP/CPS roles for TSP certificate services; CP describes what is adhered to, CPS how the TSP adheres to it: https://www.etsi.org/deliver/etsi_en/319400_319499/31941101/01.04.01_60/en_31941101v010401p.pdf

## Recommended Stack Additions

### OCSP encoding/parsing

Use Node's built-in `crypto.X509Certificate` where possible for basic certificate fields, but it will not be enough for full extension parsing or OCSP DER construction.

Recommended approach:

1. Add a small ASN.1/PKI library only if needed for parsing AIA/Certificate Policies and constructing OCSP requests.
2. Prefer an established JS PKI library over custom ASN.1 encoders.
3. Keep v1.3 OCSP validation technical: build request, send to responder, store response status/content-type/bytes/hash/timing. Full signature/status validation can be a later milestone.

Candidate libraries to evaluate during implementation:

- `pkijs` + `asn1js`: strong ASN.1/X.509 model in JS, useful for AIA, certificate policies, and OCSP structures.
- `@peculiar/x509`: ergonomic X.509 parsing on WebCrypto primitives, useful for certificate extension extraction; verify OCSP support before adopting.

Avoid:

- Shelling out to `openssl` in the packaged runtime; it creates host/runtime dependency drift.
- Implementing full ASN.1 DER encoders manually unless a tiny targeted encoder is demonstrably simpler.

### Document download and extraction

For CP/CPS/DPC documents, v1.3 should store raw bytes or a bounded text extraction artifact plus metadata. Do not add a heavyweight document processing pipeline yet.

Recommended approach:

- Use existing `fetch`/Buffer/hash flow with strict timeout, byte limits, redirect validation, content-type capture, and snapshot hashing.
- Store raw document snapshots either in Postgres bytea/text for bounded sizes or as future-ready metadata with content retained in Postgres for now. Given the current compose stack, Postgres storage is acceptable for bounded proof/demo scope.
- Add PDF text extraction only if the dependency remains lightweight and build-safe in Docker. If not, store the raw PDF + hash and defer deep extraction.

Candidate libraries:

- Existing `pdf` skill used local tooling for review, but the app should not depend on host Poppler.
- For in-app extraction, evaluate `pdf-parse` or `pdfjs-dist` only if package/build compatibility is confirmed. Otherwise implement metadata capture first.

### Storage and retention

Add new Postgres-backed tables under the runtime store:

- `monitoring_sources`: derived OCSP/document source definitions tied to certificate/provenance/group visibility.
- `monitoring_source_events`: poll/check events with status, duration, failure reason, content hash, size, and timestamps.
- `document_snapshots`: document-specific snapshots with content-type, size, sha256, extracted text excerpt/metadata, and source URL.
- Optional `ocsp_response_snapshots`: OCSP response bytes/hash/status metadata if separating OCSP payload evidence from generic events simplifies later validation.

Keep source derivation deterministic to avoid duplicates:

- source key = certificate id or fingerprint + source kind + normalized URL + optional policy OID/document role.

### Configuration

Add environment-configurable limits:

- `MONITORING_SOURCE_FETCH_TIMEOUT_MS`
- `MONITORING_SOURCE_MAX_DOCUMENT_BYTES`
- `MONITORING_SOURCE_MAX_EXTRACTED_TEXT_BYTES`
- `MONITORING_SOURCE_MAX_REDIRECTS`
- `OCSP_MAX_RESPONSE_BYTES`

Default conservatively; document in README/operators.

## Integration Points

- Certificate import: derive OCSP and CPS URI candidates immediately after certificate parse.
- Trust-list sync/projection: reuse certificate-first import path so sources are derived from imported/projection certificates.
- Worker loop: add a monitor pass for enabled derived sources, ideally after existing CRL/certificate polling.
- Reporting read models: aggregate source kinds into operational detail and executive cards.
- Authorization: source visibility follows the parent certificate/target group shares.

## What Not To Add in v1.3

- No manual source-management UI unless derivation gaps make the milestone impossible.
- No AI document analysis or policy conformance scoring yet.
- No full OCSP signature/status conformance gate yet.
- No distributed object store unless document size requirements exceed bounded Postgres storage.

## Requirement Implications

- Requirements need explicit derivation behavior for OCSP and CP/CPS/DPC sources.
- Requirements need evidence retention: raw/hash/timing/status and document snapshot metadata.
- Requirements need operational limits and SSRF controls.
- Requirements need reporting integration but not a separate new product area.
