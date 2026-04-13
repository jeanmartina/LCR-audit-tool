# v1.1 Research Summary

## Focus

Milestone `v1.1` should turn the shipped `v1.0` monitoring core into a usable product with:
- certificate-first onboarding
- invitation-only multi-user access
- group-scoped authorization with shared targets
- i18n
- deployable HTTPS packaging

## Recommended direction

- Keep **Auth.js + Postgres-backed app authorization** as the identity foundation.
- Use **groups + memberships + invites + role bindings** as first-class application entities.
- Model **targets as shareable across groups** through a join/share table.
- Keep onboarding **certificate-first**; derive CRLs from uploaded certificates and `.zip` bundles.
- Package the stack as **web + worker + postgres + caddy**.
- Treat **HTTPS/public callback configuration** as part of the product scope because OAuth/OIDC depends on it.
- Add **next-intl-style App Router i18n** with per-user locale preferences for `en`, `pt-BR`, and `es`.

## Suggested requirement buckets

- Authentication
- Groups & Authorization
- Certificate Onboarding & Target Administration
- Internationalization
- Deployment & Operations
- Documentation

## Suggested sequencing

1. identity/groups/roles/invites
2. certificate onboarding + target admin UX
3. Docker/Caddy/HTTPS packaging
4. i18n pass across the new and existing UI
5. GitHub README and operator docs

## Deferred beyond v1.1

- ETSI TS 119 612 trust-list ingestion and auto-refresh
- OCSP monitoring
- CPS/CP/DPC URL monitoring
- horizontal worker elasticity
- multi-region or multi-jurisdiction probe execution
- `DIF-03` executive burn-rate expansion
