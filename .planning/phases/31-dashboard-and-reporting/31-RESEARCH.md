# Phase 31: Dashboard and Reporting - Research

**Researched:** 2026-05-13  
**Domain:** Next.js reporting UX/read-model normalization for UI-05  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Dashboard default must show healthy and problematic items together.
- **D-02:** Problematic items must be prioritized at the top while healthy items remain visible in the same view.
- **D-03:** Use a medium taxonomy with six operator-facing states: `ok`, `degraded`, `blocked`, `failed`, `not-checkable`, `unknown`.
- **D-04:** Keep this taxonomy consistent across dashboard list, summary badges, and detail diagnostics.
- **D-05:** Timeline/log entries must default to human-readable phrasing.
- **D-06:** Technical evidence/details must be available via expandable drill-down per event.
- **D-07:** Use a hybrid action pattern:
  - global primary actions fixed at page level
  - contextual actions inline per item
- **D-08:** Action styling and hierarchy should remain consistent across dashboard and detail pages.

### Claude's Discretion
- Exact visual encoding for six-state badges/chips (colors/icons), as long as consistency and readability are preserved.
- Exact interaction pattern for technical detail expansion (accordion, drawer, inline expand), as long as human-first default is preserved.
- Internal read-model refactors needed to support the clarified view model.

### Deferred Ideas (OUT OF SCOPE)
- New dashboard capabilities outside UI-05 scope (e.g., brand-new analytics modules, new monitor types, cross-phase alerting features).
- Any new capability that changes monitoring collection behavior rather than reporting clarity.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-05 | Dashboard and reporting should keep healthy items visible, classify derived-source states clearly, explain timelines and logs, and present actions as consistent controls. | Read-model-first ordering strategy, six-state normalization map, human-first timeline copy model, and action-control component pattern below. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

`CLAUDE.md` not found in repository root; no additional project-local directives were discovered. [VERIFIED: codebase scan]

## Summary

The existing reporting surface is already read-model driven (`buildDashboardRows`, `buildDashboardSummary`, `buildDetailEvidence`, `buildExecutiveSummary`) and principal-scoped, so UI-05 should be implemented as a normalization/refinement layer instead of new storage or monitoring logic. [VERIFIED: src/reporting/read-models.ts]  
Current dashboard behavior already keeps all rows visible and exposes a risk-priority function (`getRiskPriority`) that can be reused to move problematic rows first without filtering healthy rows out. [VERIFIED: src/reporting/read-models.ts]

Current derived-source status handling is fragmented across many raw states (`available`, `unavailable`, `changed`, `malformed`, etc.) and currently uses separate display logic in detail and executive pages. A single six-state taxonomy mapper should be introduced in read models and consumed everywhere to satisfy D-03/D-04. [VERIFIED: src/app/reporting/[targetId]/page.tsx, src/app/reporting/executive/page.tsx, src/reporting/read-models.ts]

Timeline content is technically rich but text-first readability is limited by raw log string formatting. Keep existing event assembly from `buildAuditTimeline`, but split each event into human summary + collapsible technical evidence payload so operators get immediate context and can drill down when needed. [VERIFIED: src/reporting/timeline.ts, src/app/reporting/[targetId]/page.tsx]

**Primary recommendation:** Add a centralized `normalizeOperationalState()` and `formatTimelineNarrative()` layer in `src/reporting/read-models.ts`/`src/reporting/timeline.ts`, then consume it through shared UI components for status chips and action bars across `/reporting`, `/reporting/[targetId]`, and `/reporting/executive`. [VERIFIED: codebase scan]

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | `16.2.6` | App Router SSR reporting pages | Existing routing/rendering foundation for all reporting surfaces. [VERIFIED: npm registry + package.json] |
| `react` | `19.2.6` | Component rendering and shared UX primitives | Existing UI primitive composition (`Panel`, `StatusPill`, etc.). [VERIFIED: npm registry + src/components/ui/primitives.tsx] |
| `react-dom` | `19.2.6` | Server/client rendering runtime | Required with current Next stack. [VERIFIED: npm registry + package.json] |
| `typescript` | `6.0.3` | Strong typing for state taxonomy and read models | Existing typed contracts in read models and filters reduce regression risk. [VERIFIED: npm registry + src/reporting/read-models.ts] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| In-repo `src/components/ui/primitives.tsx` | repo-local | Standard buttons/panels/pills/headers | Reuse for action consistency and status display normalization. [VERIFIED: src/components/ui/primitives.tsx] |
| In-repo `src/i18n/index.ts` | repo-local | Translation dictionary and key lookup | Add new human-first timeline/status copy keys across `en`, `pt-BR`, `es`. [VERIFIED: src/i18n/index.ts] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Read-model normalization in current app | New dashboard BFF/API layer | Adds unnecessary complexity for UI-05 because required data already exists and is aggregated. [VERIFIED: src/reporting/read-models.ts] |

**Installation:**
```bash
npm install
```

**Version verification:**  
`npm view next version` -> `16.2.6` (modified 2026-05-10) [VERIFIED: npm registry]  
`npm view react version` -> `19.2.6` (modified 2026-05-08) [VERIFIED: npm registry]  
`npm view react-dom version` -> `19.2.6` (modified 2026-05-08) [VERIFIED: npm registry]  
`npm view typescript version` -> `6.0.3` (modified 2026-04-16) [VERIFIED: npm registry]

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── reporting/
│   ├── read-models.ts          # taxonomy normalization and risk ordering
│   ├── timeline.ts             # human-first timeline copy + technical payload
│   └── query-state.ts          # shared filter/query serialization
├── app/reporting/
│   ├── page.tsx                # dashboard list + fixed global actions
│   ├── [targetId]/page.tsx     # diagnostic-first detail + inline actions
│   └── executive/page.tsx      # aligned summary consumption
└── components/ui/primitives.tsx # action/status primitives reused across pages
```

### Pattern 1: Normalize Raw Derived States Into UI-05 Six-State Taxonomy
**What:** Map `displayStatus` + `latestEvent` into `{ok,degraded,blocked,failed,not-checkable,unknown}` in one function. [VERIFIED: src/reporting/read-models.ts]  
**When to use:** Dashboard rows, detail derived-source cards, executive derived-source summaries. [VERIFIED: src/app/reporting/page.tsx, src/app/reporting/[targetId]/page.tsx, src/app/reporting/executive/page.tsx]  
**Example:**
```typescript
// Source: src/reporting/read-models.ts (new helper)
export type UiOperationalState =
  | "ok"
  | "degraded"
  | "blocked"
  | "failed"
  | "not-checkable"
  | "unknown";

export function normalizeOperationalState(raw: string): UiOperationalState {
  if (raw === "available" || raw === "healthy" || raw === "unchanged") return "ok";
  if (raw === "degraded" || raw === "discovered" || raw === "changed") return "degraded";
  if (raw === "blocked") return "blocked";
  if (raw === "offline" || raw === "unavailable" || raw === "malformed" || raw === "extraction_failed") return "failed";
  if (raw === "not_checkable" || raw === "disabled" || raw === "oversized") return "not-checkable";
  return "unknown";
}
```

### Pattern 2: Keep Healthy Visible, Order By Risk
**What:** Reuse `getRiskPriority` and sort descending before render; do not filter healthy rows by default. [VERIFIED: src/reporting/read-models.ts, 31-CONTEXT.md D-01/D-02]  
**When to use:** `buildDashboardRows` return path and executive risk lists. [VERIFIED: src/reporting/read-models.ts]  

### Pattern 3: Human-First Timeline + Expandable Technical Evidence
**What:** Add narrative fields to timeline events, and expose raw data behind disclosure control (`details`/accordion/inline expander). [VERIFIED: src/reporting/timeline.ts, src/app/reporting/[targetId]/page.tsx]  
**When to use:** Default `timeline` tab and any future incident log widgets. [VERIFIED: src/reporting/query-state.ts]

### Anti-Patterns to Avoid
- **Per-page status mapping logic:** leads to inconsistent chips/counts between dashboard/detail/executive. [VERIFIED: current duplicated mapping in detail + executive pages]
- **Raw ISO/event dumps as primary text:** breaks D-05 human-first requirement. [VERIFIED: src/app/reporting/[targetId]/page.tsx]
- **Link-only action controls:** inconsistent visual hierarchy vs existing primitives (`ActionButton`, `Panel`). [VERIFIED: src/components/ui/primitives.tsx, src/app/reporting/page.tsx]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Status taxonomy consistency | Ad-hoc `if/else` chains in each page | Shared normalization helper in read-model layer | Prevents drift across pages and locales. [VERIFIED: src/reporting/read-models.ts + current duplication] |
| Action styling consistency | Per-page inline CSS action variants | Reuse/extend UI primitives (`ActionButton`, `StatusPill`, `Panel`) | Existing design system path already in repo. [VERIFIED: src/components/ui/primitives.tsx] |
| Timeline event assembly | New data fetch path for diagnostics | Extend `buildAuditTimeline` from existing detail evidence | Existing data model already includes poll/alerts/validation/predictive/snapshots. [VERIFIED: src/reporting/timeline.ts, src/reporting/read-models.ts] |

**Key insight:** UI-05 is mostly view-model normalization and component consistency, not new backend capability. [VERIFIED: 31-CONTEXT.md + existing code]

## Common Pitfalls

### Pitfall 1: Taxonomy Drift Between Raw and UI States
**What goes wrong:** Dashboard shows 3 states while derived-source cards show >10 raw states. [VERIFIED: src/reporting/read-models.ts, src/app/reporting/[targetId]/page.tsx]  
**Why it happens:** No shared canonical mapper exists today. [VERIFIED: codebase scan]  
**How to avoid:** Introduce one mapper + one i18n key namespace (`reporting.state.ui.*`) consumed in all reporting surfaces. [ASSUMED]  
**Warning signs:** Same source appears as different severity labels across dashboard/detail/executive.

### Pitfall 2: Human-Readable Requirement Lost in Raw Timeline Text
**What goes wrong:** Operators read event tuples (`ISO - type - title - detail`) rather than clear narratives. [VERIFIED: src/app/reporting/[targetId]/page.tsx]  
**Why it happens:** Timeline currently concatenates technical fields directly. [VERIFIED: src/reporting/timeline.ts]  
**How to avoid:** Generate `summary` sentence and keep technical evidence in expandable area. [ASSUMED]  
**Warning signs:** Support questions ask “what happened?” even when event exists.

### Pitfall 3: Inconsistent Action Placement
**What goes wrong:** Global exports/settings and item-specific links look visually equivalent, reducing action clarity. [VERIFIED: src/app/reporting/page.tsx, src/app/reporting/[targetId]/page.tsx]  
**Why it happens:** Actions are mostly plain links without shared hierarchy component. [VERIFIED: same files]  
**How to avoid:** Define `ReportingGlobalActions` (fixed/sticky) and `ReportingInlineActions` (row/detail scoped) primitives with shared style tokens. [ASSUMED]  
**Warning signs:** New actions get added as ad-hoc links with no consistent priority styling.

## Code Examples

### Reuse Existing Risk Priority for D-02 Ordering
```typescript
// Source: src/reporting/read-models.ts
function getRiskPriority(row: DashboardRow): number {
  const statusScore = row.currentStatus === "offline" ? 300 : row.currentStatus === "degraded" ? 200 : 0;
  const predictiveScore = row.predictiveSeverity === "critical" ? 80 : row.predictiveSeverity === "warning" ? 40 : 0;
  const alertScore = Math.min(row.openAlerts, 10) * 5;
  const expirationScore = row.nextExpiration ? 20 : 0;
  const slaScore = Math.max(0, 100 - row.slaPercent);
  return statusScore + predictiveScore + alertScore + expirationScore + slaScore;
}
```

### Timeline Human-First Event Shape
```typescript
// Source: src/reporting/timeline.ts (recommended extension)
type HumanTimelineEvent = {
  type: TimelineEventType;
  at: Date;
  summary: string;     // default UI copy
  technical: string[]; // expandable details
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Status labels tied directly to raw monitor/event states | Introduce six-state operator taxonomy adapter layer | Phase 31 target | Improves consistency and comprehension across surfaces. [VERIFIED: 31-CONTEXT.md decisions] |
| Flat timeline string dumps | Human summary + drill-down evidence block | Phase 31 target | Meets D-05/D-06 without losing technical depth. [VERIFIED: 31-CONTEXT.md decisions + current timeline code] |

**Deprecated/outdated:**
- Per-surface status vocabulary (`healthy/degraded/offline` vs `available/blocked/...`) as direct UI contract. [VERIFIED: codebase scan]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | New i18n namespace `reporting.state.ui.*` should be added for six-state labels. | Common Pitfalls | Medium: may conflict with existing translation organization preference. |
| A2 | Action consistency should be solved with new `ReportingGlobalActions`/`ReportingInlineActions` components. | Common Pitfalls | Low: can still be done with existing primitives if component extraction is deferred. |
| A3 | Timeline drill-down should use disclosure UI (accordion/details/inline). | Architecture Patterns | Low: exact interaction can vary per D-07 discretion. |

## Open Questions

1. **Should CRL row status (`healthy/degraded/offline`) also be remapped to six-state taxonomy in main table labels?**
   - What we know: CRL/dashboard rows currently use 3-state `currentStatus` only. [VERIFIED: src/reporting/read-models.ts]
   - What's unclear: Whether requirement D-03 expects six-state display for top-level rows or only derived-source surfaces.
   - Recommendation: Lock this in discuss/planning as an explicit acceptance criterion for UI-05.

2. **Should timeline ordering remain ascending or switch to newest-first?**
   - What we know: `buildAuditTimeline` currently sorts ascending by time. [VERIFIED: src/reporting/timeline.ts]
   - What's unclear: Operator preference for incident triage speed vs chronology readability.
   - Recommendation: Keep default newest-first in UI render while preserving chronological export behavior. [ASSUMED]

## Environment Availability

Step 2.6 result: **SKIPPED (no blocking external dependencies identified for this phase).** [VERIFIED: phase scope in 31-CONTEXT.md]

Local baseline probe (informational): Node `v22.22.2`, npm `11.12.1`, Docker `27.5.1`, psql `16.13`. [VERIFIED: local command probes]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None currently configured (no jest/vitest/pytest config found) [VERIFIED: repo scan] |
| Config file | none — see Wave 0 [VERIFIED: repo scan] |
| Quick run command | `npm run typecheck` [VERIFIED: package.json] |
| Full suite command | `npm run quality` [VERIFIED: package.json] |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-05 | Healthy rows visible while risk rows are top-prioritized | unit/integration | `npm run typecheck` + targeted page render test (to add) | ❌ Wave 0 |
| UI-05 | Six-state taxonomy consistent on dashboard/detail/executive | unit | `npm run typecheck` + mapper tests (to add) | ❌ Wave 0 |
| UI-05 | Timeline human summary with technical drill-down | integration | `npm run typecheck` + timeline renderer test (to add) | ❌ Wave 0 |
| UI-05 | Global fixed and inline contextual action controls are consistent | integration/manual visual | `npm run quality` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run typecheck`
- **Per wave merge:** `npm run quality`
- **Phase gate:** `npm run quality` green and manual UX walkthrough on `/reporting`, `/reporting/[targetId]`, `/reporting/executive`.

### Wave 0 Gaps
- [ ] Add UI test framework (recommended: Vitest + React Testing Library for component/read-model validation). [ASSUMED]
- [ ] Add tests for taxonomy mapper (`src/reporting/read-models`).
- [ ] Add tests for timeline human-summary formatter (`src/reporting/timeline`).
- [ ] Add integration tests asserting global + inline action layout contracts.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Existing `assertAuthenticated` / `assertCertificatePermission` guards on reporting pages. [VERIFIED: reporting page sources] |
| V3 Session Management | yes | Existing auth/session path reused; no new session mechanism in UI-05 scope. [VERIFIED: reporting page sources + scope] |
| V4 Access Control | yes | Read models are principal-scoped and group-visibility constrained. [VERIFIED: read-model access paths + requirements history] |
| V5 Input Validation | yes | Existing `parseReportFilters` whitelists tabs/modes/event types and parses bounded types. [VERIFIED: src/reporting/query-state.ts] |
| V6 Cryptography | no (direct) | No new crypto logic in UI-05 scope. [VERIFIED: phase scope] |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Query-string tampering for unauthorized evidence view | Elevation of Privilege | Keep `assertCertificatePermission("detail.view", targetId)` and principal-scoped read models. [VERIFIED: src/app/reporting/[targetId]/page.tsx] |
| XSS via timeline/detail strings | Tampering | Keep React escaping and avoid `dangerouslySetInnerHTML` for human timeline copy. [VERIFIED: no such usage in reporting pages] |
| Information disclosure via mixed action links | Information Disclosure | Keep exports and detail pages behind existing auth guards and scoped fetches. [VERIFIED: reporting pages + read-model patterns] |

## Sources

### Primary (HIGH confidence)
- `src/reporting/read-models.ts` - dashboard/detail/executive read model composition, status logic, risk priority, derived-source summaries.
- `src/reporting/timeline.ts` - timeline event model and current copy structure.
- `src/app/reporting/page.tsx` - dashboard visibility/order/action patterns.
- `src/app/reporting/[targetId]/page.tsx` - detail diagnostics, tabs, timeline rendering, derived-source display.
- `src/app/reporting/executive/page.tsx` - executive alignment and derived-source aggregate rendering.
- `src/reporting/query-state.ts` - filter parsing/validation and query serialization.
- `src/components/ui/primitives.tsx` - reusable control/panel/status primitives.
- `src/i18n/index.ts` - current translation keys and reporting copy surface.
- `.planning/phases/31-dashboard-and-reporting/31-CONTEXT.md` - locked decisions and phase boundaries.
- `.planning/REQUIREMENTS.md` - UI-05 requirement text.
- `.planning/config.json` - nyquist validation enabled.
- npm registry (`npm view`) - current versions and modification timestamps for `next`, `react`, `react-dom`, `typescript`.

### Secondary (MEDIUM confidence)
- None.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - versions verified via npm registry and current codebase usage.
- Architecture: HIGH - recommendations anchored to existing reporting/read-model implementation.
- Pitfalls: MEDIUM - some UX implementation details require final planner/user choice.

**Research date:** 2026-05-13  
**Valid until:** 2026-06-12
