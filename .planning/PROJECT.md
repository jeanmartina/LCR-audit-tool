# LCR Availability Dashboard

## What This Is
An LCR audit tool for compliance and engineering teams that monitors certificate revocation lists and standalone certificates, validates integrity, records historical evidence, and exposes exportable reporting to prove revocation coverage.

## Core Value
Never allow a trusted certificate to operate without valid revocation coverage. When a revocation source fails, the team needs immediate visibility and precise evidence of how long coverage was missing.

## Current State

- **Shipped version:** `v1.1` on 2026-04-13
- **Monitoring runtime:** database-backed inventory, per-target polling with configurable interval/timeout, and persisted polls, coverage gaps, snapshots, validation events, and alerts
- **Integrity path:** signature/hash validation, invalid artifact rejection, and retained audit evidence
- **Reporting:** dashboard with filters, target drill-down, audit timeline, CSV exports, executive/operational PDFs, predictive views, and group-scoped authorization
- **Identity and access:** invitation-only local auth, Google invite-gated login proof on a real public host, sessions, audit events, groups, memberships, and backend-enforced reporting/export boundaries
- **Onboarding/admin:** certificate-first onboarding, batch ZIP import, shared target administration, ignored derived URLs, templates, change history, and layered defaults
- **Internationalization:** canonical English dictionaries with `pt-BR` and `es` translations, locale-aware auth/reporting/settings/admin surfaces, and localized CSV/PDF exports
- **Packaging and operations:** Docker packaging for `web` and `worker`, compose topology for `web + worker + postgres + caddy`, HTTPS ingress through Caddy, README/operator docs, and a public-host Google proof runbook

## Requirements

### Validated

- ✓ **LCR-01**: Continuous monitoring of each LCR/certificate with availability, downtime, and recovery lag — `v1.0`
- ✓ **LCR-02**: Per-target configurable interval with a 10-minute global default — `v1.0`
- ✓ **LCR-03**: Email alerts with default/override recipients, repeated until recovery, and admin disablement — `v1.0`
- ✓ **LCR-04**: Signature/hash validation and historical storage of verified LCRs — `v1.0`
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

### Active

- [ ] **AUTH-03**: Invited user can accept access through Microsoft Entra ID login.
- [ ] **AUTH-04**: Invited user can accept access through a generic OIDC provider.
- [ ] **SRC-01**: Import trust lists according to ETSI TS 119 612 using the trust-list distribution URL as the onboarding source.
- [ ] **SRC-02**: Re-import certificates automatically when a tracked trust list updates.
- [ ] **SRC-03**: Monitor OCSP availability in addition to CRLs.
- [ ] **SRC-04**: Monitor the availability of CP/CPS/DPC document URLs referenced by certificates.
- [ ] **SCL-01**: Scale workers horizontally for high target counts.
- [ ] **SCL-02**: Run workers from multiple regions/jurisdictions and compare availability by probe location.
- [ ] **DIF-03**: Expose SLOs, burn rates, and historical error budgets for executive prioritization.
- [ ] **UX-01**: Bootstrap the first platform admin from the web UI on first run.
- [ ] **UX-02**: Redesign the visual system and operator-facing UI quality.
- [ ] **UX-03**: Make certificate and ZIP onboarding operator-friendly.
- [ ] **UX-04**: Add field-level hints, examples, and contextual form guidance.

### Out of Scope

- [Microsecond-level coverage] — the monitor only needs minute-level resolution for SLA reporting.
- [External notification integrations] — alerts are email-only for now; SMS/push are out of scope.
- [Dedicated mobile app] — access is through the web dashboard and table-driven operator flows.

## Next Milestone Goals

- deliver real Microsoft Entra ID and generic OIDC proof on the packaged HTTPS deployment
- add trust-list ingestion and automatic certificate re-import from trust-list updates
- expand monitoring beyond CRLs into OCSP and referenced policy-document availability
- improve operator UX with first-run admin bootstrap, simpler certificate/ZIP onboarding, and stronger form guidance
- raise the product’s visual quality with a deliberate redesign pass

<details>
<summary>v1.1 shipped milestone snapshot</summary>

v1.1 turned the v1.0 technical core into an operable multi-user product with invitation-only access, group-scoped authorization, certificate-first onboarding, localized UI surfaces, Docker/Caddy packaging, and Google public-host proof on the packaged deployment.

</details>

<details>
<summary>v1.0 original definition snapshot</summary>

The original scope started from a compliance/engineering dashboard with background polling, a 10-minute default cadence, recurring email alerts, historical LCR retention, and a focus on lost-coverage windows.

</details>

## Context
- The primary audience is compliance and engineering teams responsible for trust-list availability and revocation coverage.
- The domain must handle European TSL-driven ecosystems and standalone certificates while always validating signature/hash and preserving downloaded LCR history for future document-verification use cases.
- The stack now spans Postgres-backed monitoring, multi-user access control, localized user-facing surfaces, and Docker/Caddy deployment.
- The product has proven the Google invite-gated flow on a real public HTTPS host; Entra ID and generic OIDC still require the same level of proof.
- Operator/admin UX still needs significant polish for first-run bootstrap, onboarding guidance, and overall visual quality.

## Constraints
- **Interface**: configurable, table-first operator workflows for engineering/compliance; no dedicated mobile design or heavy animation requirements.
- **Default cadence**: 10 minutes, overridable per monitored source, with a global fallback for newly onboarded assets.
- **Configurable timeout**: network checks must respect a short configurable timeout before marking an asset unavailable.
- **Signature/hash**: downloaded CRLs only become valid after issuer signature verification; subsequent comparisons use hash detection.
- **Alerts**: email alerts repeat until recovery, support per-target overrides, and can be disabled by administrators.
- **Coverage gaps**: the system records time windows with no valid CRL coverage and exposes them for SLA auditability.
- **Granular configuration**: each certificate/derived target can carry individual interval, timeout, recipient, and alert-frequency settings.
- **Onboarding source**: new assets originate from uploaded certificates; manual CRL URL onboarding remains out of scope as a primary flow.
- **Authorization model**: targets can be shared across groups; permissions combine global role and per-group role.
- **Invitation-only access**: users enter through invites, not public sign-up.
- **Internationalization**: every new interface must be translatable and initially support English, Portuguese, and Spanish.
- **Documentation language**: default code and technical documentation remain in English.
- **External provider scope for shipped v1.1**: Google is proven; Entra ID and generic OIDC are deferred to the next milestone.

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
*Last updated: 2026-04-13 after v1.1 milestone completion*
