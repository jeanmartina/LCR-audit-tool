# Phase 12: Containerized Deployment, HTTPS, and Operator Documentation - Research

**Researched:** 2026-04-07
**Status:** Ready for planning

## Scope

This research is limited to Phase 12 concerns:

- packaging the application as `web + worker + postgres + caddy`
- shipping a `docker compose` topology for local/staging use
- making HTTPS the normal access path through Caddy
- supporting both valid-domain ACME flows and local HTTPS test flows
- simplifying runtime configuration with a single `.env`
- documenting setup and operator usage in English

## Current codebase signals

- The app already builds as a Next.js server app via `npm run build`.
- The codebase already distinguishes web-facing routes from background runtime work, so a separate `worker` service is structurally aligned with the product direction.
- Runtime smoke currently depends on `DATABASE_URL`, which means packaging should reduce manual DB wiring rather than introduce another connection model.
- Public-origin resolution currently comes from `AUTH_PUBLIC_ORIGIN` or `NEXT_PUBLIC_APP_ORIGIN`, so deployment must keep those aligned with the HTTPS entrypoint exposed by Caddy.

## Recommended direction

### Service topology

- Ship four compose services:
  - `web`
  - `worker`
  - `postgres`
  - `caddy`
- Use one application image for both `web` and `worker` unless the implementation reveals a strong reason to split images.
- Keep `postgres` internal to the compose network by default.
- Expose only Caddy to the host in the normal stack path.

Why:
- It matches the locked phase decision and keeps the topology simple enough for local/staging.
- Reusing one app image keeps the packaging surface smaller and reduces drift between `web` and `worker`.

### Database connectivity

- Do not require the operator to handcraft `DATABASE_URL` for the default compose path.
- Provide an internal default database connection using service discovery, for example `postgresql://app:app@postgres:5432/app`.
- Keep Postgres authentication enabled even on the internal Docker network.
- Put DB credentials in `.env`, but ensure the compose defaults are already coherent.

Why:
- This satisfies the user's operational goal of zero manual DB wiring while preserving a basic auth boundary.
- It keeps the runtime compatible with the existing code, which already expects `DATABASE_URL`.

### HTTPS and Caddy behavior

- Make Caddy the only normal ingress path.
- Force HTTPS in the Caddy-served stack.
- Support two deployment modes:
  1. **domain mode** — valid host, ACME-managed certificate
  2. **local test mode** — localhost/dev-oriented HTTPS via Caddy's local certificate path
- Keep callback/public-origin settings explicit in `.env` and document that real provider validation still depends on a valid public host.

Why:
- This matches the product requirement that OAuth/OIDC callback behavior is driven by a real HTTPS origin.
- It gives the user a real local HTTPS path without pretending localhost is equivalent to a public provider callback environment.

### Compose and Docker artifacts

- Phase 12 should likely produce:
  - root `Dockerfile`
  - `compose.yaml` (or `docker-compose.yml`)
  - `Caddyfile`
  - `.env.example`
  - `.dockerignore`
- The compose file should cover:
  - build/image wiring
  - internal network
  - persistent Postgres data volume
  - Caddy data/config volumes for certificates
  - restart policies appropriate for local/staging convenience

Why:
- These are the minimum coherent artifacts for the deployment requirement set.

### Documentation

- `README.md` should stay concise and GitHub-friendly:
  - what the project is
  - service topology
  - prerequisites
  - `.env` setup
  - startup/shutdown/log/rebuild commands
  - local HTTPS vs real domain behavior
  - auth provider variable matrix
  - link to the operator/deployment guide
- A separate operations document should carry the deeper deployment/operator notes:
  - service responsibilities
  - environment variable reference
  - callback/public-origin guidance
  - local HTTPS expectations
  - common operational commands / troubleshooting

Why:
- It matches the locked decision to have both a README and a separate operator document.
- It keeps the GitHub entrypoint readable without losing operational detail.

## Likely implementation slices

1. **Container/runtime packaging**
   - app image
   - web/worker commands
   - `.dockerignore`

2. **Compose and Caddy**
   - compose topology
   - internal service wiring
   - HTTPS ingress
   - local-vs-domain config path

3. **Environment configuration**
   - single `.env` contract
   - internal `DATABASE_URL` default path
   - provider/public-origin variable matrix

4. **Documentation and validation**
   - README
   - operator guide
   - validation for packaging/docs presence and config expectations

## Pitfalls to avoid

1. **Treating localhost HTTPS as equivalent to real provider readiness**
   - Local HTTPS is useful, but real Google/Entra/OIDC verification still requires a valid public host.

2. **Exposing Postgres unnecessarily**
   - The default compose path should keep Postgres internal unless there is a strong operator reason not to.

3. **Creating two unrelated config models**
   - The local/staging compose stack and app runtime should share one coherent environment contract.

4. **Making README too heavy**
   - Keep operator depth in a separate document and let README point to it.

5. **Overreaching into production orchestration**
   - This phase is about a solid local/staging package, not Kubernetes, swarm, or multi-node production operations.

## Implications for planning

The plan should be sequenced in this order:

1. package the app runtime into reusable container artifacts for `web` and `worker`
2. add compose topology + Caddy HTTPS + `.env` contract
3. document startup and operations, then validate packaging/docs expectations

That order keeps the deployment artifacts grounded in a real runnable app image before Caddy/docs are layered on top.

## References used

- `.planning/phases/12-containerized-deployment-https-and-operator-documentation/12-CONTEXT.md`
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `package.json`
- `scripts/runtime-smoke.js`
- `src/auth/config.ts`

---
*Phase: 12-containerized-deployment-https-and-operator-documentation*
*Research completed: 2026-04-07*
