# Phase 33: Global UX Consistency - Research

**Researched:** 2026-05-19  
**Domain:** Cross-screen UX system unification (Next.js App Router + shared UI primitives)  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
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

### Deferred Ideas (OUT OF SCOPE)
- Full redesign to sidebar-only navigation (out of scope for this phase's chosen hybrid model).
- Expanded motion/animation system beyond consistency cleanup.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-07 | The application should use one modern, consistent UX language across all major screens and navigation. | Shared primitives-first rollout, hybrid nav normalization, and action/empty-state contracts across reporting/settings/admin/public shells. |
</phase_requirements>

## Summary

The codebase already has a viable UX foundation (`PageShell`, `PageHeader`, `Panel`, `ActionGroup`, `ActionLink`, `Notice`, `EmptyState`, `StatusPill`), but major screens still mix this with page-local inline styles and ad-hoc control patterns. [VERIFIED: src/components/ui/primitives.tsx, src/app/reporting/page.tsx, src/app/admin/certificates/page.tsx]

For UI-07, planning should focus on enforcing contracts rather than redesigning from scratch: one spacing scale, one action hierarchy mapping, one hybrid nav model (top-level route actions + local sub-nav tabs/chips), and one empty/error composition pattern. [VERIFIED: .planning/phases/33-global-ux-consistency/33-CONTEXT.md]

Current frontend/runtime versions are modern and suitable: Next `16.2.2` installed, React `19.2.4` installed, Tailwind `4.2.2`, TypeScript `6.0.2`; npm shows newer patch/minor releases available for several packages, so phase scope should avoid framework migration and stay UX-focused. [VERIFIED: package.json, npm registry]

**Primary recommendation:** Implement a “primitives-only surface contract” for all major screens and treat any raw inline action/empty/nav pattern as non-compliant debt to be replaced in this phase. [VERIFIED: codebase review]

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.2 (installed), 16.2.6 latest | App Router layout/shell composition | Current app already uses App Router layouts/pages; best fit for global shell changes. [VERIFIED: package.json, src/app/layout.tsx, npm registry] |
| react / react-dom | 19.2.4 (installed), 19.2.6 latest | Component model for reusable primitives | Existing primitives and routes are React Server Component-first. [VERIFIED: package.json, src/components/ui/primitives.tsx, npm registry] |
| typescript | 6.0.2 (installed), 6.0.3 latest | Typed UI contracts and refactors | Needed to enforce shared prop contracts safely across all screens. [VERIFIED: package.json, npm registry] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwindcss | 4.2.2 (installed), 4.3.0 latest | Utility styling option | Use only if already wired in specific screens; do not mix style paradigms within same surface. [VERIFIED: package.json, npm registry] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Existing primitives-first strategy | New design system library migration | Larger risk/scope; conflicts with phase goal of consistency cleanup, not stack migration. [VERIFIED: phase scope + existing primitives] |

**Installation:**
```bash
npm install
```

**Version verification (npm):**
- `next@16.2.6` published `2026-05-07T19:01:54.751Z`. [VERIFIED: npm registry]
- `react@19.2.6` published `2026-05-06T16:16:47.653Z`. [VERIFIED: npm registry]
- `tailwindcss@4.2.2` published `2026-03-18T16:12:50.031Z`; latest is `4.3.0`. [VERIFIED: npm registry]
- `typescript@6.0.2` published `2026-03-23T16:14:45.521Z`; latest is `6.0.3`. [VERIFIED: npm registry]

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── components/ui/        # shared primitives and style contracts
├── app/.../page.tsx      # screen composition only
└── app/layout.tsx        # global theme tokens and app shell
```

### Pattern 1: Primitive-First Page Composition
**What:** Build screens from `PageShell` + `PageHeader` + `Panel` + `ActionGroup/ActionLink` + `Notice/EmptyState` and avoid local one-off action widgets. [VERIFIED: src/components/ui/primitives.tsx]  
**When to use:** Every major surface (reporting, settings, admin, public entry) during Phase 33. [VERIFIED: 33-CONTEXT canonical refs]

### Pattern 2: Hybrid Navigation Contract
**What:** Keep global route actions in shell/header and local area navigation as tabs/chips per section (settings already demonstrates this). [VERIFIED: src/components/public-shell.tsx, src/app/settings/settings-page.tsx]  
**When to use:** Any screen with both cross-area navigation and intra-area sections.

### Pattern 3: Action Hierarchy Mapping
**What:** Map D-02 directly in code:
- Primary: `ActionLink tone="primary"` or primary submit button.
- Secondary: default `ActionLink`.
- Tertiary: plain contextual text link.  
[VERIFIED: src/components/ui/primitives.tsx, 33-CONTEXT D-02]

### Anti-Patterns to Avoid
- **Inline action style islands:** pages defining custom button/link styles that bypass shared primitives. [VERIFIED: src/app/reporting/page.tsx, src/app/admin/certificates/page.tsx]
- **Mixed empty/error composition:** ad-hoc state messages without standardized message + primary action + recovery link pattern. [VERIFIED: 33-CONTEXT D-04 + page usage review]
- **Typography drift:** root layout uses `Arial, sans-serif`, so introducing another arbitrary font per page breaks coherence. [VERIFIED: src/app/layout.tsx]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-page shells | Per-page bespoke wrappers | `PageShell` + `PageHeader` | Prevents spacing/header drift. [VERIFIED: primitives + current pages] |
| Action hierarchy | One-off styled buttons | `ActionGroup`, `ActionLink`, shared primary button | Enforces D-02 globally. [VERIFIED: primitives + D-02] |
| Empty/error messaging | Custom ad-hoc blocks | `EmptyState` + `Notice` + standard action row | Enforces D-04 and consistent recovery UX. [VERIFIED: primitives + D-04] |

**Key insight:** Consistency risk is mostly composition drift, not missing components; planning should prioritize replacement/migration tasks over new UI invention. [VERIFIED: codebase review]

## Common Pitfalls

### Pitfall 1: “Primitives exist, but pages bypass them”
**What goes wrong:** Teams add local inline styles for speed and silently diverge hierarchy/spacing. [VERIFIED: reporting/admin pages]  
**How to avoid:** Add explicit implementation rule: no new local action/empty/nav styles where primitive exists.

### Pitfall 2: Incomplete rollout
**What goes wrong:** Reporting is cleaned, but admin/settings/public remain inconsistent, failing UI-07 “without exception”. [VERIFIED: UI-07 wording in REQUIREMENTS.md]  
**How to avoid:** Plan by surface inventory and require verification checklist per major route family.

### Pitfall 3: Density overcorrection
**What goes wrong:** Compact target turns into cramped, low-legibility controls. [ASSUMED]  
**How to avoid:** lock minimum tap/click size and consistent rhythm tokens before rollout. [ASSUMED]

## Code Examples

### Shared action hierarchy usage
```tsx
<ActionGroup>
  <ActionLink href="/reporting/executive" tone="primary">Open Executive</ActionLink>
  <ActionLink href="/reporting/export/dashboard.csv">Export CSV</ActionLink>
  <a href="/settings" style={{ color: "var(--link-color)" }}>Settings</a>
</ActionGroup>
```
Source pattern: `src/app/reporting/page.tsx` + `src/components/ui/primitives.tsx`. [VERIFIED: codebase]

### Local sub-navigation pattern
```tsx
<nav aria-label={t("settings.tabs.label")}>
  <Link href="/settings?tab=preferences" aria-current="page">Preferences</Link>
  <Link href="/settings?tab=groups">Groups</Link>
</nav>
```
Source pattern: `src/app/settings/settings-page.tsx`. [VERIFIED: codebase]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Screen-specific UX patterns | Shared primitives + shell-level theming | v1.2+ and ongoing | Enables global consistency enforcement with lower refactor cost. [VERIFIED: STATE.md decisions + primitives] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Compact density can remain usable with stricter min control sizes | Common Pitfalls | Could create touch/scanability regressions if not validated with real screens |

## Open Questions (RESOLVED)

1. **Should Phase 33 include public auth entry (`/` and `/auth`) in the same pass as reporting/settings/admin?**
   - Resolution: **Yes** — public entry and auth entry are **in scope in this phase**. [RESOLVED]
   - Basis: UI-07 requires one consistent UX language across major screens, and `PublicShell` is a canonical shared surface in current architecture. [VERIFIED: .planning/REQUIREMENTS.md, src/components/public-shell.tsx, .planning/phases/33-global-ux-consistency/33-CONTEXT.md]
   - Planning impact: both `33-01-PLAN.md` and `33-02-PLAN.md` already include `/` and `/auth` coverage, so no replan is required.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified beyond existing project Node/npm toolchain for this UX consistency phase). [VERIFIED: phase scope]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Custom Node validator scripts (`scripts/validate-*.js`) |
| Config file | none (script-driven validation) |
| Quick run command | `node scripts/validate-ui-guidance.js` |
| Full suite command | `npm run validate` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-07 | One consistent UX language across major screens/navigation | integration + manual UX audit | `npm run validate` plus route-by-route UAT checklist | ✅ |

### Sampling Rate
- **Per task commit:** `node scripts/validate-ui-guidance.js`
- **Per wave merge:** `npm run validate`
- **Phase gate:** `npm run validate` + manual multi-screen UX walkthrough

### Wave 0 Gaps
- [ ] Add/extend a dedicated Phase 33 validator (for action hierarchy + nav + empty/error contract checks) if current scripts do not assert all D-01..D-04 rules explicitly. [VERIFIED: scripts/validate-all.js includes UI checks but no Phase-33-specific script name]

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Existing auth guards (`assertAuthenticated`, permission checks) remain required on all protected screens. [VERIFIED: reporting/admin/settings pages] |
| V3 Session Management | yes | Preserve existing session-based principal resolution in layout/routes. [VERIFIED: src/app/layout.tsx auth calls] |
| V4 Access Control | yes | Keep per-route authorization checks unchanged while refactoring UX. [VERIFIED: `assertAuthenticated`, `assertCertificatePermission`] |
| V5 Input Validation | yes | Keep server-side route validation and avoid trusting UI state transitions. [VERIFIED: existing validate scripts + route patterns] |
| V6 Cryptography | no direct change | No new crypto in this phase. [VERIFIED: phase scope] |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Broken access control during UI route refactor | Elevation of privilege | Keep existing auth/permission guards in every refactored page. [VERIFIED: current patterns] |
| Unsafe link/action rewiring | Tampering | Prefer framework `Link` + server-enforced handlers; no client-only trust. [VERIFIED: current code patterns] |

## Sources

### Primary (HIGH confidence)
- Local codebase:
  - `src/components/ui/primitives.tsx`
  - `src/app/layout.tsx`
  - `src/components/public-shell.tsx`
  - `src/app/reporting/page.tsx`
  - `src/app/reporting/[targetId]/page.tsx`
  - `src/app/reporting/executive/page.tsx`
  - `src/app/settings/settings-page.tsx`
  - `src/app/admin/trust-lists/page.tsx`
  - `src/app/admin/certificates/page.tsx`
  - `scripts/validate-all.js`
  - `scripts/validate-reporting.js`
  - `.planning/phases/33-global-ux-consistency/33-CONTEXT.md`
  - `.planning/REQUIREMENTS.md`
  - `.planning/config.json`
- npm registry metadata:
  - `npm view next version`, `npm view next time --json`
  - `npm view react version`, `npm view react time --json`
  - `npm view tailwindcss version`, `npm view tailwindcss time --json`
  - `npm view typescript version`, `npm view typescript time --json`

### Secondary (MEDIUM confidence)
- None.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified directly from `package.json` and npm registry live metadata.
- Architecture: HIGH - derived from canonical referenced files and existing shared primitives.
- Pitfalls: MEDIUM - code-backed drift is verified; one usability caution remains assumed.

**Research date:** 2026-05-19  
**Valid until:** 2026-06-18
