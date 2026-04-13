# Phase 10: Group-Scoped Reporting and Predictive Monitoring - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 10 extends the reporting product surface on top of the Phase 9 certificate-first model. It must enforce group-scoped visibility in reporting/export paths, add predictive monitoring and alert preferences, and introduce structured multi-PKI / trust-source tagging into filters and reporting views.

</domain>

<decisions>
## Implementation Decisions

### Reporting visibility model
- **D-01:** The primary reporting view remains **certificate-centric**.
- **D-02:** Drill-down remains in the context of the certificate, even if runtime CRL execution is internally shared.
- **D-03:** The product should add an optional **alternative view by CRL URL** for users who want to inspect monitoring by URL rather than by certificate.
- **D-04:** The CRL-based view is a **reading mode only**; it does not change authorization boundaries.
- **D-05:** Any CRL-level aggregation must include only evidence the user is already authorized to see through accessible certificates/groups.

### Predictive alerts
- **D-06:** Predictive alerts start **3 days before expiration** when enabled.
- **D-07:** "Publication delayed" is defined relative to the known `nextUpdate` timestamp.
- **D-08:** Predictive alert policy can be configured by `platform-admin` and `group-admin`.
- **D-09:** Individual users can configure predictive alert preferences with all of these dimensions:
  - enabled / disabled
  - groups
  - severities
  - types:
    - upcoming expiration
    - publication delayed

### Tags and multi-PKI / trust-source views
- **D-10:** The product uses both:
  - structured system tags
  - free-form tags
- **D-11:** Structured tags for `v1.1` are:
  - `trustSource`
  - `pki`
  - `jurisdiction`
- **D-12:** Group membership is **not** represented as a tag because it is an authorization boundary, not a business taxonomy.
- **D-13:** Structured tags should inherit from group defaults when present, with certificate-level overrides.
- **D-14:** Free-form tags remain available for local organization and search, but structured tags drive reporting filters/groupings and executive reading.

### UX scope for this phase
- **D-15:** The dashboard remains primarily certificate-centric, but must add a user-selectable CRL view.
- **D-16:** The dashboard should add filtering/grouping on `trustSource`, `pki`, and `jurisdiction`.
- **D-17:** The dashboard should expose predictive-risk information in the visible surface.
- **D-18:** Drill-down should show predictive state and predictive events in the timeline while remaining certificate-scoped.
- **D-19:** Exports should preserve the active reporting mode and current filters/tags, and include predictive context.
- **D-20:** User predictive-alert preferences require a **dedicated settings page**, not just a small inline section.
- **D-21:** That preferences surface should also introduce at least **light theme** and **dark theme** support alongside the predictive preference controls.
- **D-22:** The CRL-based reporting mode should be richer than a trivial flat list, but should avoid overcomplicating the first version.

### the agent's Discretion
- Exact layout and interaction details for switching between certificate and CRL views.
- Exact representation of predictive status in tables, chips, or summary blocks.
- Exact modeling of theme preference storage and application, provided the product ships with at least light and dark themes in this phase.
- Exact aggregation mechanics for the CRL view, provided it stays authorization-safe and reasonably rich.

</decisions>

<specifics>
## Specific Ideas

- The CRL view is complementary, not the default product identity.
- Predictive preferences are per-user and need enough control to avoid alert fatigue.
- Theme selection is now part of the user-facing product settings surface and should coexist with predictive preferences.
- Structured tags should make executive filtering easier without collapsing group authorization into metadata.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone scope
- `.planning/PROJECT.md` — Current milestone framing and constraints
- `.planning/REQUIREMENTS.md` — Phase 10 requirement IDs and milestone boundaries
- `.planning/ROADMAP.md` — Phase 10 goal, dependencies, and success criteria

### Prior phase context
- `.planning/phases/08-identity-invitations-and-access-foundation/08-CONTEXT.md` — locked auth/session/permission rules
- `.planning/phases/08-identity-invitations-and-access-foundation/08-VERIFICATION.md` — what Phase 8 delivered
- `.planning/phases/09-certificate-first-onboarding-and-target-administration/09-CONTEXT.md` — certificate-first admin and sharing decisions
- `.planning/phases/09-certificate-first-onboarding-and-target-administration/09-VERIFICATION.md` — what Phase 9 delivered and what reporting must build on

### Code context
- `src/reporting/read-models.ts` — existing certificate-scoped reporting selectors
- `src/reporting/query-state.ts` — existing filter/query contract
- `src/app/reporting/page.tsx` — current dashboard surface
- `src/app/reporting/[targetId]/page.tsx` — current certificate drill-down surface
- `src/exports/csv.ts` and `src/exports/pdf.ts` — export behavior that must stay consistent with active reporting mode and filters
- `src/inventory/certificate-admin.ts` — certificate-first admin/runtime projection foundation introduced in Phase 9
- `src/auth/authorization.ts` — authz primitives that reporting and settings surfaces must keep using

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Reporting already has a stable query/filter contract and export integration.
- Auth/session/permission primitives already exist from Phase 8.
- Certificate-first admin state now exists from Phase 9 and should become the domain truth for reporting extensions.

### Established Patterns
- Backend permission checks are enforced in read-models and route handlers, not only in UI.
- Reporting filters already flow through URL state and export routes.
- Validation scripts in `scripts/` remain the standard verification mechanism.

### Integration Points
- Phase 10 must preserve Phase 8 authorization boundaries and Phase 9 certificate/domain truth.
- Predictive state will need to integrate with current timeline/export/reporting structures.
- Theme and user preferences will need to integrate with the authenticated user model.

</code_context>

<deferred>
## Deferred Ideas

- Full internationalization rollout remains Phase 11.
- HTTPS/provider packaging and callback readiness remain Phase 12.
- Future TSL ingestion, OCSP, CP/CPS/DPC monitoring, and multi-region probing stay out of this phase.

</deferred>

---

*Phase: 10-group-scoped-reporting-and-predictive-monitoring*
*Context gathered: 2026-04-07*
