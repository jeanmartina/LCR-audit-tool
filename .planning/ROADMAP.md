# ROADMAP

## Completed Milestones

- [x] **v1.0** — Shipped the LCR audit tool across Phases 1-7 with end-to-end monitoring, validation, alerting, reporting, real PDF export, and production-readiness hardening. See `.planning/milestones/v1.0-ROADMAP.md`.
- [x] **v1.1** — Shipped the multi-user product layer across Phases 8-15 with invitation-only access, certificate-first onboarding, group-scoped reporting, internationalization, Docker/Caddy packaging, and Google public-host proof. See `.planning/milestones/v1.1-ROADMAP.md`.
- [x] **v1.2** — Shipped trust-list ingestion, trust-list operator UX, executive summary reporting, first-run/bootstrap improvements, guided onboarding, and a published auth-entry landing across Phases 16-21.1. See `.planning/milestones/v1.2-ROADMAP.md`.

## Active Milestone: v1.3 Monitoring Source Expansion

**Goal:** expand monitoring beyond CRL/certificate/trust-list availability into OCSP and CP/CPS/DPC document sources while preserving audit evidence for future PKI compliance analysis.

**Requirements:** 19 total, 19 mapped.

| Phase | Name | Goal | Requirements |
|-------|------|------|--------------|
| 22 | Derived Monitoring Source Foundation | Add a deterministic derived-source layer for OCSP and policy-document candidates tied to existing certificates and trust-list provenance. | SRC-05, SRC-06, SRC-07, SRC-08 |
| 23 | CP/CPS/DPC Document Snapshot Monitoring | Safely fetch, snapshot, hash, and extract bounded metadata/text from discovered policy documents. | DOCS-01, DOCS-02, DOCS-03, DOCS-04, DOCS-05, SEC-01 |
| 24 | OCSP Technical Evidence Monitoring | Check derived OCSP responders technically and retain evidence without claiming full revocation validation. | OCSP-01, OCSP-02, OCSP-03, OCSP-04 |
| 25 | Monitoring Source Reporting and Executive Visibility | Expose derived-source health in operator drill-downs and simple executive aggregate cards under existing authorization. | REP-04, REP-05, REP-06 |
| 26 | Operations, Configuration, and Proof Closure | Document and validate source limits, safety posture, compose envs, and future AI boundary. | OPS-07, OPS-08 |

## Phase Details

### Phase 22: Derived Monitoring Source Foundation

**Goal:** Add a deterministic derived-source layer for OCSP and policy-document candidates tied to existing certificates and trust-list provenance.

**Requirements:** SRC-05, SRC-06, SRC-07, SRC-08

**Success criteria:**
1. Imported and trust-list-derived certificates can produce derived OCSP/document source records when supported metadata exists.
2. Source records deduplicate by certificate/provenance, source type, normalized URL, and policy/document role.
3. Missing or uncheckable sources are represented explicitly without failing certificate import or trust-list sync.
4. Derived sources inherit parent certificate/provenance references for reporting and authorization.
5. Validators prove the derivation schema and source-state behavior.

### Phase 23: CP/CPS/DPC Document Snapshot Monitoring

**Goal:** Add safe policy-document fetching and snapshot capture suitable for later AI compliance analysis.

**Requirements:** DOCS-01, DOCS-02, DOCS-03, DOCS-04, DOCS-05, SEC-01

**Success criteria:**
1. Document fetches enforce timeout, redirect, size, and private-network protections before downloading content.
2. Document events and snapshots store content type, size, SHA-256 hash, URL, capture timestamp, and failure reason.
3. The system extracts bounded metadata/text when feasible and records truncation or extraction failure clearly.
4. Hash changes create historical snapshot evidence without losing prior versions.
5. Document snapshots retain certificate, policy OID, trust-list source, and snapshot/run provenance for future AI analysis.

### Phase 24: OCSP Technical Evidence Monitoring

**Goal:** Add bounded OCSP responder checks and response evidence capture while clearly separating reachability from semantic revocation validation.

**Requirements:** OCSP-01, OCSP-02, OCSP-03, OCSP-04

**Success criteria:**
1. OCSP checks run only when derived responder URL and issuer/check context are sufficient; otherwise the source becomes `not checkable` with a reason.
2. OCSP events store status, duration, HTTP status, content type, response size, response hash, and failure reason.
3. OCSP response evidence is retained within configured byte limits for later validation work.
4. UI/reporting copy does not present technical OCSP reachability as full revocation-status validation.
5. Validators cover reachable, unavailable, oversized, malformed, and missing-issuer-context outcomes.

### Phase 25: Monitoring Source Reporting and Executive Visibility

**Goal:** Make new source categories visible without overwhelming existing operator and executive workflows.

**Requirements:** REP-04, REP-05, REP-06

**Success criteria:**
1. Operator reporting shows OCSP and policy-document source health with links to parent certificates and evidence details.
2. Executive summary adds simple aggregate cards for OCSP health and policy-document availability/change risk.
3. Reporting respects parent certificate/group authorization for every derived source and export path.
4. Empty/not-discovered/not-checkable states are readable and actionable.
5. CSV/PDF/export behavior remains stable for existing CRL/certificate/trust-list reporting.

### Phase 26: Operations, Configuration, and Proof Closure

**Goal:** Close v1.3 with documented operational limits, packaged runtime validation, and explicit future AI-analysis boundary.

**Requirements:** OPS-07, OPS-08

**Success criteria:**
1. `.env.example` and compose expose fetch timeout, document byte limit, extracted text byte limit, redirect limit, and OCSP response byte limit.
2. README/operator docs explain source derivation, health states, retention limits, safety controls, and future AI scope.
3. Packaged validation covers web/worker behavior for derived source polling and reporting.
4. Security review confirms certificate-derived URLs cannot reach private/internal targets or unsafe redirects.
5. Milestone audit confirms all 19 requirements are mapped, implemented, and validated.

## Current Status

- Active milestone: v1.3 Monitoring Source Expansion
- Current stage: Phase 23 complete; ready to discuss/plan Phase 24
- Next recommended step: `/gsd-discuss-phase 24`

## Backlog / Future

### OCSP Validation

- Full OCSP semantic validation: responder authorization, signature validation, certificate status, and freshness windows.

### AI-Assisted Policy Analysis

- Analyze retained CP/CPS/DPC snapshots for PKI policy compliance.
- Compare certificate contents and provenance against obligations extracted from policy documents.

### Source Management and Discovery

- Manual OCSP/document source entry UI.
- Controlled public CA repository discovery without arbitrary crawling.

### Advanced Analytics

- SLOs, burn rates, and historical error budgets for OCSP and policy-document source categories.
