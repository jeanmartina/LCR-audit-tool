# ROADMAP

## Completed Milestones

- [x] **v1.0** — Shipped the LCR audit tool across Phases 1-7 with end-to-end monitoring, validation, alerting, reporting, real PDF export, and production-readiness hardening. See `.planning/milestones/v1.0-ROADMAP.md`.

## Active Milestone

### Milestone v1.1: Multi-User Operations, I18N, and Secure Deployment

#### Phase 8: Identity, Invitations, and Access Foundation
**Goal**: Add the authentication and authorization foundation required to turn the product into an invitation-only multi-user system with group-scoped access control.
**Depends on**: Phase 7
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, GRP-01, GRP-02, GRP-03
**Success Criteria** (what must be TRUE):
  1. Invited users can authenticate with local email/password, Google, Microsoft Entra ID, or generic OIDC.
  2. Platform admins can create groups and invite initial group admins.
  3. Group admins can invite members and assign `viewer`, `operator`, and `group-admin` roles.
  4. Platform admins can operate as group admins without needing a second account.
**Plans**: `08-01` ✓ complete

#### Phase 9: Certificate-First Onboarding and Target Administration
**Goal**: Replace SQL/manual onboarding with a certificate-first administration experience that derives CRLs automatically and supports shared targets plus layered defaults.
**Depends on**: Phase 8
**Requirements**: ADM-01, ADM-02, ADM-03, ADM-04, ADM-05, GRP-05, GRP-06
**Success Criteria** (what must be TRUE):
  1. Operators can upload single certificates or `.zip` bundles and the system derives CRL targets from them.
  2. Manual CRL URL entry is no longer the normal onboarding path.
  3. Admin UI supports create/edit/disable, tags, clone, change history, and target sharing across groups.
  4. Platform, group, and target defaults resolve predictably and are visible before save.
**Plans**: `09-01` ✓ complete

#### Phase 10: Group-Scoped Reporting and Predictive Monitoring
**Goal**: Enforce authorization boundaries across reporting and exports while adding configurable predictive alerts and multi-PKI tagging views.
**Depends on**: Phase 9
**Requirements**: GRP-04, MON-03, MON-04, REP-03
**Success Criteria** (what must be TRUE):
  1. Dashboard, drill-down, and exports only show authorized group data.
  2. Predictive alerts can warn before CRL expiry/publication failure.
  3. Users can choose whether they receive predictive alerts.
  4. Reporting supports grouping/filtering by trust-source or PKI tags.
**Plans**: `10-01` ✓ complete

#### Phase 11: Internationalization and English-First Product Surface
**Goal**: Internationalize the UI and normalize the code/documentation surface around English-first engineering with per-user locale preferences.
**Depends on**: Phase 10
**Requirements**: I18N-01, I18N-02, I18N-03, I18N-04
**Success Criteria** (what must be TRUE):
  1. User-facing interfaces are translatable and ship in English, Portuguese, and Spanish.
  2. Each user can choose and persist their preferred language.
  3. New code and default technical documentation are written in English.
**Plans**: `11-01` ✓ complete

#### Phase 12: Containerized Deployment, HTTPS, and Operator Documentation
**Goal**: Package the stack for practical deployment with Docker and Caddy-backed HTTPS, and document the basic setup and usage path for GitHub users/operators.
**Depends on**: Phase 11
**Requirements**: AUTH-05, OPS-01, OPS-02, OPS-03, DOC-01
**Success Criteria** (what must be TRUE):
  1. The stack runs as `web + worker + postgres + caddy`.
  2. Caddy handles HTTPS with automatic certificate renewal suitable for auth callbacks.
  3. Public-origin and provider configuration are documented and environment-driven.
  4. The repo includes a basic English README for setup and usage.
**Plans**: `12-01` ✓ complete

#### Phase 13: Real OAuth and OIDC Authentication Delivery
**Goal**: Replace the current provider-auth scaffolding with real Google, Microsoft Entra ID, and generic OIDC flows that complete over the packaged HTTPS deployment path.
**Depends on**: Phase 12
**Requirements**: AUTH-02, AUTH-03, AUTH-04, AUTH-05
**Gap Closure**: Closes milestone audit gaps for provider auth integration and public HTTPS callback validation.
**Success Criteria** (what must be TRUE):
  1. Google sign-in completes through a real OAuth redirect and callback flow.
  2. Microsoft Entra ID sign-in completes through a real OAuth redirect and callback flow.
  3. Generic OIDC sign-in completes through a real discovery/redirect/callback flow.
  4. The packaged HTTPS stack is verified against the real callback path rather than a placeholder form-post route.
**Plans**: TBD

#### Phase 14: Packaged Batch Import Runtime Hardening
**Goal**: Make `.zip` certificate onboarding work in the shipped containerized runtime and verify the end-to-end batch import path inside the packaged stack.
**Depends on**: Phase 13
**Requirements**: ADM-02
**Gap Closure**: Closes milestone audit gaps for packaged batch import runtime compatibility.
**Success Criteria** (what must be TRUE):
  1. The packaged runtime can extract and process `.zip` certificate bundles without undeclared host dependencies.
  2. Batch onboarding works in the compose-based stack and projects derived CRLs into reporting.
  3. The runtime/container contract documents any remaining operational assumptions for batch import clearly.
**Plans**: TBD

## Current Status

- Active milestone: `v1.1`
- Next recommended step: run `$gsd-plan-phase 13`
