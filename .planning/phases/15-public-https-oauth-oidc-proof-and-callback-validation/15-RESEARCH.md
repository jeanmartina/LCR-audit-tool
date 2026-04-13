# Phase 15 Research

## Research Question

What is the smallest reproducible way to close the remaining auth-proof gap using the existing packaged Docker/Caddy stack, while the operator performs the proof manually and only Google stays in scope for this milestone?

## Findings

### 1. The remaining blocker is evidence, not implementation
- The provider-start and callback code already exists.
- The packaged HTTPS path already exists through `compose.yaml` and `Caddyfile`.
- The unresolved milestone gap is the absence of recorded public-host proof for the external provider flow.

### 2. The proof path should validate deployment and auth together
- Running the packaged stack on a public HTTPS hostname validates more than the callback itself:
  - Docker packaging
  - Caddy HTTPS termination
  - public-origin callback correctness
  - session creation under the deployed stack
  - post-login authorization against reporting
- This is stronger than source-only local execution and matches the current milestone blocker.

### 3. Google-only proof is coherent, but it requires formal scope handling
- If only Google is proven now, `AUTH-02` can close with evidence.
- `AUTH-03` and `AUTH-04` cannot be considered closed unless the milestone requirements are explicitly moved out of `v1.1`.
- `AUTH-05` should be narrowed or partially closed based on the Google public-host callback proof unless the requirement remains provider-agnostic.

### 4. Manual proof needs a structured runbook, not just docs
- The operator wants to execute the proof and report results back step by step.
- That means the phase should generate:
  - a deployment checklist
  - a Google provider setup checklist
  - an invite/test-user checklist
  - an evidence worksheet
  - a final proof report template

### 5. The acceptance bar should be explicit
- Minimum proof set for Google on the public host:
  1. packaged stack is reachable on the public HTTPS hostname
  2. invite flow starts from the app
  3. Google redirect and callback complete successfully
  4. app creates a session for the invited user
  5. invited user reaches authorized reporting after login
  6. logs/audit records exist for the flow

## Recommended Planning Direction

1. Add a first task that aligns milestone scope and evidence targets with the new Google-only decision.
2. Deliver any missing Docker/operator polish needed to make the packaged proof runnable without ad hoc fixes.
3. Produce a guided proof kit: runbook, evidence checklist, and report template.
4. Leave the actual live proof execution to the operator, but make the verification contract precise enough that the next audit can consume the reported evidence.

## Constraints Preserved

- Google is the only provider in scope for this phase.
- Entra ID and generic OIDC move to a future milestone.
- The packaged Docker/Caddy path is mandatory.
- Secrets remain env-driven.
- The environment remains useful as a demo/staging deployment after proof.
