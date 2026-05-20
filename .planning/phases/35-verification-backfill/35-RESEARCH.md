# Phase 35: Verification Backfill - Research

**Researched:** 2026-05-20  
**Domain:** Milestone governance backfill (phase verification artifacts + requirement traceability closure)  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Backfill policy
- **D-01:** This phase must not re-implement product features from phases 27-29; it only closes verification/audit evidence gaps.

### Verification artifact scope
- **D-02:** Create phase-level VERIFICATION artifacts for 27, 28, and 29 based on existing plan+summary evidence and current codebase behavior.

### Requirement closure target
- **D-03:** UI-01, UI-02, UI-03 must end with explicit verification status and evidence references.

### Claude's Discretion
- Exact report wording and evidence-table formatting in backfilled verification docs.

### Deferred Ideas (OUT OF SCOPE)
- Any product-surface redesign or new behavior changes (out of scope).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-01 | Public landing/auth shell should present modern branded entry with visible login, enabled providers only, top-left language selector, and modern nav. | Backfill 27-VERIFICATION using `27-01-SUMMARY.md`, current `src/app/page.tsx`, `src/app/auth/page.tsx`, `src/components/public-shell.tsx`, and deterministic validator outputs. |
| UI-02 | Settings/admin organized into clear sections with contextual technical hints. | Backfill 28-VERIFICATION by aggregating all 28 plan summaries + current settings/admin route/state evidence + validators for auth/settings/trust-list admin. |
| UI-03 | Trust-list screens show hierarchy/metadata/diagnostics, support safe removal, and precise failure explanations. | Backfill 29-VERIFICATION from 29 summaries + current trust-list diagnostics/detail routes + trust-list validator suite + archive/delete safety evidence. |
</phase_requirements>

## Summary

Phase 35 is a documentation/evidence closure phase, not a feature phase. The milestone audit explicitly marks `UI-01`, `UI-02`, and `UI-03` as partial only because phases 27/28/29 have summaries but no phase-level `VERIFICATION.md` artifacts. [VERIFIED: `.planning/v1.4-MILESTONE-AUDIT.md`]  

The standard pattern to follow already exists in phases 30-34: each phase-level `VERIFICATION.md` records truths, artifacts, wiring, data-flow, behavioral checks, requirement coverage, anti-pattern scan, and human-verification status. [VERIFIED: `.planning/phases/30-import-review-and-safety/30-VERIFICATION.md`, `.planning/phases/31-dashboard-and-reporting/31-VERIFICATION.md`, `.planning/phases/32-executive-pdf/32-VERIFICATION.md`, `.planning/phases/33-global-ux-consistency/33-VERIFICATION.md`, `.planning/phases/34-release-clarity/34-VERIFICATION.md`]  

Primary execution risk is governance drift (requirements table/status not synchronized with verification output), not implementation risk. [VERIFIED: `.planning/v1.4-MILESTONE-AUDIT.md`, `.planning/REQUIREMENTS.md`]

**Primary recommendation:** Produce `27-VERIFICATION.md`, `28-VERIFICATION.md`, and `29-VERIFICATION.md` using current code + existing validators as evidence anchors, then update requirement traceability/status in one atomic pass. [VERIFIED: `.planning/v1.4-MILESTONE-AUDIT.md`]

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | 16.2.6 | App routes/components used as verification evidence targets | Existing app runtime and route structure are Next-based, so evidence must reference these artifacts directly. [VERIFIED: npm registry + `package.json`] |
| `react` | 19.2.6 | UI component layer for all UI-01/02/03 surfaces | Public shell/settings/trust-list screens are implemented as React components. [VERIFIED: npm registry + source files] |
| `typescript` | 6.0.3 | Type-safe static verification (`npm run typecheck`) | Existing milestone verification pattern relies on typecheck as baseline gate. [VERIFIED: npm registry + `package.json` scripts] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js runtime | v22.22.2 | Runs deterministic validation scripts under `scripts/` | Use for all behavioral spot-check evidence in backfilled verification docs. [VERIFIED: local `node --version`] |
| npm CLI | 11.12.1 | Runs `validate/typecheck/build` workflows | Use when recording reproducible verifier commands in each backfilled report. [VERIFIED: local `npm --version`] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Script-backed evidence from current repo | Narrative-only summary backfill | Not acceptable for audit closure; lacks deterministic proof and repeats current gap. [VERIFIED: milestone audit gap description] |

**Installation:**
```bash
npm install
```

**Version verification:**
```bash
npm view next version
npm view react version
npm view typescript version
```
Observed on 2026-05-20: `next@16.2.6`, `react@19.2.6`, `typescript@6.0.3`. [VERIFIED: npm registry]

## Architecture Patterns

### Recommended Project Structure
```text
.planning/phases/
├── 27-public-shell-and-identity/
│   ├── 27-01-PLAN.md
│   ├── 27-01-SUMMARY.md
│   └── 27-VERIFICATION.md        # create in Phase 35
├── 28-settings-and-administration/
│   ├── 28-0x-PLAN.md / SUMMARY.md
│   └── 28-VERIFICATION.md        # create in Phase 35
└── 29-trust-lists-and-diagnostics/
    ├── 29-0x-PLAN.md / SUMMARY.md
    └── 29-VERIFICATION.md        # create in Phase 35
```

### Pattern 1: Verifier-Style Phase Report
**What:** Mirror phase 30+ verification format (truth table, artifact table, link verification, data-flow trace, behavioral checks, requirement coverage). [VERIFIED: 30-34 VERIFICATION files]  
**When to use:** For all backfilled phase-level verification docs in 27/28/29.  
**Example:** Use deterministic checks like:
```bash
node scripts/validate-trust-list-foundation.js
node scripts/validate-trust-list-operator-ux.js
node scripts/validate-all.js
npm run typecheck
```
Source: repository validators and prior verification reports. [VERIFIED: `scripts/`, `29-02-SUMMARY.md`, `30-VERIFICATION.md`]

### Pattern 2: Three-Source Requirement Closure
**What:** Mark requirement satisfied only when traceability row, phase verification, and evidence links align. [VERIFIED: `v1.4-MILESTONE-AUDIT.md`]  
**When to use:** Closing UI-01/UI-02/UI-03 governance drift.  

### Anti-Patterns to Avoid
- **Backfill-by-assertion:** Declaring “passed” without command output or source references. [VERIFIED: phase context + audit gap]
- **Feature drift during backfill:** Editing UI behavior while writing verification docs. [VERIFIED: D-01 locked decision]
- **Single-artifact evidence:** Using summary-only evidence without checking current code/validators. [VERIFIED: audit findings]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UI requirement verification | New ad-hoc checker scripts for Phase 35 only | Existing `scripts/validate-*.js` suite + `npm run typecheck/build` | Existing scripts already encode phase contracts and reduce false claims. [VERIFIED: `scripts/` + prior phase reports] |
| Verification report format | New custom markdown schema | Reuse 30-34 verification schema | Keeps milestone evidence consistent and planner/verifier-friendly. [VERIFIED: 30-34 VERIFICATION files] |

**Key insight:** Phase 35 should compose existing evidence channels, not invent new verification mechanics. [VERIFIED: context D-01/D-02]

## Common Pitfalls

### Pitfall 1: Requirements status drift after writing verification
**What goes wrong:** `REQUIREMENTS.md` remains unchecked/planned after artifacts are backfilled. [VERIFIED: `v1.4-MILESTONE-AUDIT.md`, `REQUIREMENTS.md`]  
**How to avoid:** Update requirement status/traceability in same execution wave as verification file creation. [VERIFIED: audit integration failure text]

### Pitfall 2: Evidence from stale code state
**What goes wrong:** Report cites summary claims not validated against current files. [VERIFIED: context “preserve implementation truth”]  
**How to avoid:** Every truth line references current file paths and validator commands.

### Pitfall 3: Nyquist mismatch
**What goes wrong:** Phase-level verification exists but validation strategy files remain draft/non-compliant. [VERIFIED: audit nyquist section + 29/31/32/33 validation frontmatter]  
**How to avoid:** Plan follow-up to align 27/28/29 validation compliance after backfill artifacts are written.

## Code Examples

Verified evidence-command pattern:
```bash
# Phase-level deterministic anchors
node scripts/validate-all.js
node scripts/validate-auth-foundation.js auth
node scripts/validate-trust-list-foundation.js
node scripts/validate-trust-list-operator-ux.js
npm run typecheck
```
Source: prior summaries and scripts directory. [VERIFIED: `28-02-SUMMARY.md`, `28-03-SUMMARY.md`, `29-02-SUMMARY.md`, `scripts/`]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Summary-only completion for 27-29 | Summary + explicit phase-level VERIFICATION artifact | By 2026-05-20 audit baseline | Enables auditable closure and requirement-level evidence. [VERIFIED: `v1.4-MILESTONE-AUDIT.md`] |

**Deprecated/outdated:**
- Treating `requirements-completed` in summary frontmatter as sufficient proof. [VERIFIED: audit requirement table]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Planner/verifier for Phase 35 should mirror 30-34 verification schema exactly rather than a reduced variant. [ASSUMED] | Architecture Patterns | Medium: inconsistent format may still pass but reduce governance consistency. |

## Open Questions

1. **Should Phase 35 also update `REQUIREMENTS.md` checkbox states, or only produce verification files?**
   - What we know: Audit calls out both missing verification and requirements-status drift. [VERIFIED: `v1.4-MILESTONE-AUDIT.md`]
   - What's unclear: Whether scope owner wants requirement row edits in this phase or a separate governance patch.
   - Recommendation: Include requirement-status reconciliation in Phase 35 plan as explicit task, unless user locks it out.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `node` | Validator execution and evidence capture | ✓ | v22.22.2 | — |
| `npm` | Script orchestration (`validate/typecheck/build`) | ✓ | 11.12.1 | — |

**Missing dependencies with no fallback:**
- None. [VERIFIED: local runtime checks]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Script-based validators + TypeScript compiler checks [VERIFIED: `package.json`, `scripts/`] |
| Config file | `package.json` scripts + per-validator script files [VERIFIED: `package.json`, `scripts/`] |
| Quick run command | `npm run typecheck` |
| Full suite command | `npm run validate && npm run typecheck && npm run build` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-01 | Public shell + auth entry contract still present in current code | script/static contract | `node scripts/validate-first-run-onboarding.js && npm run typecheck` | ✅ |
| UI-02 | Settings/admin sectionized and lifecycle wiring still valid | script/static contract | `node scripts/validate-auth-foundation.js auth && npm run typecheck` | ✅ |
| UI-03 | Trust-list hierarchy/diagnostics/remove safeguards remain valid | script/static contract | `node scripts/validate-trust-list-foundation.js && node scripts/validate-trust-list-operator-ux.js && npm run typecheck` | ✅ |

### Sampling Rate
- **Per task commit:** `npm run typecheck`
- **Per wave merge:** `npm run validate && npm run typecheck`
- **Phase gate:** `npm run validate && npm run typecheck && npm run build`

### Wave 0 Gaps
- None — existing test infrastructure covers Phase 35 verification-backfill needs. [VERIFIED: `scripts/`, `package.json`]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | N/A (no auth behavior changes in this phase) [VERIFIED: D-01] |
| V3 Session Management | no | N/A (no session-path edits in scope) [VERIFIED: D-01] |
| V4 Access Control | no | N/A (no policy/runtime auth mutation in scope) [VERIFIED: D-01] |
| V5 Input Validation | yes | Preserve validator-driven evidence integrity and no fabricated outputs [VERIFIED: context specifics + existing validation pattern] |
| V6 Cryptography | no | N/A (no cryptographic flow changes) [VERIFIED: D-01] |

### Known Threat Patterns for this phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Evidence fabrication or unverifiable claims | Repudiation | Require command-backed proofs and file-path citations in each verification truth table. |
| Governance drift after updates | Tampering | Reconcile verification files and requirements status in same change set. |

## Sources

### Primary (HIGH confidence)
- `.planning/phases/35-verification-backfill/35-CONTEXT.md` - locked decisions and scope  
- `.planning/v1.4-MILESTONE-AUDIT.md` - identified gaps and governance failures  
- `.planning/REQUIREMENTS.md` - UI-01/UI-02/UI-03 definitions and traceability rows  
- `.planning/phases/27-public-shell-and-identity/27-01-SUMMARY.md` - UI-01 implementation summary evidence  
- `.planning/phases/28-settings-and-administration/28-01-SUMMARY.md`  
- `.planning/phases/28-settings-and-administration/28-02-SUMMARY.md`  
- `.planning/phases/28-settings-and-administration/28-03-SUMMARY.md`  
- `.planning/phases/28-settings-and-administration/28-04-SUMMARY.md`  
- `.planning/phases/29-trust-lists-and-diagnostics/29-01-SUMMARY.md`  
- `.planning/phases/29-trust-lists-and-diagnostics/29-02-SUMMARY.md`  
- `.planning/phases/30-import-review-and-safety/30-VERIFICATION.md`  
- `.planning/phases/31-dashboard-and-reporting/31-VERIFICATION.md`  
- `.planning/phases/32-executive-pdf/32-VERIFICATION.md`  
- `.planning/phases/33-global-ux-consistency/33-VERIFICATION.md`  
- `.planning/phases/34-release-clarity/34-VERIFICATION.md`  
- `package.json` and local runtime commands (`node --version`, `npm --version`)  
- npm registry package pages: https://www.npmjs.com/package/next , https://www.npmjs.com/package/react , https://www.npmjs.com/package/typescript

### Secondary (MEDIUM confidence)
- None.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - versions and scripts verified locally and via npm registry.
- Architecture: HIGH - based on existing in-repo verification patterns and audit findings.
- Pitfalls: HIGH - directly evidenced by milestone audit and current artifact state.

**Research date:** 2026-05-20  
**Valid until:** 2026-06-19
