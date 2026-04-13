# Phase 10: Group-Scoped Reporting and Predictive Monitoring - Research

**Researched:** 2026-04-07
**Status:** Ready for planning

## Scope

This research is limited to Phase 10 concerns:
- enforcing group-scoped visibility across reporting, drill-down, and exports
- adding a complementary CRL-based reporting mode without changing auth boundaries
- introducing predictive alerting from `nextUpdate`
- adding per-user predictive alert preferences
- adding structured `trustSource`, `pki`, and `jurisdiction` tagging to reporting
- introducing a dedicated settings surface with at least light and dark themes

## Recommended Direction

### Reporting model
- Keep the existing **certificate-centric dashboard and drill-down** as the default reporting surface.
- Add a second reporting projection for **CRL URL view** that aggregates only the CRL evidence already visible through authorized certificates/groups.
- Represent the active reporting mode in the same query/filter contract used by exports so certificate mode and CRL mode are reproducible from URL state.

Why:
- The current app and export contract are already filter-driven and certificate-scoped.
- The user explicitly wants CRL mode as a complementary view, not a replacement.

### Authorization boundaries
- Continue enforcing authz in backend/read-model/export paths, not just UI.
- Phase 10 should treat CRL aggregation as a **derived read model**, not a new domain authority.
- Any CRL-level row should be built only from certificates/groups the principal already has access to.

Why:
- This preserves Phase 8's backend permission contract and Phase 9's visibility rule.

### Predictive alert model
- Store predictive state separately from reactive availability alerts.
- Recommended predictive event types:
  - `expiration-upcoming`
  - `publication-delayed`
- Use `nextUpdate` as the only Phase 10 publication/expiry reference.
- Predictive state should be queryable by:
  - certificate
  - CRL URL
  - group
  - severity
  - predictive type

Why:
- The user explicitly locked predictive timing and the delayed-publication definition around `nextUpdate`.
- Phase 10 needs both reporting and user-preference delivery, so the model should not be hidden inside UI code.

### User preferences and settings
- Add an authenticated user settings model with:
  - theme preference
  - predictive alert enabled/disabled
  - selected groups
  - selected severities
  - selected predictive types
- Use a dedicated settings page rather than overloading reporting or admin screens.
- Implement at least `light` and `dark` themes through a user preference that the app shell can consume.

Why:
- This is explicitly required by the context.
- The current app has no settings surface and hardcodes the dark palette in `src/app/layout.tsx`.

### Structured tags in reporting
- Treat structured tags as reporting-facing dimensions, distinct from free-form tags.
- Recommended reporting support in Phase 10:
  - filter by `trustSource`, `pki`, `jurisdiction`
  - group summaries by these structured tags
  - surface them in exports and executive summaries
- Keep inheritance/group-default resolution in the admin/domain layer, but make reporting consume the **effective tag values**.

Why:
- The tag defaults/overrides were already decided in Phase 10 context and Phase 9 certificate/admin modeling.

### Integration shape
- Phase 10 should likely touch:
  - `src/reporting/read-models.ts`
  - `src/reporting/query-state.ts`
  - `src/reporting/timeline.ts`
  - `src/exports/csv.ts`
  - `src/exports/pdf.ts`
  - `src/app/reporting/*`
  - `src/app/layout.tsx`
  - new settings route(s) under `src/app/`
  - storage/auth model for user preferences and predictive subscriptions
  - a dedicated `scripts/validate-reporting-phase10.js` or an extension of current reporting validation

Why:
- The current reporting and export code is concentrated there.
- The current app shell and auth model need a user-preference hook for theme and predictive settings.

## Pitfalls to avoid in this phase

1. **Letting CRL view bypass certificate/group visibility**
   - The CRL view is a projection, not a new entitlement model.

2. **Implementing predictive state only in the UI**
   - It needs durable state/query support for reporting, export, and per-user delivery.

3. **Hardcoding tags directly in reporting pages**
   - Reporting should consume effective structured tags, not invent them ad hoc.

4. **Adding theme selection without wiring the app shell**
   - A settings page without actual theme application will not satisfy the phase intent.

5. **Breaking export reproducibility**
   - Exports must carry the active reporting mode, filters, and predictive context.

## Implications for Planning

The plan should be sequenced in this order:
1. predictive state + user settings persistence and effective structured-tag read model
2. reporting/query/export extensions for certificate mode + CRL mode + predictive indicators
3. dedicated settings UI and theme application, plus final reporting surface updates

That keeps the data model and auth boundaries stable before UI and export work consume them.

## References Used

- `.planning/phases/10-group-scoped-reporting-and-predictive-monitoring/10-CONTEXT.md`
- `.planning/phases/09-certificate-first-onboarding-and-target-administration/09-CONTEXT.md`
- `.planning/phases/09-certificate-first-onboarding-and-target-administration/09-VERIFICATION.md`
- `.planning/phases/08-identity-invitations-and-access-foundation/08-CONTEXT.md`
- `src/reporting/read-models.ts`
- `src/reporting/query-state.ts`
- `src/reporting/timeline.ts`
- `src/exports/csv.ts`
- `src/exports/pdf.ts`
- `src/app/reporting/page.tsx`
- `src/app/reporting/[targetId]/page.tsx`
- `src/app/layout.tsx`

---
*Phase: 10-group-scoped-reporting-and-predictive-monitoring*
*Research completed: 2026-04-07*
