# v1.1 Research: Features

## Scope

This research covers only milestone `v1.1` features beyond shipped `v1.0` functionality.

## Table Stakes

### 1. Invitation-only access
Users should only enter the system through an invite flow.

Expected behavior:
- `platform-admin` creates groups and invites initial `group-admin` users
- `group-admin` invites group members
- an invited user can accept the invitation using:
  - local credentials
  - Google
  - Microsoft Entra ID
  - generic OIDC
- one user account may belong to multiple groups with different roles

### 2. Group-scoped authorization
The system should scope visibility and mutation rights by group.

Expected behavior:
- dashboard data is filtered to the groups the user can access
- exports and audit views follow the same authorization boundary
- the same target may be visible to more than one group through an explicit share
- `platform-admin` may operate across all groups without needing a second account

### 3. Target administration UI
Operators need a real UI for administration rather than SQL.

Expected behavior:
- create/edit/disable certificate-derived monitoring targets
- show derived CRL targets generated from uploaded certificates
- surface defaults inherited from platform/group and allow target overrides
- preview alert routing and operational settings before saving
- keep change history for auditability
- allow cloning and tags

### 4. Certificate-first onboarding
New monitoring should start from certificates.

Expected behavior:
- upload one certificate or a `.zip` package
- parse all certificates in the package
- extract CRL distribution points
- create/update monitorable targets from those derived CRLs
- reject or flag invalid/unsupported certificate material with clear errors

### 5. Internationalized UI
The app should support translated interface copy.

Expected behavior:
- all new UI strings move into translation catalogs
- the user can choose preferred language in profile/settings
- supported languages in v1.1:
  - English
  - Portuguese
  - Spanish
- language preference persists per user

### 6. Deployable stack
The product should be runnable as a practical environment, not just a dev repo.

Expected behavior:
- Docker packaging for app, worker, Postgres, and reverse proxy
- HTTPS through Caddy
- callback-compatible public origin configuration for OAuth/OIDC
- environment-driven configuration for secrets, domains, and providers

## Differentiators Worth Keeping in v1.1
- certificate-derived CRL monitoring instead of manual CRL URL entry
- group-shared targets instead of forcing duplication
- mixed auth support (local + social + enterprise OIDC) in the same milestone
- user-configurable locale from day one

## Explicitly Deferred
- monitoring OCSP endpoints
- monitoring CPS/CP/DPC URLs
- TSL ingestion via ETSI TS 119 612
- automatic re-import on TSL refresh
- multi-region probe execution
- worker elasticity/horizontal autoscaling
- richer executive SLO/burn-rate work from `DIF-03`

## Product Risks
- The admin UX can bloat if target management, certificate ingestion, invites, and defaults all land in one screen.
- Sharing targets across groups means the product must distinguish:
  - shared target data
  - group-specific permissions
  - possibly group-specific defaults/notifications
- OAuth/OIDC support adds deployment constraints early, especially around public HTTPS and callback correctness.
