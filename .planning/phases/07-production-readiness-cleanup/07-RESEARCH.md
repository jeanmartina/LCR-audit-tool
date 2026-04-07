# Phase 7 Research: Production Readiness Cleanup

## What the codebase already has

### 1. The runtime store is already Postgres-aware, but it is not exercised end-to-end

- `src/storage/runtime-store.ts` already creates a `pg` `Pool` from `DATABASE_URL` and defines durable SQL for:
  - `runtime_targets`
  - `poll_events`
  - `validation_events`
  - `alert_events`
  - `snapshot_records`
  - `coverage_gaps`
- The current milestone audit debt is therefore not "missing Postgres support". It is missing runtime proof against a live database and a reproducible way to run that proof.

**Implication for planning:** Phase 7 should not redesign persistence. It should add a smoke path that initializes schema, exercises the runtime flow against a real database, and proves persisted evidence can be read back.

### 2. There is no actual project gate today

- `package.json` currently has dependencies only; there are no `scripts`.
- The repo still has no visible `tsconfig.json`.
- Existing confidence relies on targeted validation scripts:
  - `scripts/validate-inventory.js`
  - `scripts/validate-scheduler.js`
  - `scripts/validate-storage.js`
  - `scripts/validate-runtime-wiring.js`
  - `scripts/validate-reporting.js`

**Implication for planning:** The cleanup phase needs a single runnable gate that composes build, typecheck, and the targeted validation scripts rather than inventing a second verification system.

### 3. PDF correctness is solved; PDF polish is intentionally minimal

- `src/exports/pdf.ts` already produces executive and operational report bytes via `createPdfBytesFromHtml(...)`.
- `src/exports/pdf-engine.js` converts HTML-derived text into a minimal `%PDF-` artifact.
- `src/exports/pdf-templates.js` is very simple HTML with headings, paragraphs, and lists.

**Implication for planning:** Minimal visual improvement should stay at the template/text layer:
- clearer section hierarchy
- better labels
- spacing/readability
- maybe lightweight text formatting decisions that survive the current text-to-PDF pipeline

It should not attempt a renderer swap or a browser-based PDF path.

### 4. The current validation scripts are string-contract checks, not runtime smoke checks

- `scripts/validate-runtime-wiring.js` and `scripts/validate-reporting.js` confirm module structure and route contracts.
- They do not prove:
  - a real database accepts schema and writes
  - the runtime path works with `DATABASE_URL`
  - the whole project can pass a single quality command

**Implication for planning:** The new smoke test should be additive, not a replacement:
- keep the current fast checks
- add one real runtime smoke script for Postgres
- wrap them together under one quality command

## Recommended implementation direction

### A. Add one reproducible runtime smoke entrypoint

Best fit for this codebase:
- a Node script under `scripts/` that:
  1. requires `DATABASE_URL`
  2. initializes or applies the SQL schema from `src/storage/runtime-store.ts`
  3. inserts a target through the runtime store path
  4. persists representative poll / validation / alert / snapshot / coverage-gap evidence
  5. reads it back through the existing read contracts
  6. exits non-zero on mismatch

Why this fits:
- stays aligned with the current code organization
- avoids adding a test runner just for one readiness proof
- can run locally or in CI-like automation with a real Postgres container/service

### B. Add a single quality gate command in `package.json`

Best fit:
- expose scripts such as:
  - `build`
  - `typecheck`
  - `validate`
  - `smoke:runtime`
  - `quality`

Where `quality` runs the full gate:
- build
- typecheck
- validation scripts
- optionally the runtime smoke if `DATABASE_URL` is present, or as a documented separate required step for readiness

Given the user explicitly wants a single gate, the better plan is:
- make `quality` the local gate
- make the Postgres smoke reproducible and callable from the same package-script family
- decide during execution whether `quality` should fail hard without `DATABASE_URL` or whether `quality:runtime` is the deployment-readiness gate

### C. Introduce the missing TypeScript/Next baseline only as needed to support the gate

Because the repo currently lacks `tsconfig.json`, planning should assume Phase 7 may need:
- `tsconfig.json`
- possibly `next-env.d.ts`
- package scripts compatible with Next 16 / TypeScript 6

This is a cleanup/hardening task, not a feature phase, so the scope should stay minimal:
- enough config for `next build` and `tsc --noEmit`
- no broad refactor for "perfect typing"

### D. Create Nyquist validation artifacts from completed evidence, not by rewriting phase history

The audit shows all phases 1–6 are missing `*-VALIDATION.md`.

Best fit for Phase 7:
- generate retroactive validation docs from:
  - each phase `PLAN.md`
  - each phase `SUMMARY.md`
  - each phase `VERIFICATION.md`
- keep them aligned with completed scope
- do not use them to reopen already-closed requirements

### E. Keep PDF polish shallow and verifiable

The current engine strips HTML to text before PDF generation, so CSS-heavy work is wasted.

Best cleanup targets:
- improve template wording and section grouping
- ensure headings and evidence sections are more legible in the stripped text output
- extend validation with a style/readability check only if it can stay deterministic

## Recommended task split

1. **Gate foundation**
   - add package scripts
   - add TS/Next config needed for `build` and `typecheck`
   - consolidate existing validations under one entrypoint

2. **Real Postgres smoke**
   - add reproducible smoke script using `DATABASE_URL`
   - prove schema + write/read flow against live Postgres
   - document how to run it locally/staging

3. **PDF cleanup**
   - improve current report templates for readability
   - keep same renderer and route contract
   - add deterministic validation for the improved report structure if useful

4. **Retroactive Nyquist artifacts**
   - create `*-VALIDATION.md` for phases 1–6
   - keep them evidence-based and scoped to what was actually shipped

## Planning guardrails

- Do not redesign persistence or reporting architecture.
- Do not replace the PDF engine.
- Do not turn this into a broad CI/CD initiative.
- Do not reopen milestone requirements; this is readiness cleanup on top of a completed milestone.
