# Phase 12 Context

## Phase

- Phase 12: Containerized Deployment, HTTPS, and Operator Documentation

## Goal

Package the application for practical local/staging deployment with Docker Compose, front it with Caddy-managed HTTPS, and document the setup/operational path in English.

## Locked decisions

### Topology

- Deliver four services: `web`, `worker`, `postgres`, and `caddy`.
- `worker` stays a single process separated from `web`.
- The output of this phase is a `docker compose` topology for local/staging, not a full production orchestrator design.

### HTTPS and callback model

- The normal deployment path always goes through `Caddy + HTTPS`.
- Keep a local development/test mode so the stack can be exercised locally while still using HTTPS.
- When a valid domain is configured, Caddy should use ACME with automatic certificate issuance/renewal.
- For localhost/testing, use a local HTTPS mode (for example local/self-signed certificates) so the product still runs behind HTTPS even without a public domain.
- Auth callback/public-origin behavior must be environment-driven and consistent with the Caddy-served host.
- Real provider validation for Google/Microsoft/OIDC still depends on a public valid host; localhost HTTPS is primarily for stack verification and local app testing.

### Runtime configuration

- Use a single `.env` file for this phase's local/staging stack.
- Keep secrets as environment variables for now; Docker secrets are explicitly out of scope.
- The documented configuration surface must clearly separate required and optional variables.
- The default compose path should not require the operator to manually construct `DATABASE_URL`.
- Compose should provide a working internal database connection string using Docker service networking.
- Postgres authentication remains enabled even inside the Docker network; the simplification is zero manual wiring, not removing auth.

### Documentation

- `README.md` is required in this phase and must be written in English.
- `README.md` must cover project purpose, service architecture, prerequisites, `.env` setup, startup/shutdown/logs/rebuild flows, access URLs, callback/public-origin expectations, provider environment variables, local HTTPS vs real domain notes, and known limitations.
- Create a separate operator-oriented document in addition to the README.
- `README.md` must mention and point operators to that separate operations document.

## Research guidance for Phase 12

Downstream research should focus on:

- Docker Compose patterns for splitting `web` and `worker` while sharing the same codebase/image where reasonable.
- Caddy configuration patterns for:
  - ACME on real domains
  - local HTTPS/test certificates
  - reverse proxying the web app cleanly
- Environment variable design that keeps local/staging setup simple while remaining consistent with auth callback requirements.
- Documentation structure for a concise GitHub README plus a separate operator/deployment guide.

## Constraints inherited from prior phases

- The app already depends on real HTTPS/public-origin alignment for OAuth/OIDC callback correctness.
- The stack already has a Postgres-backed runtime and a separate worker concept at the code level.
- Phase 11 established English-first code/docs for active surfaces; all new docs in this phase must follow that rule.

## Deferred ideas

- Full production orchestration beyond Docker Compose.
- Horizontal worker elasticity and multi-region workers.
- Docker secrets / more advanced secret-management systems.
