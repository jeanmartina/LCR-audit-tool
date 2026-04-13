# Phase 10 Discussion Log

**Date:** 2026-04-07
**Phase:** 10 - Group-Scoped Reporting and Predictive Monitoring

## Decisions captured

1. Reporting visibility
   - primary view stays certificate-centric
   - drill-down stays certificate-scoped
   - add an optional CRL-based reporting mode
   - CRL mode is only a reading mode and does not change authorization
   - CRL aggregation can include only evidence the user is already authorized to see

2. Predictive alerts
   - predictive alerts start 3 days before expiration
   - publication delay is evaluated from `nextUpdate`
   - predictive policy is configurable by platform-admin and group-admin
   - user preferences are fully configurable by:
     - enabled/disabled
     - groups
     - severities
     - types (upcoming expiration, publication delayed)

3. Tags / multi-PKI
   - use structured tags plus free-form tags
   - structured tags in v1.1:
     - `trustSource`
     - `pki`
     - `jurisdiction`
   - group is not a tag
   - structured tags inherit from group defaults and can be overridden at certificate level

4. UX scope
   - dashboard adds certificate view + alternative CRL view
   - dashboard adds structured-tag filtering/grouping and predictive indicators
   - drill-down adds predictive state/events while staying certificate-scoped
   - exports carry active mode and predictive context
   - predictive preferences get a dedicated settings page
   - the settings page must introduce at least light and dark themes
   - CRL view should be richer than a trivial table but not overbuilt yet

## Deferred to later phases

- full i18n rollout
- Docker/Caddy/HTTPS packaging
- trust-list ingestion
- OCSP and CP/CPS/DPC monitoring
- multi-region execution
