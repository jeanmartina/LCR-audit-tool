# Phase 27: Public Shell and Identity - Context

**Gathered:** 2026-05-09  
**Status:** Ready for planning  
**Source:** user discussion

<domain>
## Phase Boundary

This phase modernizes the public entry shell and login experience so the product feels official, clear, and trustworthy from the first screen. It covers the public landing page, direct login visibility, enabled identity-provider visibility, language selector placement, navigation behavior, and the overall visual identity of the entry surfaces.

</domain>

<decisions>
## Implementation Decisions

### Public entry and login
- The public landing page must feel like the official entry point of the product, not a technical stub.
- The landing page should communicate the product purpose quickly and confidently.
- The login form for local username/password must be visible directly without an intermediate click.
- Identity providers must appear publicly only when enabled in the current deployment.
- Disabled providers must not appear as public login options.

### Language selector
- The language selector must exist and be compact.
- The selector should live in the top-left area of the interface.
- It must not compete visually with the login or primary entry actions.

### Navigation and visual identity
- The top-level navigation should look like a modern action bar, not a set of disconnected links.
- Important navigation items should read visually as buttons or tabs with clear hierarchy.
- The application needs a contemporary, professional visual identity with better typography and a balanced light/dark palette.
- The logo should communicate LabSEC, monitoring, and trust.
- The product should feel coherent and trustworthy, not like a prototype.

### the agent's Discretion
- Exact layout composition of hero, trust text, and login block.
- Exact brand treatment for the logo and visual system.
- Exact button styling, spacing, and responsive behavior.
- Exact empty/disabled states for deployments with no enabled identity providers.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap and requirements
- `.planning/ROADMAP.md` — Defines Phase 27 scope and success criteria for public shell and identity.
- `.planning/REQUIREMENTS.md` — Defines the active UI-01 requirement and related UX constraints.
- `.planning/PROJECT.md` — Current milestone context, core value, and product framing.

### Visual guidance
- `@$HOME/.codex/get-shit-done/references/ui-brand.md` — Visual patterns for user-facing GSD output and brand-sensitive UI work.

</canonical_refs>

<specifics>
## Specific Ideas

- Public landing page should feel official and modern.
- Login should be visible directly.
- Only enabled identity providers should be shown publicly.
- Language selector should be small and unobtrusive in the top-left.
- Navigation should feel like a modern action bar.
- The visual language should feel serious, contemporary, and product-grade.

</specifics>

<deferred>
## Deferred Ideas

None — Phase 27 is focused on public shell and identity entry only.

</deferred>

---

*Phase: 27-public-shell-and-identity*
*Context gathered: 2026-05-09 via discussion*
