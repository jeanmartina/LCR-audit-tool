# ROADMAP

## Completed Milestones

- [x] **v1.0** — Shipped the LCR audit tool across Phases 1-7 with end-to-end monitoring, validation, alerting, reporting, real PDF export, and production-readiness hardening. See `.planning/milestones/v1.0-ROADMAP.md`.
- [x] **v1.1** — Shipped the multi-user product layer across Phases 8-15 with invitation-only access, certificate-first onboarding, group-scoped reporting, internationalization, Docker/Caddy packaging, and Google public-host proof. See `.planning/milestones/v1.1-ROADMAP.md`.
- [x] **v1.2** — Shipped trust-list ingestion, trust-list operator UX, executive summary reporting, first-run/bootstrap improvements, guided onboarding, and a published auth-entry landing across Phases 16-21.1. See `.planning/milestones/v1.2-ROADMAP.md`.
- [x] **v1.3** — Shipped monitoring source expansion across Phases 22-26 with derived OCSP/policy-document evidence, reporting visibility, and packaged closure validation. See `.planning/milestones/v1.3-ROADMAP.md`.

## Active Milestone: v1.4 Interface Clarity and UX Modernization

**Goal:** make the product easier to use and inspect across public shell, settings, trust lists, import review, reporting, PDF, global navigation, and runtime version visibility.

**Requirements:** 8 total, 8 mapped.

| Phase | Name | Goal | Requirements |
|-------|------|------|--------------|
| 27 | Public Shell and Identity | Make the public landing page, login, identity provider visibility, language selector, and navigation feel official and modern. | UI-01 |
| 28 | Settings and Administration | Reorganize settings and admin surfaces into clear tabs for personal preferences, group defaults, providers, trust lists, groups, and invitations. | UI-02 |
| 29 | Trust Lists and Diagnostics | Improve trust-list hierarchy, metadata, removals, and operational diagnostics. | UI-03 |
| 30 | Import Review and Safety | Add review-before-save import flows with server-side revalidation and preserved provenance. | UI-04 |
| 31 | Dashboard and Reporting | Make dashboard, timelines, derived states, and actions clearer and more consistent. | UI-05 |
| 32 | Executive PDF | Make the executive PDF professional, Unicode-safe, and aligned with the web executive read model. | UI-06 |
| 33 | Global UX Consistency | Apply one modern visual language and navigation pattern across the application. | UI-07 |
| 34 | Release Clarity | Surface the running version/build identifier in an operator-visible place in the web UI. | UI-08 |

## Phase Details

### Phase 27: Public Shell and Identity

**Goal:** Make the public landing page, login, identity provider visibility, language selector, and navigation feel official and modern.

**Requirements:** UI-01

**Plans:** 1 plan

Plans:
- [ ] `27-01-PLAN.md` — Build the shared public shell, refactor `/` and `/auth`, and validate enabled-provider-only public entry.

**Success criteria:**
1. The public landing page reads like the official product entry, not a technical stub.
2. Login is visible directly without an extra click.
3. Only enabled identity providers appear publicly.
4. The language selector is compact and unobtrusive.
5. Top-level navigation feels modern and action-oriented.

### Phase 28: Settings and Administration

**Goal:** Reorganize settings and admin surfaces into clear tabs for personal preferences, group defaults, providers, trust lists, groups, and invitations.

**Requirements:** UI-02

**Success criteria:**
1. Settings are split into clear tabs or sections.
2. Personal preferences are separated from administrative settings.
3. Group administration and invitation management are clear CRUD flows.
4. Technical fields provide contextual hints.

### Phase 29: Trust Lists and Diagnostics

**Goal:** Improve trust-list hierarchy, metadata, removals, and operational diagnostics.

**Requirements:** UI-03

**Success criteria:**
1. Trust-list hierarchy is visible, including LOTL/subordinate structure.
2. Operators can remove incorrect sources without losing history.
3. Failure modes are distinguished clearly and explained technically.
4. Inventory cards and tables remain compact and legible.

### Phase 30: Import Review and Safety

**Goal:** Add review-before-save import flows with server-side revalidation and preserved provenance.

**Requirements:** UI-04

**Success criteria:**
1. Import flows use derivation/prevalidation followed by review and then save.
2. Operators can accept, edit, ignore, reject, mark duplicates, or keep suggestions pending.
3. The server revalidates everything at final save time.
4. Provenance is preserved across corrections.

### Phase 31: Dashboard and Reporting

**Goal:** Make dashboard, timelines, derived states, and actions clearer and more consistent.

**Requirements:** UI-05

**Success criteria:**
1. Dashboard filters are predictable and keep healthy items visible.
2. Derived-source states are explicit and readable.
3. Timelines/logs explain issues in human terms.
4. Actions look like consistent controls rather than loose links.
5. Detail views become diagnostic pages rather than data dumps.

### Phase 32: Executive PDF

**Goal:** Make the executive PDF professional, Unicode-safe, and aligned with the web executive read model.

**Requirements:** UI-06

**Success criteria:**
1. The PDF has a professional executive-report appearance.
2. Unicode and accented characters render correctly.
3. Sections are fixed and predictable.
4. The PDF uses the same underlying read model as the web executive view.

### Phase 33: Global UX Consistency

**Goal:** Apply one modern visual language and navigation pattern across the application.

**Requirements:** UI-07

**Success criteria:**
1. The application feels like one coherent product across all major screens.
2. Buttons and actions follow a consistent hierarchy.
3. Density is controlled without becoming sparse or noisy.
4. The same visual discipline applies everywhere without exception.

### Phase 34: Release Clarity

**Goal:** Surface the running version/build identifier in an operator-visible place in the web UI.

**Requirements:** UI-08

**Success criteria:**
1. The running version/build is visible without developer tools.
2. The placement is stable and operator-facing.
3. The displayed value can be verified in the packaged runtime.

## Current Status

- Active milestone: v1.4 Interface Clarity and UX Modernization
- Current stage: requirements finalized; roadmap ready for phase planning
- Next recommended step: `/gsd-plan-phase 27`

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
