# Phase 14 Research: Packaged Batch Import Runtime Hardening

**Date:** 2026-04-08  
**Phase:** 14 - Packaged Batch Import Runtime Hardening

## Question

What has to change in the current certificate batch-import path so `.zip` onboarding works inside the shipped compose/runtime stack without relying on undeclared host binaries?

## Current codebase findings

- Batch import currently lives in `src/inventory/certificate-admin.ts`.
- The code shells out to `unzip`, which means packaged runtime success depends on an external binary existing in the container.
- The runtime `Dockerfile` currently copies the built app and dependencies, but does not install `unzip`.
- The milestone audit explicitly calls this out as the reason the packaged `zip certificate import -> reporting` flow is broken.
- The compose stack already provides the proof environment for `web + worker + postgres + caddy`.

## Research conclusions

### 1. Remove shell dependency from the app path

For this codebase, the cleanest fix is to keep archive extraction in-process rather than installing and maintaining OS-level tooling just for one feature path.

Implication:
- replace the `execFile("unzip", ...)` approach with a pure Node/runtime extraction library or equivalent in-process parser
- keep the runtime image portable and deterministic

### 2. Treat archive-level corruption separately from per-item failures

The current product model already supports partial success semantics for readable archives. That should stay.

The missing piece is clear top-level handling for unreadable/corrupt archives:
- fail the import run itself
- record a top-level archive error
- skip item processing entirely

This aligns with the user decision and keeps operator diagnostics coherent.

### 3. Preserve the certificate-first contract

This phase should not re-open onboarding semantics. The import contract stays:
- archive contains certificate files
- certificate records are deduplicated by fingerprint
- derived CRLs are projected into runtime targets
- reporting reads the resulting persisted state

The fix is runtime hardening, not product redesign.

### 4. Packaged proof needs to be compose-based

Because the audit gap is specifically about the shipped runtime, proof needs to execute against the compose stack rather than only the source tree.

That proof should show:
- a batch import route can run from the packaged app
- archive extraction succeeds inside the runtime container
- import-run summary is persisted
- derived CRLs become visible through reporting-facing persisted data

### 5. DER and PEM support should be preserved explicitly

The batch path should continue to accept:
- `.pem`
- `.crt`
- `.cer`

and handle both:
- PEM text
- DER binary

This may require tightening certificate decoding logic so file extension does not incorrectly imply PEM-only parsing.

## Planning implications

1. The extraction mechanism and certificate decoding logic should be planned together.  
   If DER support is part of the contract, the import pipeline must normalize both PEM and DER before fingerprinting and CRL derivation.

2. Validation needs a packaged-path check, not only unit-like source checks.  
   The plan should require a reproducible compose-based verification path.

3. Documentation must say what is and is not guaranteed.  
   Since no hard archive-size limit is introduced, the operator docs should describe current behavior as runtime-resource-bound rather than falsely claiming a product limit.

## Recommended implementation direction

- Replace external archive extraction with an in-process Node/library path.
- Normalize certificate file contents so PEM and DER both reach the same fingerprint/CRL derivation pipeline.
- Record archive-level failures distinctly from per-item failures.
- Extend validation to cover:
  - extraction path no longer shells out to `unzip`
  - supported file types/encodings remain accepted
  - packaged compose proof path exists and is documented

## Risks / traps

- Installing `unzip` in the runtime image would close the immediate gap but keep the app dependent on host-level packaging details.
- Treating corrupt archives like normal partial-success batches would blur operator diagnostics and contradict the chosen contract.
- Proving only source execution would not actually close the audit gap.
- Assuming `.crt` / `.cer` are always PEM would create false negatives for DER-encoded files.

## Conclusion

Phase 14 should be planned as a focused runtime-hardening phase with three outcomes:
- self-contained `.zip` extraction in the packaged runtime
- explicit handling for archive-level failures versus item-level failures
- compose-based proof that batch import projects derived CRLs into persisted reporting data
