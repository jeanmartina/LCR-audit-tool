# Phase 33: Global UX Consistency - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply one modern and consistent visual language and navigation pattern across major application screens, with unified action hierarchy and consistent empty/error states.

</domain>

<decisions>
## Implementation Decisions

### Density baseline
- **D-01:** Use a compact technical density across the application (high information throughput per screen).

### Action hierarchy
- **D-02:** Standardize action hierarchy globally as:
  - Primary: solid button
  - Secondary: outline button
  - Tertiary: link action

### Navigation pattern
- **D-03:** Use hybrid navigation: global top navigation plus local sub-navigation per area.

### Empty and error states
- **D-04:** Standardize empty/error states to: short message + primary action + recovery link.

### the agent's Discretion
- Exact spacing token values per breakpoint while preserving compact density.
- Exact icon usage and microcopy wording as long as it respects D-02 and D-04.

</decisions>

<specifics>
## Specific Ideas

- Consistency should prioritize operational speed and scanability over decorative spacing.
- Navigation should stay predictable across reporting, settings, trust-list, and admin surfaces.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and requirement anchors
- `.planning/ROADMAP.md` — Phase 33 goal and success criteria.
- `.planning/REQUIREMENTS.md` — UI-07 requirement definition.

### Shared UI foundation
- `src/components/ui/primitives.tsx` — Existing shared visual primitives and action components.
- `src/app/layout.tsx` — Global application layout and shell entrypoint.
- `src/components/public-shell.tsx` — Public shell patterns relevant to navigation consistency.

### Major operational surfaces
- `src/app/reporting/page.tsx` — Reporting baseline patterns.
- `src/app/reporting/[targetId]/page.tsx` — Detail-page density and action patterns.
- `src/app/reporting/executive/page.tsx` — Executive layout/action hierarchy.
- `src/app/settings/settings-page.tsx` — Settings shell and section composition.
- `src/app/admin/trust-lists/page.tsx` — Trust-list operational shell.
- `src/app/admin/certificates/page.tsx` — Admin/inventory operational layout.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ActionGroup`, `ActionLink`, `Panel`, `PageHeader`, `PageShell`, `StatusPill` in `src/components/ui/primitives.tsx` already provide shared building blocks for consistency enforcement.
- Settings area is already sectionized and can serve as a pattern source for local sub-navigation consistency.

### Established Patterns
- Reporting and executive routes already use common primitives and translator-based labels.
- Multiple areas still mix local inline styles and ad-hoc spacing; this phase should normalize these into shared conventions.

### Integration Points
- Global consistency work should flow through shared primitives first, then propagate through reporting/settings/admin pages.
- Navigation hybrid model should be expressed at layout/shell level and consumed by area pages.

</code_context>

<deferred>
## Deferred Ideas

- Full redesign to sidebar-only navigation (out of scope for this phase's chosen hybrid model).
- Expanded motion/animation system beyond consistency cleanup.

</deferred>

---

*Phase: 33-global-ux-consistency*
*Context gathered: 2026-05-19*
