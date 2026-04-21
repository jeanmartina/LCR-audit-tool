# Phase 17 UI Specification: First-Run Bootstrap and Certificate/ZIP Onboarding UX

**Date:** 2026-04-20
**Status:** Design contract for planning and execution

## UX Goal

Make the first useful setup path understandable without SQL, JSON editing, or raw API responses. A new operator should be able to create the first admin, upload a certificate or ZIP, understand what the system found, and know the next action.

## Required Screens

### First-Run Setup

Route: `/setup`

- Use `PageShell`, `PageHeader`, `Panel`, `Field`, `TextInput`, `ActionButton`, and `Notice`.
- Page title: first admin setup.
- Explain that the page is only available before any platform admin exists.
- Fields:
  - email
  - display name
  - password
  - confirm password
  - preferred locale, if low risk
- Show validation feedback for invalid email, short password, mismatch, and bootstrap already complete.
- After success, redirect to a useful authenticated page with a clear setup-complete notice.

### Certificate Single Upload

Route: `/admin/certificates/new`

- Convert the current raw form into a guided flow using Phase 16 primitives.
- Keep the main controls visible:
  - display name
  - certificate file (`.pem`, `.crt`, `.cer`, PEM or DER)
  - groups
  - tags
  - ignored derived URLs
  - group overrides or simplified defaults
- Preview section must show:
  - fingerprint
  - derived CRL URL count
  - tracked derived CRLs
  - ignored derived CRLs
  - effective group defaults
  - warning when no CRL URL is found
- Commit result must provide a clear success/failure state and a next action link.

### ZIP Upload

Route: `/admin/certificates/batch`

- Convert raw batch form to a guided upload panel.
- Show accepted archive contents: `.pem`, `.crt`, `.cer` inside `.zip`; PEM and DER are accepted.
- Before commit, show validation guidance for missing archive and missing groups.
- After commit, route to a result surface rather than raw JSON.

### Import Run Result

Recommended route: `/admin/certificates/import-runs/[runId]`

- Show summary cards:
  - imported
  - updated
  - invalid
  - ignored
  - archive status
- Show per-file table:
  - filename
  - result
  - fingerprint, if available
  - message
- Show next actions:
  - view certificate administration
  - import another ZIP
  - import one certificate

## Interaction Contract

- Server remains authoritative. Preview output is advisory; commit re-parses and re-authorizes uploads.
- Redirects from POST handlers must use relative `Location` headers to avoid container-origin leaks.
- Errors should be shown as `Notice` or field-level errors, not raw JSON in normal browser flows.
- JSON responses may remain for API clients only if form/browser flows get operator-friendly pages.

## Visual Contract

Use the Phase 16 visual system consistently:

- `PageShell` for page layout.
- `PageHeader` for title, description, and back links.
- `Panel` for each logical step.
- `Field` wrappers for labels, hints, examples, and validation messages.
- `Notice` for success, warning, and error results.
- `StatusPill` for imported/updated/invalid/ignored statuses.
- `EmptyState` for no groups or no import results.

Avoid new ad-hoc inline styling except small layout grids when primitives do not cover the case.

## Copy and Guidance Contract

All new copy must exist in `src/i18n/index.ts` for `en`, `pt-BR`, and `es`.

Required guidance concepts:

- first-run setup is disabled after the first platform admin exists
- password confirmation must match
- certificate file accepts PEM or DER encoded `.pem`, `.crt`, `.cer`
- derived CRLs are extracted from the certificate and become monitored targets unless ignored
- ZIP accepts certificate files and records partial failures
- failed ZIP entries do not prevent successful valid entries from being imported

## Accessibility and Usability

- Inputs must have visible labels, not only placeholders.
- Buttons must describe the action: preview, import certificate, import ZIP, create first admin.
- Result tables must have text labels for every status.
- Error messages must be readable without relying on color only.

## Acceptance Criteria

- `/setup` is usable on a fresh deployment and blocked after bootstrap.
- Single-certificate onboarding provides real CRL/effective-default preview before commit.
- ZIP onboarding ends on an operator-readable import result view.
- No normal browser path displays raw JSON as the final onboarding result.
- All touched pages use shared UI primitives and localized copy.
