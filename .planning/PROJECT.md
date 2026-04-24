# LCR Availability Dashboard

## What This Is
An LCR audit tool for compliance and engineering teams that monitors certificate revocation lists and standalone certificates, validates integrity, records historical evidence, and exposes exportable reporting to prove revocation coverage.

## Core Value
Never allow a trusted certificate to operate without valid revocation coverage. When a revocation source fails, the team needs immediate visibility and precise evidence of how long coverage was missing.

## Current State

- **Shipped version:** `v1.2` on 2026-04-24
- **Monitoring runtime:** database-backed inventory, per-target polling with configurable interval/timeout, and persisted polls, coverage gaps, snapshots, validation events, and alerts
- **Integrity path:** signature/hash validation, invalid artifact rejection, retained audit evidence, and blocking trust-list XMLDSig validation
- **Reporting:** dashboard with filters, target drill-down, audit timeline, CSV exports, executive/operational PDFs, predictive views, executive summary route, print support, and group-scoped authorization
- **Identity and access:** invitation-only local auth, Google invite-gated login proof on a real public host, sessions, audit events, groups, memberships, backend-enforced reporting/export boundaries, and a published root landing/auth entry path
- **Onboarding/admin:** first-run platform-admin bootstrap, certificate-first onboarding, batch ZIP import, trust-list source onboarding, shared target administration, ignored derived URLs, templates, change history, and layered defaults
- **Trust-list runtime:** persisted trust-list sources, snapshots, sync runs, change detection, certificate projection, provenance, operator preview, timeline visibility, and recovery guidance
- **Internationalization:** canonical English dictionaries with `pt-BR` and `es` translations, locale-aware auth/reporting/settings/admin surfaces, and localized CSV/PDF exports
- **Packaging and operations:** Docker packaging for `web` and `worker`, compose topology for `web + worker + postgres + caddy`, HTTPS ingress through Caddy, README/operator docs, and a public-host Google proof runbook

## Next Milestone Goals

**Goal:** deepen the operational and executive value of the shipped platform without regressing the simpler v1.2 operator experience.

**Candidate features:**
- Microsoft Entra ID and generic OIDC proof on the packaged/public deployment
- deeper executive analytics such as SLOs, burn rates, and error budgets
- richer trust-list operational drill-down and historical sync analysis
- future monitoring sources such as OCSP and CP/CPS/DPC document availability
- scalability work for multi-worker and multi-region execution

## Requirements

### Validated

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

### Active

- [ ] **AUTH-03**: Invited user can accept access through Microsoft Entra ID login.
- [ ] **AUTH-04**: Invited user can accept access through a generic OIDC provider.
- [ ] **SRC-03**: Monitor OCSP availability in addition to CRLs.
- [ ] **SRC-04**: Monitor the availability of CP/CPS/DPC document URLs referenced by certificates.
- [ ] **SCL-01**: Scale workers horizontally for high target counts.
- [ ] **SCL-02**: Run workers from multiple regions/jurisdictions and compare availability by probe location.
- [ ] **DIF-03**: Expose SLOs, burn rates, and historical error budgets for executive prioritization.

### Out of Scope

- [Microsecond-level coverage] — the monitor only needs minute-level resolution for SLA reporting.
- [External notification integrations] — alerts are email-only for now; SMS/push are out of scope.
- [Dedicated mobile app] — access is through the web dashboard and table-driven operator flows.

## Research Focus for v1.2

- identify the safest trust-list ingestion model for ETSI TS 119 612 in the current TypeScript/Postgres runtime
- determine the simplest executive summary surfaces that still help leadership understand coverage risk
- redesign the operator/admin UX around low-friction onboarding, first-run setup, and field-level guidance
- avoid adding complexity that would make the product harder to operate than the current certificate-first workflow

<details>
<summary>v1.1 shipped milestone snapshot</summary>

v1.1 turned the v1.0 technical core into an operable multi-user product with invitation-only access, group-scoped authorization, certificate-first onboarding, localized UI surfaces, Docker/Caddy packaging, and Google public-host proof on the packaged deployment.

</details>

<details>
<summary>v1.0 original definition snapshot</summary>

The original scope started from a compliance/engineering dashboard with background polling, a 10-minute default cadence, recurring email alerts, historical CRL retention, and a focus on lost-coverage windows.

</details>

## Context
- The primary audience is compliance and engineering teams responsible for trust-list availability and revocation coverage.
- The domain must handle European TSL-driven ecosystems and standalone certificates while always validating signature/hash and preserving downloaded CRL history for future document-verification use cases.
- The stack now spans Postgres-backed monitoring, multi-user access control, localized user-facing surfaces, and Docker/Caddy deployment.
- The product has proven the Google invite-gated flow on a real public HTTPS host; Entra ID and generic OIDC still require the same level of proof.
- v1.2 materially improved operator/admin UX, but deeper analytics and broader source coverage still remain future work.

## Constraints
- **Interface**: configurable, table-first operator workflows for engineering/compliance; no dedicated mobile design or heavy animation requirements.
- **Default cadence**: 10 minutes, overridable per monitored source, with a global fallback for newly onboarded assets.
- **Configurable timeout**: network checks must respect a short configurable timeout before marking an asset unavailable.
- **Signature/hash**: downloaded CRLs only become valid after issuer signature verification; subsequent comparisons use hash detection.
- **Alerts**: email alerts repeat until recovery, support per-target overrides, and can be disabled by administrators.
- **Coverage gaps**: the system records time windows with no valid CRL coverage and exposes them for SLA auditability.
- **Granular configuration**: each certificate/derived target can carry individual interval, timeout, recipient, and alert-frequency settings.
- **Onboarding source**: new assets originate from uploaded certificates today; trust-list ingestion must extend rather than break the certificate-first model.
- **Authorization model**: targets can be shared across groups; permissions combine global role and per-group role.
- **Invitation-only access**: users enter through invites, not public sign-up.
- **Internationalization**: every new interface must be translatable and initially support English, Portuguese, and Spanish.
- **Documentation language**: default code and technical documentation remain in English.
- **External provider scope**: Google is proven; Entra ID and generic OIDC are deferred until they are explicitly prioritized.

## Key Decisions
| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Prioritize continuous coverage tracking and historical evidence | Audits need exact proof of when revocation coverage failed and what validated artifacts were available | ✓ Good |
| Repeat email alerts until recovery | Compliance and engineering need persistent signal until revocation coverage returns | ✓ Good |
| Allow standalone certificates in addition to trust-list-derived assets | Adjacent monitoring scenarios should not depend on official list updates | ✓ Good |
| Persist alerts before delivery | The audit trail cannot depend on downstream channel success | ✓ Good |
| Use Postgres as the runtime source of truth | Inventory and evidence must survive restarts and support real reporting | ✓ Good |
| Separate executive and operational PDFs | Compliance and management need different evidence densities over the same dataset | ✓ Good |
| Center onboarding on certificates | Deriving CRLs from certificates reduces operator error and keeps configuration faithful to the domain | ✓ Good |
| Allow targets to be shared across groups | The same monitored artifact can serve multiple groups without duplicate runtime work | ✓ Good |
| Prefer Caddy for HTTPS callback readiness | OAuth/SSO requires real HTTPS; Caddy reduces operational friction with automatic TLS | ✓ Good |
| Build auth foundation before admin UX | Auth, sessions, invites, and permission boundaries must exist before certificate-first admin and group-scoped onboarding | ✓ Good |
| Build certificate-first admin before predictive/group reporting | Predictive monitoring and group-scoped reporting should build on certificate/admin truth, not SQL-only target maintenance | ✓ Good |
| Move the active product surface to English-first i18n | The product needs user-selectable languages without losing a stable English engineering baseline | ✓ Good |
| Close v1.1 auth proof with real Google public-host validation | The milestone needed one proven public-host external provider path instead of placeholder readiness only | ✓ Good |
| Extend trust-list ingestion through the certificate-first model | Keeps one inventory model and one operator workflow instead of splitting trust-list assets into a parallel system | ✓ Good |
| Treat trust-list XMLDSig validation as blocking | Prevents unverified trust-list data from mutating inventory or reports | ✓ Good |
| Keep executive reporting summary-oriented and principal-scoped | Preserves evidence boundaries while giving leadership a simpler view | ✓ Good |
| Fix published-root auth discoverability before closing v1.2 | A shipped deployment cannot rely on hidden auth routes or a 404 root path | ✓ Good |

## Evolution
This document evolves with each phase and milestone transition.

**After each phase:**
1. Invalidated requirements move to *Out of Scope* with a reason.
2. Validated requirements move to *Validated* with the phase reference.
3. Newly discovered requirements are added to *Active*.
4. Meaningful decisions get new rows in the decision table.
5. `What This Is` is revised to remain accurate.

**After each milestone:**
1. Review every section.
2. Confirm that the core value is still true.
3. Audit *Out of Scope* items so the rationale remains current.
4. Update context with the current operational state and any active risk signals.

---
*Last updated: 2026-04-24 after v1.2 milestone completion*
