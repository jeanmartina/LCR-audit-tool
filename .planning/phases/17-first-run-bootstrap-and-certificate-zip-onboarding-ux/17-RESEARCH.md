# Phase 17 Research: First-Run Bootstrap and Certificate/ZIP Onboarding UX

**Date:** 2026-04-20
**Phase:** 17 - First-Run Bootstrap and Certificate/ZIP Onboarding UX
**Requirements:** UX-02, UX-03, UX-05

## Planning Question

What must be understood to plan a safe, executable implementation for first-run platform-admin bootstrap plus guided certificate and ZIP onboarding?

## Existing Implementation Baseline

### Authentication and Bootstrap

- `src/app/auth/page.tsx` currently renders the login and provider entry page with inline styles.
- Credential login posts to `src/app/api/auth/login/route.ts` and creates `lcr_session_token` through `createSession`.
- Users already persist through `ensureUser`, `createUserRecord`, `elevatePlatformAdmin`, and audit events in `src/auth/models.ts` plus `src/storage/runtime-store.ts`.
- There is no web first-run path. Operators previously needed SQL or manual insertion to create the first platform admin.
- Platform-admin checks already use `assertPlatformAdmin`; normal auth checks use `assertAuthenticated`.

### Certificate Onboarding

- `src/app/admin/certificates/new/page.tsx` is a raw multipart form posting directly to `/api/admin/certificates/import`.
- The import route normalizes PEM/DER through `normalizeCertificatePem`, derives CRLs with `extractDerivedCrlUrls`, persists the certificate, CRL links, targets, group shares, import run/item, and change event.
- The page currently labels preview sections, but those sections do not compute a real preview before commit.
- The route redirects with `new URL(..., request.url)`, which can leak the internal container origin in packaged deployments if not corrected.

### ZIP Onboarding

- `src/app/admin/certificates/batch/page.tsx` is a raw multipart form posting to `/api/admin/certificates/import-zip`.
- The API returns JSON summary instead of an operator-friendly result page.
- `importCertificateZip` extracts `.pem`, `.crt`, and `.cer` files with `fflate`, normalizes PEM/DER, records archive-level failures, and records per-item failures.
- Current nested use of `importCertificate` creates single-import runs inside the ZIP path. That is acceptable to preserve for now unless execution naturally isolates preview/commit helpers, but Phase 17 should surface one ZIP result to the operator.

### UI Foundation

- Phase 16 added `src/components/ui/primitives.tsx` with `PageShell`, `PageHeader`, `Panel`, `Field`, `TextInput`, `TextAreaInput`, `SelectInput`, `CheckboxField`, `ActionButton`, `Notice`, `EmptyState`, and `StatusPill`.
- Settings redirects were corrected to use relative `Location` headers. Phase 17 should keep that public-origin-safe redirect model.
- All new UI copy must be in `src/i18n/index.ts` for `en`, `pt-BR`, and `es`.

## Implementation Findings

### First-Run Bootstrap Should Be a Narrow Public Exception

The public first-run endpoint/page should be available only while no platform admin exists. It must not become a generic user-management bypass.

Recommended shape:

- Add an auth helper such as `hasPlatformAdmin()` in `src/auth/models.ts` or direct runtime-store helper usage.
- Add `src/app/setup/page.tsx` as the first-run UI.
- Add `src/app/api/setup/platform-admin/route.ts` as the POST handler.
- If a platform admin already exists, `/setup` redirects to `/auth` or `/reporting` when authenticated.
- The POST handler re-checks that no platform admin exists immediately before creation, creates the user with `platformRole: "platform-admin"`, stores `passwordHash`, records an audit event such as `platform-admin.bootstrap.created`, creates a session, and redirects to `/settings?firstRun=complete` or `/reporting?setup=complete` with a relative `Location` header.

Race handling should be pragmatic for this product stage: re-check immediately before create and fail with `bootstrap-already-complete` if the admin appeared. Full database transaction/unique singleton lock can be deferred unless the runtime store already has a convenient transactional primitive.

### Certificate Preview Should Reuse the Existing Parser, Not Duplicate It in the Page

The preview flow needs the same normalization and CRL derivation as commit. The safest approach is to extract or add a pure helper in `src/inventory/certificate-admin.ts`, for example:

- `previewCertificateImport(input)` returns fingerprint, derived CRL URLs, ignored/tracked split, group IDs, effective defaults, warnings, and whether at least one CRL was found.
- It should not mutate certificate tables, runtime targets, shares, import runs, or audit events.
- The existing commit route continues to call `importCertificate` after parsing the same form shape.

The UI can support a pragmatic two-step server flow without adding client JS:

1. Preview submission posts to `/api/admin/certificates/import/preview`.
2. The preview result is stored in a short-lived signed token or simpler hidden fields; for Phase 17, hidden fields containing the parsed form values plus a clear preview page are acceptable if the POST commit re-runs server-side parsing and authorization.
3. Commit posts to `/api/admin/certificates/import` and redirects with relative `Location` to the certificate detail page or result page.

Because `File` values cannot be preserved in hidden fields, the lower-risk server-component approach is to make the import page render the form and use a preview API returning JSON for progressive enhancement, while the commit path remains the full multipart POST. If no client component exists yet, a committed plan may introduce a small client component specifically for previewing the selected file.

### ZIP Onboarding Needs a Result Surface

The ZIP flow should no longer leave the user with raw JSON. It needs:

- upload validation before commit where feasible: file required, `.zip` extension/content type hints, group selection, group authorization, and expected accepted extensions (`.pem`, `.crt`, `.cer`).
- commit result summary with counts: imported, updated, ignored, invalid, archive readable/failed, run ID.
- partial failure details listing filename, result, message.
- next actions: view certificate administration, retry upload, inspect failed entries.

A pragmatic implementation can POST to the existing API and redirect to a new result page using `runId`, or return an HTML result route from the server action path. Since import runs/items are already persisted, adding `src/app/admin/certificates/import-runs/[runId]/page.tsx` is the cleanest operator-facing result target.

## Security Threat Model

### Assets

- first platform-admin account and credentials
- auth session cookie
- certificate PEM/DER material uploaded by operators
- group membership/authorization boundaries
- import run audit trail

### Threats and Mitigations

- **Unauthorized bootstrap after setup**
  - Mitigation: every setup page/API path checks that no platform admin exists; POST re-checks immediately before creation; after bootstrap the route refuses with `bootstrap-already-complete`.
- **Weak credential creation**
  - Mitigation: require email, display name, password, confirmation, and a minimum password length; hash using existing `hashPassword`.
- **Session fixation or leaked internal origin**
  - Mitigation: create a fresh session after bootstrap and use relative redirect `Location` headers.
- **Unauthorized certificate import into groups**
  - Mitigation: preserve `canManageGroup` checks in `importCertificate` and `importCertificateZip`; preview helpers must run the same group authorization checks before displaying effective group-specific values.
- **File upload denial or unsafe content handling**
  - Mitigation: keep in-process ZIP parsing, accepted certificate extensions only, PEM/DER normalization, and no shelling out; report invalid entries as per-item failures.
- **Preview/commit mismatch**
  - Mitigation: commit path must re-parse and re-authorize the uploaded payload. Preview is advisory, not trusted as an authorization or integrity decision.

## Validation Architecture

Phase 17 should add or extend a validator, preferably `scripts/validate-first-run-onboarding.js`, and wire it into `scripts/validate-all.js`.

Required validator checks:

- setup page and setup API exist.
- setup API references `hashPassword`, `ensureUser` or `createUserRecord`, `platform-admin`, `createSession`, and uses a relative `Location` header.
- setup API/page includes or references a no-existing-platform-admin guard.
- certificate admin new/batch pages import and use shared UI primitives from `src/components/ui/primitives.tsx`.
- single import has a preview route or client preview integration and still commits through `importCertificate`.
- ZIP import redirects or links to an import-run result surface instead of exposing only raw JSON.
- import-run result page reads persisted import run/items and shows per-item results.
- new UI copy exists in all three locales.

Core project verification remains:

```bash
node scripts/validate-first-run-onboarding.js
node scripts/validate-onboarding-admin.js import
node scripts/validate-onboarding-admin.js ui
node scripts/validate-auth-foundation.js auth
node scripts/validate-auth-foundation.js permissions
node scripts/validate-i18n.js foundation
node scripts/validate-i18n.js ui
node scripts/validate-all.js
npm run typecheck
npm run build
```

## Planning Recommendations

1. Implement first-run bootstrap first, because it closes the highest operational gap and is independent of certificate import UX.
2. Extract pure preview helpers in `certificate-admin.ts` before touching pages, so preview and commit share parsing/derivation logic.
3. Refactor single and ZIP pages onto Phase 16 primitives while adding real guidance and result states.
4. Add import-run result routing for ZIP, and optionally reuse it for single imports where useful.
5. Add a dedicated validation script before or alongside implementation so Phase 17 cannot regress into raw forms/JSON.

## Out of Scope for Phase 17

- trust-list source onboarding (Phase 20)
- ETSI LOTL/TSL parsing (Phase 18)
- executive dashboards (Phase 21)
- Entra/OIDC provider proof
- full client-side upload progress with streaming progress events unless it is trivial; result summary is required, live byte progress is not
