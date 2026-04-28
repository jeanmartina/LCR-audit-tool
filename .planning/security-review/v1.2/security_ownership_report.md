# Security Ownership Report: v1.2

**Date:** 2026-04-27  
**Tool:** `security-ownership-map`  
**Output directory:** `.planning/security-review/v1.2/ownership-map`

## Executive Summary

The repository has one dominant owner in git history for all security-sensitive code. This is expected for a solo project. A `CODEOWNERS` file has been added for the current owner; broaden it to a team or second reviewer once additional maintainers exist.

## Generated Artifacts

- `.planning/security-review/v1.2/ownership-map/people.csv`
- `.planning/security-review/v1.2/ownership-map/files.csv`
- `.planning/security-review/v1.2/ownership-map/edges.csv`
- `.planning/security-review/v1.2/ownership-map/cochange_edges.csv`
- `.planning/security-review/v1.2/ownership-map/summary.json`
- `.planning/security-review/v1.2/ownership-map/commits.jsonl`
- `.planning/security-review/v1.2/ownership-map/communities.json`
- `.planning/security-review/v1.2/ownership-map/cochange.graph.json`

## Key Findings

### OWN-01: Auth-sensitive code has bus factor 1

- **Severity:** Low operational risk today; medium once external users/maintainers depend on the system.
- **Evidence:** `security-ownership-map` reports `bus_factor: 1` for auth-sensitive files including:
  - `src/auth/session.ts`
  - `src/auth/authorization.ts`
  - `src/auth/provider-flow.ts`
  - `src/app/api/auth/login/route.ts`
  - `src/app/api/auth/callback/[provider]/route.ts`
  - `src/app/auth/page.tsx`
- **Top owner:** `jean.martina@gmail.com`
- **Status:** Mitigated in working tree with `CODEOWNERS` entries for `@jeanmartina`. Expand to a second reviewer/team when available.

### OWN-02: Sensitive areas need explicit ownership domains

- **Auth/session:** `src/auth/**`, `src/app/api/auth/**`
- **Authorization/export:** `src/auth/authorization.ts`, `src/reporting/**`, `src/app/reporting/**`
- **Trust-list SSRF/integrity boundary:** `src/trust-lists/**`
- **Certificate upload/parsing boundary:** `src/inventory/certificate-admin.ts`, `src/app/api/admin/certificates/**`
- **Deployment/TLS boundary:** `Dockerfile`, `compose.yaml`, `Caddyfile`, `.env.example`

## Implemented CODEOWNERS Draft

```text
# Security-sensitive surfaces
/src/auth/ @jeanmartina
/src/app/api/auth/ @jeanmartina
/src/app/api/admin/ @jeanmartina
/src/trust-lists/ @jeanmartina
/src/inventory/certificate-admin.ts @jeanmartina
/Dockerfile @jeanmartina
/compose.yaml @jeanmartina
/Caddyfile @jeanmartina
/.env.example @jeanmartina
```

Expand `@jeanmartina` to a team or second reviewer once the project has more than one security reviewer.
