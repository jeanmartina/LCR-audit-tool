# Phase 32: Executive PDF - Research

**Researched:** 2026-05-19  
**Domain:** Executive PDF generation for Next.js reporting  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Report visual language
- **D-01:** Use a classic corporate appearance for the executive PDF (clean and sober typography, simple tables/lists, restrained visual decoration).

### Fixed section order
- **D-02:** Use this exact section order in the executive PDF: cover/scope -> executive summary -> derived source status -> top risks -> trend -> final notes.

### Unicode and accent safety gate
- **D-03:** Unicode/accent rendering is a hard gate: release is blocked if executive PDF output shows broken characters.

### Read-model parity
- **D-04:** Executive PDF must use exactly the same underlying executive read model and fields as the web executive view; no parallel data logic.

### Claude's Discretion
- Minor typography sizing/spacing values within the selected corporate style.
- Exact wording of final notes section while preserving executive tone.

### Deferred Ideas (OUT OF SCOPE)
- Rich chart-heavy visual redesign for executive PDF beyond the selected conservative corporate style.
- Any independent PDF data pipeline differing from the web executive read model.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-06 | Executive PDF should be professional, Unicode-safe, fixed-section, and share web executive read model | Reuse `buildExecutiveSummary()` for parity; replace hand-rolled PDF text writer with standard renderer and registered Unicode fonts; lock section order at template layer; add Unicode-focused validation checks. |
</phase_requirements>

## Summary

Current executive PDF generation already uses the same read-model entrypoint as the web executive view (`buildExecutiveSummary(filters, principal)`), which directly supports the UI-06 parity requirement. [VERIFIED: codebase grep `src/exports/pdf.ts`, `src/app/reporting/executive/page.tsx`]  
Current risk is the PDF engine: HTML is stripped to plain text and rendered with a hand-built PDF stream using Type1 Helvetica (`/BaseFont /Helvetica`). This design is not a robust Unicode strategy and is the most likely source of accent/Unicode regressions. [VERIFIED: `src/exports/pdf-engine.js`]

Primary implementation direction should be: keep the existing read-model and export route contracts, but replace the byte-level hand-rolled writer with a standard PDF renderer that supports explicit font registration and real layout primitives. [VERIFIED: `src/exports/pdf.ts`; CITED: https://react-pdf.org/fonts; CITED: https://react-pdf.org/node]  
This phase should be template-and-renderer focused, not data-model focused. [VERIFIED: code path reuse in `buildExecutiveSummary()`]

**Primary recommendation:** Adopt `@react-pdf/renderer` with registered TTF font family for Unicode-safe output and implement the fixed executive section sequence in one dedicated executive document component. [CITED: https://react-pdf.org/fonts; CITED: https://react-pdf.org/node; VERIFIED: npm registry]

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@react-pdf/renderer` | `4.5.1` | Server-side PDF rendering with structured layout | Supports Node buffer rendering and font registration for controlled Unicode-safe output. [VERIFIED: npm registry; CITED: https://react-pdf.org/node; CITED: https://react-pdf.org/fonts] |
| Existing `buildExecutiveSummary` read model | in-repo | Single source of executive data | Already shared by web executive view and PDF export flow. [VERIFIED: `src/reporting/read-models.ts`, `src/app/reporting/executive/page.tsx`, `src/exports/pdf.ts`] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react` | `19.2.4` | JSX document composition for PDF component | Required by `@react-pdf/renderer`; already present. [VERIFIED: `package.json`] |
| `next` | `16.2.2` | Existing route/auth integration | Keep current route behavior (`application/pdf`, auth-scoped filters). [VERIFIED: `src/app/reporting/export/executive.pdf/route.ts`, `package.json`] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@react-pdf/renderer` | Keep hand-rolled `pdf-engine.js` | Fastest short-term but high Unicode/layout risk and ongoing maintenance burden. [VERIFIED: `src/exports/pdf-engine.js`] |
| `@react-pdf/renderer` | `pdf-lib` + custom layout engine | Powerful low-level API, but requires hand-building pagination/layout system for professional report styling. [CITED: https://pdf-lib.js.org/docs/api/index.html] |

**Installation:**
```bash
npm install @react-pdf/renderer
```

**Version verification (2026-05-19):**
- `@react-pdf/renderer`: latest `4.5.1`, published `2026-04-15`. [VERIFIED: npm registry via `npm view @react-pdf/renderer version time --json`]
- `pdf-lib`: latest `1.17.1`, published `2021-11-06` (stale for this use case as primary recommendation). [VERIFIED: npm registry via `npm view pdf-lib version time --json`]

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── exports/
│   ├── pdf.ts                         # orchestration + read-model assembly
│   ├── executive-pdf-document.tsx     # NEW: fixed executive PDF component
│   └── pdf-engine.ts                  # NEW or refactor: renderer adapter
└── app/reporting/export/executive.pdf/route.ts  # existing delivery route
```

### Pattern 1: Single Read Model, Dual Presentation
**What:** Keep one executive read model (`buildExecutiveSummary`) and map it to both web and PDF surfaces. [VERIFIED: codebase]  
**When to use:** Always for executive export changes in this phase.  
**Example:** `buildExecutiveSummary(filters, principal)` is already used in web page and PDF builder. [VERIFIED: `src/app/reporting/executive/page.tsx`, `src/exports/pdf.ts`]

### Pattern 2: Fixed Section Contract in Renderer
**What:** Encode section order in one render function/component with no conditional reordering. [ASSUMED]  
**When to use:** For D-02 deterministic executive layout.  
**Example order:** scope -> summary -> derived source status -> top risks -> trend -> final notes. [VERIFIED: `32-CONTEXT.md`]

### Anti-Patterns to Avoid
- **Hand-rolled PDF byte streams for business reports:** hard to maintain for Unicode, typography, spacing, and pagination quality. [VERIFIED: `src/exports/pdf-engine.js`]
- **Parallel data logic for PDF only:** violates D-04 and creates drift from web executive view. [VERIFIED: `32-CONTEXT.md`]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF object/xref/text stream builder | Manual `%PDF-1.4` assembly and Type1 text placement | `@react-pdf/renderer` Node render API | Eliminates fragile low-level PDF mechanics and improves layout/font control. [CITED: https://react-pdf.org/node; VERIFIED: `src/exports/pdf-engine.js`] |
| Unicode font fallback behavior | Custom ad-hoc character escaping only | Registered TTF family via `Font.register` | Explicit font registration is the standard control point for broad glyph support. [CITED: https://react-pdf.org/fonts] |

**Key insight:** UI-06 quality bar is report-like presentation plus Unicode reliability, which is a rendering concern, not a read-model concern. [VERIFIED: phase goal + existing shared read model]

## Common Pitfalls

### Pitfall 1: “Unicode-safe” claim without font registration
**What goes wrong:** Accents/Unicode render inconsistently despite passing basic English tests. [CITED: https://react-pdf.org/fonts; VERIFIED: current engine uses Helvetica Type1]  
**Why it happens:** Default/base fonts and plain-text conversion path are not a full glyph strategy. [VERIFIED: `src/exports/pdf-engine.js`]  
**How to avoid:** Register explicit TTF fonts (regular/bold/italic) and add fixture text with `pt-BR` and `es` accented strings in validation. [CITED: https://react-pdf.org/fonts; ASSUMED]  
**Warning signs:** Replacement glyphs, missing accents, or mismatched text between web and PDF export. [ASSUMED]

### Pitfall 2: Section drift between template and requirement
**What goes wrong:** Executive PDF gains/loses/reorders sections over time. [ASSUMED]  
**Why it happens:** Template edits without explicit order checks. [ASSUMED]  
**How to avoid:** Add deterministic order assertions in `scripts/validate-reporting.js` for D-02 anchors. [VERIFIED: validation architecture already script-driven]  
**Warning signs:** Validator passes but leadership cannot find expected sections predictably. [ASSUMED]

### Pitfall 3: Data parity regressions
**What goes wrong:** PDF numbers differ from web executive view for same filters/principal. [ASSUMED]  
**Why it happens:** Derived values recomputed separately in PDF path. [ASSUMED]  
**How to avoid:** Keep PDF builder as pure formatter over `buildExecutiveSummary` output only. [VERIFIED: existing pattern in `src/exports/pdf.ts`]  
**Warning signs:** Inconsistent counts/risks between `/reporting/executive` and exported PDF. [ASSUMED]

## Code Examples

### Shared read-model parity (existing)
```ts
// Source: src/exports/pdf.ts
const summary = await buildExecutiveSummary(filters, principal);
```
[VERIFIED: codebase]

### Node-side PDF rendering target API (recommended stack)
```ts
// Source concept: react-pdf Node API
import { renderToBuffer } from '@react-pdf/renderer';
const bytes = await renderToBuffer(<ExecutivePdfDocument summary={summary} />);
```
[CITED: https://react-pdf.org/node]

### Font registration for Unicode-capable output
```ts
// Source concept: react-pdf fonts docs
import { Font } from '@react-pdf/renderer';
Font.register({ family: 'NotoSans', src: '/absolute/path/NotoSans-Regular.ttf' });
```
[CITED: https://react-pdf.org/fonts]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hand-crafted PDF syntax + text extraction (`stripHtmlToText`) | Component/layout-driven rendering engines with explicit font registration | Modern Node PDF workflows (current ecosystem norm) | Higher fidelity report layout and safer multilingual output. [CITED: https://react-pdf.org; VERIFIED: current codebase old approach] |

**Deprecated/outdated in this context:**
- Byte-level PDF writing for product-report UI workstreams (high maintenance, low layout agility). [ASSUMED]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | React-pdf + registered TTF will cover all needed Portuguese/Spanish executive text without additional fallback chain | Common Pitfalls / Recommendation | Medium: might still miss niche glyphs and require broader font family |
| A2 | Fixed-section validator anchors should be added in `validate-reporting.js` rather than new test framework | Common Pitfalls / Validation | Low: could move to another existing script if preferred |
| A3 | “Professional appearance” can be met without charts by typography/spacing/list hierarchy only | Summary / Architecture | Medium: stakeholder may request richer visual elements later |

## Open Questions

1. **Which exact font files are approved for shipping/licensing in this repo?**
   - What we know: No `.ttf/.otf/.woff` assets are currently present. [VERIFIED: repo search]
   - What's unclear: Legal/branding-approved family for production PDF.
   - Recommendation: Decide one Unicode-friendly family (regular/bold/italic) before plan lock.

2. **Should PDF continue as attachment-only or support inline preview mode?**
   - What we know: Current route returns attachment disposition. [VERIFIED: `src/app/reporting/export/executive.pdf/route.ts`]
   - What's unclear: UX expectation under UI-06.
   - Recommendation: Keep attachment in Phase 32 unless explicitly expanded.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build/render scripts | ✓ | v22.22.2 | — |
| npm | install renderer package | ✓ | 11.12.1 | — |
| `@react-pdf/renderer` | recommended PDF renderer | ✗ (not installed) | latest 4.5.1 | keep current engine temporarily |
| ripgrep | code/search validation work | ✓ | 15.1.0 | `grep` |

**Missing dependencies with no fallback:**
- None for planning stage. [VERIFIED: local tool check]

**Missing dependencies with fallback:**
- `@react-pdf/renderer` missing now; fallback is current engine but does not satisfy Unicode/professional goals robustly. [VERIFIED + ASSUMED]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node script validators (custom) |
| Config file | none |
| Quick run command | `node scripts/validate-reporting.js pdf-bytes && node scripts/validate-reporting.js pdf-routes` |
| Full suite command | `npm run validate` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-06 | PDF route emits real PDF bytes | contract script | `node scripts/validate-reporting.js pdf-routes` | ✅ |
| UI-06 | Executive PDF uses executive read model path | static contract script | `node scripts/validate-reporting.js executive` | ✅ |
| UI-06 | Unicode/accent rendering hard gate | fixture/script check | `node scripts/validate-i18n.js exports` + new Unicode fixture assertion | ⚠️ partial |
| UI-06 | Fixed section order | static contract script | add `node scripts/validate-reporting.js pdf-audit` anchors for section sequence | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node scripts/validate-reporting.js executive && node scripts/validate-reporting.js pdf-bytes`
- **Per wave merge:** `npm run validate`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] Extend `scripts/validate-reporting.js` with fixed section-order assertions for D-02.
- [ ] Add Unicode/accent fixture assertion path in PDF validation (e.g., Portuguese/Spanish accented sentence roundtrip).

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Keep `assertAuthenticated()` in export route. [VERIFIED: route code] |
| V3 Session Management | yes | Reuse existing auth/session flow already used by reporting exports. [VERIFIED: route + prior validators] |
| V4 Access Control | yes | Use principal-scoped read model (`buildExecutiveSummary(filters, principal)`). [VERIFIED: `src/exports/pdf.ts`] |
| V5 Input Validation | yes | Keep `parseReportFilters` as single filter parser. [VERIFIED: route code] |
| V6 Cryptography | no (phase-local) | No new crypto requirements introduced in UI-06 renderer change. [ASSUMED] |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized report export | Information Disclosure | Preserve auth guard + principal-scoped data path. [VERIFIED: route + pdf builder] |
| HTML/template injection into PDF body | Tampering | Keep escaping in template path or renderer-safe text components; avoid raw HTML injection from untrusted fields. [VERIFIED: `escapeHtml` in `pdf-templates.js`; ASSUMED for new renderer] |

## Sources

### Primary (HIGH confidence)
- Local codebase files: `src/exports/pdf.ts`, `src/exports/pdf-engine.js`, `src/exports/pdf-templates.js`, `src/reporting/read-models.ts`, `src/app/reporting/executive/page.tsx`, `src/app/reporting/export/executive.pdf/route.ts`, `scripts/validate-reporting.js`, `scripts/validate-i18n.js`, `scripts/validate-all.js` (implementation and validation contracts checked).
- npm registry:
  - `npm view @react-pdf/renderer version time --json`
  - `npm view pdf-lib version time --json`
- React-pdf official docs:
  - https://react-pdf.org/fonts
  - https://react-pdf.org/node

### Secondary (MEDIUM confidence)
- PDF-lib API docs:
  - https://pdf-lib.js.org/docs/api/index.html
  - https://pdf-lib.js.org/docs/api/classes/pdfform
  - https://pdf-lib.js.org/docs/api/enums/standardfonts

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - recommended renderer and versions verified from official docs + npm.
- Architecture: HIGH - based on direct inspection of current web/PDF read-model integration.
- Pitfalls: MEDIUM - Unicode/layout risks are strongly indicated by current engine and docs, but full glyph coverage depends on chosen production fonts.

**Research date:** 2026-05-19  
**Valid until:** 2026-06-18
