# Requirements: LCR Availability Dashboard

**Defined:** 2026-04-20
**Core Value:** Never allow a trusted certificate to operate without valid revocation coverage

## v1.2 Requirements

### Trust-List Sources

- [ ] **TSL-01**: Platform admin can register an ETSI TS 119 612 trust-list source by URL.
- [ ] **TSL-02**: System fetches and parses supported LOTL/TSL documents while preserving source metadata such as territory, sequence number, issue date, next update, and digest.
- [ ] **TSL-03**: System validates trust-list integrity before accepting extracted certificates into the monitored inventory.
- [ ] **TSL-04**: System extracts certificates from supported trust-list sources and imports them through the existing certificate-first pipeline.
- [ ] **TSL-05**: System detects trust-list changes and re-imports affected certificates without duplicating unchanged monitored assets.
- [ ] **TSL-06**: Operator can see trust-list sync status, last successful sync, next expected update, failure reason, and change summary.
- [ ] **TSL-07**: Trust-list-derived certificates and targets retain provenance back to source URL, snapshot, and import run.

### Executive Visibility

- [ ] **EXEC-01**: Authorized user can open a simple executive summary dashboard for their allowed groups.
- [ ] **EXEC-02**: Executive summary shows current healthy, degraded, unavailable, and at-risk asset counts without requiring operator-level drill-down.
- [ ] **EXEC-03**: Executive summary highlights top current risks and upcoming expiration/publication risks with links to operational evidence.
- [ ] **EXEC-04**: Executive summary exposes a short trend view for recent coverage health and incidents.
- [ ] **EXEC-05**: Executive summary can be exported or printed as a concise management-facing report.

### Operator UX and Visual Design

- [x] **UX-01**: Product UI uses a coherent visual system with clearer hierarchy, spacing, typography, panels, states, and action placement.
- [x] **UX-02**: Certificate onboarding provides a guided flow for single certificate upload with clear preview, derived CRLs, effective defaults, and save outcome.
- [x] **UX-03**: ZIP onboarding provides a guided flow with upload validation, import progress/result summary, partial-failure details, and next steps.
- [ ] **UX-04**: Trust-list onboarding uses the same guided source-onboarding model as certificate and ZIP onboarding.
- [x] **UX-05**: First system access presents a first-run web flow to create the initial platform admin instead of requiring direct database insertion.
- [x] **UX-06**: Editable forms include concise field-level hints, examples, and validation feedback for technical fields such as trust source, PKI, jurisdiction, callback origin, predictive windows, and source URLs.
- [x] **UX-07**: Empty states and post-action states guide operators to the next useful action after setup, onboarding, import, sync, or error outcomes.

### Operations and Safety

- [ ] **OPS-04**: Trust-list sync runs are persisted with auditable success/failure state and do not silently mutate inventory.
- [ ] **OPS-05**: Existing Docker packaged runtime can run trust-list sync and executive summary features without manual host dependencies.
- [ ] **OPS-06**: Documentation explains trust-list source setup, sync behavior, failure handling, and operator recovery steps.

## Future Requirements

### Future Authentication Providers

- **AUTH-03**: Invited user can accept access through Microsoft Entra ID login.
- **AUTH-04**: Invited user can accept access through a generic OIDC provider.

### Future Monitoring Sources

- **SRC-03**: Monitor OCSP availability in addition to CRLs.
- **SRC-04**: Monitor the availability of CP/CPS/DPC document URLs referenced by certificates.

### Future Scalability

- **SCL-01**: Scale workers horizontally for high target counts.
- **SCL-02**: Run workers from multiple regions/jurisdictions and compare availability by probe location.

### Future Executive Analytics

- **DIF-03**: Expose full SLOs, burn rates, and historical error budgets for executive prioritization.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Microsoft Entra ID live proof | Deferred so v1.2 can focus on trust-list ingestion and UX quality |
| Generic OIDC live proof | Deferred with Entra ID to a dedicated provider-proof milestone |
| OCSP monitoring | Deferred until trust-list ingestion and CRL coverage model are stable |
| CP/CPS/DPC document monitoring | Deferred until trust-list-derived certificate provenance is stable |
| Full burn-rate / error-budget analytics | v1.2 should ship simpler executive summaries first |
| Multi-region worker execution | Deferred until the ingestion and operator workflow model is stable |
| Replacing the current app with a separate BI/dashboard tool | Adds operational complexity and breaks the current evidence/authorization model |
| Separate trust-list admin product surface | Trust-list ingestion must extend the existing certificate/source onboarding model |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TSL-01 | Phase 18 | Pending |
| TSL-02 | Phase 18 | Pending |
| TSL-03 | Phase 18 | Pending |
| TSL-04 | Phase 19 | Pending |
| TSL-05 | Phase 19 | Pending |
| TSL-06 | Phase 20 | Pending |
| TSL-07 | Phase 19 | Pending |
| EXEC-01 | Phase 21 | Pending |
| EXEC-02 | Phase 21 | Pending |
| EXEC-03 | Phase 21 | Pending |
| EXEC-04 | Phase 21 | Pending |
| EXEC-05 | Phase 21 | Pending |
| UX-01 | Phase 16 | Complete |
| UX-02 | Phase 17 | Complete |
| UX-03 | Phase 17 | Complete |
| UX-04 | Phase 20 | Pending |
| UX-05 | Phase 17 | Complete |
| UX-06 | Phase 16 | Complete |
| UX-07 | Phase 16 | Complete |
| OPS-04 | Phase 18 | Pending |
| OPS-05 | Phase 18 | Pending |
| OPS-06 | Phase 20 | Pending |

**Coverage:**
- v1.2 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0

---
*Requirements defined: 2026-04-20*
*Last updated: 2026-04-21 after Phase 17 execution*
