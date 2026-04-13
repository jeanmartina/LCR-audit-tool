# Phase 8: Identity, Invitations, and Access Foundation - Research

**Researched:** 2026-04-07
**Status:** Ready for planning

## Scope

This research is limited to Phase 8 concerns:
- invitation-only access
- local credentials + Google + Microsoft Entra ID + generic OIDC
- group and platform roles
- backend-enforced authorization boundaries
- session/security policy needed before downstream phases

## Recommended Direction

### Authentication layer
- Use **Auth.js** in the Next.js App Router as the primary authentication layer.
- Support these sign-in methods in one user model:
  - local email/password
  - Google
  - Microsoft Entra ID
  - generic OIDC
- Keep **application authorization in Postgres**, not in the identity providers.

Why:
- The app is already Next.js-based, so Auth.js fits the existing surface.
- The milestone needs mixed auth modes, not a single IdP.
- Group roles, invites, and cross-group access are product rules that must live in app-owned data.

### Core data model
Recommended Phase 8 entities:
- `users`
- `auth_accounts`
- `auth_sessions`
- `password_resets`
- `mfa_methods`
- `groups`
- `group_memberships`
- `group_invites`
- `audit_events`

Recommended role split:
- global:
  - `platform-admin`
- group-scoped:
  - `viewer`
  - `operator`
  - `group-admin`

Recommended invite shape:
- invite bound to a specific email
- invite carries:
  - target group
  - initial role
  - expiry
  - status
  - inviter
- invite acceptance creates or links the internal user account and creates membership

### Session and security
- Enforce an **8-hour inactivity timeout** in session validation.
- Implement password recovery in the same phase because local credentials are part of scope.
- Keep MFA **available but optional** in Phase 8 so the auth model does not need redesign later.
- Add simple rate limiting for:
  - login
  - invite acceptance
  - password reset request

### Permission enforcement
- Authorization must not live only in UI conditionals.
- Add shared permission helpers that can be used by:
  - pages/layout guards
  - route handlers
  - reporting read-models
  - export routes
- This phase should introduce the permission primitives even if the full group-scoped reporting work lands in Phase 10.

### Provider linking
- One internal user can link multiple auth methods.
- Social/OIDC acceptance must verify that the provider email matches the invited email.
- Linking new providers later should require either:
  - valid invite acceptance
  - an already authenticated user session

## Pitfalls to avoid in this phase

1. **Letting OAuth create authorization implicitly**
   - Provider login authenticates identity, not membership or role.

2. **Deferring permission checks to UI-only conditions**
   - Export routes and read-models must be covered too.

3. **Treating invitation delivery as email-only**
   - Product explicitly allows out-of-band code sharing.

4. **Creating separate user identities per provider**
   - Phase 8 needs one internal account with multiple auth methods.

5. **Postponing auditability**
   - Invite creation, resend/revoke, provider link, role change, login success, and failed invite acceptance all need durable records now.

## Implications for Planning

The plan should be sequenced in this order:
1. persistence and auth domain model
2. invitation acceptance and provider wiring
3. permission enforcement and session/security controls

That order keeps downstream phases from building on ad hoc identity assumptions.

## References Used

- `.planning/phases/08-identity-invitations-and-access-foundation/08-CONTEXT.md`
- `.planning/research/STACK.md`
- `.planning/research/ARCHITECTURE.md`
- `.planning/research/PITFALLS.md`
- `.planning/research/SUMMARY.md`

---
*Phase: 08-identity-invitations-and-access-foundation*
*Research completed: 2026-04-07*

