# ROADMAP

## Completed Milestones

- [x] **v1.0** — Shipped the LCR audit tool across Phases 1-7 with end-to-end monitoring, validation, alerting, reporting, real PDF export, and production-readiness hardening. See `.planning/milestones/v1.0-ROADMAP.md`.
- [x] **v1.1** — Shipped the multi-user product layer across Phases 8-15 with invitation-only access, certificate-first onboarding, group-scoped reporting, internationalization, Docker/Caddy packaging, and Google public-host proof. See `.planning/milestones/v1.1-ROADMAP.md`.
- [x] **v1.2** — Shipped trust-list ingestion, trust-list operator UX, executive summary reporting, first-run/bootstrap improvements, guided onboarding, and a published auth-entry landing across Phases 16-21.1. See `.planning/milestones/v1.2-ROADMAP.md`.
- [x] **v1.3** — Shipped monitoring source expansion across Phases 22-26 with derived OCSP/policy-document evidence, reporting visibility, and packaged closure validation. See `.planning/milestones/v1.3-ROADMAP.md`.
- [x] **v1.4** — Shipped interface clarity and UX modernization across Phases 27-38, including governance and Nyquist closure. See `.planning/milestones/v1.4-ROADMAP.md`.

## Current Status

- Active milestone: none
- Next recommended command: `/gsd-new-milestone`

## Future / Backlog

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
