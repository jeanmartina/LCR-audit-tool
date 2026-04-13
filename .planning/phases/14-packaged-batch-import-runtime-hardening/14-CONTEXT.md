# Phase 14: Packaged Batch Import Runtime Hardening - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning
**Source:** Interactive discuss-phase

<domain>
## Phase Boundary

Phase 14 closes the packaged batch-import gap from the `v1.1` audit. The work is limited to making `.zip` certificate onboarding function inside the shipped compose/runtime path and proving that derived CRLs reach persisted reporting data from that packaged stack.

This phase does not add new onboarding capabilities. It hardens the existing batch-import flow so the shipped runtime matches the admin product surface already delivered.
</domain>

<decisions>
## Implementation Decisions

### Runtime extraction strategy
- Remove the external `unzip` dependency from the application path.
- Archive extraction must be self-contained inside the app/runtime.
- The shipped container path must not depend on undeclared host binaries.

### Packaged proof path
- Acceptance proof must happen in the packaged compose stack, not only from source execution.
- Proof must show:
  - a `.zip` upload is accepted
  - the packaged runtime processes the archive
  - the batch result correctly reports imported/updated/ignored/invalid outcomes
  - derived CRLs are projected into persisted runtime data and become visible to reporting

### Partial-failure behavior
- Partial success remains the rule for readable archives.
- If the archive itself is corrupt or unreadable, the system must create a failed import run with a top-level archive error.
- Corrupt/unreadable archives must not attempt per-item processing.
- For readable archives, operator-visible failures should remain concrete and item-specific.

### Supported inputs and limits
- Supported archive type in this phase: `.zip`
- Supported certificate file types inside the archive: `.pem`, `.crt`, `.cer`
- Supported encodings for those certificate files: PEM and DER
- No hard archive-size limit is introduced in this phase unless the implementation adds one explicitly.
- Documentation should state that archive handling is currently constrained by runtime resources rather than an enforced product limit.

### the agent's Discretion
- Choose the specific in-runtime extraction library/path that best fits the current stack and packaging constraints.
- Decide how to encode/archive top-level import-run errors in the existing persistence model if a dedicated field does not yet exist.
- Decide the most practical compose-based verification harness, as long as it proves the packaged path rather than source-only execution.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audit and milestone contract
- `.planning/v1.1-MILESTONE-AUDIT.md` — Defines the packaged batch-import blocker and the exact broken flow this phase closes
- `.planning/REQUIREMENTS.md` — Tracks `ADM-02` as pending and reassigned to Phase 14
- `.planning/ROADMAP.md` — Defines Phase 14 boundary and success criteria

### Existing onboarding/runtime implementation
- `src/inventory/certificate-admin.ts` — Current batch-import flow, archive extraction path, CRL derivation, and import-run behavior
- `src/storage/runtime-store.ts` — Import run/item persistence and reporting-linked runtime data
- `src/app/api/admin/certificates/import-zip/route.ts` — Current batch import entrypoint

### Packaged runtime path
- `Dockerfile` — Current runtime image contents; currently misses the host dependency used by batch import
- `compose.yaml` — Packaged stack contract for `web + worker + postgres + caddy`
- `README.md` — Shipped setup contract that Phase 14 must keep accurate
- `docs/operators.md` — Operator-facing packaged deployment documentation that must reflect the hardened batch-import path
</canonical_refs>

<specifics>
## Specific Ideas

- The current audit gap exists because `.zip` onboarding works in app code but fails in the shipped runtime image.
- The preferred outcome is a portable runtime that behaves the same in source execution and in the packaged compose stack.
- Reporting evidence is part of the proof bar, not an optional follow-up.
</specifics>

<deferred>
## Deferred Ideas

- Explicit archive-size limits
- Horizontal scaling or distributed import workers
- New onboarding sources or onboarding UX changes beyond fixing the shipped batch-import path
</deferred>

---

*Phase: 14-packaged-batch-import-runtime-hardening*
*Context gathered: 2026-04-08 via interactive discuss-phase*
