# v1.3 Research: Feature Behavior for OCSP and CP/CPS/DPC Monitoring

**Milestone:** v1.3 Monitoring Source Expansion  
**Date:** 2026-04-28

## Product Intent

v1.3 expands monitored evidence beyond CRLs and trust-list-derived certificates. The milestone should prove the platform can automatically discover and monitor two additional PKI evidence classes:

1. OCSP responder availability/evidence derived from certificate AIA.
2. CP/CPS/DPC policy document availability and retained snapshots for later compliance analysis.

The future AI compliance agent is explicitly downstream. v1.3 prepares clean, durable evidence; it does not judge policy conformance.

## Feature Categories

### 1. Derived Source Discovery

**Table stakes**

- Derive OCSP responder URLs from the certificate AIA `id-ad-ocsp` access method when present.
- Derive CPS URLs from RFC 5280 Certificate Policies CPS Pointer qualifiers when present.
- Derive CP/DPC candidates only when discoverable from certificate/trust-list/provenance metadata or known fields already parsed by the system.
- Deduplicate derived sources by certificate/provenance/source kind/normalized URL.
- Mark missing source types explicitly as `not discovered` instead of treating them as failures.

**Differentiators**

- Preserve policy OIDs alongside CPS/document URLs for later certificate-to-policy analysis.
- Preserve trust-list snapshot/projection provenance for sources derived from trust-list certificates.

**Defer/out of scope**

- Manual source URL entry for OCSP/documents.
- Web crawling to discover documents from arbitrary CA sites.

### 2. OCSP Technical Monitoring

**Table stakes**

- Build an OCSP request for the target certificate when issuer context is available.
- Send request to the derived responder with bounded timeout and response-size limits.
- Record HTTP status, content-type, duration, response size, response hash, and failure reason.
- Treat network/timeout/non-response/wrong content type/oversized response as unhealthy.
- Store payload evidence or hash/metadata sufficient to reprocess later.

**Differentiators**

- Parse high-level OCSP response envelope status if feasible without full cryptographic validation.
- Capture `thisUpdate`, `nextUpdate`, and `producedAt` when cheaply parseable.

**Defer/out of scope**

- Full OCSP signature verification, responder authorization, and certificate revocation status enforcement.
- Nonce and advanced responder profile validation.

### 3. CP/CPS/DPC Document Monitoring

**Table stakes**

- Fetch discovered document URLs with the same SSRF, timeout, redirect, and byte-limit controls used for trust-list fetches.
- Record HTTP status, content-type, duration, size, hash, and failure reason.
- Store a snapshot of the document or bounded raw content where size permits.
- Extract basic metadata: URL, content-type, size, hash, first-seen, last-seen, changed/unchanged, optional title/text excerpt when feasible.
- Track document version changes by hash over time.

**Differentiators**

- Extract bounded text from PDF/HTML/text documents for future AI analysis.
- Preserve policy OID and certificate provenance next to document snapshots.

**Defer/out of scope**

- Determining whether the document content is compliant.
- Mapping document obligations to certificate fields.
- Robust multilingual semantic parsing.

### 4. Reporting and Executive Visibility

**Table stakes**

- Operational reporting shows source kind (`crl`, `certificate`, `trust-list`, `ocsp`, `policy-document`) and health.
- Operators can drill into recent OCSP/document check events and evidence metadata.
- Executive summary adds simple aggregate cards for OCSP health and policy-document availability/change risk.
- Existing group-scoped authorization remains enforced through the parent certificate/target visibility.

**Differentiators**

- Show document change count and stale/unavailable document count as management signals.
- Link document/OCSP evidence back to parent certificate and trust-list source.

**Defer/out of scope**

- Separate monitoring-source application area.
- Complex SLO/burn-rate analytics for these new sources.

## Anti-Features for v1.3

- Do not create another independent inventory that operators must reconcile manually.
- Do not block certificate import because OCSP/doc documents are absent; absence is evidence, not import failure.
- Do not label an OCSP response as semantically valid unless full validation exists.
- Do not store unbounded document bodies or extraction text.
- Do not let document fetches reach private/internal networks.

## Requirement Implications

- Requirements should separate discovery, evidence capture, polling, reporting, and limits.
- Requirements should explicitly state that AI compliance analysis is future scope.
- Requirements should define healthy/unhealthy semantics per source kind.
