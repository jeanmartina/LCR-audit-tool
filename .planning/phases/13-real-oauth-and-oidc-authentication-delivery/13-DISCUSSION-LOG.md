# Phase 13 Discussion Log

**Date:** 2026-04-07
**Phase:** 13 - Real OAuth and OIDC Authentication Delivery

## Topics Discussed

### 1. Provider flow model
- Invite remains the gate.
- Provider auth starts from invite acceptance.
- Real authorization redirect/callback is required.
- Invite is consumed only after successful provider verification and invited-email match.

### 2. Account linking and identity rules
- Provider email mismatch fails hard.
- Provider account linked to another user fails hard.
- Additional provider linking is allowed only from an authenticated session.
- Existing user with unrelated memberships does not auto-attach to the new invite; this needs separate account/invite resolution.

### 3. Callback verification scope
- Localhost/local TLS is not enough to close `AUTH-05`.
- Phase 13 must validate real public HTTPS callback behavior.
- Proof bar: Google end to end, Entra ID end to end, and one generic OIDC provider end to end.

### 4. Operator/admin configuration surface
- Provider secrets stay in env vars only.
- UI may show whether config exists and what callback URL is expected, but must not reveal or edit secrets.
- Provider verification status is tracked manually by platform-admins.

## Outcome

Context is ready for planning.
