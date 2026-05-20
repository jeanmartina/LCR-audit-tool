# Phase 34: Release Clarity - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Surface the running version/build identifier in an operator-visible location in the web UI, with packaged-runtime verifiability.

</domain>

<decisions>
## Implementation Decisions

### Primary placement
- **D-01:** Show version/build in the global topbar so it is always visible in operator flows.

### Display format
- **D-02:** Display version as `vX.Y.Z` only (no build metadata or commit hash in the visible label).

### Missing metadata behavior
- **D-03:** If version/build metadata is missing, hide the indicator entirely.

### Runtime verification surface
- **D-04:** Provide both:
  - global UI position (topbar), and
  - technical read-only endpoint `/api/version` for packaged-runtime verification.

### the agent's Discretion
- Exact topbar visual treatment (badge/text style) as long as it remains operator-visible and stable.
- Exact endpoint payload shape, provided it is simple and read-only.

</decisions>

<specifics>
## Specific Ideas

- Visibility should be operationally useful without forcing users into settings pages.
- Public display stays concise (`vX.Y.Z`), while deeper verification comes from a technical endpoint.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and requirement anchors
- `.planning/ROADMAP.md` — Phase 34 goal and success criteria.
- `.planning/REQUIREMENTS.md` — UI-08 requirement definition.

### Global UI shell
- `src/app/layout.tsx` — Global app shell and topbar composition point.
- `src/components/public-shell.tsx` — Shared shell patterns impacting global placement.
- `src/components/ui/primitives.tsx` — Shared visual primitives for consistent indicator rendering.

### Existing operator-visible surfaces
- `src/app/reporting/page.tsx` — Main operator landing surface.
- `src/app/reporting/executive/page.tsx` — Executive operator surface to validate global placement continuity.

### Validation and packaged-runtime proof paths
- `scripts/validate-reporting.js` — Existing reporting validator to extend with version visibility assertions.
- `docs/operators.md` — Packaged runtime/operator documentation reference for verification instructions.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Global layout/shell structure already exists and is the safest place to render a stable topbar indicator.
- Existing script-based validators can enforce UI and endpoint contracts without introducing new test frameworks.

### Established Patterns
- Operator-facing routes are already centralized around reporting surfaces and shared primitives.
- Runtime configuration/doc patterns in operators docs can carry `/api/version` verification guidance.

### Integration Points
- Topbar indicator should be wired in shared layout/shell to avoid per-page duplication.
- `/api/version` should be a minimal read-only route with deterministic metadata source resolution.

</code_context>

<deferred>
## Deferred Ideas

- Showing extended build metadata (short SHA or build timestamp) in the primary visible label.
- Dedicated release/changelog UI beyond version visibility.

</deferred>

---

*Phase: 34-release-clarity*
*Context gathered: 2026-05-20*
