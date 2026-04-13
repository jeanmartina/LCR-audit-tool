# Phase 13 Research: Real OAuth and OIDC Authentication Delivery

**Date:** 2026-04-07  
**Phase:** 13 - Real OAuth and OIDC Authentication Delivery

## Question

What has to change in the current invite-gated auth foundation so Google, Microsoft Entra ID, and generic OIDC become real end-to-end provider flows over the packaged HTTPS deployment path?

## Current codebase findings

- The current provider callback route is only a form-post acceptance path. It accepts `inviteCode`, `email`, and `providerAccountId` directly and never performs redirect initiation, code exchange, token verification, or issuer validation. See `src/app/api/auth/callback/[provider]/route.ts`.
- Provider configuration is already env-driven through `src/auth/config.ts` and `src/auth/providers.ts`.
- Invite acceptance and local-account creation are centralized in `src/auth/invitations.ts`.
- The packaged HTTPS/public-origin path already exists through `compose.yaml`, `Caddyfile`, `README.md`, and `docs/operators.md`.

## Primary-source research

### Google

Source: Google OpenID Connect server flow docs  
Link: https://developers.google.com/identity/openid-connect/openid-connect?hl=en-US

Relevant points:
- The server flow requires a real anti-forgery `state` token round trip.
- The request should include `response_type=code`.
- The flow requires exchanging the returned `code` for tokens on the server.
- The ID token contains claims such as `iss`, `aud`, `sub`, `email`, and `nonce`, which the app must validate.

Source: Google OAuth 2.0 for Web Server Applications  
Link: https://developers.google.com/identity/protocols/oauth2/web-server

Relevant points:
- `redirect_uri` must exactly match one of the authorized redirect URIs.
- HTTPS is required for normal web redirect URIs, with localhost as a limited exception.
- The server-side application is expected to maintain state and securely store confidential credentials.

### Microsoft Entra ID

Source: Microsoft identity platform authorization code flow  
Link: https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow

Relevant points:
- The correct baseline is the OAuth 2.0 authorization code flow with OpenID Connect.
- `redirect_uri` must exactly match a registered redirect URI.
- `openid` is required for sign-in, with `profile` and `email` recommended when user identity data is needed.
- `response_mode=form_post` is recommended for server-side web apps.
- The server redeems the authorization code at the token endpoint with the same `redirect_uri`.

Source: Microsoft redirect URI restrictions  
Link: https://learn.microsoft.com/en-us/entra/identity-platform/reply-url

Relevant points:
- Redirect URIs are a strict security boundary and should be treated as exact registered values.
- Production web apps are expected to use public HTTPS endpoints.

### Generic OIDC

Source: OpenID Connect Core 1.0  
Link: https://openid.net/specs/openid-connect-core-1_0-18.html

Relevant points:
- The authorization request needs `scope=openid`.
- The relying party must use and validate `state`.
- The relying party should use `nonce` to mitigate replay and validate it against the ID token.
- Token validation must include at least issuer/audience correctness and identity binding via the ID token claims.

## Planning implications

1. **The current callback route cannot be incrementally “tweaked”.**  
   It needs to be split into:
   - provider-auth start/redirect initiation
   - provider callback/code exchange
   - post-verification invite consumption and account linking

2. **Invite state must survive the redirect safely.**  
   The simplest shape in this codebase is an app-owned signed or random opaque state record that binds:
   - invite code
   - expected email
   - provider id
   - nonce
   - optional return locale

3. **Provider identity must be validated before invite acceptance.**  
   This is required by the locked phase decisions and aligns with the audit blocker.

4. **Manual provider-verification status is a separate concern from runtime auth.**  
   The app should expose config presence and callback URL/status in a platform-admin surface, but actual secrets stay in env vars.

5. **Phase 13 should include explicit verification artifacts, not just code.**  
   To close `AUTH-05`, the plan should require a documented public-host verification path and validation script coverage for:
   - redirect/start route exists
   - callback route performs code exchange and token validation
   - provider status surface exists and is platform-admin only

## Recommended implementation direction

- Use server-side authorization code flow for all three providers.
- Add a provider-start route that is entered from invite acceptance and constructs the provider authorization URL.
- Persist or encode temporary auth transaction state server-side rather than trusting round-tripped free-form form inputs.
- On callback:
  - validate `state`
  - redeem the code
  - validate token claims
  - enforce invited-email match
  - enforce provider-account uniqueness
  - then consume invite and create session
- Add platform-admin provider-status UI that reports:
  - enabled/disabled from env presence
  - resolved callback URL
  - manually tracked verification status

## Risks / traps

- Implementing only redirect initiation without real token validation would still fail the milestone audit.
- Using provider email as the only durable external identity is weak; provider account subject/ID also needs to be persisted for uniqueness.
- Mixing “invite acceptance” and “provider callback” responsibilities in one handler will make correctness and testing harder.
- Localhost-only tests are insufficient for `AUTH-05` because the milestone explicitly requires a real public HTTPS callback proof.

## Conclusion

Phase 13 should be planned as a focused auth-integration phase with three main outcomes:
- real provider redirect/callback/code-exchange handling
- strict invite-gated identity linking rules
- operator-visible provider status and proof path over the packaged HTTPS deployment
