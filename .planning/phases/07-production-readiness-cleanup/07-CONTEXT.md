# Phase 7: Production Readiness Cleanup - Context

## Phase Boundary

This phase is a post-milestone cleanup focused on production readiness and confidence, not on reopening the v1 feature scope. It exists to turn the remaining non-blocking debt from the `v1.0` audit into a reproducible runtime proof path and a stronger quality gate.

This phase does not add new monitoring, alerting, reporting, or export capabilities. It hardens what already exists.

## Implementation Decisions

### Runtime Proof With Real Postgres

- This phase must validate the runtime flow against a real Postgres instance using `DATABASE_URL`.
- The outcome must include a reproducible smoke test path that proves the runtime store, polling flow, and persisted evidence can execute against a live database.
- A one-off manual proof is not enough; the result must be repeatable by another operator or CI-like environment.

### Quality Gate

- This phase must establish a single quality gate command that runs:
  - build
  - typecheck
  - validation scripts
- The goal is to stop relying on scattered manual checks and give the project one reproducible readiness gate.

### PDF Scope

- PDF work in this phase is limited to minimal visual improvement on top of the current renderer.
- This phase must not reopen the PDF architecture or swap in a new rendering stack.
- Any PDF cleanup should stay within presentation polish that improves audit readability without changing the established export contract.

### Nyquist / Retroactive Validation

- This phase must create the missing `*-VALIDATION.md` artifacts for Phases 1 through 6.
- Nyquist coverage is part of the cleanup scope because the milestone audit identified it as missing project-wide validation evidence.

### The Agent's Discretion

- Planning can decide whether the runtime smoke test is implemented as a script, make target, or npm script, as long as it is reproducible and uses a real Postgres connection.
- Planning can decide how the unified quality gate is exposed (`package.json`, shell script, or both), as long as it is easy to run locally and in automation.
- Planning can choose the smallest set of PDF styling changes that materially improves readability without introducing a new PDF dependency chain.

### Folded Todos

None.

## Canonical References

### Audit Drivers

- `.planning/v1.0-MILESTONE-AUDIT.md`
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/STATE.md`

### Upstream Phase Artifacts

- `.planning/phases/04-runtime-inventory-polling-persistence-wiring/04-CONTEXT.md`
- `.planning/phases/04-runtime-inventory-polling-persistence-wiring/04-VERIFICATION.md`
- `.planning/phases/05-reporting-e2e-wiring-audit-ux-completion/05-CONTEXT.md`
- `.planning/phases/05-reporting-e2e-wiring-audit-ux-completion/05-VERIFICATION.md`
- `.planning/phases/06-real-pdf-export-delivery/06-CONTEXT.md`
- `.planning/phases/06-real-pdf-export-delivery/06-VERIFICATION.md`

## Existing Code Insights

### Reusable Assets

- `src/storage/runtime-store.ts` already defines the Postgres-facing runtime persistence shape and is the natural center of a real-database smoke flow.
- `scripts/validate-runtime-wiring.js` and `scripts/validate-reporting.js` already provide targeted verification checks that can be folded into a unified gate.
- The current PDF path already has real byte generation in `src/exports/pdf.ts`, `src/exports/pdf-engine.js`, and `src/exports/pdf-templates.js`, so cleanup can stay within styling/template refinement.

### Known Debt To Close

- The project has not yet exercised the runtime path against a live Postgres database.
- The repo lacks a single build/typecheck/validation gate.
- Nyquist validation artifacts are missing for all completed phases.
- PDF exports are contract-correct but visually minimal.

### Integration Points

- The runtime smoke path must prove that the database-backed inventory and evidence flow from Phase 4 still work end-to-end with a real connection.
- The unified quality gate must cover both the runtime/reporting validations and the app-level build/typecheck surface.
- Nyquist artifacts must align with the already completed phases rather than redefining their scope.

## Specific Ideas

- Prefer one documented command that a maintainer can run before shipping.
- Keep the PDF cleanup intentionally narrow: better headings, spacing, section readability, but no renderer rewrite.
- Make the Postgres smoke flow simple enough to run on demand in local or staging environments.

## Deferred Ideas

- Replacing the PDF renderer with a more sophisticated engine.
- Broad CI/CD design beyond the single local/automation quality gate needed now.
- New product capabilities or UI features unrelated to production readiness cleanup.

---
*Phase: 07-production-readiness-cleanup*
*Context gathered: 2026-04-07*
