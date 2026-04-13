# Phase 11: Internationalization and English-First Product Surface - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Internationalize the existing product surface so user-facing flows ship in English, Portuguese, and Spanish with per-user locale preference, while also normalizing the active codebase and planning/documentation surface around English-first engineering. This phase covers translation architecture, locale selection, translated UI/auth/admin/reporting/settings/export surfaces, and refactoring existing hardcoded strings in-scope. It does not add new product capabilities beyond language support.

</domain>

<decisions>
## Implementation Decisions

### Translation architecture
- **D-01:** Use locale message catalogs with stable keys organized by domain/feature, e.g. `reporting.dashboard.title` and `settings.profile.save`.
- **D-02:** `en` is the canonical source locale for all message keys.
- **D-03:** `pt-BR` and `es` must mirror the same key structure as `en`.
- **D-04:** Missing translations in `pt-BR` or `es` must fall back automatically to `en` without breaking the UI.
- **D-05:** New user-facing strings must not be hardcoded directly in pages/components; they must resolve through the i18n layer.

### Locale selection and persistence
- **D-06:** Initial default locale is `en`.
- **D-07:** For unauthenticated users, `Accept-Language` may be used only as an initial suggestion; the final fallback remains `en`.
- **D-08:** After login, the persisted user locale preference overrides browser language.
- **D-09:** A locale selector must be present on the login/invite surface, not only after authentication.
- **D-10:** Authenticated users must be able to change locale from product settings and persist that preference per user.

### Translation scope in this phase
- **D-11:** Translate the in-scope product surfaces: auth, reporting, settings, and certificate admin.
- **D-12:** Translate relevant empty states, error-facing UI messages, labels, titles, buttons, and feedback messages in those surfaces.
- **D-13:** CSV and PDF exports must also be localized in this phase.
- **D-14:** Backend/API technical error payloads do not need deep translation in this phase; the UI only needs localized user-facing mappings for the main error cases.

### English-first policy
- **D-15:** New code, identifiers, comments, and technical documentation must be written in English.
- **D-16:** Existing hardcoded strings in the Phase 11 in-scope surfaces must be refactored to follow the English-first + i18n model, not just newly added code.
- **D-17:** The active `.planning/` artifacts should also be normalized to English-first from this phase forward.

### the agent's Discretion
- Exact i18n library/runtime choice, provided it supports domain-key catalogs, server-rendered locale resolution, and `en` fallback.
- Exact file layout for locale dictionaries and translation helpers.
- Exact UX placement of the authenticated locale selector within settings, provided it is clear and persists per user.

</decisions>

<specifics>
## Specific Ideas

- Login/invite should already let the user switch language before authentication.
- Locale support in this milestone is exactly `en`, `pt-BR`, and `es`.
- Future milestones should cover more locales and deeper translation of technical backend error surfaces.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and scope
- `.planning/PROJECT.md` — Active v1.1 scope, English-first rule, and i18n expectations
- `.planning/REQUIREMENTS.md` — `I18N-01` through `I18N-04` requirements
- `.planning/ROADMAP.md` — Phase 11 goal, dependency chain, and success criteria
- `.planning/STATE.md` — Current milestone position after Phase 10 completion

### Existing locale/theme/user preference foundations
- `src/storage/runtime-store.ts` — Existing `preferredLocale`, `preferredTheme`, and user settings persistence
- `src/settings/preferences.ts` — Current settings service layer that already persists theme/predictive preferences
- `src/app/settings/page.tsx` — Current settings surface that must expand to locale control
- `src/app/layout.tsx` — App shell already applies per-user theme and is the natural integration point for locale-aware product chrome

### Existing user-facing surfaces to internationalize
- `src/app/auth/page.tsx` — Login/invite landing page that must gain a locale selector
- `src/app/auth/accept-invite/page.tsx` — Invite-acceptance flow
- `src/app/reporting/page.tsx` — Reporting dashboard strings and mode labels
- `src/app/reporting/[targetId]/page.tsx` — Certificate drill-down strings and tab labels
- `src/app/admin/certificates/page.tsx` — Certificate admin list UI
- `src/app/admin/certificates/new/page.tsx` — Single-certificate onboarding UI
- `src/app/admin/certificates/batch/page.tsx` — Batch import UI
- `src/app/admin/certificates/[certificateId]/page.tsx` — Certificate detail/edit UI
- `src/exports/csv.ts` — CSV export column labels/content strings
- `src/exports/pdf.ts` — PDF export assembly
- `src/exports/pdf-templates.js` — PDF-facing user-visible copy that also needs localization

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/storage/runtime-store.ts` already persists `preferredLocale`, so locale preference does not need a new domain model.
- `src/settings/preferences.ts` already centralizes user settings reads/writes, which makes it the natural place to add locale persistence logic.
- `src/app/layout.tsx` already resolves user-specific presentation state (theme), so it is the right place to anchor locale-aware shell behavior.
- `src/reporting/query-state.ts` and `src/reporting/read-models.ts` already centralize reporting state and labels enough that localized UI wiring can stay structured.

### Established Patterns
- Phase 10 moved the shell and reporting surfaces to English-first visible copy; Phase 11 should complete that normalization instead of adding a parallel ad hoc translation path.
- User settings and admin settings are already backed by server routes under `src/app/api/settings/`; locale changes should follow the same pattern instead of inventing a separate client-only mechanism.
- Export routes and builders are already first-class product surfaces, so localized CSV/PDF output should be treated as part of the phase, not as documentation debt.

### Integration Points
- Auth pages need locale selection before sign-in.
- Settings needs locale preference alongside theme/predictive controls.
- Reporting/admin/auth pages need message extraction and locale-aware rendering.
- PDF/CSV export builders need locale-aware labels while keeping the same authorization and data contracts.

</code_context>

<deferred>
## Deferred Ideas

- Translate raw backend/API technical error payloads in depth for operators and developers.
- Add support for more locales beyond `en`, `pt-BR`, and `es`.

</deferred>

---

*Phase: 11-internationalization-and-english-first-product-surface*
*Context gathered: 2026-04-07*
