# Phase 16 Validation Strategy

**Date:** 2026-04-20
**Phase:** 16 — Product Visual System and Guided Form UX

## Requirements Covered

- UX-01: coherent visual system
- UX-06: field-level hints, examples, and validation feedback
- UX-07: empty and post-action guidance states

## Automated Validation

Required validation commands after implementation:

```bash
node scripts/validate-i18n.js foundation
node scripts/validate-i18n.js ui
node scripts/validate-all.js
npm run typecheck
npm run build
```

Phase 16 should add or extend a validator to check:
- shared UI primitives exist
- touched settings/admin/reporting surfaces use the primitives
- required hint/help i18n keys exist in `en`, `pt-BR`, and `es`
- known technical fields have adjacent guidance text
- touched empty/post-action states exist

Suggested validator:

```bash
node scripts/validate-ui-guidance.js
```

## Manual Validation

Manual review must verify:
- group defaults can be understood from the UI without external explanation
- provider status/verification fields are clear and do not expose secrets
- empty states tell the operator what to do next
- visual hierarchy is materially clearer than the v1.1 inline-styled pages

## Residual Risk

This phase is a UI foundation, not a full application redesign. Screens not touched in Phase 16 may still look rough until later v1.2 phases apply the primitives more broadly.
