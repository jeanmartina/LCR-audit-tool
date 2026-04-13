# Phase 13: Real OAuth and OIDC Authentication Delivery - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the current provider-auth scaffolding with real Google, Microsoft Entra ID, and generic OIDC flows that start from invitation acceptance, complete over the packaged HTTPS deployment path, and satisfy the milestone audit gaps for `AUTH-02`, `AUTH-03`, `AUTH-04`, and `AUTH-05`.

</domain>

<decisions>
## Implementation Decisions

### Provider flow model
- **D-01:** Invitation remains the entry gate for provider authentication; users do not start with a standalone Google/Entra/OIDC login flow.
- **D-02:** Provider authentication starts from the invite acceptance surface, where the invited user chooses local password, Google, Entra ID, or generic OIDC.
- **D-03:** The app must perform a real authorization redirect and callback flow for Google, Entra ID, and generic OIDC.
- **D-04:** An invite is consumed only after provider identity verification succeeds and the provider email matches the invited email.

### Identity and account-linking rules
- **D-05:** The provider email must match the invited email exactly; mismatches fail hard.
- **D-06:** If the provider account is already linked to a different internal user, the flow fails hard.
- **D-07:** Additional provider linking after account creation is allowed only from an already authenticated session.
- **D-08:** If the invited email already belongs to an existing user with memberships elsewhere, that does not automatically attach the user to the new group; it requires separate account/invite resolution.

### Callback proof bar
- **D-09:** `AUTH-05` is not satisfied by localhost or local TLS testing alone.
- **D-10:** Phase 13 must prove the real callback path against a valid public HTTPS host.
- **D-11:** The proof bar for this phase is real end-to-end validation for Google, Microsoft Entra ID, and one generic OIDC provider.

### Provider administration surface
- **D-12:** Provider credentials remain environment-variable-only; the UI may show whether values are present, but must never display or edit secrets.
- **D-13:** Platform-admins need a provider settings/status surface that shows per-provider configuration presence, resolved callback URL, and enabled/disabled status.
- **D-14:** Provider verification state is tracked manually by platform-admins rather than inferred automatically from successful auth flows.

### the agent's Discretion
- Exact route structure for redirect initiation and callback handling.
- Session/internal state transport between invite acceptance and provider redirect.
- How provider-status UI is presented as long as it remains platform-admin only and secret-safe.

</decisions>

<specifics>
## Specific Ideas

- The existing invite-only model must remain intact; provider auth is an alternative acceptance method, not a separate product entry path.
- Provider proof for this phase must be strong enough to close the milestone audit, which means real external-provider exercise over public HTTPS.
- The UI should expose enough provider configuration/status information for operators to understand whether setup is complete, without turning the product into a secret-management surface.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and audit
- `.planning/ROADMAP.md` — Defines Phase 13 goal, dependency on Phase 12, and success criteria.
- `.planning/REQUIREMENTS.md` — Defines `AUTH-02`, `AUTH-03`, `AUTH-04`, and `AUTH-05` as pending gap-closure requirements.
- `.planning/v1.1-MILESTONE-AUDIT.md` — Source of the concrete audit gaps this phase must close.
- `.planning/PROJECT.md` — Current milestone context, constraints, and HTTPS/auth expectations.
- `.planning/STATE.md` — Current project state and blocker summary.

### Existing auth foundation
- `src/app/api/auth/callback/[provider]/route.ts` — Current placeholder callback path that must be replaced with real provider handling.
- `src/app/api/auth/invite/accept/route.ts` — Existing invite-acceptance path that defines the current entry flow.
- `src/app/auth/accept-invite/page.tsx` — Existing invite acceptance surface where provider choice begins.
- `src/auth/config.ts` — Auth providers, invite/session TTLs, and public-origin resolution.
- `src/auth/providers.ts` — Provider runtime config and callback URL derivation.
- `src/auth/invitations.ts` — Invite validation and acceptance rules.
- `src/auth/models.ts` — User/provider-link persistence rules.
- `src/auth/session.ts` — Session creation and lifecycle behavior.
- `src/auth/authorization.ts` — Platform-admin/group authorization primitives relevant to the provider settings surface.

### Packaging and HTTPS path
- `compose.yaml` — Packaged runtime topology and env injection model.
- `Caddyfile` — HTTPS ingress path used by the packaged deployment.
- `README.md` — Documented public-origin and callback expectations for the packaged stack.
- `docs/operators.md` — Operator-facing HTTPS and provider configuration guidance.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/auth/invitations.ts` already centralizes invite validation, failure recording, and acceptance bookkeeping.
- `src/auth/models.ts` and `src/storage/runtime-store.ts` already provide persistence primitives for users, provider links, invites, sessions, and audit events.
- `src/app/settings/page.tsx` and related settings routes provide a pattern for a platform-admin configuration/status surface.

### Established Patterns
- Provider config is already env-driven via `src/auth/config.ts` and `src/auth/providers.ts`.
- Backend permission enforcement is expected at route/read-model level rather than only in UI visibility.
- User-facing product text is localized through the existing i18n layer, while code and active docs remain English-first.

### Integration Points
- Invite acceptance UI and routes are the correct entry point for provider login.
- The packaged deployment path (`compose.yaml` + `Caddyfile`) is the runtime path that must support real callback testing.
- Audit events should continue to be recorded through the runtime store when provider auth succeeds or fails.

</code_context>

<deferred>
## Deferred Ideas

- Automatic provider verification-state inference from successful logins.
- In-app secret editing or secret rotation workflows.
- Multi-provider linking UX beyond the authenticated account-management path.

</deferred>

---

*Phase: 13-real-oauth-and-oidc-authentication-delivery*
*Context gathered: 2026-04-07*
