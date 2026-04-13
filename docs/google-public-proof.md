# Google Public-Host Proof Runbook

## Purpose

This runbook is the operator-facing checklist for the manual `v1.1` Google auth proof on the packaged Docker/Caddy stack.

It assumes:
- the stack is deployed through `docker compose`
- Caddy serves the public HTTPS hostname
- Google is the only external provider in scope for this proof

## Inputs You Need Before Starting

- a public hostname already pointing to the machine that will run the stack
- Google OAuth client ID and client secret
- one invite target email that matches the Google account you will use
- platform-admin access to the application

## Step 1: Prepare `.env`

Set at minimum:

- `APP_HOST=<your-public-host>`
- `AUTH_PUBLIC_ORIGIN=https://<your-public-host>`
- `NEXT_PUBLIC_APP_ORIGIN=https://<your-public-host>`
- `AUTH_GOOGLE_CLIENT_ID=<google-client-id>`
- `AUTH_GOOGLE_CLIENT_SECRET=<google-client-secret>`

Leave Entra ID and generic OIDC variables empty for this phase.

## Step 2: Register the Google callback URL

In the Google provider console, register:

- `https://<your-public-host>/api/auth/callback/google`

Do not continue until the registered callback exactly matches `AUTH_PUBLIC_ORIGIN`.

## Step 3: Start the packaged stack

```bash
docker compose up --build -d
docker compose ps
```

Expected result:
- `web` is up
- `worker` is up
- `postgres` is healthy
- `caddy` is up

## Step 4: Verify public HTTPS reachability

Open:

- `https://<your-public-host>`

Expected result:
- the app loads through HTTPS
- no obvious callback-origin mismatch exists between the browser URL and configured origin

## Step 5: Prepare the invite

Using the platform-admin flow:
- create or locate an invite for the Google account email you will use
- copy the invite link

Expected result:
- the invite email exactly matches the Google account email

## Step 6: Execute the Google sign-in flow

1. open the invite link
2. choose Google sign-in from the invite acceptance screen
3. complete the Google consent/redirect flow
4. wait for the callback to return to the application

Expected result:
- the callback completes successfully
- the app creates a session
- the user lands on an authorized in-app surface

## Step 7: Prove authorized post-login access

After login:

1. open the reporting surface
2. confirm the user can access reporting without being bounced out of session
3. confirm the user sees only data allowed by their invite/group scope

Expected result:
- session remains valid
- authorized reporting access works

## Step 8: Capture evidence

Capture all of the following:

- the public host used
- the exact callback URL registered in Google
- the invite target email
- whether the callback succeeded
- whether a session was created
- whether reporting access worked
- relevant application logs
- relevant Caddy logs, if needed
- relevant audit/log entries visible in the app or database-backed audit trail

Use `.planning/phases/15-public-https-oauth-oidc-proof-and-callback-validation/15-PROOF-REPORT-TEMPLATE.md`.

## Step 9: Mark provider verification

After successful proof:

1. open platform settings
2. record Google as manually verified
3. add a short verification note with the host and date used

## Step 10: Report back for milestone audit

When you finish, report:

- host used
- whether callback succeeded
- whether session creation succeeded
- whether reporting access succeeded
- where the evidence/logs were captured

That report becomes the input for the next milestone audit.
