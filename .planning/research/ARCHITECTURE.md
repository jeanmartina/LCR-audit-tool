# v1.1 Research: Architecture

## Existing Base

The shipped `v1.0` already has:
- Next.js App Router UI
- Postgres-backed runtime store
- worker/polling concepts in code
- reporting and export routes
- local quality and smoke commands

## Recommended v1.1 Build Order

### Phase A: identity and tenancy foundation
Build first:
- auth tables and login/session plumbing
- groups, memberships, invites, roles
- authorization helpers usable from pages, APIs, exports, and worker code

Reason:
- target admin, dashboard scoping, and import ownership all depend on the access model.

### Phase B: certificate-first administration
Build second:
- admin UI for certificate uploads and management
- certificate parsing/import jobs
- derived CRL target creation/update
- defaults + overrides model
- change history

Reason:
- this is the primary productization gap left by v1.0.

### Phase C: deployment/runtime packaging
Build third:
- separate web and worker services
- Docker packaging
- Caddy proxy with HTTPS
- callback/public-origin config and docs

Reason:
- auth providers and practical deployment depend on real HTTPS and stable service topology.

### Phase D: internationalization pass
Can run in parallel with admin/auth UI work once the main routes stabilize:
- message catalogs
- locale selection persistence
- route/layout/message plumbing
- README/docs refresh in English

Reason:
- i18n touches many screens, but it is cleaner once the main v1.1 surfaces exist.

## Data/ownership model

Recommended relationships:
- `user` many-to-many `group` through `group_membership`
- `target` many-to-many `group` through `target_group_share`
- `certificate_source` one-to-many `derived_crl_target`
- `group_defaults` scoped to group
- `target_override` stored directly on target/share depending on whether the override is global or group-specific

Key design question already answered by product scope:
- targets are shareable across groups, therefore group visibility cannot be encoded only as `target.group_id`

## Authorization boundaries

Authorization must apply consistently to:
- dashboard reads
- drill-down reads
- CSV/PDF exports
- target admin writes
- invite/member management
- import history and upload artifacts

Recommended implementation shape:
- central permission helpers that accept `(user, group, action)`
- route/page guards call those helpers
- reporting selectors accept authorized group scope rather than relying on UI filtering alone

## Authentication integration notes

- Credentials auth should coexist with OAuth/OIDC accounts on the same user identity.
- Invitation acceptance should be the moment when the user is bound to group membership.
- The system should avoid unrestricted just-in-time tenant creation.
- Callback/public-origin configuration should be explicit and environment-driven.

## Packaging shape

Recommended services:
- `web`: Next.js app
- `worker`: polling/import/background jobs
- `postgres`: primary relational store
- `caddy`: HTTPS termination and reverse proxy

Optional future split, not required now:
- separate import worker
- separate scheduler and execution workers

## Future-safe hooks

Even though multi-region workers are out of scope for `v1.1`, new evidence models should leave room for future fields like:
- `worker_id`
- `probe_region`
- `probe_country`
- `jurisdiction`

That avoids painful schema churn when distributed monitoring is added later.
