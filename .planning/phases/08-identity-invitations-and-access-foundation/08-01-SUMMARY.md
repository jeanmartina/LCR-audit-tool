---
phase: 08-identity-invitations-and-access-foundation
plan: 01
subsystem: auth
tags: [identity, invitations, authorization, sessions]
requires:
  - phase: 07-production-readiness-cleanup
    provides: build and validation gate
provides:
  - durable auth, invite, group, membership, session, and audit persistence
  - invitation-only local auth plus provider callback foundation
  - backend-enforced reporting and export authorization boundaries
affects: [auth, reporting, exports, runtime]
key-files:
  created:
    - src/auth/config.ts
    - src/auth/providers.ts
    - src/auth/rate-limit.ts
    - src/auth/models.ts
    - src/auth/invitations.ts
    - src/auth/session.ts
    - src/auth/authorization.ts
    - src/app/auth/page.tsx
    - src/app/auth/accept-invite/page.tsx
    - src/app/api/auth/invite/accept/route.ts
    - src/app/api/auth/login/route.ts
    - src/app/api/auth/logout/route.ts
    - src/app/api/auth/logout-all/route.ts
    - src/app/api/auth/password-reset/request/route.ts
    - src/app/api/auth/password-reset/complete/route.ts
    - src/app/api/auth/callback/[provider]/route.ts
    - src/app/api/auth/groups/route.ts
    - src/app/api/auth/groups/[groupId]/invites/route.ts
    - scripts/validate-auth-foundation.js
  modified:
    - src/storage/runtime-store.ts
    - src/reporting/read-models.ts
    - src/app/reporting/page.tsx
    - src/app/reporting/[targetId]/page.tsx
    - src/app/reporting/export/dashboard.csv/route.ts
    - src/app/reporting/export/executive.pdf/route.ts
    - src/app/reporting/[targetId]/export/alerts.csv/route.ts
    - src/app/reporting/[targetId]/export/coverage-gaps.csv/route.ts
    - src/app/reporting/[targetId]/export/polls.csv/route.ts
    - src/app/reporting/[targetId]/export/snapshots.csv/route.ts
    - src/app/reporting/[targetId]/export/operational.pdf/route.ts
    - scripts/validate-all.js
    - .planning/PROJECT.md
    - .planning/ROADMAP.md
    - .planning/REQUIREMENTS.md
    - .planning/STATE.md
completed: 2026-04-07
---

# Phase 8: Identity, Invitations, and Access Foundation Summary

## Outcome

- Added durable Postgres-backed auth and access storage for users, linked auth accounts, sessions, groups, memberships, invites, password resets, MFA methods, audit events, and target-to-group sharing in `src/storage/runtime-store.ts`.
- Added an auth foundation layer in `src/auth/` covering provider/runtime config, invite lifecycle, password/session handling, group management helpers, authorization checks, and rate limiting.
- Added minimal auth surfaces for invite acceptance, credentials login, password reset, logout, provider callback handling, group creation, and group-member invite issuance under `src/app/auth/` and `src/app/api/auth/`.
- Enforced authentication and authorization inside reporting pages, read-model filtering, and export routes so group boundaries are checked on backend-facing paths, not only in UI visibility.
- Added `scripts/validate-auth-foundation.js` and wired it into `scripts/validate-all.js`.

## Validation Run

- `node scripts/validate-auth-foundation.js schema`
- `node scripts/validate-auth-foundation.js auth`
- `node scripts/validate-auth-foundation.js permissions`
- `node scripts/validate-all.js`
- `npm run typecheck`
- `npm run build`

## Residual Notes

- Google, Microsoft Entra ID, and generic OIDC now have callback contracts and account-linking foundations, but live provider exercise still depends on real provider credentials and HTTPS/public-origin configuration from Phase 12.
- MFA is represented as optional persistence/infrastructure in this phase; mandatory MFA flows are not enforced.
