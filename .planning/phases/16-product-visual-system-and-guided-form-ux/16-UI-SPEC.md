# Phase 16 UI Specification: Product Visual System and Guided Form UX

**Date:** 2026-04-20
**Status:** Design contract for planning and execution

## UX Principles

1. **Clarity over density** — forms should explain what each technical value controls.
2. **Progressive disclosure** — advanced options should not dominate the first view.
3. **Consistent hierarchy** — page titles, descriptions, panels, actions, and state messages should look consistent across the app.
4. **Actionable empty states** — empty or zero-data screens should tell the user what to do next.
5. **Localized by default** — all user-facing text belongs in the i18n dictionaries.

## Required Primitives

The implementation should introduce or formalize reusable UI primitives for:
- `PageShell`
- `PageHeader`
- `Panel` / `Card`
- `ActionBar`
- `MetricCard`
- `Field`
- `FieldHint`
- `FieldError`
- `EmptyState`
- `Notice`
- `Button` or button style helpers

Exact file structure is implementation discretion, but primitives should live in a shared UI area such as `src/components/ui/` or equivalent.

## Form Guidance Contract

Every touched technical field must support:
- label
- optional description/hint
- optional example
- validation/error text if invalid

Required fields to cover in Phase 16:
- trust source
- PKI
- jurisdiction
- predictive window days
- predictive policy enabled
- provider callback URL
- provider configured/verified status
- provider verification note
- locale/theme/predictive user preferences where touched

## Visual Contract

The UI should preserve the current dark/light theme support but improve:
- spacing consistency
- input contrast
- button/action hierarchy
- card/panel readability
- section separation
- table header readability
- status/notice visibility

Avoid adding heavy animation or a large external component library in this phase.

## Empty/Post-Action States

At minimum, touched surfaces should provide useful states for:
- no groups available
- no provider configured
- settings saved
- group defaults saved
- form validation errors
- no reporting data available

## Acceptance Criteria

- shared primitives exist and are used on touched pages
- settings group defaults are understandable without prior explanation from the developer
- provider settings no longer rely on raw technical text only
- touched empty states include one clear next action
- all new copy is available in `en`, `pt-BR`, and `es`
