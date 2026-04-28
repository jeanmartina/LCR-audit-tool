# Documentation Review: v1.2

**Date:** 2026-04-27  
**Scope:** `README.md`, `docs/operators.md`, generated milestone documentation.  
**Note:** The installed `doc` skill is DOCX-specific, so it was not directly applicable because this repository documents in Markdown.

## Executive Summary

The documentation review gaps have been addressed in the working tree for the current Markdown docs: security hardening status, upload limits, trust-list server-side fetch boundary, cookie/header policy, and backup warning are now documented. A fuller backup/restore runbook can still be added later.

## Findings

### DOC-01: README still frames real provider validation as v1.1-specific

- **Severity:** Low
- **Location:** `README.md:109`
- **Evidence:** The section says “For `v1.1`, only Google remains in scope...” even though v1.2 is now shipped and archived.
- **Impact:** Operators may assume provider proof guidance is stale or only relevant to the old milestone.
- **Fix:** Reword as “Current implemented public proof covers Google; Entra ID and OIDC remain future scope.”

### DOC-02: Documentation does not include production security hardening checklist

**Status:** Fixed in working tree via README hardening status and operator security-boundary updates.

- **Severity:** Medium
- **Location:** `README.md:163`, `docs/operators.md:194`
- **Evidence:** Known limitations say local/staging only, and security boundary lists env secrets/Postgres behavior, but there is no hardening checklist for cookies, headers, CSRF/origin checks, rate limits, backup, or secret rotation.
- **Impact:** A staging deployment may drift toward production use without a clear minimum security checklist.
- **Fix:** Add a “Production hardening required before public use” section with explicit blockers and links to the security review.

### DOC-03: Upload limits are documented as absent but not operationalized

**Status:** Fixed in working tree; docs now point to configurable upload/decompression limits.

- **Severity:** Medium
- **Location:** `README.md:43`, `docs/operators.md:56`
- **Evidence:** Docs say archive size is not hard-limited and constrained by runtime resources.
- **Impact:** Operators know the limitation exists but have no mitigation guidance, monitoring step, or recommended safe archive size.
- **Fix:** Document a temporary operational limit, e.g. “keep ZIPs below X MB and Y files until app-level limits are implemented,” then replace with env vars after implementation.

### DOC-04: Trust-list URL security model is not explicit enough

**Status:** Fixed in working tree with explicit official-public-URL/server-side-fetch guidance.

- **Severity:** Medium
- **Location:** `docs/operators.md:209`, `docs/operators.md:229`
- **Evidence:** Docs explain HTTPS and recovery behavior, but not that trust-list URLs are server-side fetches and should be official public TSL/LOTL URLs only.
- **Impact:** Operators may add internal URLs for convenience, increasing SSRF exposure and confusing the trust boundary.
- **Fix:** Add guidance that trust-list sources must be official public distribution URLs and not internal services, metadata endpoints, or arbitrary test URLs outside local dev.

### DOC-05: Backup and restore guidance is missing

**Status:** Partially fixed in working tree with a `docker compose down -v` backup warning; a complete restore runbook remains follow-up.

- **Severity:** Low
- **Location:** `docs/operators.md:21`, `docs/operators.md:170`
- **Evidence:** The guide documents that Postgres persists runtime/auth state and how to remove volumes, but does not explain backup/restore or warn that `docker compose down -v` deletes all evidence.
- **Impact:** Operators may lose audit evidence or auth state during maintenance.
- **Fix:** Add backup/restore commands or at least a clear “before `down -v`, export Postgres volume/database” warning.

## Recommended Documentation Follow-up

1. Add a full Postgres backup/restore procedure before relying on the demo instance as long-lived evidence storage.
2. Expand security ownership from single-owner `CODEOWNERS` to a team or second reviewer when available.
3. Keep provider-proof wording current as Entra ID and generic OIDC move into future milestones.

## Non-Findings

- Setup, compose, Caddy, auth callback, Google proof, batch import, trust-list onboarding, and executive summary paths are documented.
- Docs consistently describe provider secrets as env-only.
- The published root landing path added in Phase 21.1 is now mentioned in both README/operator flows.
