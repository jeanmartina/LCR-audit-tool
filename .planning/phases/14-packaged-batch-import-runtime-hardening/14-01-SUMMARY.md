# Phase 14 Summary

## Outcome

Phase 14 removed the packaged batch-import dependency on the external `unzip` binary, added explicit archive-level failure handling, and documented the compose-based proof path for shipped `.zip` onboarding.

## Delivered

- Replaced shell-based zip extraction with in-process runtime extraction in `src/inventory/certificate-admin.ts`.
- Added PEM/DER normalization for supported `.pem`, `.crt`, and `.cer` certificate files in `src/inventory/certificate-admin.ts` and `src/app/api/admin/certificates/import/route.ts`.
- Extended certificate import run status handling to support archive-level failure states in `src/storage/runtime-store.ts`.
- Added Phase 14 validation coverage in `scripts/validate-batch-runtime.js` and wired it into `scripts/validate-all.js`.
- Updated onboarding validation expectations in `scripts/validate-onboarding-admin.js`.
- Documented the packaged batch-import contract and compose-based proof path in `README.md` and `docs/operators.md`.
- Added the pure-JS zip runtime dependency in `package.json` and `package-lock.json`.

## Notes

- The shipped runtime no longer relies on a host `unzip` binary for `.zip` onboarding.
- Corrupt/unreadable archives now produce a failed import run with a top-level archive error and no per-item processing.
- Supported batch inputs remain `.zip` archives containing `.pem`, `.crt`, and `.cer` files in either PEM or DER encoding.
- No hard archive-size limit was introduced; current behavior remains constrained by runtime resources.
