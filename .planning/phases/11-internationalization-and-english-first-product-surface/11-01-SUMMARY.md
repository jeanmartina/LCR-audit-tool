# Phase 11 Summary

## Outcome

Phase 11 shipped the initial internationalization layer and moved the active product surface to an English-first implementation model.

## Delivered

- Added a shared i18n foundation with canonical `en` dictionaries, `pt-BR` and `es` translations, locale normalization, request/user locale resolution, and translator helpers in `src/i18n/index.ts`.
- Wired locale persistence through invitation acceptance, provider callback acceptance, login, authenticated settings updates, and app shell locale resolution in:
  - `src/app/api/auth/invite/accept/route.ts`
  - `src/app/api/auth/callback/[provider]/route.ts`
  - `src/app/api/auth/login/route.ts`
  - `src/app/api/settings/profile/route.ts`
  - `src/settings/preferences.ts`
  - `src/app/layout.tsx`
- Localized the in-scope UI surfaces:
  - auth landing and invite acceptance
  - reporting dashboard and certificate detail
  - settings
  - certificate administration list/import/detail
- Added locale selectors to the login and invite surfaces and per-user locale selection in settings.
- Localized CSV/PDF exports using the authenticated user locale and updated the PDF templates to render label-driven content.
- Added Phase 11 validation coverage in `scripts/validate-i18n.js` and wired it into `scripts/validate-all.js`.

## Notes

- `en` remains the canonical locale and fallback.
- UI-facing localization is in scope; deep backend technical error translation remains deferred.
- The active planning/project surface is now being maintained in English-first form from this phase onward.
