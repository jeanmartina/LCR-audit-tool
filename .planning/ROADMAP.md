# ROADMAP

## Completed Milestones

- [x] **v1.0** — Shipped the LCR audit tool across Phases 1-7 with end-to-end monitoring, validation, alerting, reporting, real PDF export, and production-readiness hardening. See `.planning/milestones/v1.0-ROADMAP.md`.
- [x] **v1.1** — Shipped the multi-user product layer across Phases 8-15 with invitation-only access, certificate-first onboarding, group-scoped reporting, internationalization, Docker/Caddy packaging, and Google public-host proof. See `.planning/milestones/v1.1-ROADMAP.md`.

## Active Milestone

### Milestone v1.2: Trust Lists, Executive Visibility, and Operator UX

**Goal:** extend the shipped multi-user product with ETSI trust-list ingestion, simpler executive reporting, and a substantially easier operator experience.

#### Phase 16: Product Visual System and Guided Form UX
**Goal**: Establish a coherent visual system and reusable guidance patterns so every subsequent v1.2 screen is easier to understand and operate.
**Depends on**: Phase 15
**Requirements**: UX-01, UX-06, UX-07
**Success Criteria** (what must be TRUE):
  1. Shared UI primitives define consistent layout, typography, panels, actions, states, and form help patterns.
  2. Technical fields show concise hints, examples, and validation feedback near the field.
  3. Empty states and post-action states guide users to the next useful action.
  4. Existing high-friction settings/admin screens use the new primitives where they are touched.
**Plans**: `16-01` complete

#### Phase 17: First-Run Bootstrap and Certificate/ZIP Onboarding UX
**Goal**: Remove bootstrap and certificate onboarding friction by replacing database/manual setup and raw upload screens with guided web flows.
**Depends on**: Phase 16
**Requirements**: UX-02, UX-03, UX-05
**Success Criteria** (what must be TRUE):
  1. A fresh deployment can create the initial platform admin from the web UI.
  2. Single-certificate onboarding previews derived CRLs, effective defaults, and save outcome before/after commit.
  3. ZIP onboarding shows upload validation, import progress/result summary, partial failures, and next steps.
  4. Operators no longer need direct SQL or unclear technical screens for the first useful setup path.
**Plans**: `17-01` complete

#### Phase 18: Trust-List Source Model and Safe Sync Foundation
**Goal**: Add ETSI trust-list sources as first-class inventory sources with persisted sync metadata, validation gates, and auditable sync runs.
**Depends on**: Phase 17
**Requirements**: TSL-01, TSL-02, TSL-03, TSL-04 (initial import path), OPS-04, OPS-05
**Success Criteria** (what must be TRUE):
  1. Platform admins can register a trust-list URL source.
  2. The runtime fetches and parses supported LOTL/TSL metadata into persisted snapshots.
  3. Trust-list integrity is validated before extracted data can affect inventory.
  4. Validated extracted certificates can enter the existing certificate-first import pipeline for configured groups.
  5. Sync runs record success/failure state, digest/sequence metadata, and failure reasons.
  6. The packaged Docker runtime can execute trust-list sync without undeclared host dependencies.
**Plans**: `18-01`, `18-02` complete

#### Phase 19: Trust-List Certificate Projection and Reimport
**Goal**: Project validated trust-list certificates into the existing certificate-first pipeline while preserving provenance and avoiding duplicate unchanged assets.
**Depends on**: Phase 18
**Requirements**: TSL-04 (hardening), TSL-05, TSL-07
**Success Criteria** (what must be TRUE):
  1. Trust-list certificate import is hardened beyond the Phase 18 initial path with duplicate/change handling and richer provenance.
  2. Change detection reimports affected certificates without duplicating unchanged monitored assets.
  3. Trust-list-derived certificates and targets retain provenance back to source URL, snapshot, and import run.
  4. Reporting/admin surfaces can distinguish trust-list-derived assets from manually uploaded assets without creating a separate inventory model.
**Plans**: `19-01`, `19-02` complete

#### Phase 20: Operator Trust-List Onboarding and Sync Visibility
**Goal**: Make trust-list onboarding and ongoing sync understandable to operators through guided source creation, sync status, and recovery guidance.
**Depends on**: Phase 19
**Requirements**: TSL-06, UX-04, OPS-06
**Success Criteria** (what must be TRUE):
  1. Trust-list onboarding uses the same guided source-onboarding model as certificate and ZIP onboarding.
  2. Operators can see sync status, last successful sync, next expected update, failure reason, and change summary.
  3. Documentation explains trust-list setup, sync behavior, failure handling, and operator recovery steps.
  4. Trust-list failures are visible and actionable instead of silent background errors.
**Plans**: `20-01`, `20-02` complete

#### Phase 21: Simple Executive Summary Dashboard and Export
**Goal**: Add a management-facing view that explains current coverage risk without requiring operator-level investigation.
**Depends on**: Phase 20
**Requirements**: EXEC-01, EXEC-02, EXEC-03, EXEC-04, EXEC-05, OPS-05 (executive summary packaging)
**Success Criteria** (what must be TRUE):
  1. Authorized users can open an executive summary for their allowed groups.
  2. Summary cards show healthy, degraded, unavailable, and at-risk counts.
  3. Top risks and upcoming expiration/publication risks link to operational evidence.
  4. A short trend view shows recent coverage health and incidents.
  5. The summary can be exported or printed as a concise management-facing report.
**Plans**: `21-01`, `21-02`, `21-03` complete

#### Phase 21.1: Public Landing Page and Discoverable Authentication Entry (INSERTED)
**Goal**: Fix the published root-path experience so operators do not hit a 404 and can immediately discover how to sign in with local credentials or enabled identity providers.
**Depends on**: Phase 21
**Requirements**: UX-08
**Success Criteria** (what must be TRUE):
  1. Opening the published root URL `/` no longer returns a 404 and instead shows a clear landing/auth entry surface.
  2. Users can discover local username/password login from the landing surface without guessing hidden routes.
  3. Users can discover and start any enabled IDP login flows directly from the same landing surface.
  4. The landing surface reflects enabled providers accurately and degrades cleanly when only local login is available.
**Plans**: `21.1-01` complete

## Current Status

- Active milestone: `v1.2`
- Current stage: Urgent Phase `21.1` inserted after milestone audit due to published-root/login discoverability gap
- Next recommended step: `$gsd-execute-phase 21.1`

## Backlog

### Phase 999.1: First-Run Platform Admin Bootstrap in the Web UI (BACKLOG)

**Goal:** Promoted into active v1.2 scope as UX-05 / Phase 17.
**Requirements:** UX-05
**Plans:** Promoted

### Phase 999.2: Product Visual Redesign and UI Quality Pass (BACKLOG)

**Goal:** Promoted into active v1.2 scope as UX-01 / Phase 16.
**Requirements:** UX-01
**Plans:** Promoted

### Phase 999.3: Operator-Friendly Certificate and ZIP Onboarding UX (BACKLOG)

**Goal:** Promoted into active v1.2 scope as UX-02 and UX-03 / Phase 17.
**Requirements:** UX-02, UX-03
**Plans:** Promoted

### Phase 999.4: Field-Level Guidance, Hints, and Form Help UX (BACKLOG)

**Goal:** Promoted into active v1.2 scope as UX-06 / Phase 16.
**Requirements:** UX-06
**Plans:** Promoted
