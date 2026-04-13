# Phase 15 Google Proof Report

## Environment

- Date: 2026-04-13
- Public host: lcrlogs.labsec.ufsc.br
- `AUTH_PUBLIC_ORIGIN`: https://lcrlogs.labsec.ufsc.br
- Google callback URL registered: https://lcrlogs.labsec.ufsc.br/api/auth/callback/google
- Stack launch command: `docker compose up --build -d`

## Invite and Test Identity

- Invited email: jean.martina@gmail.com
- Google account email used: jean.martina@gmail.com
- Emails matched exactly: yes

## Execution Results

### 1. HTTPS reachability
- Result: passed
- Notes: Caddy obtained and served a valid certificate for `lcrlogs.labsec.ufsc.br`, and the application was reachable over HTTPS on the packaged stack.

### 2. Invite acceptance start
- Result: passed
- Notes: Group `group-1776118956000-gd97qj0u` was created for the proof flow and invite code `code-1776119756888-5chcqgps` was issued for `jean.martina@gmail.com`.

### 3. Google redirect and callback
- Result: passed
- Notes: Google sign-in completed through the real public callback path and linked provider account `106346797145562575892`.

### 4. Session creation
- Result: passed
- Notes: Session `sess-1776119844242-uaggc53p` was created for user `user-1776119844112-0vmpkxjw`.

### 5. Authorized reporting access
- Result: passed
- Notes: The authenticated user reached the reporting dashboard successfully after the Google login flow completed.

### 6. Provider verification update
- Result: passed
- Notes: Google was marked as manually verified in `/settings`.

## Evidence Collected

- App logs: packaged `web` service stayed up and served the auth flow
- Caddy logs: TLS issuance succeeded for `lcrlogs.labsec.ufsc.br`
- Audit trail evidence:
  - `invite.created`
  - `invite.accepted`
  - `provider.linked`
  - `login.succeeded`
- Screenshots or screen captures:
  - reporting dashboard after authenticated Google login

## Outcome

- Google public-host proof complete: yes
- Follow-up issues:
  - settings redirect still uses the internal origin after save and should be corrected in a future cleanup
  - the Google client secret used during the test should be rotated
- Ready for milestone re-audit: yes
