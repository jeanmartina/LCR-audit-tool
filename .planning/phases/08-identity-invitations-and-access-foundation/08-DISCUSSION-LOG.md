# Phase 8 Discussion Log

**Date:** 2026-04-07
**Phase:** 08 - Identity, Invitations, and Access Foundation

## Decisions captured

1. Invitation flow
   - short-lived invite with resend/regenerate
   - invite can be shared out-of-band instead of requiring system email delivery
   - invite acceptance is what binds the user to the group
   - social/SSO login email must match the invited email

2. Identity model
   - one internal account per user
   - local credentials + Google + Microsoft Entra ID + generic OIDC may all link to the same user
   - new provider linking only during valid invite acceptance or by an authenticated user

3. Roles
   - `viewer`, `operator`, `group-admin`, `platform-admin`
   - backend/read-model/export enforcement is mandatory
   - `platform-admin` can operate as `group-admin` without a second account

4. Session and security
   - 8-hour inactivity timeout
   - MFA available but optional
   - password recovery required
   - logout current session + all sessions required
   - invalid/expired invites block acceptance
   - rate limiting required for login and invite acceptance
   - audit log required for invite, login, role, and provider-link events

## Deferred to later phases

- certificate-first onboarding UX
- target sharing/admin UI
- predictive alerts and multi-PKI reporting
- i18n implementation
- Docker/Caddy production packaging
