# Security Best Practices Review: v1.2

**Date:** 2026-04-27  
**Scope:** Next.js/TypeScript app, Docker/Caddy packaging, auth/session routes, certificate ZIP import, trust-list ingestion.  
**Skills used:** `security-best-practices`, `security-ownership-map`.

## Executive Summary

No critical unauthenticated data-exposure issue was confirmed in this pass. The reported hardening gaps have been addressed in the working tree: same-origin mutation guards, secure session cookie serialization, trust-list SSRF controls, upload/decompression limits, Caddy security headers, database-backed auth rate limits, and CODEOWNERS coverage for sensitive paths.

## High Severity

### SBR-01: Cookie-authenticated mutation routes lack explicit CSRF/origin protection

**Status:** Fixed in working tree via `src/auth/request-security.ts` and guards on state-changing API routes.

- **Rule ID:** `NEXT-CSRF-001`
- **Severity:** High
- **Location:** `src/app/api/admin/certificates/[certificateId]/update/route.ts:19`, `src/app/api/admin/trust-lists/route.ts:48`, `src/app/api/settings/groups/[groupId]/route.ts:15`
- **Evidence:** State-changing route handlers call `assertAuthenticated()`/`assertPermission()` and then process `request.formData()` or `request.json()` without a CSRF token or strict `Origin`/`Referer` validation.
- **Impact:** If browser cookie protections are bypassed, weakened, or a same-site context is abused, an attacker could trigger privileged state changes for an authenticated operator/admin.
- **Fix:** Add a shared `assertSameOriginRequest(request)` helper for cookie-authenticated mutation routes; for browser forms validate `Origin`/`Referer` against `AUTH_PUBLIC_ORIGIN`; for JSON endpoints require a custom header plus origin validation.
- **Mitigation:** Keep `SameSite=Lax`, restrict Caddy host exposure, and prioritize routes that mutate certificates, trust-list sources, group settings, and auth/provider settings.
- **False positive notes:** `SameSite=Lax` reduces risk in modern browsers, but the installed Next.js security guidance still requires explicit protection for Route Handlers that mutate state with cookie auth.

## Medium Severity

### SBR-02: Session cookies are not marked `Secure` in HTTPS production

**Status:** Fixed in working tree via centralized cookie serialization in `src/auth/session.ts`.

- **Rule ID:** `NEXT-SESS-001`
- **Severity:** Medium
- **Location:** `src/app/api/auth/login/route.ts:25`, `src/app/api/auth/callback/[provider]/route.ts:89`, `src/app/api/setup/platform-admin/route.ts:43`
- **Evidence:** Session cookies are set as `Path=/; HttpOnly; SameSite=Lax` but do not include `Secure`.
- **Impact:** In public HTTPS deployments, missing `Secure` allows the browser to send the session cookie over HTTP if an HTTP request path exists before redirect or through a misconfigured edge path.
- **Fix:** Centralize session-cookie serialization and include `Secure` when `AUTH_PUBLIC_ORIGIN` is HTTPS or `SESSION_COOKIE_SECURE=true`; keep it disableable for local HTTP dev.
- **Mitigation:** Caddy currently terminates HTTPS and redirects HTTP automatically, but cookie security should not rely only on edge behavior.

### SBR-03: Server-side trust-list fetch permits authenticated SSRF to internal HTTPS targets

**Status:** Fixed in working tree by validating DNS/IP targets and redirects in `src/trust-lists/sync.ts`.

- **Rule ID:** SSRF / `NEXT-INPUT-001`
- **Severity:** Medium
- **Location:** `src/trust-lists/admin.ts:80`, `src/trust-lists/sync.ts:35`, `src/trust-lists/sync.ts:48`
- **Evidence:** URL validation requires HTTPS except localhost, then server-side `fetch(url)` retrieves operator-provided URLs. It does not block private IP ranges, link-local metadata addresses, internal DNS names, or redirects to internal addresses.
- **Impact:** A trust-list operator could make the server probe internal network resources or metadata endpoints from inside the Docker network.
- **Fix:** Resolve hostnames and reject private, loopback, link-local, multicast, and metadata IP ranges except explicit dev allowlist; disable or validate redirects; optionally allowlist known TSL/LOTL domains.
- **Mitigation:** The route is authenticated and scoped to trust-list operators, which lowers likelihood but does not remove SSRF impact.

### SBR-04: Certificate/ZIP uploads have no hard byte or entry-count limit

**Status:** Fixed in working tree with configurable single-file, archive, uncompressed-size, and entry-count limits.

- **Rule ID:** File handling / resource exhaustion
- **Severity:** Medium
- **Location:** `src/app/api/admin/certificates/import-zip/route.ts:30`, `src/inventory/certificate-admin.ts:357`, `docs/operators.md:56`
- **Evidence:** The route reads the entire uploaded archive into memory via `Buffer.from(await file.arrayBuffer())`; `unzipSync` expands the archive in process; docs explicitly state archive size is not hard-limited.
- **Impact:** An authenticated operator can exhaust memory or CPU with a large archive, zip bomb, or many certificate entries.
- **Fix:** Add `CERT_IMPORT_MAX_ARCHIVE_BYTES`, `CERT_IMPORT_MAX_UNCOMPRESSED_BYTES`, and `CERT_IMPORT_MAX_FILES`; reject before buffering where possible and after archive metadata inspection before processing entries.
- **Mitigation:** Access is authenticated, but this is still a practical availability risk for the packaged stack.

### SBR-05: Production security headers are not set in app or Caddy

**Status:** Fixed in working tree with a baseline Caddy header block.

- **Rule ID:** `NEXT-HEADERS-001`, `NEXT-CSP-001`
- **Severity:** Medium
- **Location:** `Caddyfile:1`, `Caddyfile:3`
- **Evidence:** Caddy only configures compression and reverse proxy. No `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, or `Permissions-Policy` are visible in app/edge configuration.
- **Impact:** XSS, clickjacking, MIME sniffing, and referrer leakage defenses rely on browser defaults instead of explicit policy.
- **Fix:** Add a conservative header block in Caddy or Next.js. Start with `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy`, `X-Frame-Options: DENY`, and a staged CSP.
- **Mitigation:** No direct XSS sink was found in the grep scan, but headers are still expected production hardening.

## Low Severity

### SBR-06: Login rate limiting is in-memory and single-process only

**Status:** Fixed for the packaged stack by persisting rate-limit attempts in Postgres when `DATABASE_URL` is configured; process-memory fallback remains for non-DB local runs.

- **Rule ID:** Auth brute-force resilience
- **Severity:** Low
- **Location:** `src/auth/rate-limit.ts:1`, `src/app/api/auth/login/route.ts:14`
- **Evidence:** Rate counters are held in a process-local `Map`; login rate limit is keyed only by email.
- **Impact:** Limits reset on restart and do not coordinate across multiple web replicas; attackers can distribute attempts across target emails.
- **Fix:** Move rate limits to Postgres or a shared cache and combine email plus IP/client key where operationally possible.
- **Mitigation:** Current compose topology has one `web` process, so this is not a blocker for local/staging.

### SBR-07: Sensitive auth/security code has bus factor 1

**Status:** Mitigated in working tree with `CODEOWNERS` entries for security-sensitive paths. Replace or expand the owner when more maintainers are available.

- **Rule ID:** Ownership risk
- **Severity:** Low
- **Location:** `.planning/security-review/v1.2/ownership-map/summary.json`
- **Evidence:** Ownership map reports auth-sensitive files such as `src/auth/session.ts`, `src/auth/authorization.ts`, and auth route handlers with `bus_factor: 1` and top owner `jean.martina@gmail.com`.
- **Impact:** Security-critical knowledge is concentrated in one maintainer, increasing review and continuity risk.
- **Fix:** Add CODEOWNERS/security review ownership expectations and require a second reviewer for auth, trust-list fetch, certificate upload, and deployment config changes.

## Positive Findings

- Auth and authorization checks are consistently present on protected reporting/admin/export surfaces.
- `.env` and `.env.local` are ignored; only `.env.example` is tracked.
- Public redirects previously causing `0.0.0.0` exposure were normalized in several routes.
- Trust-list sync already has timeout and max XML byte controls.
- No `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `localStorage`, `sessionStorage`, or `postMessage` sinks were found by the grep scan.

## Recommended Follow-up

1. Verify Caddy headers and cookie `Secure` behavior on the deployed HTTPS host after rebuild.
2. Decide whether to expand `CODEOWNERS` from `@jeanmartina` to a team or second reviewer when the project has more maintainers.
3. Add IP-aware throttling only when the deployment has a trusted proxy/IP-forwarding policy; avoid trusting spoofable headers before that.
