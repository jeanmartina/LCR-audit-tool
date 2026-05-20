# Phase 34: Release Clarity - Research

**Researched:** 2026-05-20  
**Domain:** Next.js operator UI release/version visibility  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
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

### Claude's Discretion
- Exact topbar visual treatment (badge/text style) as long as it remains operator-visible and stable.
- Exact endpoint payload shape, provided it is simple and read-only.

### Deferred Ideas (OUT OF SCOPE)
- Showing extended build metadata (short SHA or build timestamp) in the primary visible label.
- Dedicated release/changelog UI beyond version visibility.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-08 | The web UI should visibly show the running version or build identifier in an operator-facing location. | Topbar placement in shared shell/layout, `vX.Y.Z` formatting, and `/api/version` runtime endpoint with packaged verification flow. |
</phase_requirements>

## Summary

Phase 34 should be implemented as a small shared-shell enhancement plus one read-only API route: render a version badge in a global topbar component used by authenticated/operator pages, and expose `/api/version` that returns the same resolved value used by the UI. This directly satisfies D-01/D-02/D-04 and avoids per-page duplication. [VERIFIED: .planning/phases/34-release-clarity/34-CONTEXT.md] [VERIFIED: src/app/reporting/page.tsx] [VERIFIED: src/app/reporting/executive/page.tsx]

The current codebase has shared UI primitives (`StatusPill`, `PageShell`, `PageHeader`) and script-based validators as the standard quality gate. This means Phase 34 should extend existing patterns rather than adding a new test framework. [VERIFIED: src/components/ui/primitives.tsx] [VERIFIED: scripts/validate-reporting.js]

**Primary recommendation:** Implement a shared `Topbar`/shell-level version indicator sourced from a single server-side resolver and validate it with a new `validate-reporting.js` mode plus `/api/version` packaged runtime checks. [VERIFIED: .planning/phases/34-release-clarity/34-CONTEXT.md]

## Project Constraints (from CLAUDE.md)

No `CLAUDE.md` found at repository root, so there are no additional project-specific directives beyond phase/context/planning artifacts. [VERIFIED: workspace root listing]

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.6 | App Router UI + route handlers (`/api/version`) | Already primary framework in this repo and supports colocated route handlers. [VERIFIED: package.json] [VERIFIED: npm registry] |
| react | 19.2.6 | Shared UI composition for topbar indicator | Existing pages/components are React server/client components. [VERIFIED: package.json] [VERIFIED: npm registry] |
| typescript | 6.0.3 | Type-safe metadata resolver + endpoint payload | Project is TypeScript-first and compile-time checked. [VERIFIED: package.json] [VERIFIED: npm registry] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| none (built-in `Response.json`) | n/a | Return `/api/version` JSON payload | Use built-in Next/Fetch APIs; no dependency needed. [VERIFIED: src/app/api/settings/profile/route.ts] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| topbar badge | settings-only display | Fails D-01 operator-visible/stable placement expectation. [VERIFIED: .planning/phases/34-release-clarity/34-CONTEXT.md] |
| `/api/version` route | embed only in UI | Fails D-04 packaged-runtime verification surface. [VERIFIED: .planning/phases/34-release-clarity/34-CONTEXT.md] |

**Installation:**
```bash
# no new packages required
```

**Version verification:**  
- `next@16.2.6` published 2026-05-07T19:01:54.751Z. [VERIFIED: npm registry]  
- `react@19.2.6` published 2026-05-06T16:16:47.653Z. [VERIFIED: npm registry]  
- `typescript@6.0.3` published 2026-04-16T23:38:27.905Z. [VERIFIED: npm registry]

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── app/
│   ├── api/version/route.ts      # read-only runtime version endpoint
│   └── (shared shell entry)      # topbar composition point in shared layout/shell
├── components/
│   └── ui/primitives.tsx         # reuse StatusPill / styling primitives
└── app/(or lib)/version.ts       # single resolver for display/API value
```

### Pattern 1: Single Source for Version Resolution
**What:** One resolver function used by both UI and `/api/version`. [VERIFIED: D-04 + existing route patterns]  
**When to use:** Always; prevents mismatch between displayed and API values. [VERIFIED: D-04]  
**Example:**
```ts
export function resolveRuntimeVersion(): string | null {
  const pkgVersion = process.env.npm_package_version ?? null;
  if (!pkgVersion) return null;
  return `v${pkgVersion}`;
}
```
[ASSUMED]

### Pattern 2: Stable Operator Placement via Shared Shell
**What:** Render version indicator in global topbar/shell component, not page-local headers. [VERIFIED: D-01]  
**When to use:** All authenticated/operator flows (reporting, executive, detail). [VERIFIED: src/app/reporting/page.tsx] [VERIFIED: src/app/reporting/executive/page.tsx]  

### Anti-Patterns to Avoid
- **Per-page version rendering:** creates drift and misses pages. [VERIFIED: D-01]
- **Display build hashes/timestamps in primary label:** violates D-02. [VERIFIED: D-02]
- **Showing placeholder when missing metadata:** violates D-03; must hide indicator. [VERIFIED: D-03]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| topbar visual chip | bespoke component tree with custom tokens | existing `StatusPill` + primitive style tokens | Keeps consistency with Phase 33 UX system. [VERIFIED: src/components/ui/primitives.tsx] |
| API serialization layer | custom serializer package | `Response.json(...)` route handler pattern | Existing routes already use platform APIs. [VERIFIED: src/app/api/settings/profile/route.ts] |
| test harness | new Jest/Vitest setup | existing script validators (`scripts/validate-*.js`) | Current project validation standard is script-based. [VERIFIED: package.json] [VERIFIED: scripts/validate-reporting.js] |

**Key insight:** This phase is a shell + metadata wiring change; adding new libraries or frameworks increases risk without solving a real gap. [VERIFIED: phase scope + codebase patterns]

## Common Pitfalls

### Pitfall 1: UI Value and API Value Diverge
**What goes wrong:** topbar shows one value and `/api/version` returns another.  
**Why it happens:** separate resolution logic.  
**How to avoid:** one shared resolver imported by both surfaces.  
**Warning signs:** validator checks text fragments independently but not shared source.  
[ASSUMED]

### Pitfall 2: Indicator Disappears on Some Operator Routes
**What goes wrong:** visible in reporting page but not executive/detail pages.  
**Why it happens:** page-level insertion instead of shared shell insertion.  
**How to avoid:** place in global topbar/layout composition path.  
**Warning signs:** only one route file changed for UI surface.  
[VERIFIED: D-01] [VERIFIED: src/app/reporting/page.tsx] [VERIFIED: src/app/reporting/executive/page.tsx]

## Code Examples

Verified patterns from existing sources:

### Route Handler Response Pattern
```ts
export async function POST(request: Request): Promise<Response> {
  // ...
  return Response.json({ ok: true });
}
```
Source: [src/app/api/settings/profile/route.ts](../../src/app/api/settings/profile/route.ts) (pattern adapted from existing route; currently returns redirect). [VERIFIED: src/app/api/settings/profile/route.ts]

### Shared Status Pill Pattern
```ts
<StatusPill tone="neutral">v1.2.3</StatusPill>
```
Source: [src/components/ui/primitives.tsx](../../src/components/ui/primitives.tsx). [VERIFIED: src/components/ui/primitives.tsx]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| page-local headings/actions | shared primitives and consistent shell patterns | v1.4 UI phases (27-33) | Phase 34 should continue shell-level consistency. [VERIFIED: .planning/REQUIREMENTS.md] [VERIFIED: src/components/ui/primitives.tsx] |

**Deprecated/outdated:**
- New UI silos for simple metadata display are out of pattern for this codebase. [VERIFIED: Phase 33 consistency goal in requirements/state]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `process.env.npm_package_version` is reliably available in packaged runtime for web process. | Architecture Patterns | Indicator may hide unexpectedly in production; require explicit env injection fallback. |
| A2 | Shared shell insertion point for authenticated flows can be added without route-group refactor. | Architecture Patterns | Could expand phase scope if current layout split is stricter than assumed. |
| A3 | Validator should extend `scripts/validate-reporting.js` instead of adding a dedicated `validate-release-clarity.js`. | Validation Architecture | Minor maintainability tradeoff only. |

## Open Questions (RESOLVED)

1. **Authoritative runtime version source**
   - **Resolution:** Use `APP_VERSION` as the authoritative runtime source for both UI topbar display and `/api/version` payload; treat `package.json` version as build-time/default fallback only. This removes ambiguity in packaged/container runtime where `npm_package_version` may be unavailable.
   - **Implementation contract:** shared resolver order is `APP_VERSION` -> `package.json` version -> `null`; output must be normalized to `vX.Y.Z` per D-02, and indicator hidden when resolution returns `null` per D-03.
   - **Operational requirement:** packaged deployment/compose must inject `APP_VERSION` for deterministic runtime verification (D-04). [VERIFIED: package.json] [VERIFIED: .planning/phases/34-release-clarity/34-CONTEXT.md]

## Environment Availability

Step 2.6: SKIPPED (no new external dependencies identified).  
Phase 34 is code/config only in existing Next.js runtime; no additional service/CLI is required beyond current project toolchain. [VERIFIED: phase scope + existing stack]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Script-based validators + Next build/typecheck [VERIFIED: package.json] |
| Config file | none centralized (validator scripts in `scripts/`) [VERIFIED: scripts directory + package.json] |
| Quick run command | `node scripts/validate-reporting.js release-clarity` [ASSUMED] |
| Full suite command | `npm run validate && npm run typecheck && npm run build` [VERIFIED: package.json] |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-08 | Topbar shows `vX.Y.Z` on operator surface | static/contract script check | `node scripts/validate-reporting.js release-clarity` | ❌ Wave 0 |
| UI-08 | `/api/version` returns runtime value for packaged verification | route contract check | `node scripts/validate-reporting.js release-clarity` | ❌ Wave 0 |
| UI-08 | Packaged runtime can verify value without dev tools | packaging/doc proof check | `node scripts/validate-packaging.js docs` | ✅ |

### Sampling Rate
- **Per task commit:** `node scripts/validate-reporting.js release-clarity` [ASSUMED]
- **Per wave merge:** `npm run validate && npm run typecheck` [VERIFIED: package.json]
- **Phase gate:** `npm run build` plus validation suite green [VERIFIED: package.json]

### Wave 0 Gaps
- [ ] Extend `scripts/validate-reporting.js` with `release-clarity` mode for topbar indicator + `/api/version`.
- [ ] Add operator guide section documenting `/api/version` and UI location verification in packaged runtime.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (read-only metadata route can be public or auth-scoped by decision) | Keep payload non-sensitive (`vX.Y.Z` only). [VERIFIED: D-02] |
| V3 Session Management | no | No session mutation in this phase. [VERIFIED: phase scope] |
| V4 Access Control | low | If auth-gated, use existing `assertAuthenticated` pattern. [VERIFIED: src/app/api/settings/profile/route.ts] |
| V5 Input Validation | yes (minimal) | No user input accepted by `/api/version`. [VERIFIED: planned route contract] |
| V6 Cryptography | no | Not in scope. [VERIFIED: phase scope] |

### Known Threat Patterns for Next.js + operator UI metadata

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Accidental metadata overexposure (commit SHA/build internals) | Information Disclosure | Enforce strict visible format `vX.Y.Z` only. [VERIFIED: D-02] |
| Stale or spoofed UI text | Tampering | Resolve from server-side source, not client-provided value. [ASSUMED] |

## Sources

### Primary (HIGH confidence)
- `.planning/phases/34-release-clarity/34-CONTEXT.md` - locked decisions D-01..D-04 and scope.
- `.planning/REQUIREMENTS.md` - UI-08 requirement and milestone intent.
- `src/components/ui/primitives.tsx` - shared shell primitives and status pill pattern.
- `src/app/reporting/page.tsx` - operator page composition and current shared UI usage.
- `src/app/reporting/executive/page.tsx` - second operator surface for stability checks.
- `src/app/api/settings/profile/route.ts` - route-handler conventions.
- `scripts/validate-reporting.js` - current script-based validator approach.
- `package.json` - project scripts/dependency baseline.
- npm registry (`npm view next/react/typescript version time --json`) - current versions and publish dates.

### Secondary (MEDIUM confidence)
- none.

### Tertiary (LOW confidence)
- none.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - confirmed via repository and npm registry.
- Architecture: HIGH - directly constrained by locked decisions and existing code layout.
- Pitfalls: MEDIUM - mostly inference from implementation patterns.

**Research date:** 2026-05-20  
**Valid until:** 2026-06-19
