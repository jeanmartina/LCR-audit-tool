# Phase 12 Discussion Log

## Deployment topology

- `worker` must remain a single process separate from `web`.
- Phase 12 delivers a `docker compose` package ready for local/staging use.
- This phase does not try to solve full production orchestration.

## HTTPS and public-origin model

- The normal stack path is always `Caddy + HTTPS`.
- A local development/test mode must still exist so the user can run the stack locally and inspect behavior.
- With a valid domain, Caddy should use automatic ACME issuance/renewal.
- For localhost/testing, Caddy can use a local/self-signed certificate path so HTTPS remains part of the workflow.
- Real Google/Microsoft/OIDC callback validation is still expected to require a valid public host.

## Runtime configuration and secrets

- Use a single `.env` file for the local/staging stack in this phase.
- Secrets stay as environment variables for now; do not introduce Docker secrets yet.
- Documentation must include an explicit variable matrix with required vs optional variables.
- The default compose path should not require the user to hand-author `DATABASE_URL`.
- The compose stack should provide an internal default `DATABASE_URL` using Docker networking, e.g. the app services talk to Postgres by service name.
- Postgres authentication should remain enabled even on the internal network; the goal is zero manual configuration, not auth removal.

## Documentation scope

- `README.md` must cover:
  - what the project does
  - service architecture (`web`, `worker`, `postgres`, `caddy`)
  - prerequisites
  - `.env` setup
  - startup/shutdown/logs/rebuild flows
  - access URL and callback/public-origin expectations
  - provider variable matrix
  - HTTPS notes for local testing vs real domains
  - known limits of the milestone
- In addition to `README.md`, create a separate operator-oriented document.
- `README.md` must explicitly mention and link/reference that separate operator document.
