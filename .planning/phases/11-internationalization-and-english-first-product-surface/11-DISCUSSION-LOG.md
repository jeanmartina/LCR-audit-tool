# Phase 11 Discussion Log

**Date:** 2026-04-07
**Phase:** 11 — Internationalization and English-First Product Surface

## Areas Discussed

1. Translation architecture
2. Locale selection and persistence
3. Translation scope
4. English-first policy

## Decisions

- Use domain/feature-based translation keys such as `reporting.dashboard.title`.
- `en` is the canonical locale; `pt-BR` and `es` mirror the same key tree.
- Missing translations fall back automatically to `en`.
- Default locale is `en`.
- Unauthenticated users may start from `Accept-Language`, but persisted user preference wins after login.
- Locale selector must exist on login/invite screens.
- This phase must translate auth, reporting, settings, certificate admin, related empty/error states, and CSV/PDF exports.
- Deep translation of technical backend/API errors is deferred; UI-level friendly mappings are enough for now.
- New code/comments/docs must be in English.
- Existing hardcoded strings in-scope must be refactored, not left behind.
- Active `.planning/` artifacts should also move to English-first going forward.

## Deferred

- More locales in a future milestone.
- Deeper translation of technical backend/API error surfaces in a future milestone.
