# Phase 20 Plan Check

**Checked:** 2026-04-23
**Verdict:** PASSED after user consultation and local research

## User Consultation Captured

| Decision | User Choice | Planning Effect |
|----------|-------------|-----------------|
| Onboarding model | 1A | Guided wizard is implemented on existing `/admin/trust-lists`. |
| Operator scope | 2B | Platform admins and group-admins can operate sources within group scope. |
| Test before save | 3B | Preview/test is optional; save without test remains allowed with warning. |
| Sync visibility | 4A | Per-source simple timeline/status/recovery view is required. |
| Recovery guidance | 5A | Known errors map to prescriptive recommended actions. |
| Documentation | 6A | Operator/admin docs are updated with setup, sync, failures, and recovery. |
| Research | 7A | Local/codebase research was performed before planning. |

## Scope Fit

| Requirement | Covered By | Notes |
|-------------|------------|-------|
| TSL-06 | 20-01 recovery/status model, 20-02 timeline UI | Operators see status, last success, next update, failure reason, and change summary. |
| UX-04 | 20-02 guided wizard | Trust-list onboarding uses the same guided preview/commit model as certificate and ZIP onboarding. |
| OPS-06 | 20-02 docs | Documentation covers setup, sync behavior, failures, and recovery. |

## Quality Gates

- Plans preserve Phase 18 XMLDSig blocking semantics and Phase 19 projection semantics.
- Plans centralize group-admin scope enforcement in `src/trust-lists/admin.ts`.
- Preview/test is explicitly non-mutating and validated.
- Recovery guidance covers required known errors.
- UI scope is guided onboarding plus simple timeline, not full run-history drill-down.
- Documentation is part of done criteria, not an afterthought.

## Risks Accepted

- Group-admin source operation introduces broader authorization complexity. The plan mitigates this with central authorization helpers and validator checks.
- Optional test means users can still save an untested source. The plan mitigates with explicit warning and recovery guidance.
- Full historical sync drill-down remains deferred to avoid scope creep.

## Result

The plans are executable and cover Phase 20's required operator experience: guided source onboarding, optional preview, scoped operation, visible sync status/failures, prescriptive recovery, and documentation.
