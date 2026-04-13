# LCR Audit Tool

LCR Audit Tool monitors certificate revocation coverage, validates downloaded artifacts, records audit evidence, and exposes reporting for compliance and engineering teams.

## Architecture

The packaged local/staging stack runs four services:

- `web` — Next.js application and HTTP surface
- `worker` — background polling loop
- `postgres` — runtime persistence
- `caddy` — HTTPS ingress and reverse proxy

## Prerequisites

- Docker Engine
- Docker Compose v2

## Quick start

1. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

2. Adjust the values you need in `.env`.

3. Start the stack:

   ```bash
   docker compose up --build
   ```

4. Open the application through the HTTPS origin configured by `AUTH_PUBLIC_ORIGIN`.

## Batch certificate import in the packaged stack

- Batch onboarding accepts `.zip` archives.
- Supported certificate files inside the archive are `.pem`, `.crt`, and `.cer`.
- PEM and DER encodings are both accepted.
- Archive extraction happens inside the application runtime. The packaged stack does not rely on a host `unzip` binary.
- Archive size is not hard-limited yet. Current behavior is constrained by runtime resources.

## Day-to-day commands

- Start in background:

  ```bash
  docker compose up -d --build
  ```

- Stop the stack:

  ```bash
  docker compose down
  ```

- View logs:

  ```bash
  docker compose logs -f
  ```

- Rebuild after code changes:

  ```bash
  docker compose up --build
  ```

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `APP_HOST` | Yes | Host served by Caddy. Use `localhost` for local HTTPS tests or a real domain for public callback validation. |
| `AUTH_PUBLIC_ORIGIN` | Yes | Public HTTPS origin used by auth callback resolution. |
| `NEXT_PUBLIC_APP_ORIGIN` | Optional | Frontend-facing app origin. Defaults to `AUTH_PUBLIC_ORIGIN`. |
| `POSTGRES_DB` | Yes | Compose-managed Postgres database name. |
| `POSTGRES_USER` | Yes | Compose-managed Postgres username. |
| `POSTGRES_PASSWORD` | Yes | Compose-managed Postgres password. |
| `WORKER_LOOP_INTERVAL_MS` | Optional | Worker poll-loop interval in milliseconds. |
| `AUTH_GOOGLE_CLIENT_ID` | Optional | Google OAuth client ID. |
| `AUTH_GOOGLE_CLIENT_SECRET` | Optional | Google OAuth client secret. |
| `AUTH_ENTRA_CLIENT_ID` | Optional | Microsoft Entra application ID. |
| `AUTH_ENTRA_CLIENT_SECRET` | Optional | Microsoft Entra secret. |
| `AUTH_ENTRA_TENANT_ID` | Optional | Microsoft Entra tenant ID. |
| `AUTH_OIDC_CLIENT_ID` | Optional | Generic OIDC client ID. |
| `AUTH_OIDC_CLIENT_SECRET` | Optional | Generic OIDC client secret. |
| `AUTH_OIDC_ISSUER` | Optional | Generic OIDC issuer URL. |

`DATABASE_URL` is not meant to be hand-authored in the default compose flow. The compose stack injects an internal database connection string for `web` and `worker`.

## HTTPS modes

- **Local HTTPS test mode**: set `APP_HOST=localhost` and keep `AUTH_PUBLIC_ORIGIN=https://localhost`. Caddy serves the stack locally over HTTPS so the app can be tested behind TLS.
- **Real-domain mode**: set `APP_HOST` and `AUTH_PUBLIC_ORIGIN` to the real domain. This is the mode required for real Google, Microsoft Entra ID, or generic OIDC callback validation.

Local HTTPS is suitable for stack verification and UI testing. Real provider validation still requires a valid public host.

## Auth callback notes

The auth layer resolves callback URLs from:

- `AUTH_PUBLIC_ORIGIN`
- `NEXT_PUBLIC_APP_ORIGIN` (fallback)

Those values must stay aligned with the HTTPS host served by Caddy.

## Real provider validation

For `v1.1`, only Google remains in scope for real public-host proof. Microsoft Entra ID and generic OIDC are deferred to a future milestone.

The expected Google proof path is:

1. configure Google in `.env`
2. expose the stack on a public HTTPS origin served by Caddy
3. register this callback URL in Google:
   - `https://<your-host>/api/auth/callback/google`
4. start from an invite acceptance flow and complete one real Google sign-in
5. mark the Google verification status in the platform-admin settings page after the real callback succeeds

Local HTTPS remains useful for stack verification, but it does not close the milestone callback requirement by itself.

## Google public-host proof kit

The operator runbook, evidence checklist, and report template for the manual Google proof are here:

- `docs/operators.md`
- `docs/google-public-proof.md`
- `.planning/phases/15-public-https-oauth-oidc-proof-and-callback-validation/15-PROOF-REPORT-TEMPLATE.md`

## Packaged batch-import proof path

To prove the packaged batch-import flow in the shipped compose stack:

1. start the stack with `docker compose up --build`
2. open the batch import surface
3. upload a `.zip` containing `.pem`, `.crt`, or `.cer` certificates
4. confirm the batch result reports imported, updated, ignored, or invalid outcomes
5. confirm derived CRLs appear in persisted reporting-visible data

Corrupt archives should fail at the archive level with a top-level import-run error rather than item-by-item processing.

## Operator documentation

For the deeper deployment and troubleshooting guide, see `docs/operators.md`.

## Known limitations

- This packaging is designed for local/staging use, not full production orchestration.
- Provider credentials must still be supplied for real social/enterprise auth flows.
- Local HTTPS helps verify the stack but does not replace a real public callback host for external providers.
