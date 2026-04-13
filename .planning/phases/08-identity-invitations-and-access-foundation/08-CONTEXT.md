# Phase 8: Identity, Invitations, and Access Foundation - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 8 delivers the authentication and authorization foundation for milestone `v1.1`: invitation-only access, multi-provider login, group-scoped roles, and backend-enforced permissions for authenticated product access.

</domain>

<decisions>
## Implementation Decisions

### Invitation flow
- **D-01:** Invitations expire after a short period and can be resent or regenerated.
- **D-02:** Invitations do not need to be delivered by system email; the product may generate an invite code/token that the inviter shares through another channel.
- **D-03:** Group membership is created from invite acceptance, not from login alone.
- **D-04:** For social login and SSO/OIDC acceptance, the authenticated email must match the email defined on the invitation.

### Identity model
- **D-05:** The product uses one internal user account per person.
- **D-06:** A single account may link multiple auth methods: local credentials, Google, Microsoft Entra ID, and generic OIDC.
- **D-07:** Linking an additional auth method is only allowed during valid invite acceptance or by an already authenticated user.

### Roles and permission boundaries
- **D-08:** Group roles are:
  - `viewer` — dashboard, detail, audit, and exports
  - `operator` — viewer + target and alert operations/configuration
  - `group-admin` — operator + member invites/removals and group role assignment
  - `platform-admin` — create groups, invite initial group admins, configure global auth, access any group
- **D-09:** `platform-admin` may act as `group-admin` without requiring a second account.
- **D-10:** Permission checks must be enforced in backend/read-model/export paths, not only in the UI.

### Session and security policy
- **D-11:** Session inactivity timeout is 8 hours.
- **D-12:** MFA should be available in this phase but is optional per user and not mandatory by default.
- **D-13:** Password recovery is required.
- **D-14:** The product must support logout from the current session and logout from all devices/sessions.
- **D-15:** Invalid or expired invitations must block account creation/acceptance.
- **D-16:** Rate limiting or equivalent simple abuse protection is required for login and invite acceptance.
- **D-17:** Audit logging is required for sensitive auth/access events:
  - invite created / resent / revoked
  - successful login
  - failed invite acceptance
  - role change
  - auth-provider link

### the agent's Discretion
- Exact token format for invitation codes
- MFA mechanism choice and UX details
- Exact rate-limiting implementation strategy
- Session-renewal mechanics, provided the 8-hour inactivity rule is respected

</decisions>

<specifics>
## Specific Ideas

- Invite delivery may happen outside the product; the system should not assume email delivery is the only path.
- Social/SSO acceptance must stay bound to the pre-defined invited email to avoid unauthorized joins.
- Backend permission enforcement is mandatory across read-models and export routes.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone scope
- `.planning/PROJECT.md` — Current milestone framing, certificate-first product direction, and global constraints
- `.planning/REQUIREMENTS.md` — Phase 8 requirement IDs and milestone-wide requirement boundaries
- `.planning/ROADMAP.md` — Phase 8 goal, dependencies, and success criteria
- `.planning/research/SUMMARY.md` — Recommended auth/group/i18n/deployment direction for v1.1

### Authentication and authorization context
- `.planning/research/STACK.md` — Auth.js, provider mix, group-role model, and app-owned authorization notes
- `.planning/research/ARCHITECTURE.md` — Suggested build order, identity/group data model, and authorization boundaries
- `.planning/research/PITFALLS.md` — Failure modes for auth/authz separation, shared targets, and callback/HTTPS constraints

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/reporting/page.tsx` — Existing authenticated-looking product surface that will need real auth gating in later work
- `src/app/reporting/export/*` — Existing export routes that will need permission enforcement
- `src/reporting/read-models.ts` — Existing reporting selectors that must become authorization-aware
- `src/storage/runtime-store.ts` — Existing Postgres-backed persistence foundation that can host auth/group data

### Established Patterns
- Runtime data already lives in Postgres-backed code paths, so auth/group state should follow the same persistence approach.
- The current product already separates web and worker concerns conceptually, which supports introducing identity without collapsing runtime boundaries.

### Integration Points
- Auth/session state must integrate with App Router pages and route handlers.
- Group scope must later integrate with reporting selectors, exports, and target admin flows.
- Invite and membership state must be available before certificate onboarding in Phase 9.

</code_context>

<deferred>
## Deferred Ideas

- Certificate onboarding and target admin UX belong to Phase 9, not this phase.
- Predictive alerts and multi-PKI tagging belong to Phase 10.
- Internationalization product work belongs to Phase 11.
- Docker/Caddy/HTTPS packaging belongs to Phase 12, though auth must be designed with callback/public-origin needs in mind.

</deferred>

---

*Phase: 08-identity-invitations-and-access-foundation*
*Context gathered: 2026-04-07*
