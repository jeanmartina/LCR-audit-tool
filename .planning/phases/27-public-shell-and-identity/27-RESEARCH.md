# Phase 27: Public Shell and Identity - Research

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- The public landing page must feel like the official entry point of the product, not a technical stub.
- The landing page should communicate the product purpose quickly and confidently.
- The login form for local username/password must be visible directly without an intermediate click.
- Identity providers must appear publicly only when enabled in the current deployment.
- Disabled providers must not appear as public login options.
- The language selector must exist and be compact.
- The selector should live in the top-left area of the interface.
- It must not compete visually with the login or primary entry actions.
- The top-level navigation should look like a modern action bar, not a set of disconnected links.
- Important navigation items should read visually as buttons or tabs with clear hierarchy.
- The application needs a contemporary, professional visual identity with better typography and a balanced light/dark palette.
- The logo should communicate LabSEC, monitoring, and trust.
- The product should feel coherent and trustworthy, not like a prototype.

### Claude's Discretion
- Exact layout composition of hero, trust text, and login block.
- Exact brand treatment for the logo and visual system.
- Exact button styling, spacing, and responsive behavior.
- Exact empty/disabled states for deployments with no enabled identity providers.

### Deferred Ideas (OUT OF SCOPE)
None — Phase 27 is focused on public shell and identity entry only.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-01 | The public landing page should look like the official product entry, with a modern identity, visible login form, only enabled identity providers, a compact top-left language selector, modern navigation, and a contemporary visual brand. | Current public entry/auth routes, provider enablement helpers, locale helpers, and shared UI primitives show where to consolidate the shell and where to keep deployment-specific identity-provider visibility. |
</phase_requirements>

# Phase 27: Public Shell and Identity - Research

**Researched:** 2026-05-09
**Domain:** Next.js App Router public shell, invite-gated auth entry, i18n, and product branding
**Confidence:** HIGH

## Summary

The repo already has the pieces needed for Phase 27, but they are split across a root landing page, a separate `/auth` page, and a provider-status model that currently mixes public-facing and operator-facing information. The current implementation uses Next.js App Router server components, a locale-aware root layout, existing locale helpers, and provider enablement derived from environment variables. The best plan is to consolidate the public entry experience into a shared public shell component rather than inventing a second auth system or a new styling stack.

The main planning risk is that the current public pages still expose disabled providers as visible public entries and place locale selection inside the body instead of the top-left shell. The official shell should present local login immediately, only render enabled identity providers as public login options, keep provider diagnostics in settings/admin surfaces, and use a compact top-left language selector. The navigation should be built as a deliberate action bar, not a loose list of links.

**Primary recommendation:** Build a shared `PublicShell`/`AuthEntryShell` around the existing App Router pages, then have `/` and `/auth` use that shell so login, locale switching, provider visibility, and brand treatment stay consistent.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | `16.2.6` (published `2026-05-07`) | App Router pages, redirects, server components, `Link`, and `searchParams` handling | This repo is already built on App Router and the current Next.js docs center page/layout composition around server components and route-local UI. |
| `react` | `19.2.6` (published `2026-05-06`) | Component rendering for the shell and auth pages | The repo already uses React 19 server components, and the public shell should stay within that model. |
| `react-dom` | `19.2.6` (published `2026-05-06`) | DOM rendering for the UI shell | Matches the current React runtime used by Next.js. |
| `typescript` | `6.0.3` (published `2026-04-16`) | Type-safe page props, translators, and auth/provider models | The codebase is TypeScript-first and already relies on typed page/server helpers. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `src/components/ui/primitives.tsx` | repo-local | `PageShell`, `PageHeader`, `Panel`, `Field`, `SelectInput`, `ActionButton`, and notice/pill primitives | Use for any authenticated or shared page chrome so public shell work stays visually consistent with the rest of the product. |
| `src/i18n/index.ts` | repo-local | Locale normalization, request/principal translation, and supported locale options | Use for the language selector, public-entry copy, and locale persistence; do not reimplement query parsing. |
| `src/auth/providers.ts` | repo-local | Runtime provider enablement and callback URL construction | Use as the source of truth for whether Google, Entra ID, or OIDC are publicly available in this deployment. |
| `src/auth/config.ts` | repo-local | Provider definitions and public origin resolution | Use for provider labels and callback/public-origin consistency. |
| `src/auth/provider-flow.ts` | repo-local | Provider startup and callback flow wiring | Use for provider login navigation; do not move provider OAuth/OIDC logic into the UI layer. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Shared shell primitives | Bespoke inline styles on each route | Faster for one page, but it will keep `/` and `/auth` visually divergent and harder to modernize consistently. |
| Publicly listing every provider with enabled/disabled status | Only rendering enabled providers publicly | The second option satisfies the requirement; the first leaks deployment details into the public entry and reads less official. |
| Separate landing and auth experiences with duplicated markup | One shared public entry shell used by both routes | Shared shell is slightly more work up front, but it prevents drift in copy, spacing, and brand treatment. |
| A custom client-side locale system | Existing `getRequestTranslator`/`getSupportedLocaleOptions` helpers | The current helpers already handle locale normalization and request/principal translation, so custom logic would be redundant and risk inconsistent locale behavior. |

**Installation:**
```bash
npm install
```

**Version verification:** Current registry versions were verified with `npm view`:
```bash
npm view next version
npm view react version
npm view react-dom version
npm view typescript version
```
The repo currently pins older patch releases in `package.json` (`next` 16.2.2, `react`/`react-dom` 19.2.4, `tailwindcss` 4.2.2, `typescript` 6.0.2), but the latest registry patches at research time are the versions listed above. Phase 27 does not require a dependency upgrade to plan the UI work.

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── app/
│   ├── page.tsx              # official public entry
│   ├── auth/page.tsx         # direct sign-in surface
│   └── auth/accept-invite/   # invite-gated provider flow
├── auth/                     # provider enablement, origin, callback flow
├── components/ui/            # reusable shell/panel/field primitives
└── i18n/                     # request/principal locale helpers and copy
```

### Pattern 1: Shared Public Shell
**What:** Keep one shared shell for the root landing page and the direct auth page, with server-side locale resolution and authenticated redirects.
**When to use:** Any time a route is part of the public entry surface and should feel like the same official product entry.
**Example:**
```tsx
// Source: repo patterns in src/app/page.tsx, src/app/auth/page.tsx, and Next.js App Router page docs
export default async function PublicEntryPage({
  searchParams,
}: {
  searchParams?: Promise<{ locale?: string }>;
}) {
  const principal = await getCurrentPrincipal();
  if (principal) redirect("/reporting");

  const { locale, t } = await getRequestTranslator((await searchParams)?.locale);
  const providers = getExternalProviderRuntimeConfigs().filter((provider) => provider.enabled);

  return (
    <PublicShell locale={locale} title={t("auth.entry.title")}>
      <LoginForm locale={locale} />
      <ProviderButtons providers={providers} />
    </PublicShell>
  );
}
```

### Pattern 2: Locale as a Small Shell Control
**What:** Render locale selection as a compact, unobtrusive top-left control and persist it with the existing locale helpers.
**When to use:** On public pages where the locale is useful but should not compete with login.
**Example:**
```tsx
// Source: src/i18n/index.ts and src/app/page.tsx
const localeOptions = getSupportedLocaleOptions(locale);

<form action="/" method="get">
  <label>
    <span>{t("common.locale.label")}</span>
    <select name="locale" defaultValue={locale}>
      {localeOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
</form>
```

### Pattern 3: Provider Visibility from Runtime Config
**What:** Derive public identity-provider affordances from `getExternalProviderRuntimeConfigs()` and filter to enabled providers for the public shell.
**When to use:** When the deployment can vary by environment and disabled providers must stay hidden publicly.
**Example:**
```tsx
// Source: src/auth/providers.ts and src/app/page.tsx
const providers = getExternalProviderRuntimeConfigs().filter((provider) => provider.enabled);

{providers.map((provider) => (
  <Link key={provider.id} href={`/auth/accept-invite?locale=${encodeURIComponent(locale)}#provider-${provider.id}`}>
    {t(`auth.provider.${provider.id}`)}
  </Link>
))}
```

### Anti-Patterns to Avoid
- **Duplicated auth chrome on `/` and `/auth`:** it will drift visually and textually; extract a shared shell instead.
- **Rendering disabled providers as public login options:** this violates the phase requirement and makes the product look unfinished.
- **Putting callback URLs and provider diagnostics in the public shell:** those belong in settings/admin surfaces, not on the official entry page.
- **A full-width language selector in the hero area:** it competes with login and weakens the top-left requirement.
- **Ad hoc inline styling for every element:** it will keep the shell inconsistent with the rest of the product and make later UI phases harder.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Public-entry shell structure | Two separate landing/auth page layouts with different spacing, headers, and copy | A shared public shell component and shared locale/provider helpers | Prevents drift and keeps the public entry authoritative across routes. |
| Locale parsing and label generation | Custom query parsing and translation lookup in each page | `normalizeLocale`, `getRequestTranslator`, and `getSupportedLocaleOptions` | The i18n module already handles locale normalization and request/principal translation. |
| Provider enablement checks | Scattered `process.env` checks in page components | `getExternalProviderRuntimeConfigs()` / `getProviderRuntimeConfigs()` | Provider enablement is already centralized and includes callback URL derivation. |
| Login/session redirects | Client-side state or manual history rewrites | `getCurrentPrincipal()` and `redirect("/reporting")` | The current auth flow already handles authenticated redirects server-side. |
| Brand tokens and shell controls | Fresh one-off CSS variables and controls per route | `src/components/ui/primitives.tsx` plus the existing layout theme variables | Reusing primitives keeps the visual system coherent and minimizes design drift. |

**Key insight:** The complex part here is not the auth mechanism. It is the public entry composition. The shell should be treated as a product surface with one source of truth for locale, brand, login, and provider visibility.

## Common Pitfalls

### Pitfall 1: Public provider leakage
**What goes wrong:** Disabled providers still appear as sign-in choices or are shown with misleading status text.
**Why it happens:** The current root and auth pages iterate over all external providers and render both enabled and disabled states.
**How to avoid:** Filter public provider affordances to `enabled === true`, and move provider diagnostics to settings/admin pages.
**Warning signs:** Public pages still show callback URLs, "missing environment configuration" text, or disabled provider cards.

### Pitfall 2: The landing page still feels like a stub
**What goes wrong:** The root page reads like a simple link hub rather than an official product entry.
**Why it happens:** The current implementation separates introduction, login, and provider links into small inline-styled blocks.
**How to avoid:** Give the public shell one dominant visual hierarchy, branded hero text, and a direct login block on the first screen.
**Warning signs:** The page can be mistaken for a development placeholder or a temporary login router.

### Pitfall 3: Locale selection competes with login
**What goes wrong:** The language selector becomes a form section instead of a subtle shell control.
**Why it happens:** It is currently placed in the body with the same visual weight as login and provider content.
**How to avoid:** Move it into the top-left shell chrome and keep the control compact.
**Warning signs:** Users have to visually hunt for language switching or it pushes login below the fold.

### Pitfall 4: Copy and identity drift between routes
**What goes wrong:** `/` and `/auth` say slightly different things, use different spacing, or show providers differently.
**Why it happens:** Each route currently owns its own inline layout.
**How to avoid:** Share the public shell and source copy from the same translation keys.
**Warning signs:** The root page and auth page feel like two different products.

### Pitfall 5: Visual polish without structural consistency
**What goes wrong:** The page looks prettier but still behaves like disconnected sections.
**Why it happens:** Only typography or color is updated while the shell layout remains fragmented.
**How to avoid:** Design the action bar, hero, login block, and provider area as one composition.
**Warning signs:** The nav still looks like loose links and the brand treatment feels bolted on.

## Code Examples

Verified patterns from official sources:

### App Router page composition
```tsx
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/page
export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ locale?: string }>;
}) {
  return <main>...</main>;
}
```

### Link-based action navigation
```tsx
// Source: https://nextjs.org/docs/app/api-reference/components/link
import Link from "next/link";

<Link href="/auth">Open sign in</Link>;
```

### Current repo pattern to extend
```tsx
// Source: src/app/page.tsx and src/app/auth/page.tsx
const principal = await getCurrentPrincipal();
if (principal) {
  redirect("/reporting");
}

const providers = getExternalProviderRuntimeConfigs();
const { locale, t } = await getRequestTranslator((await searchParams)?.locale);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate root stub plus separate auth page with duplicated inline styles | A shared public shell that serves both the official landing page and direct sign-in entry | Phase 27 / v1.4 | One authoritative public entry surface, fewer clicks, and less visual drift. |
| Publicly showing all providers with "configured/missing" text | Only enabled providers shown publicly; provider diagnostics kept for settings/admin surfaces | Phase 27 / v1.4 | Avoids leaking deployment details and makes the public entry feel finished. |
| Locale selection embedded in the main content flow | Compact top-left shell control using existing locale helpers | Phase 27 / v1.4 | Reduces visual competition with login and primary entry actions. |
| Loose link clusters | Action-bar-style navigation with clear button/tab hierarchy | Phase 27 / v1.4 | Makes the shell feel like a product UI, not a page list. |

**Deprecated/outdated:**
- Inline-styled public entry fragments on separate routes.
- Showing disabled identity providers as public login options.
- Keeping provider callback URL text in the public shell.
- Using a large in-body locale form when a shell control is sufficient.

## Assumptions Log

> This table is empty because no `[ASSUMED]` claims were needed for this research.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| - | - | - | - |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **Should `/` and `/auth` become one shared public shell, or should `/` become the only canonical entry page?**
   - What we know: both routes already exist, and both currently render public auth-related content.
   - What's unclear: whether the root page should remain a branded landing page while `/auth` remains the direct form, or whether they should be merged visually and structurally.
   - Recommendation: plan a shared shell first so copy, locale placement, and provider gating stay synchronized.

2. **How much identity-provider detail should remain visible on the public entry?**
   - What we know: the requirement allows only enabled providers to appear publicly.
   - What's unclear: whether the public page should show only provider buttons or include a short explanation of why provider login is available.
   - Recommendation: keep the public shell concise and move detailed provider diagnostics to settings/admin.

3. **What is the exact brand mark treatment for LabSEC / monitoring / trust?**
   - What we know: there is no existing logo asset or dedicated brand system in the repository.
   - What's unclear: whether the mark should be text-only, icon-plus-text, or a lightweight SVG treatment.
   - Recommendation: let the planner choose a minimal brand asset path that fits the current codebase and avoids dependency sprawl.

## Environment Availability

Skipped — this phase uses the existing Next.js/Node toolchain only; no additional external CLI or service dependencies were identified for planning.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Repo-native Node validation scripts; no conventional `test/` runner detected |
| Config file | none |
| Quick run command | `node scripts/validate-auth-foundation.js entry && node scripts/validate-i18n.js ui && node scripts/validate-ui-guidance.js` |
| Full suite command | `npm run validate` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-01 | Public landing reads like the official product entry, login is visible directly, only enabled identity providers appear publicly, the language selector is compact/top-left, navigation feels modern, and the visual brand looks contemporary. | static validation + manual visual review | `node scripts/validate-auth-foundation.js entry && node scripts/validate-i18n.js ui && node scripts/validate-ui-guidance.js` | ✅ |

### Sampling Rate
- **Per task commit:** `node scripts/validate-auth-foundation.js entry && node scripts/validate-i18n.js ui && node scripts/validate-ui-guidance.js`
- **Per wave merge:** `npm run validate`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- No screenshot or Playwright-style visual regression harness exists for the public shell.
- No automated assertion checks rendered placement for the top-left locale selector or the action-bar hierarchy.
- No automated DOM-level assertion currently proves that disabled providers are omitted from the public shell rather than merely styled differently.
- The existing validators are string/structure checks, so Phase 27 will likely need either an expanded validation script or a new UI snapshot harness after implementation.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | Invitation-gated local login plus provider login through the existing auth routes; keep login entry server-driven. |
| V3 Session Management | yes | Existing session cookie helpers, login redirect handling, and logout routes; do not hand-roll cookie/state logic. |
| V4 Access Control | yes | Public shell only shows unauthenticated entry points; authenticated users redirect to `/reporting`; provider visibility derives from deployment config. |
| V5 Input Validation | yes | Server-side form parsing, locale normalization, invite/email trimming, and same-origin mutation guards. |
| V6 Cryptography | yes | Existing auth/provider helpers handle provider code exchange and token verification; do not introduce custom crypto in the UI layer. |

### Known Threat Patterns for the current auth shell

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| CSRF on login/provider-start forms | Spoofing | Keep mutation routes same-origin only and POST-only; continue using `rejectCrossOriginRequest` and server-side form handling. |
| Credential stuffing on local login | Denial of Service / Spoofing | Keep rate limits on login and provider-start flows; do not add client-only throttling. |
| Open redirect after authentication | Spoofing | Redirect to fixed relative paths or `resolvePublicOrigin()`-based URLs only; do not accept arbitrary next/return targets from the public shell. |
| Provider spoofing / false provider availability | Spoofing | Only render providers from the runtime enablement helper and keep disabled-provider diagnostics out of the public UI. |
| Locale/query injection into public copy | Tampering | Normalize locale through `normalizeLocale` and use translated dictionary keys only. |

## Sources

### Primary (HIGH confidence)
- `src/app/page.tsx` - current public landing page and provider visibility pattern.
- `src/app/auth/page.tsx` - current direct login surface.
- `src/auth/providers.ts` - runtime provider visibility and callback URL helper.
- `src/auth/config.ts` - provider definitions, environment enablement, and public origin helper.
- `src/auth/provider-flow.ts` - provider start/callback wiring.
- `src/i18n/index.ts` - locale normalization and language selector options.
- `src/components/ui/primitives.tsx` - shared shell/panel/field primitives.
- `src/app/layout.tsx` - current theme and locale-aware root layout.
- `scripts/validate-auth-foundation.js` - existing entry/auth coverage.
- `scripts/validate-i18n.js` - existing locale/UI coverage.
- `scripts/validate-ui-guidance.js` - current UI primitive guidance.
- https://nextjs.org/docs/app - App Router overview.
- https://nextjs.org/docs/app/api-reference/file-conventions/page - page props and `searchParams`.
- https://nextjs.org/docs/app/api-reference/components/link - `Link` component and client navigation.
- https://www.npmjs.com/package/next/v/16.2.6 - current registry version metadata.
- https://www.npmjs.com/package/react/v/19.2.6 - current registry version metadata.
- https://www.npmjs.com/package/react-dom/v/19.2.6 - current registry version metadata.
- https://www.npmjs.com/package/typescript/v/6.0.3 - current registry version metadata.

### Secondary (MEDIUM confidence)
- None.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - versions were verified against the npm registry and the repo's current codebase clearly shows App Router, i18n, and shared UI primitives.
- Architecture: HIGH - current routes, helper modules, and validation scripts make the shell composition pattern explicit.
- Pitfalls: HIGH - the existing pages already demonstrate the exact leakage/drift risks this phase needs to fix.

**Research date:** 2026-05-09
**Valid until:** 2026-06-08
