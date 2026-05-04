---
phase: 24
slug: ocsp-technical-evidence-monitoring
status: complete
created: 2026-05-04
---

# Phase 24 Research — OCSP Technical Evidence Monitoring

## Research Questions

1. How should this project generate a real DER OCSP request without claiming full revocation validation?
2. How should issuer context be resolved from the existing certificate inventory and trust-list provenance?
3. What storage and event shape best preserves future validation evidence while staying bounded?
4. How should the worker and validator mirror the Phase 23 document-monitoring pattern?

## Standards Baseline

### RFC 6960

RFC 6960 defines the OCSP request and response structures. The request identifies the target certificate through `CertID`, including issuer name hash, issuer key hash, and serial number. The response can contain responseStatus plus response bytes for a BasicOCSPResponse. The RFC also defines OCSP-over-HTTP: GET encodes the DER OCSPRequest into the URL; POST sends DER bytes with `Content-Type: application/ocsp-request`, and responses use `application/ocsp-response`.

Primary source: https://www.rfc-editor.org/rfc/rfc6960.txt

Planning consequence: Phase 24 can legitimately send real DER OCSP requests using HTTP POST and retain raw request/response bytes without validating response signatures or interpreting certificate status as product health.

### RFC 5019

RFC 5019 defines a lightweight OCSP profile for high-volume environments. It recommends unsigned requests and highlights caching/freshness concerns. It also reinforces that clients need accurate time and must be careful about replay and cache behavior.

Primary source: https://www.rfc-editor.org/rfc/rfc5019.txt

Planning consequence: Phase 24 should keep requests unsigned and nonce-free by default. It should record response metadata but not assert semantic freshness or status correctness until the future semantic validation milestone.

## Dependency Findings

Commands run:

```bash
npm view @peculiar/x509 version dependencies keywords description
npm view pkijs version dependencies keywords description engines
npm view asn1js version dependencies keywords description
npm view @peculiar/asn1-ocsp version dependencies keywords description engines
npm view ocsp version dependencies keywords description engines
npm view node-forge version dependencies keywords description engines
npm view ocsp readme
npm view @peculiar/asn1-ocsp readme
npm view pkijs readme
```

Findings:

| Package | Fit | Notes |
|---|---|---|
| `pkijs` 3.4.0 | Best fit | Pure JS, Node >=16, documented `OCSPRequest`, `BasicOCSPResponse`, and `CertID.createForCertificate(cert, { issuerCertificate, hashAlgorithm })`. |
| `asn1js` 3.0.10 | Required companion | PKIjs docs use it directly for BER parsing/encoding; should be installed explicitly for stable imports. |
| `@peculiar/asn1-ocsp` 2.7.0 | Lower-level fallback | Modern RFC 6960 ASN.1 schema only. Useful if PKIjs import/build fails, but planner should prefer PKIjs because it has higher-level OCSP helpers. |
| `ocsp` 1.2.0 | Not preferred | Old callback-style package for stapling/checking. It can generate requests but has older dependencies and less TypeScript-friendly ergonomics. |
| `node-forge` 1.4.0 | Not preferred | Broad crypto package, but no clear advantage over PKIjs for this Phase 24 scope. |
| `@peculiar/x509` 2.0.0 | Already installed, not enough alone | Good for X.509 parsing but no OCSP request/response helpers. |

Recommendation: install `pkijs` and `asn1js` in Phase 24. Use Node's WebCrypto (`node:crypto`.webcrypto) as the PKIjs crypto engine if required by runtime tests.

Official PKIjs docs show `OCSPRequest.createForCertificate(cert, { hashAlgorithm: "SHA-256", issuerCertificate })` and DER encoding via `ocspReq.toSchema(true).toBER()`. They also show OCSP response classes for parsing/constructing response structures.

Primary sources:
- https://pkijs.org/docs/examples/certificates-and-revocation/working-with-OCSP-requests/
- https://pkijs.org/docs/examples/certificates-and-revocation/working-with-OCSP-responses/

## Current Codebase Findings

### Existing foundation

- `src/monitoring-sources/types.ts` already defines `MonitoringSourceType = "ocsp" | "policy-document"` and carries certificate/trust-list provenance.
- `src/monitoring-sources/derive.ts` already extracts AIA OCSP URLs from certificates and creates `discovered` or `not_discovered` OCSP sources.
- `src/monitoring-sources/fetch-safety.ts` provides the private-network blocking, redirect limit, timeout, response byte limit, and localhost-development pattern from Phase 23.
- `src/monitoring-sources/documents.ts` provides the right pattern for event-per-check, bounded raw evidence, failure classification, and future-analysis boundary.
- `src/monitoring-sources/worker.ts` already schedules policy-document checks; OCSP should be added as a separate scheduled pass rather than a new service.
- `src/storage/runtime-store.ts` has the schema/mapping/helper convention for new evidence tables and in-memory fallback.

### Issuer context feasibility

The local Node runtime exposes these `X509Certificate` APIs:

```text
ca
checkIssued
issuer
issuerCertificate
raw
serialNumber
subject
verify
```

Planning consequence: issuer matching can start pragmatically by loading the target certificate record by `source.certificateId`, scanning inventory certificates, and selecting an issuer candidate where `candidate.subject === target.issuer` and `candidate.checkIssued(target)` is true. If no candidate is found, record `not_checkable: issuer-certificate-not-found`.

This avoids low-confidence issuer inference and matches the user decision from `24-CONTEXT.md`.

## Recommended Architecture

### Storage

Add two OCSP-specific tables instead of overloading document snapshots:

1. `ocsp_check_events`
   - event-per-check audit trail
   - status: `available`, `unavailable`, `blocked`, `oversized`, `malformed`, `not_checkable`
   - source/certificate/issuer identifiers
   - HTTP response metadata and failure reason
   - optional `evidence_id`

2. `ocsp_response_evidence`
   - raw request bytes and raw response bytes as bounded `bytea`
   - request/response SHA-256 hashes and sizes
   - responder URL, content type, HTTP status, duration
   - certificate fingerprint and issuer fingerprint
   - parse metadata JSON for future semantic validation

Do not store semantic `good`, `revoked`, or `unknown` as health. If response parsing is implemented, store parse facts as metadata such as `ocspResponseStatus`, `responseType`, and `singleResponseCount`.

### Request generation

Use `pkijs` + `asn1js` to:

- parse target and issuer PEM into PKIjs certificates;
- create an `OCSPRequest` with `hashAlgorithm: "SHA-256"`;
- encode DER bytes using `toSchema(true).toBER(false)`;
- retain the exact DER request bytes.

Use unsigned requests and omit nonce by default. This aligns with RFC 5019 lightweight profile and keeps Phase 24 focused on technical evidence.

### HTTP behavior

Use HTTP POST as the default transport:

- URL: source AIA OCSP URL.
- Method: `POST`.
- Request content type: `application/ocsp-request`.
- Accept header: `application/ocsp-response`.
- Response max bytes controlled by `OCSP_MAX_RESPONSE_BYTES`.
- Timeout controlled by `OCSP_FETCH_TIMEOUT_MS`.
- Redirects bounded by `OCSP_MAX_REDIRECTS` and revalidated through the same private-network blocking as Phase 23.

Public HTTP must be allowed for OCSP because real AIA OCSP URLs commonly use HTTP. Private/internal targets remain blocked unless explicit localhost development mode is enabled.

### Worker

Extend the existing worker process, not compose topology:

- `runScheduledOcspSourceChecks()` scans discovered `ocsp` monitoring sources with non-null URLs.
- Use `OCSP_CHECK_INTERVAL_SECONDS` for independent cadence.
- Keep the document and OCSP loops separate so failures/limits do not cross-contaminate.

## Validation Architecture

Create a focused validator: `scripts/validate-ocsp-monitoring.js`.

It should assert:

- `package.json` contains `pkijs` and `asn1js` after the OCSP request implementation plan.
- `src/monitoring-sources/ocsp-types.ts` exports event/evidence status types and forbids semantic health statuses.
- `src/storage/runtime-store.ts` contains `ocsp_check_events`, `ocsp_response_evidence`, raw request/response storage, hash fields, certificate and issuer fingerprints, and helper functions.
- `src/monitoring-sources/ocsp.ts` exports request generation/check functions, includes `application/ocsp-request`, `application/ocsp-response`, `issuer-certificate-not-found`, and uses `recordOcspCheckEvent`/`recordOcspResponseEvidence`.
- `src/monitoring-sources/worker.ts` exports/calls `runScheduledOcspSourceChecks`, filters only `source.sourceType === "ocsp"`, and does not treat policy-document sources as OCSP.
- `.env.example` and `compose.yaml` contain `OCSP_FETCH_TIMEOUT_MS`, `OCSP_MAX_RESPONSE_BYTES`, `OCSP_MAX_REDIRECTS`, `OCSP_CHECK_INTERVAL_SECONDS`, and `OCSP_ALLOW_LOCALHOST`.
- `scripts/validate-all.js` invokes the OCSP validator exactly once.
- Forbidden strings such as `status: "good"`, `status: "revoked"`, and `status: "unknown"` do not appear as event health status assignments in OCSP service/types.

Verification commands:

```bash
node scripts/validate-ocsp-monitoring.js
node scripts/validate-all.js
npm run typecheck
npm run build
```

## Threats and Mitigations

| Threat | Mitigation in planning |
|---|---|
| SSRF through certificate-derived OCSP URLs | Reuse/generalize Phase 23 public URL validation, DNS/IP private-target blocking, and redirect revalidation. |
| False compliance claims | Store technical statuses only and explicitly avoid `good/revoked/unknown` as health. |
| Missing issuer context causing invalid requests | Require issuer certificate match before request generation; otherwise record `not_checkable`. |
| Unbounded response storage | Enforce `OCSP_MAX_RESPONSE_BYTES` before retaining response body. |
| Dependency fragility | Prefer maintained pure-JS `pkijs` + `asn1js`; verify typecheck/build in plan. |
| Worker instability | Catch per-source failures and keep OCSP scheduling separate from document scheduling. |

## Planning Recommendation

Split Phase 24 into four plans:

1. OCSP storage/types/validator foundation.
2. OCSP dependency/request generation/issuer context/check service.
3. Worker integration/env packaging/docs.
4. Final validation/proof closure.
