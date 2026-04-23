# Phase 19 Plan Check

**Checked:** 2026-04-23
**Verdict:** PASSED after user consultation

## User Consultation Captured

| Decision | User Choice | Planning Effect |
|----------|-------------|-----------------|
| Stable identity | 1A | Certificate fingerprint remains the inventory identity; source/candidate digest handles projection changes. |
| Existing manual/ZIP certificate collision | 2A | Reuse the existing certificate row and add trust-list provenance. |
| Unchanged sync behavior | 3A | Record skipped unchanged and do not call `importCertificate`. |
| UI scope | 4B | Deliver admin source/run counters plus certificate-level provenance; defer enriched reporting filters/labels. |
| Validation scope | 5A | Require projection validator, build, typecheck, and validate-all. |

## Scope Fit

| Requirement | Covered By | Notes |
|-------------|------------|-------|
| TSL-04 hardening | 19-01 sync projection logic | Phase 18 initial import is hardened with stable projection identity and skip/update semantics. |
| TSL-05 | 19-01 change detection | Candidate digest comparison skips unchanged and reimports changed candidates only. |
| TSL-07 | 19-01 provenance model, 19-02 admin/certificate surfaces | Projection records link certificate to source, snapshot, run, and extracted item; admin/certificate detail exposes it. |

## Quality Gates

- Plans preserve Phase 18 XMLDSig gate and failure semantics.
- Plans keep certificate-first inventory as the canonical monitored asset model.
- Plans separate data/model hardening from admin/certificate-detail exposure.
- Validator requirements are explicit and wired into `validate-all`.
- Phase 20 recovery UX and Phase 21 executive/reporting analytics remain deferred, avoiding scope creep.

## Risks Accepted

- Candidate identity based on source path/ordinal may still be imperfect for some real-world TSL variations. The plan mitigates this by making fingerprint the inventory identity and using candidate digest for projection-level change detection.
- The first UI exposure is evidentiary/provenance-oriented, not a full operator recovery workflow. That is intentional for Phase 20.
- Enriched reporting filters/labels are not delivered in Phase 19 because the user selected admin counters plus certificate provenance as the UI scope.

## Result

The plans are executable and directly address Phase 19's required hardening: no duplicate unchanged imports, reimport changed candidates, and durable provenance from certificate/admin records back to trust-list source evidence.
