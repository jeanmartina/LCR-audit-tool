# Operator Guide

## Purpose

This document covers the local/staging deployment model for the packaged stack and the minimum operator knowledge required to run it.

## Service responsibilities

### `web`

- serves the Next.js application
- handles auth, admin, reporting, and export routes
- connects to Postgres through the compose-injected `DATABASE_URL`

### `worker`

- runs the background scheduler loop
- uses the same application image as `web`
- connects to the same Postgres instance through the compose-injected `DATABASE_URL`

### `postgres`

- persists runtime targets, polls, snapshots, validation events, alerts, and user/auth state
- is kept internal to the compose network by default

### `caddy`

- terminates HTTPS
- proxies traffic to `web`
- is the only service exposed to the host in the normal stack path

## Startup procedure

1. Copy `.env.example` to `.env`.
2. Set `APP_HOST` and `AUTH_PUBLIC_ORIGIN`.
3. Fill provider credentials only for the providers you plan to test.
4. Start the stack:

   ```bash
   docker compose up --build
   ```

5. Confirm the services:

   ```bash
   docker compose ps
   ```

## Batch import contract

- Supported archive type: `.zip`
- Supported certificate files inside the archive: `.pem`, `.crt`, `.cer`
- Supported encodings: PEM and DER
- Archive extraction is handled inside the application runtime
- No host `unzip` dependency is required in the packaged path
- Archive size is not hard-limited yet; current behavior is constrained by runtime resources

## Local HTTPS mode

Use:

- `APP_HOST=localhost`
- `AUTH_PUBLIC_ORIGIN=https://localhost`

This keeps the full stack behind HTTPS for local testing.

## Real-domain mode

Use a real public domain when testing:

- Google sign-in

In this mode:

- `APP_HOST` must be the real host served by Caddy
- `AUTH_PUBLIC_ORIGIN` must match that HTTPS origin exactly

## Provider callback proof procedure

Use this procedure to close the Google public-HTTPS auth requirement for `v1.1`:

1. fill `AUTH_GOOGLE_CLIENT_ID` and `AUTH_GOOGLE_CLIENT_SECRET`
2. deploy the stack on a real public HTTPS host served by Caddy
3. register the callback URL in Google:
   - `https://<host>/api/auth/callback/google`
4. create an invite for the target email
5. start sign-in from the invite acceptance page
6. complete one real successful Google flow
7. open the platform-admin settings page and record the manual verification status for Google

Microsoft Entra ID and generic OIDC are intentionally deferred to a future milestone.

Provider secrets remain env-only. The settings page only shows callback URLs, configuration presence, and the manual verification state.

## Google public-host proof checklist

1. `docker compose up --build -d`
2. confirm `docker compose ps` shows `web`, `worker`, `postgres`, and `caddy` up
3. confirm `https://<host>` opens through Caddy without mixed-origin surprises
4. confirm the invite target email matches the Google account you will use
5. generate or locate the invite link for that email
6. start the flow from the invite acceptance page
7. complete Google redirect and callback
8. confirm the app creates a session and lands on an authorized surface
9. open reporting and confirm authorized access works after login
10. capture logs and audit evidence before marking the provider verified

Use `docs/google-public-proof.md` together with `.planning/phases/15-public-https-oauth-oidc-proof-and-callback-validation/15-PROOF-REPORT-TEMPLATE.md` while you execute the run.

## Logs and troubleshooting

- all logs:

  ```bash
  docker compose logs -f
  ```

- web only:

  ```bash
  docker compose logs -f web
  ```

- worker only:

  ```bash
  docker compose logs -f worker
  ```

- caddy only:

  ```bash
  docker compose logs -f caddy
  ```

- postgres only:

  ```bash
  docker compose logs -f postgres
  ```

## Packaged batch-import proof procedure

Use this procedure to prove the shipped compose stack supports batch onboarding:

1. start the packaged stack with `docker compose up --build`
2. verify `web`, `worker`, `postgres`, and `caddy` are healthy
3. open the batch import UI
4. upload a `.zip` containing `.pem`, `.crt`, or `.cer` certificates
5. confirm the returned/imported batch summary reports imported, updated, ignored, and invalid outcomes correctly
6. confirm derived CRLs are visible through the persisted reporting path

If the archive itself is corrupt or unreadable, the expected behavior is a failed import run with a top-level archive error and no per-item processing.

## Rebuild and restart

- rebuild after source changes:

  ```bash
  docker compose up --build
  ```

- stop services:

  ```bash
  docker compose down
  ```

- stop services and remove volumes:

  ```bash
  docker compose down -v
  ```

Use the volume-removal form only when you explicitly want to discard local database state.

## Environment reference

### Required in the standard stack

- `APP_HOST`
- `AUTH_PUBLIC_ORIGIN`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

### Optional

- `NEXT_PUBLIC_APP_ORIGIN`
- `WORKER_LOOP_INTERVAL_MS`
- all provider-specific OAuth/OIDC variables

## Security boundary for this phase

- Secrets are environment variables in this milestone.
- Postgres authentication remains enabled even on the internal network.
- The compose stack avoids manual `DATABASE_URL` authoring by injecting an internal connection string automatically.

## Expected operator checks

After startup, verify:

1. `docker compose ps` shows all four services up.
2. The application opens on the HTTPS origin configured by `AUTH_PUBLIC_ORIGIN`.
3. `worker` logs show poll-loop execution without immediate crashes.
4. Auth callback origins match the configured HTTPS host before attempting real provider sign-in.

## Trust-list source onboarding

Use `/admin/trust-lists` for the guided trust-list source flow.

1. Open the wizard and fill the source label, HTTPS ETSI XML URL, and comma-separated target group IDs.
2. Keep scheduled sync enabled only for sources you expect the worker to poll.
3. Click `Preview source` before saving whenever possible.
4. Review the preview output:
   - digest, sequence, territory, XML size, and certificate count
   - XML signature validation status
   - recovery guidance when the preview fails
5. Save the source.
6. Run `Sync now` to create the first accepted snapshot and certificate projections.

Platform admins can manage every trust-list source. Group admins can manage only sources whose `groupIds` stay inside their own admin scope.

## Recovery guidance

The trust-list page now maps common failures to explicit operator actions.

- `Invalid URL`: fix the URL format and retry preview.
- `HTTPS required`: use HTTPS for deployed sources; only localhost may stay HTTP for local tests.
- `XML signature invalid`: confirm the official source and do not sync into inventory until XMLDSig passes.
- `XML too large`: confirm the file is the expected ETSI XML or raise `TRUST_LIST_MAX_XML_BYTES` deliberately.
- `Fetch failed`: inspect DNS, firewall, TLS, and upstream HTTP status from the Docker host.
- `No certificates found`: confirm the document is a real ETSI TS 119 612 trust-list XML and not an index or HTML page.
- `XML parse failed`: confirm the URL returns XML and points directly to the trust-list document.
- `Unmapped failure`: capture the raw error and extend recovery mapping if the issue repeats.
