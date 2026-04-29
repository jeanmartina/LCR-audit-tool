# Requirements: LCR Availability Dashboard v1.3

**Defined:** 2026-04-28  
**Milestone:** v1.3 Monitoring Source Expansion  
**Core Value:** Never allow a trusted certificate to operate without valid revocation coverage. When a revocation source fails, the team needs immediate visibility and precise evidence of how long coverage was missing.

## v1.3 Requirements

### Source Discovery

- [ ] **SRC-05**: System derives OCSP monitoring sources from imported certificates and trust-list-derived certificates when AIA OCSP URLs are present.
- [ ] **SRC-06**: System derives CP/CPS/DPC document monitoring sources from certificate policy pointers, parsed certificate metadata, or trust-list provenance when URLs are discoverable.
- [ ] **SRC-07**: System deduplicates derived monitoring sources by certificate/provenance, source type, normalized URL, and policy/document role.
- [ ] **SRC-08**: System records explicit `not discovered` or `not checkable` states when OCSP or document sources cannot be derived or checked.

### OCSP Monitoring

- [ ] **OCSP-01**: System performs bounded technical OCSP responder checks for derived OCSP sources when enough issuer context exists.
- [ ] **OCSP-02**: System records OCSP check evidence including status, duration, HTTP status, content type, response size, response hash, and failure reason.
- [ ] **OCSP-03**: System stores OCSP response evidence so future milestones can perform full semantic and signature validation.
- [ ] **OCSP-04**: System avoids presenting OCSP reachability as full revocation-status validation.

### Policy Document Monitoring

- [ ] **DOCS-01**: System fetches discovered CP/CPS/DPC document URLs with timeout, redirect, size, and private-network protections.
- [ ] **DOCS-02**: System stores document snapshots or bounded raw content with content type, size, SHA-256 hash, source URL, and capture timestamp.
- [ ] **DOCS-03**: System extracts basic document metadata and bounded text when feasible without executing or rendering fetched content.
- [ ] **DOCS-04**: System detects document changes over time by hash and preserves historical snapshot metadata.
- [ ] **DOCS-05**: System preserves certificate, policy OID, trust-list, and snapshot provenance with each document record for future AI compliance analysis.

### Reporting

- [ ] **REP-04**: Operator reporting shows OCSP and policy-document source health with drill-down evidence linked to parent certificates.
- [ ] **REP-05**: Executive summary shows simple aggregate cards for OCSP health and policy-document availability/change risk.
- [ ] **REP-06**: Reporting authorization for derived monitoring sources follows the parent certificate/group visibility rules.

### Operations and Safety

- [ ] **OPS-07**: Compose and environment configuration expose limits for derived-source fetch timeout, document size, extracted text size, redirects, and OCSP response size.
- [ ] **OPS-08**: Operator documentation explains OCSP/document source derivation, health states, retention limits, and the future AI-analysis boundary.
- [ ] **SEC-01**: Derived-source fetches reject private/internal network targets and unsafe redirects, reusing the trust-list SSRF posture.

## Future Requirements

### OCSP Validation

- **OCSP-F01**: System validates OCSP response signature, responder authorization, certificate status, and freshness windows.
- **OCSP-F02**: System interprets OCSP `good`, `revoked`, and `unknown` states as compliance evidence rather than technical reachability only.

### AI-Assisted Policy Analysis

- **AI-F01**: System uses retained CP/CPS/DPC snapshots to analyze PKI policy compliance.
- **AI-F02**: System compares certificate contents and provenance against obligations extracted from policy documents.

### Source Management and Discovery

- **SRC-F01**: Operator can manually add OCSP or document monitoring sources when automatic derivation is insufficient.
- **SRC-F02**: System can discover policy documents from configured public CA repository pages without arbitrary crawling.

### Advanced Analytics

- **AN-F01**: System exposes SLOs, burn rates, and historical error budgets for OCSP and policy-document source categories.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full OCSP semantic validation | v1.3 intentionally captures technical evidence first; full signature/status/freshness validation needs a separate focused milestone. |
| AI document compliance analysis | v1.3 stores clean evidence and provenance for later analysis but does not interpret policy content. |
| Manual OCSP/document source entry UI | The milestone scope is automatic derivation from imported/trust-list certificates to avoid a parallel source inventory. |
| Web crawling CA sites | Crawling expands security and product scope; v1.3 only uses URLs explicitly discovered from certificate/provenance data. |
| Unified SLA/burn-rate analytics for new source types | Initial reporting remains simple operational evidence plus executive aggregate cards. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SRC-05 | TBD | Pending |
| SRC-06 | TBD | Pending |
| SRC-07 | TBD | Pending |
| SRC-08 | TBD | Pending |
| OCSP-01 | TBD | Pending |
| OCSP-02 | TBD | Pending |
| OCSP-03 | TBD | Pending |
| OCSP-04 | TBD | Pending |
| DOCS-01 | TBD | Pending |
| DOCS-02 | TBD | Pending |
| DOCS-03 | TBD | Pending |
| DOCS-04 | TBD | Pending |
| DOCS-05 | TBD | Pending |
| REP-04 | TBD | Pending |
| REP-05 | TBD | Pending |
| REP-06 | TBD | Pending |
| OPS-07 | TBD | Pending |
| OPS-08 | TBD | Pending |
| SEC-01 | TBD | Pending |

**Coverage:**
- v1.3 requirements: 19 total
- Mapped to phases: 0
- Unmapped: 19

---
*Requirements defined: 2026-04-28*  
*Last updated: 2026-04-28 after requirements definition*
