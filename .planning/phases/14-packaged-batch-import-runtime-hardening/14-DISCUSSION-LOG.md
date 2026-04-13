# Phase 14 Discussion Log

**Date:** 2026-04-08
**Phase:** 14 - Packaged Batch Import Runtime Hardening

## Areas discussed

### 1. Runtime extraction strategy
- Decision: remove the external `unzip` dependency and keep archive extraction self-contained in the app/runtime.

### 2. Packaged proof path
- Decision: proof must happen in the packaged compose stack.
- Required proof:
  - `.zip` upload works
  - packaged runtime processes the archive
  - import summary is correct
  - derived CRLs reach persisted reporting data

### 3. Partial-failure behavior
- Decision: partial success remains the rule for readable archives.
- Decision: corrupt/unreadable archives create a failed import run with a top-level archive error and no per-item processing.

### 4. Operational contract and limits
- Decision: leave archive size as not hard-limited yet / constrained by runtime resources unless a real limit is implemented.
- Decision: supported certificate file types inside `.zip` are `.pem`, `.crt`, and `.cer`.
- Decision: supported encodings are PEM and DER.
