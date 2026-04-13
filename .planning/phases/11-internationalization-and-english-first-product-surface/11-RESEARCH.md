# Phase 11: Internationalization and English-First Product Surface - Research

**Researched:** 2026-04-07
**Status:** Ready for planning

## Scope

This research is limited to Phase 11 concerns:
- introducing a durable i18n architecture with `en`, `pt-BR`, and `es`
- using `en` as the canonical source locale with automatic fallback
- wiring locale selection into unauthenticated and authenticated surfaces
- localizing the existing auth, reporting, settings, certificate-admin, CSV, and PDF surfaces
- normalizing the active codebase and planning/documentation surface around English-first engineering

## Recommended Direction

### Translation architecture
- Add a small server-friendly i18n layer that resolves:
  - active locale
  - locale dictionary
  - translation helper (`t(key, values?)`)
- Keep dictionaries grouped by product domain, for example:
  - `auth`
  - `reporting`
  - `settings`
  - `admin`
  - `exports`
- Use `en` as the canonical dictionary and treat `pt-BR` / `es` as parallel translations.
- Implement fallback by:
  1. looking up the requested locale
  2. falling back to `en`
  3. returning the key itself only as a final defensive fallback

Why:
- This matches the locked product decision around stable domain-based keys.
- The current app is server-rendered and can consume locale dictionaries without introducing heavy client-only plumbing.

### Locale resolution
- Use this precedence order:
  1. explicit persisted user preference (`preferredLocale`) for authenticated users
  2. explicit query/cookie/session override for unauthenticated flows if the user chooses a locale on login/invite
  3. `Accept-Language` as an initial suggestion only
  4. final fallback to `en`
- Keep locale resolution centralized so pages, exports, and layout all derive from the same source.

Why:
- The existing runtime store already persists `preferredLocale`.
- Phase 11 must cover both authenticated and unauthenticated surfaces.

### Product surfaces in this phase
- Localize all current user-facing strings in:
  - `src/app/auth/*`
  - `src/app/reporting/*`
  - `src/app/settings/*`
  - `src/app/admin/certificates/*`
  - `src/exports/csv.ts`
  - `src/exports/pdf.ts`
  - `src/exports/pdf-templates.js`
- Localize user-facing empty/error states in those surfaces.
- Keep raw backend/API technical error payloads unchanged; map only key user-facing error cases at the UI layer.

Why:
- This matches the locked translation scope and avoids scope creep into deep backend error translation.

### English-first normalization
- Refactor the current hardcoded in-scope strings so:
  - source code identifiers and comments are English
  - canonical translation values originate in English
  - active technical docs and planning artifacts move to English-first phrasing going forward
- Treat `.planning/` normalization in this phase as document-surface cleanup, not as a requirement to retroactively rewrite archived historical artifacts from completed milestones.

Why:
- The user explicitly wants the standard to be enforced from this phase forward.
- Rewriting archived milestone history would add cost without improving the current product surface.

### Exports
- CSV exports should localize column headers and any user-facing row labels.
- PDF exports should render localized report titles, section headings, filter labels, and summary labels.
- Export locale should be derived from the same resolved locale as the requesting user or the active unauthenticated locale selection.

Why:
- CSV/PDF were explicitly pulled into scope for this phase.
- Export localization must stay aligned with the same locale-resolution contract as the UI.

## Likely implementation slices

1. **i18n foundation**
   - locale constants
   - dictionary files
   - resolver/helper functions
   - settings persistence for locale selection

2. **shell/auth/settings**
   - locale-aware layout
   - login/invite locale selector
   - authenticated settings locale selector

3. **feature surface translation**
   - reporting
   - certificate admin
   - exports
   - validation updates

4. **English-first cleanup**
   - refactor remaining in-scope hardcoded strings
   - normalize active planning artifacts for this milestone where touched

## Pitfalls to avoid

1. **Adding i18n only in pages**
   - CSV/PDF exports also need the same locale contract.

2. **Mixing English-first policy with untranslated hardcoded leftovers**
   - Phase 11 explicitly needs refactoring of the current in-scope strings, not only new strings.

3. **Letting locale handling split between auth and app surfaces**
   - Locale resolution should be centralized; otherwise login/invite and authenticated pages will diverge.

4. **Treating `preferredLocale` as authenticated-only**
   - The user also needs a locale selector before authentication.

5. **Rewriting archived planning history**
   - Normalize active/current `.planning/` surfaces, not immutable archived milestone artifacts.

## Implications for Planning

The plan should be sequenced in this order:
1. add the i18n foundation, locale resolution, dictionaries, and locale persistence/settings plumbing
2. translate auth/settings/layout plus reporting/admin product surfaces
3. localize CSV/PDF exports, tighten validation, and normalize touched active docs/planning artifacts to English-first

That order keeps locale infrastructure stable before widespread surface refactors and export/document work consume it.

## References Used

- `.planning/phases/11-internationalization-and-english-first-product-surface/11-CONTEXT.md`
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `src/storage/runtime-store.ts`
- `src/settings/preferences.ts`
- `src/app/layout.tsx`
- `src/app/settings/page.tsx`
- `src/app/auth/page.tsx`
- `src/app/auth/accept-invite/page.tsx`
- `src/app/reporting/page.tsx`
- `src/app/reporting/[targetId]/page.tsx`
- `src/app/admin/certificates/page.tsx`
- `src/app/admin/certificates/new/page.tsx`
- `src/app/admin/certificates/batch/page.tsx`
- `src/app/admin/certificates/[certificateId]/page.tsx`
- `src/exports/csv.ts`
- `src/exports/pdf.ts`
- `src/exports/pdf-templates.js`

---
*Phase: 11-internationalization-and-english-first-product-surface*
*Research completed: 2026-04-07*
