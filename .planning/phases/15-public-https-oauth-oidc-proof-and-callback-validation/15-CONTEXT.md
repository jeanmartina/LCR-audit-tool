# Phase 15: Public HTTPS OAuth/OIDC Proof and Callback Validation - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Use the packaged Docker/Caddy deployment on a real public HTTPS host, guide a manual operator-run proof, and capture evidence for the Google invite-gated auth flow end to end. This phase is intentionally scoped to Google only. Microsoft Entra ID and generic OIDC proof are deferred to a future milestone.

</domain>

<decisions>
## Implementation Decisions

### Public proof environment
- **D-01:** The proof will be executed manually by the operator, step by step, with the system guiding each action and recording reported outcomes.
- **D-02:** The deployed environment remains running afterward as a demonstration/staging instance.
- **D-03:** The proof environment must use the packaged Docker stack so the exercise validates both auth and deployment packaging together.

### Provider scope
- **D-04:** Phase 15 only proves the Google provider flow.
- **D-05:** Microsoft Entra ID and generic OIDC proof are deferred to a future milestone.
- **D-06:** Planning must reflect this explicitly so downstream work does not pretend the broader original proof bar is still being executed in this phase.

### Acceptance evidence
- **D-07:** The minimum acceptable proof set is: invite-initiated login, callback completion on the public HTTPS host, session creation, successful authorized access to reporting after login, and evidence in logs/app/audit trail.
- **D-08:** The phase must produce a concrete step-by-step execution guide so the operator can perform the proof and report each outcome back.
- **D-09:** The phase must produce an evidence checklist and a place to record the reported results.

### Operational ownership
- **D-10:** The operator wants the system delivered in Docker form first, then guided through the proof manually.
- **D-11:** The proof should validate the Dockerized path, not just source execution.

### the agent's Discretion
- Exact structure of the proof worksheet, runbook, or evidence template.
- How to organize the guided steps between deployment, provider setup, invite execution, and evidence capture.
- Whether milestone rescoping is handled as part of the planning artifacts or called out explicitly as a prerequisite/decision note.

</decisions>

<specifics>
## Specific Ideas

- The remaining blocker is no longer code readiness. It is operator-executed evidence on a public host.
- Because the scope is now Google-only, planning must either rescope the milestone requirements or explicitly preserve the expectation that the milestone stays open until Entra/OIDC are deferred formally.
- The operator wants a guided sequence, not a one-shot document dump.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and audit
- `.planning/ROADMAP.md` — Defines Phase 15 as the remaining auth-proof closure work.
- `.planning/REQUIREMENTS.md` — Shows the remaining `AUTH-02` to `AUTH-05` requirement mapping and current pending state.
- `.planning/v1.1-MILESTONE-AUDIT.md` — Source of the remaining blocking auth proof gaps.
- `.planning/PROJECT.md` — Active milestone context and product constraints.
- `.planning/STATE.md` — Current blocker summary and session continuity.

### Existing auth and packaging foundation
- `src/app/api/auth/provider/start/[provider]/route.ts` — Provider redirect start path.
- `src/app/api/auth/callback/[provider]/route.ts` — Provider callback path.
- `src/auth/provider-flow.ts` — Provider exchange/validation logic.
- `src/auth/providers.ts` — Runtime provider configuration and callback URL derivation.
- `src/app/settings/page.tsx` — Platform-admin provider status surface.
- `compose.yaml` — Packaged service topology.
- `Caddyfile` — HTTPS ingress path for the packaged deployment.
- `README.md` — Setup and public-host proof notes.
- `docs/operators.md` — Operator-facing deployment/proof guidance.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- The packaged runtime path already exists through `compose.yaml`, `Dockerfile`, and `Caddyfile`.
- Provider start/callback flow is already implemented in code and only needs real-host proof.
- Provider configuration/status is already exposed in the platform-admin settings surface.

### Established Patterns
- Sensitive provider configuration remains env-only.
- Verification artifacts live under `.planning/phases/<phase>/`.
- Operator-facing deployment guidance belongs in `docs/operators.md`, while public-facing setup belongs in `README.md`.

### Integration Points
- Invite acceptance must remain the entry point for Google proof.
- Reporting access after login is part of the acceptance proof, not an optional add-on.
- Audit events/logs should be used as part of the captured evidence.

</code_context>

<deferred>
## Deferred Ideas

- Real public-host proof for Microsoft Entra ID.
- Real public-host proof for generic OIDC.
- Automatic milestone closure for those deferred providers without explicit requirement rescoping.

</deferred>

---

*Phase: 15-public-https-oauth-oidc-proof-and-callback-validation*
*Context gathered: 2026-04-09*
