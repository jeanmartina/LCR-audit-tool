# Requirements: LCR Availability Dashboard v1.4

**Defined:** 2026-05-09  
**Milestone:** v1.4 Interface Clarity and UX Modernization  
**Core Value:** Never allow a trusted certificate to operate without valid revocation coverage. The interface should also make the running build, operational state, and major user flows easy to understand.

## Validated

- ✓ **LCR-01**: Continuous monitoring of each CRL/certificate with availability, downtime, and recovery lag — `v1.0`
- ✓ **LCR-02**: Per-target configurable interval with a 10-minute global default — `v1.0`
- ✓ **LCR-03**: Email alerts with default/override recipients, repeated until recovery, and admin disablement — `v1.0`
- ✓ **LCR-04**: Signature/hash validation and historical storage of verified CRLs — `v1.0`
- ✓ **LCR-05**: Unavailability based on HTTP != 200, timeout, and expiration without replacement — `v1.0`
- ✓ **LCR-06**: Coverage-gap window recording for SLA auditability — `v1.0`
- ✓ **LCR-07**: SLA metrics and time-window reporting — `v1.0`
- ✓ **LCR-08**: Standalone certificate administration inside the same monitoring flow — `v1.0`
- ✓ **AUTH-01**: User can authenticate with local email/password after receiving an invitation — `v1.1`
- ✓ **AUTH-02**: Invited user can accept access through Google login — `v1.1`
- ✓ **AUTH-05**: Google authentication callbacks and session handling work under a real HTTPS public origin — `v1.1`
- ✓ **GRP-01**: Platform admin can create groups and invite initial group admins — `v1.1`
- ✓ **GRP-02**: Platform admin can operate as a group admin without needing a second account — `v1.1`
- ✓ **GRP-03**: Group admins can invite users to their groups and assign `viewer`, `operator`, or `group-admin` roles — `v1.1`
- ✓ **GRP-04**: Dashboard, drill-down, exports, and admin flows only expose data from authorized groups — `v1.1`
- ✓ **GRP-05**: Targets can be shared across multiple groups without duplicating the monitored artifact — `v1.1`
- ✓ **GRP-06**: Platform defaults, group defaults, and target overrides resolve in order — `v1.1`
- ✓ **ADM-01**: Single-certificate onboarding derives CRL targets automatically — `v1.1`
- ✓ **ADM-02**: ZIP certificate onboarding works in the packaged runtime — `v1.1`
- ✓ **ADM-03**: Manual CRL URL entry is no longer the normal onboarding path — `v1.1`
- ✓ **ADM-04**: Admin UI supports detailed target management with sharing and history — `v1.1`
- ✓ **ADM-05**: Admin UI supports manual validation/connectivity tests and effective-default previews — `v1.1`
- ✓ **MON-03**: Predictive alerting warns before CRL expiry/publication misses — `v1.1`
- ✓ **MON-04**: Predictive alerts are configurable per user — `v1.1`
- ✓ **REP-03**: Reporting supports multi-PKI/trust-source organization and filtering — `v1.1`
- ✓ **I18N-01**: All user-facing interfaces are translatable — `v1.1`
- ✓ **I18N-02**: The application ships with English, Portuguese, and Spanish support — `v1.1`
- ✓ **I18N-03**: Each user can configure their own preferred language — `v1.1`
- ✓ **I18N-04**: New application code and default technical documentation are written in English — `v1.1`
- ✓ **OPS-01**: The product runs as containerized `web + worker + postgres + caddy` services — `v1.1`
- ✓ **OPS-02**: Caddy provides HTTPS termination with automatic renewal suitable for auth callbacks — `v1.1`
- ✓ **OPS-03**: Runtime configuration cleanly supports callback/public-origin settings, provider secrets, and database connectivity — `v1.1`
- ✓ **DOC-01**: The repository includes a basic English README for setup and day-to-day usage — `v1.1`
- ✓ **TSL-01**: Platform admin can register an ETSI TS 119 612 trust-list source by URL — `v1.2`
- ✓ **TSL-02**: System fetches and parses supported LOTL/TSL documents while preserving source metadata — `v1.2`
- ✓ **TSL-03**: System validates trust-list integrity before accepting extracted certificates into monitored inventory — `v1.2`
- ✓ **TSL-04**: System extracts certificates from supported trust-list sources and imports them through the existing certificate-first pipeline — `v1.2`
- ✓ **TSL-05**: System detects trust-list changes and re-imports affected certificates without duplicating unchanged monitored assets — `v1.2`
- ✓ **TSL-06**: Operator can see trust-list sync status, last successful sync, next expected update, failure reason, and change summary — `v1.2`
- ✓ **TSL-07**: Trust-list-derived certificates and targets retain provenance back to source URL, snapshot, and import run — `v1.2`
- ✓ **EXEC-01**: Authorized users can open a simple executive summary dashboard for their allowed groups — `v1.2`
- ✓ **EXEC-02**: Executive summary shows healthy, degraded, unavailable, and at-risk counts without operator drill-down — `v1.2`
- ✓ **EXEC-03**: Executive summary highlights top current risks and upcoming expiration/publication risks with links to operational evidence — `v1.2`
- ✓ **EXEC-04**: Executive summary exposes a short trend view for recent coverage health and incidents — `v1.2`
- ✓ **EXEC-05**: Executive summary can be exported or printed as a concise management-facing report — `v1.2`
- ✓ **UX-01**: Product UI uses a coherent visual system with clearer hierarchy, spacing, typography, panels, states, and action placement — `v1.2`
- ✓ **UX-02**: Certificate onboarding provides a guided flow for single certificate upload with clear preview, derived CRLs, effective defaults, and save outcome — `v1.2`
- ✓ **UX-03**: ZIP onboarding provides a guided flow with upload validation, import progress/result summary, partial-failure details, and next steps — `v1.2`
- ✓ **UX-04**: Trust-list onboarding uses the same guided source-onboarding model as certificate and ZIP onboarding — `v1.2`
- ✓ **UX-05**: First system access presents a first-run web flow to create the initial platform admin — `v1.2`
- ✓ **UX-06**: Editable forms include concise field-level hints, examples, and validation feedback for technical fields — `v1.2`
- ✓ **UX-07**: Empty states and post-action states guide operators to the next useful action after setup, onboarding, import, sync, or error outcomes — `v1.2`
- ✓ **UX-08**: The published root URL provides a non-error landing page with discoverable sign-in entry points for local username/password and enabled identity providers — `v1.2`
- ✓ **OPS-04**: Trust-list sync runs are persisted with auditable success/failure state and do not silently mutate inventory — `v1.2`
- ✓ **OPS-05**: Existing Docker packaged runtime can run trust-list sync and executive summary features without manual host dependencies — `v1.2`
- ✓ **OPS-06**: Documentation explains trust-list source setup, sync behavior, failure handling, and operator recovery steps — `v1.2`
- ✓ **SRC-05**: System derives OCSP monitoring sources from imported certificates and trust-list-derived certificates when AIA OCSP URLs are present — `v1.3`
- ✓ **SRC-06**: System derives CP/CPS/DPC document monitoring sources from certificate policy pointers, parsed certificate metadata, or trust-list provenance when URLs are discoverable — `v1.3`
- ✓ **SRC-07**: System deduplicates derived monitoring sources by certificate/provenance, source type, normalized URL, and policy/document role — `v1.3`
- ✓ **SRC-08**: System records explicit `not discovered` or `not checkable` states when OCSP or document sources cannot be derived or checked — `v1.3`
- ✓ **OCSP-01**: System performs bounded technical OCSP responder checks for derived OCSP sources when enough issuer context exists — `v1.3`
- ✓ **OCSP-02**: System records OCSP check evidence including status, duration, HTTP status, content type, response size, response hash, and failure reason — `v1.3`
- ✓ **OCSP-03**: System stores OCSP response evidence so future milestones can perform full semantic and signature validation — `v1.3`
- ✓ **OCSP-04**: System avoids presenting OCSP reachability as full revocation-status validation — `v1.3`
- ✓ **DOCS-01**: System fetches discovered CP/CPS/DPC document URLs with timeout, redirect, size, and private-network protections — `v1.3`
- ✓ **DOCS-02**: System stores document snapshots or bounded raw content with content type, size, SHA-256 hash, source URL, and capture timestamp — `v1.3`
- ✓ **DOCS-03**: System extracts basic document metadata and bounded text when feasible without executing or rendering fetched content — `v1.3`
- ✓ **DOCS-04**: System detects document changes over time by hash and preserves historical snapshot metadata — `v1.3`
- ✓ **DOCS-05**: System preserves certificate, policy OID, trust-list, and snapshot provenance with each document record for future AI compliance analysis — `v1.3`
- ✓ **REP-04**: Operator reporting shows OCSP and policy-document source health with drill-down evidence linked to parent certificates — `v1.3`
- ✓ **REP-05**: Executive summary shows simple aggregate cards for OCSP health and policy-document availability/change risk — `v1.3`
- ✓ **REP-06**: Reporting authorization for derived monitoring sources follows the parent certificate/group visibility rules — `v1.3`
- ✓ **OPS-07**: Compose and environment configuration expose limits for derived-source fetch timeout, document size, extracted text size, redirects, and OCSP response size — `v1.3`
- ✓ **OPS-08**: Operator documentation explains OCSP/document source derivation, health states, retention limits, and the future AI-analysis boundary — `v1.3`
- ✓ **SEC-01**: Derived-source fetches reject private/internal network targets and unsafe redirects, reusing the trust-list SSRF posture — `v1.3`

## v1.4 Requirements

### Public Shell and Identity

- [x] **UI-01**: The public landing page should look like the official product entry, with a modern identity, visible login form, only enabled identity providers, a compact top-left language selector, modern navigation, and a contemporary visual brand.

### Settings and Administration

- [x] **UI-02**: Settings and administration should be organized into clear tabs or sections for personal preferences, group defaults, provider verification, trust-list administration, groups, and invitations, with contextual hints for technical fields.

### Trust Lists

- [x] **UI-03**: Trust-list screens should show hierarchy, metadata, and clear diagnostics, allow removal of incorrect sources, and explain failure modes precisely.

### Import Review and Safety

- [x] **UI-04**: Import flows should use review-before-save, allow accept/edit/ignore/reject decisions, revalidate on the server, and preserve provenance across corrections.

### Dashboard and Reporting

- [x] **UI-05**: Dashboard and reporting should keep healthy items visible, classify derived-source states clearly, explain timelines and logs, and present actions as consistent controls.

### Executive PDF

- [x] **UI-06**: The executive PDF should read like a professional report, preserve Unicode correctly, use fixed sections, and share the web executive read model.

### Global UX

- [x] **UI-07**: The application should use one modern, consistent UX language across all major screens and navigation.

### Release Clarity

- [x] **UI-08**: The web UI should visibly show the running version or build identifier in an operator-facing location.

## Future Requirements

### Authentication Providers

- **AUTH-F01**: Invited user can accept access through Microsoft Entra ID login.
- **AUTH-F02**: Invited user can accept access through a generic OIDC provider.

### Monitoring and Scaling

- **SRC-F01**: Monitor OCSP availability in addition to CRLs.
- **SRC-F02**: Monitor the availability of CP/CPS/DPC document URLs referenced by certificates.
- **SCL-F01**: Scale workers horizontally for high target counts.
- **SCL-F02**: Run workers from multiple regions/jurisdictions and compare availability by probe location.
- **DIF-F01**: Expose SLOs, burn rates, and historical error budgets for executive prioritization.

### Source and Policy Extensions

- **OCSP-F01**: System validates OCSP response signature, responder authorization, certificate status, and freshness windows.
- **OCSP-F02**: System interprets OCSP `good`, `revoked`, and `unknown` states as compliance evidence rather than technical reachability only.
- **AI-F01**: System uses retained CP/CPS/DPC snapshots to analyze PKI policy compliance.
- **AI-F02**: System compares certificate contents and provenance against obligations extracted from policy documents.
- **SRC-F03**: Operator can manually add OCSP or document monitoring sources when automatic derivation is insufficient.
- **SRC-F04**: System can discover policy documents from configured public CA repository pages without arbitrary crawling.
- **AN-F01**: System exposes SLOs, burn rates, and historical error budgets for OCSP and policy-document source categories.

## Out of Scope

- Auto-update or self-update behavior — this milestone is about visibility and UX, not release automation.
- A full release notes portal — operators need a visible version tag, not a changelog surface.
- A provenance explorer for every build artifact — too deep for the current release-clarity scope.

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| UI-01 | Phase 35 | Complete |
| UI-02 | Phase 35 | Complete |
| UI-03 | Phase 35 | Complete |
| UI-04 | Phase 30 | Planned |
| UI-05 | Phase 31 | Planned |
| UI-06 | Phase 32 | Planned |
| UI-07 | Phase 33 | Planned |
| UI-08 | Phase 34 | Planned |

**Coverage:**
- v1.4 requirements: 8 total
- Mapped to phases: 8
- Unmapped: 0

---
*Requirements defined: 2026-05-09*
*Last updated: 2026-05-20 after v1.4 gap-closure planning*
