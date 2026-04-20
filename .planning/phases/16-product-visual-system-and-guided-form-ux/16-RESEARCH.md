# Phase 16 Research: Product Visual System and Guided Form UX

**Date:** 2026-04-20
**Phase:** 16 — Product Visual System and Guided Form UX
**Requirements:** UX-01, UX-06, UX-07

## Goal

Plan the first v1.2 UX phase so subsequent trust-list, onboarding, and executive-dashboard work can build on a coherent visual and form foundation instead of continuing the current raw page-by-page styling.

## Current State

The v1.1 UI works functionally but is visibly rough:
- many pages use inline styles rather than reusable product primitives
- settings/admin forms expose technical fields without enough context
- group defaults are hard to understand without domain knowledge
- empty states and post-action states are thin or absent
- Portuguese/English strings can appear mixed depending on locale and coverage

Phase 16 should not redesign every screen completely. It should create the foundation and apply it to the highest-friction surfaces touched by the phase.

## Recommended Approach

### 1. Create shared UI primitives

Introduce reusable app-level primitives for:
- page shell
- section/panel/card
- metric card
- action bar
- field group
- field help / hint / example / error text
- empty state
- success/error notice
- button/link variants

This keeps the redesign incremental and avoids a risky full component-library migration.

### 2. Improve form semantics and guidance

Use concise field-level guidance for technical fields. Guidance should explain:
- what the field affects
- accepted format or examples
- when the operator should leave it blank
- what will happen after save

Examples:
- Trust source: `Used for filtering and reporting. Example: ICP-Brasil, EU Trusted List, Internal CA.`
- PKI: `Certificate ecosystem or issuing authority family. Example: LabSEC PKI.`
- Jurisdiction: `Country or regulatory scope. Example: BR or EU.`
- Predictive window: `How many days before expiration the warning starts.`

### 3. Apply the system to high-friction screens first

Initial application targets:
- settings page group defaults
- platform/provider settings
- certificate admin list / entry links where feasible
- reporting empty states and post-action navigation where touched

### 4. Keep i18n canonical

All new labels, hints, validation messages, and empty-state copy must go through the i18n dictionary with English canonical keys and `pt-BR` / `es` coverage.

## Validation Architecture

Phase 16 should be validated by static validators, type/build checks, and targeted content checks:
- ensure shared UI primitives exist and are used by touched surfaces
- ensure field-level help keys exist in all locales
- ensure settings/admin forms include hints for technical fields
- ensure empty/post-action states exist for touched surfaces
- ensure no hardcoded Portuguese/Spanish strings are introduced outside dictionaries

## Risks

- **Risk:** visual polish without workflow clarity.
  - **Mitigation:** require field guidance and empty/post-action states as part of the phase, not optional styling.
- **Risk:** too broad a redesign.
  - **Mitigation:** build primitives and apply to highest-friction surfaces only.
- **Risk:** breaking i18n consistency.
  - **Mitigation:** extend existing i18n validation and require full locale coverage.

## Source Inputs

- `.planning/research/SUMMARY.md`
- `.planning/research/FEATURES.md`
- `.planning/research/PITFALLS.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
