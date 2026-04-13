# v1.1 Research: Stack

## Scope

This research only covers capabilities that are new for milestone `v1.1`:
- certificate-first onboarding and batch import
- invitation-based authentication and group-scoped authorization
- social login and enterprise SSO/OIDC
- UI internationalization
- Docker packaging with HTTPS termination through Caddy

## Recommendations

### Authentication and authorization
- Use **Auth.js** with the Next.js App Router integration as the authentication layer.
- Start with:
  - Credentials login for local email/password
  - Google provider
  - Microsoft Entra ID provider
  - Generic OIDC provider
- Persist users, sessions, accounts, invites, groups, memberships, and role bindings in Postgres.
- Keep **platform role** separate from **group role**:
  - global: `platform-admin`
  - group-scoped: `viewer`, `operator`, `group-admin`
- Model target access through **group-target shares**, not target ownership by a single group.

Why:
- Auth.js already fits the current Next.js stack and supports credentials + OAuth/OIDC providers.
- The project needs mixed auth modes now, not just one IdP.
- Group membership and invitation logic are application-specific, so they should live in the app database rather than being delegated entirely to the IdP.

### Data model additions
Add these core entities:
- `users`
- `accounts` / `sessions` / `verification_tokens` (or equivalent auth tables)
- `groups`
- `group_memberships`
- `group_invites`
- `target_group_shares`
- `group_defaults`
- `user_preferences` (at minimum locale)
- `certificate_import_jobs`
- `certificate_sources`
- `derived_crl_targets`
- `audit_log` / `change_history`

Why:
- The new milestone is not only auth; it also introduces multi-group sharing, per-group defaults, imports, and user-configurable language.

### Internationalization
- Use an App Router-friendly i18n layer such as **next-intl**.
- Keep translation messages in versioned locale files.
- Support these initial locales:
  - `en`
  - `pt-BR`
  - `es`
- Store the preferred locale per user and apply it after login; before login, fall back to a sane browser/default locale.

Why:
- The app already uses the App Router. The i18n layer needs to work in server components and route handlers, not only in client UI.
- Per-user language preference is a product requirement, so locale cannot live only in URL state.

### Certificate ingestion
- Keep the user-facing source of truth as **certificate uploads**, not CRL URLs.
- Support:
  - single certificate upload
  - `.zip` batch upload
- Parse uploaded certificates server-side, extract CRL distribution points, deduplicate them, and create/update derived targets.
- Preserve the raw import artifact metadata for auditability.

Why:
- Manual CRL URL entry is explicitly out for this milestone.
- The system should derive monitorable CRL endpoints from the certificate material to reduce operator error.

### Packaging and HTTPS
- Package the stack with:
  - `web`
  - `worker`
  - `postgres`
  - `caddy`
- Terminate TLS in **Caddy**.
- Use Caddy's automatic certificate management to satisfy OAuth/OIDC callback URL requirements.
- Treat callback base URL / public origin as first-class config.

Why:
- OAuth providers require stable redirect URIs and production-like HTTPS.
- The polling/worker path should not be coupled to the web process.

## Non-goals for v1.1
- No OCSP monitoring yet
- No CPS/CP/DPC URL monitoring yet
- No horizontal worker elasticity yet
- No multi-region probe execution yet
- No TSL ETSI TS 119 612 ingestion yet
- No advanced executive SLO/burn-rate expansion from `DIF-03`

## Source Notes
- Auth.js official docs: provider-based auth for Next.js and RBAC patterns
- next-intl official learning/docs: App Router i18n patterns
- Caddy official docs: automatic HTTPS and Docker-friendly reverse proxy setup
- Google and Microsoft identity docs: redirect URI / OAuth code-flow constraints
