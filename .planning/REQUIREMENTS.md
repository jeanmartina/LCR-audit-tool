# Requirements: LCR Availability Dashboard

**Defined:** 2026-04-07
**Core Value:** Never allow a trusted certificate to operate without valid revocation coverage

## v1.1 Requirements

### Authentication
- [ ] **AUTH-01**: User can authenticate with local email/password after receiving an invitation.
- [ ] **AUTH-02**: Invited user can accept access through Google login.
- [ ] **AUTH-03**: Invited user can accept access through Microsoft Entra ID login.
- [ ] **AUTH-04**: Invited user can accept access through a generic OIDC provider.
- [ ] **AUTH-05**: Authentication callbacks and session handling work under a real HTTPS public origin.

### Groups & Authorization
- [ ] **GRP-01**: Platform admin can create groups and invite initial group admins.
- [ ] **GRP-02**: Platform admin can operate as a group admin without needing a second account.
- [ ] **GRP-03**: Group admins can invite users to their groups and assign `viewer`, `operator`, or `group-admin` roles.
- [x] **GRP-04**: Dashboard, drill-down, exports, and admin flows only expose data from groups the user is authorized to access.
- [ ] **GRP-05**: Targets can be shared across multiple groups without duplicating the underlying monitored artifact.
- [ ] **GRP-06**: Platform defaults, group defaults, and target overrides are resolved in that order.

### Certificate Onboarding & Target Administration
- [ ] **ADM-01**: Operator can upload a single certificate and the system derives CRL targets from it.
- [ ] **ADM-02**: Operator can upload a `.zip` package of certificates and the system derives CRL targets from the whole batch.
- [ ] **ADM-03**: The product does not require manual CRL URL entry for normal onboarding flows.
- [ ] **ADM-04**: Admin UI supports detailed target management including create/edit/disable, tags, clone, audit history, and group sharing.
- [ ] **ADM-05**: Admin UI supports manual validation/connectivity test and preview of effective alert recipients/defaults before saving.

### Monitoring & Reporting Extensions
- [x] **MON-03**: Predictive alerting can warn before the next CRL expires or publication is missed.
- [x] **MON-04**: Predictive alerts are configurable per user so each user can choose whether to receive them.
- [x] **REP-03**: Reporting can organize and filter monitored assets using multi-PKI or trust-source tags.

### Internationalization
- [x] **I18N-01**: All user-facing interfaces are translatable.
- [x] **I18N-02**: The application ships with English, Portuguese, and Spanish support.
- [x] **I18N-03**: Each user can configure their own preferred language.
- [x] **I18N-04**: New application code and default technical documentation are written in English.

### Deployment & Operations
- [x] **OPS-01**: The product can run through containerized packaging with separate web, worker, Postgres, and Caddy services.
- [x] **OPS-02**: Caddy provides HTTPS termination with automatic certificate renewal suitable for OAuth/OIDC callbacks.
- [x] **OPS-03**: Runtime configuration cleanly supports callback/public-origin settings, provider secrets, and database connectivity.

### Documentation
- [x] **DOC-01**: The repository includes a basic English README for setup and day-to-day usage.

## v1.2+ Requirements

### Future Monitoring Sources
- **SRC-01**: Import trust lists according to ETSI TS 119 612 using the trust-list distribution URL as the onboarding source.
- **SRC-02**: Re-import certificates automatically when a tracked trust list updates.
- **SRC-03**: Monitor OCSP availability in addition to CRLs.
- **SRC-04**: Monitor the availability of CP/CPS/DPC document URLs referenced by certificates.

### Future Scalability
- **SCL-01**: Scale workers horizontally for high target counts.
- **SCL-02**: Run workers from multiple regions/jurisdictions and compare availability by probe location.

### Future Executive Analytics
- **DIF-03**: Expose SLOs, burn rates, and historical error budgets for executive prioritization.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Manual CRL URL onboarding as the primary v1.1 flow | This milestone is explicitly certificate-first to reduce operator error |
| OCSP monitoring | Deferred to the next milestone after certificate-first onboarding is stable |
| CP/CPS/DPC URL monitoring | Deferred until after the main onboarding and auth flows ship |
| ETSI TS 119 612 trust-list ingestion | Deferred to a future milestone because it adds a separate ingestion/update path |
| Horizontal worker elasticity | Deferred until the productized single-region worker topology is stable |
| Multi-region/jurisdiction probes | Deferred until the worker model and evidence schema mature further |
| DIF-03 executive burn-rate expansion | Explicitly deferred by product decision for this milestone |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 8 | Complete |
| AUTH-02 | Phase 13 | Pending |
| AUTH-03 | Phase 13 | Pending |
| AUTH-04 | Phase 13 | Pending |
| AUTH-05 | Phase 13 | Pending |
| GRP-01 | Phase 8 | Complete |
| GRP-02 | Phase 8 | Complete |
| GRP-03 | Phase 8 | Complete |
| GRP-04 | Phase 10 | Complete |
| GRP-05 | Phase 9 | Complete |
| GRP-06 | Phase 9 | Complete |
| ADM-01 | Phase 9 | Complete |
| ADM-02 | Phase 14 | Pending |
| ADM-03 | Phase 9 | Complete |
| ADM-04 | Phase 9 | Complete |
| ADM-05 | Phase 9 | Complete |
| MON-03 | Phase 10 | Complete |
| MON-04 | Phase 10 | Complete |
| REP-03 | Phase 10 | Complete |
| I18N-01 | Phase 11 | Complete |
| I18N-02 | Phase 11 | Complete |
| I18N-03 | Phase 11 | Complete |
| I18N-04 | Phase 11 | Complete |
| OPS-01 | Phase 12 | Complete |
| OPS-02 | Phase 12 | Complete |
| OPS-03 | Phase 12 | Complete |
| DOC-01 | Phase 12 | Complete |

**Coverage:**
- v1.1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-07*
*Last updated: 2026-04-07 after v1.1 milestone gap planning*
