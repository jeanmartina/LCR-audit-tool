# Phase 28: Settings and Administration - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning
**Source:** Direct user decisions in session

<domain>
## Phase Boundary

This phase reorganizes the settings and administration area into a top-tab interface and gives each major responsibility its own clear section:

- personal preferences
- groups
- providers
- trust lists
- invitations
- administration

The phase must make settings feel modular and operational rather than like one long page. The user explicitly wants top tabs, full CRUD for groups, provider enable/disable plus verification marking, trust-list metadata and LOTL hierarchy editing, invitation creation/revocation/re-send/edit flows, and a distinct administration area for bootstrap, roles, audit, and system health.

</domain>

<decisions>
## Implementation Decisions

### Layout and Navigation
- Settings and administration must use tabs at the top of the page.
- The tabs must be clearly separated and predictable.
- The tabs must be: `Preferências pessoais`, `Grupos`, `Provedores`, `Trust Lists`, `Convites`, and `Administração`.

### Personal Preferences
- Personal preferences stay separate from administrative controls.
- This section remains for the user's own settings and should not mix with group or platform management.

### Groups
- The `Grupos` tab must support full CRUD.
- The user wants to create groups.
- The user wants to delete groups.
- Group defaults remain editable inside the tab.

### Providers
- The `Provedores` tab must support status visibility and configuration inspection.
- The user wants to enable and disable providers.
- The user wants to mark providers as verified.

### Trust Lists
- The `Trust Lists` tab must support source management and synchronization.
- The user wants to edit trust-list metadata.
- The user wants to edit LOTL hierarchical relationships, including subordinate links.

### Invitations
- The `Convites` tab must support create, revoke, view, resend, and edit-pending flows.

### Administration
- The `Administração` tab must include initial bootstrap/admin setup.
- The tab must include permissions and roles.
- The tab must include audit/history.
- The tab must include system health and verification.

### Field Hints
- Technical fields must use short hover hints only.
- No extra explanatory block below the field is required for this phase.

### the agent's Discretion
- Exact component decomposition inside the settings page.
- Whether tab state is encoded in the URL or handled client-side.
- Whether tabs are rendered with server components, client components, or a hybrid shell.
- The visual treatment for CRUD forms, tables, and inline edit controls.
- The precise technical shape of the provider enable/disable and verification flows, as long as the user-visible decisions above are preserved.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current settings and admin surface
- `src/app/settings/page.tsx` — existing settings page with user preferences, group defaults, platform settings, trust-list entry point, and provider status cards
- `src/app/setup/page.tsx` — first-run admin bootstrap surface and locale picker

### Auth and provider status
- `src/auth/providers.ts` — provider runtime config and provider verification entries
- `src/auth/authorization.ts` — principal and permission model for admin/auth flows

### Shared UI primitives
- `src/components/ui/primitives.tsx` — page shell, panels, fields, buttons, notices, and status pills used across settings/admin screens

### Locale and copy
- `src/i18n/index.ts` — existing settings, setup, provider, and admin translation keys

</canonical_refs>

<specifics>
## Specific Ideas

- Tabs across the top of the settings page.
- Keep personal preferences on their own tab.
- Group management needs create and delete actions, not just defaults editing.
- Provider management needs enable/disable and verification controls.
- Trust-list management needs hierarchy-aware metadata editing.
- Invitation management needs resend and edit-pending support.
- Administration needs bootstrap, roles, audit, and health in one clearly labeled section.
- Technical fields should use short hover tooltips instead of long inline help blocks.

</specifics>

<deferred>
## Deferred Ideas

None — this phase covers the full settings and administration reorganization described by the user.

</deferred>

---

*Phase: 28-settings-and-administration*
*Context gathered: 2026-05-10 via direct user decisions*
