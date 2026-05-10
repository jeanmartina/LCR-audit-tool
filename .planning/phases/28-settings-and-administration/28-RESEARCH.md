# Phase 28: Settings and Administration - Research

**Date:** 2026-05-10
**Mode:** ecosystem
**Phase:** 28-settings-and-administration

## Standard Stack

- Use Next.js App Router server components for the settings landing page and tab content.
- Keep the existing shared UI primitives from `src/components/ui/primitives.tsx` as the visual base: `PageShell`, `PageHeader`, `Panel`, `Field`, `ActionButton`, `Notice`, `EmptyState`, `StatusPill`, `SelectInput`, `TextInput`, and `CheckboxField`.
- Keep persistence in the existing server routes and storage helpers rather than introducing a client state layer for settings.
- Keep authorization anchored in `src/auth/authorization.ts`.
- Keep settings state in `src/settings/preferences.ts`.
- Keep provider status and verification state in `src/auth/providers.ts` plus the existing settings persistence helpers.
- Keep trust-list management on top of `src/trust-lists/admin.ts` and the existing admin page patterns.

## Architecture Patterns

### Use server-rendered top tabs
- Render the settings sections as top tabs rather than a sidebar.
- Derive the active tab from a query parameter such as `?tab=prefs` or `?tab=groups`.
- Prefer query-param tabs over client-only state because the current app already uses query params for other navigational state, such as reporting tabs and filters.
- Make the tab row a server-rendered navigation shell so each tab can be deep-linked and reloaded without losing state.

### Keep each tab bounded to one responsibility
- `Preferências pessoais` should only handle per-user locale, theme, and predictive preferences.
- `Grupos` should handle group creation, editing, and deletion plus group defaults.
- `Provedores` should handle provider enablement and verification state.
- `Trust Lists` should handle trust-list sources, metadata, sync history, and LOTL hierarchy.
- `Convites` should handle invite creation, revocation, resend, editing, and pending/accepted state.
- `Administração` should handle first-run bootstrap, roles, audit, and system health.

### Preserve progressive enhancement
- Keep form submissions as same-origin `POST` routes followed by 303 redirects.
- Do not move settings mutations into a new client-side API orchestration layer.
- Keep the current server action pattern and reuse the existing permission gates.

### Make hover hints the only inline guidance for technical fields
- Use short hover-only hints for technical fields.
- Avoid new explanatory blocks below the inputs for this phase.
- If a field needs stronger guidance, prefer a tooltip-style hint trigger instead of a long help paragraph.

## Don't Hand-Roll

- Do not hand-roll a new tab state manager. Use query params and server-rendered links.
- Do not hand-roll a new permissions model. Reuse `assertAuthenticated`, `assertPlatformAdmin`, and `assertPermission`.
- Do not hand-roll a new invite store. Reuse `src/auth/invitations.ts` and the existing audit-event model.
- Do not hand-roll a separate trust-list persistence stack. Reuse `src/trust-lists/admin.ts` and the existing runtime store.
- Do not hand-roll a second provider status registry. Reuse the existing provider runtime and verification helpers.
- Do not hand-roll a second settings schema. Extend the existing settings/preferences records.

## Common Pitfalls

- The current settings page mixes personal preferences, group defaults, platform settings, trust-list entry points, and provider status in one long page. If the phase only adds visual tabs without breaking the page apart, the UX will still feel monolithic.
- Provider enable/disable is not currently backed by a writable admin flag. `getProviderRuntimeConfigs()` derives `enabled` from environment variables, which are deploy-time configuration, not operator-editable runtime state. If the phase wants a real enable/disable control, it must introduce a persisted admin setting or an equivalent authoritative override.
- Provider verification already exists as a persisted admin record, but it is separate from enablement. Keep these concepts distinct.
- The settings APIs already require same-origin POST and role checks. New tab surfaces must continue using those existing route guards.
- Group CRUD is only partially present today: `createGroup()` exists and `/api/auth/groups` can create groups, but there is no corresponding delete route in the current codebase.
- Invitation lifecycle is partially present today: `issueInvite`, `resendInvite`, and `revokeInvite` already exist in `src/auth/invitations.ts`, but there is no UI surface that exposes resend/edit-pending flows yet.
- Trust-list admin already exposes source creation and sync history, but the current UI is still a single panel with cards. If the new tab does not improve hierarchy and editing affordances, it will still feel like a dense operator page.

## Code Examples

### Query-param tab shell
```ts
const currentTab = searchParams.tab ?? "preferences";
const tabs = [
  { key: "preferences", label: "Preferências pessoais", href: "/settings?tab=preferences" },
  { key: "groups", label: "Grupos", href: "/settings?tab=groups" },
  { key: "providers", label: "Provedores", href: "/settings?tab=providers" },
  { key: "trust-lists", label: "Trust Lists", href: "/settings?tab=trust-lists" },
  { key: "invites", label: "Convites", href: "/settings?tab=invites" },
  { key: "administration", label: "Administração", href: "/settings?tab=administration" },
];
```

### Reuse the current authorization gates
```ts
await assertAuthenticated();
await assertPlatformAdmin();
await assertPermission("members.manage", groupId);
```

### Preserve same-origin mutation flow
```ts
const sameOriginFailure = rejectCrossOriginRequest(request);
if (sameOriginFailure) return sameOriginFailure;
return new Response(null, { status: 303, headers: { Location: "/settings?saved=..." } });
```

## Specific Implementation Guidance

- Build the settings page as a single route with a top tab row and tab-specific server-rendered panels.
- Keep the `Preferências pessoais` tab as the default landing tab.
- Keep group management and invitation management as distinct tabs, even though both are admin-oriented.
- When showing technical fields like trust source, PKI, jurisdiction, callback URL, and invite metadata, use short hover-only help.
- For provider enablement, plan for a persisted admin-controlled state instead of depending only on environment variables.
- For trust lists, plan to expose hierarchy and metadata editing in the same tab where sync history is shown.
- For groups and invitations, plan actual create/delete/resend/edit actions instead of read-only listings.

## Confidence

- **High confidence:** current settings page shape, provider verification handling, invite lifecycle helpers, trust-list admin API, and permission gates.
- **Medium confidence:** the exact UI decomposition for tabs because the phase still needs planner decisions on component split and route shape.
- **Low confidence:** provider enable/disable implementation until the planner decides whether to add a persisted runtime setting or a new admin flag model.

---

*Research gathered from local code inspection and existing project conventions.*
