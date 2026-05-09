---
phase: 26
plan: 26-01
name: Operations, Configuration, and Proof Closure
wave: 1
depends_on:
  - 25
requirements_addressed: [OPS-07, OPS-08]
requirements:
  - OPS-07
  - OPS-08
autonomous: true
files_modified:
  - .env.example
  - compose.yaml
  - README.md
  - docs/operators.md
  - scripts/validate-packaging.js
  - scripts/validate-all.js
  - scripts/validate-operations-closure.js
  - .planning/phases/26-operations-configuration-and-proof-closure/26-PROOF.md
  - .planning/phases/26-operations-configuration-and-proof-closure/26-VERIFICATION.md
---

# Phase 26 Plan 26-01: Operations, Configuration, and Proof Closure

**Created:** 2026-05-09  
**Status:** Ready for execution

## Objective

Close v1.3 by making the derived-source runtime limits explicit, documenting the operational model in full, and proving that the packaged stack enforces the configured safety boundary without implying future AI-assisted policy analysis is already implemented.

## Scope

### In Scope

- Keep derived-source fetch and snapshot limits conservative and explicit in the canonical environment template.
- Ensure the compose topology exposes the same derived-source and OCSP limit surface for `web` and `worker`.
- Expand the operator/deploy documentation into a complete closure-grade reference.
- Add validation that proves the packaged runtime, docs, and safety boundary remain aligned.
- Write the phase proof and verification artifacts needed to close the milestone cleanly.

### Out of Scope

- New monitoring capability.
- Manual source management UI.
- Full OCSP semantic validation.
- AI-assisted PKI policy analysis.
- New reporting views or analytics beyond what phase 25 already shipped.

## Canonical References

- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/phases/26-operations-configuration-and-proof-closure/26-CONTEXT.md`
- `.env.example`
- `compose.yaml`
- `README.md`
- `docs/operators.md`
- `docs/google-public-proof.md`
- `scripts/validate-all.js`
- `scripts/validate-packaging.js`
- `src/monitoring-sources/fetch-safety.ts`
- `src/monitoring-sources/worker.ts`
- `src/trust-lists/sync.ts`

## Threat Model

<threat_model>
T-26-01: Runtime defaults drift from the documented safety posture, causing operators to believe the stack is protected by limits that are not actually exposed or enforced. Mitigation: keep `.env.example`, `compose.yaml`, and the docs synchronized, and validate the canonical variables in the packaged-stack checks.

T-26-02: Operational documentation becomes stale or incomplete, which makes the safety and recovery guidance unreliable. Mitigation: update `README.md` and `docs/operators.md` together and validate the key sections as part of phase closure.

T-26-03: The closure docs blur the boundary between retained evidence and future AI analysis, creating compliance ambiguity. Mitigation: document the boundary explicitly and keep the future-analysis wording practical and unambiguous.

T-26-04: Proof closure is claimed without enough packaged-runtime validation. Mitigation: add a dedicated closure validator and integrate it into the project validation path before declaring the phase complete.
</threat_model>

## Implementation Tasks

<task id="26-01-T1" title="Normalize derived-source runtime limits in env and compose">
  <read_first>
    - `.env.example`
    - `compose.yaml`
    - `src/monitoring-sources/fetch-safety.ts`
    - `src/monitoring-sources/worker.ts`
    - `src/trust-lists/sync.ts`
  </read_first>
  <action>
    Align the canonical runtime surface for derived-source monitoring.

    Keep the documented defaults conservative and make the packaged stack expose the same knobs consistently for `web` and `worker`:
    - fetch timeout
    - document byte limit
    - extracted-text byte limit
    - redirect limit
    - OCSP response byte limit
    - OCSP check interval
    - policy-document check interval

    Preserve the existing safety posture:
    - private/internal targets remain blocked by default
    - localhost remains opt-in for local fixtures only
    - the packaged stack keeps the limits visible rather than implicit
  </action>
  <acceptance_criteria>
    - `.env.example` exposes the conservative derived-source and OCSP defaults.
    - `compose.yaml` wires the same runtime knobs into `web` and `worker`.
    - The default values in the packaged stack match the documented safety posture.
  </acceptance_criteria>
</task>

<task id="26-01-T2" title="Expand operator and README documentation for closure">
  <read_first>
    - `README.md`
    - `docs/operators.md`
    - `docs/google-public-proof.md`
    - `.planning/REQUIREMENTS.md`
    - `.planning/ROADMAP.md`
  </read_first>
  <action>
    Expand the operator-facing documentation into a closure-grade reference.

    Document:
    - source derivation behavior for OCSP and policy documents
    - health-state meanings and operator interpretation
    - retention limits and evidence boundaries
    - safety controls for private-network blocking and localhost opt-in
    - the future AI-assisted policy-analysis boundary
    - the packaged-stack execution and recovery path operators should follow

    Keep the writing English-first and consistent with the current operator guide style.
    The result should read as a real deployment/operations reference, not a terse note.
  </action>
  <acceptance_criteria>
    - `README.md` documents the phase 26 runtime limits and closure boundary clearly.
    - `docs/operators.md` explains derivation, health states, retention, safety, and the future AI boundary.
    - The docs remain aligned with the actual runtime limits exposed in `.env.example` and `compose.yaml`.
  </acceptance_criteria>
</task>

<task id="26-01-T3" title="Add closure validation and proof artifacts">
  <read_first>
    - `scripts/validate-packaging.js`
    - `scripts/validate-all.js`
    - `README.md`
    - `docs/operators.md`
    - `compose.yaml`
    - `.env.example`
  </read_first>
  <action>
    Add a phase-26 closure validator and wire it into the project checks.

    The validator should assert:
    - the derived-source runtime knobs exist in the canonical env/compose surface
    - the operator docs explain source derivation, health states, retention, safety, and future AI boundary
    - the packaged runtime still exposes the expected compose topology
    - the closure boundary is explicit enough to distinguish retained evidence from future AI analysis

    Create the phase proof and verification artifacts so the milestone can be closed with an auditable trail.
  </action>
  <acceptance_criteria>
    - `scripts/validate-operations-closure.js` exists and checks the phase-26 closure contract.
    - `scripts/validate-all.js` includes the closure validator.
    - `node scripts/validate-operations-closure.js` exits 0 after the phase is complete.
    - `node scripts/validate-all.js` exits 0 after the phase is complete.
    - `npm run typecheck` exits 0 after the phase is complete.
    - `npm run build` exits 0 after the phase is complete.
  </acceptance_criteria>
</task>

## Verification Commands

```bash
node scripts/validate-operations-closure.js
node scripts/validate-packaging.js compose
node scripts/validate-packaging.js docs
node scripts/validate-all.js
npm run typecheck
npm run build
```

## Must Haves

- Conservative defaults must remain conservative in both docs and runtime wiring.
- The packaged stack must expose the operational limits explicitly, not hide them in code.
- The operator docs must make the future AI boundary unambiguous.
- Proof closure should leave an auditable trail in the phase directory.

