# Phase 15 Discussion Log

**Date:** 2026-04-09
**Phase:** 15 - Public HTTPS OAuth/OIDC Proof and Callback Validation

## Topics Discussed

### 1. Public proof environment
- The proof will be executed manually by the operator.
- The operator wants step-by-step guidance and will report outcomes back.
- The environment should remain running afterward as a demonstration/staging instance.

### 2. Provider proof scope
- Google is the only provider that should be proven in this phase.
- Microsoft Entra ID and generic OIDC are deferred to a future milestone.

### 3. Evidence and acceptance bar
- Acceptable proof must include:
  - login initiated from the invite flow
  - callback completion on a public HTTPS host
  - session creation
  - successful authorized reporting access after login
  - evidence in logs/app/audit trail

### 4. Operational setup ownership
- The operator wants the system ready in Docker form first.
- The proof should validate the Dockerized packaged path, making the test broader than auth-only source execution.

## Outcome

Context is ready for planning.
