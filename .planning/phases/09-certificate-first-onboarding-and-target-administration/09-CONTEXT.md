# Phase 9: Certificate-First Onboarding and Target Administration - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 9 delivers the first real administration UX for the product. The onboarding source is the uploaded certificate, not a manually typed CRL URL. The phase must cover single-certificate import, `.zip` batch import, certificate-centric administration, shared targets across groups, and operator-visible effective configuration/defaults.

</domain>

<decisions>
## Implementation Decisions

### Administration unit
- **D-01:** The primary admin object is the **certificate**.
- **D-02:** Derived CRL URLs are shown as operational results of that certificate, not as independent primary admin objects.
- **D-03:** Operators do not edit derived CRLs directly; certificate-level configuration remains the source of truth.
- **D-04:** Operators must be able to mark a derived URL as **ignored** during create/edit flows.

### Import and deduplication behavior
- **D-05:** Certificates should be deduplicated using a stable certificate fingerprint.
- **D-06:** Re-import of a known certificate should, by default, **reimport and update** rather than ignore it or require a confirmation stop.
- **D-07:** `.zip` imports are processed item-by-item and may complete with partial success.
- **D-08:** Batch import result reporting must distinguish imported, updated, ignored, and invalid certificates.
- **D-09:** Reprocessing a certificate recalculates derived CRLs while preserving change history.
- **D-10:** Runtime monitoring of the same CRL URL must be deduplicated — the worker should not monitor the same public CRL twice if another certificate already references it.
- **D-11:** Even when CRL execution/history is deduplicated internally, visibility remains certificate/group-scoped; reuse of a CRL does **not** widen access across groups.

### Configuration and overrides
- **D-12:** Certificate-level admin fields include:
  - friendly name / label
  - tags
  - shared groups
  - enabled / disabled
  - effective polling interval
  - timeout
  - criticality
  - alert policy
  - extra recipients
  - retention
  - ignored derived URLs
- **D-13:** Defaults resolve in this order: platform -> group -> certificate.
- **D-14:** When a certificate is shared with multiple groups, the system must support **group-specific overrides** rather than only one global certificate configuration.
- **D-15:** The UI must show the **effective resolved values** before save so operators can see which values come from defaults versus overrides.

### Administration surface
- **D-16:** The main surface is a certificate list view with search/filtering, status, linked groups, derived CRL count, last import, and quick actions.
- **D-17:** Single-certificate create/edit includes field editing, derived-CRL preview, ignore-url controls, effective-default preview, and effective alert-recipient preview.
- **D-18:** `.zip` import is a **separate flow** from single-certificate create/edit because batch behavior needs iteration and bulk-apply affordances.
- **D-19:** Clone creates a **template**, not an immediately independent live certificate copy.
- **D-20:** Change history must include both field-level/operational changes **and** who changed what and when.
- **D-21:** Certificate detail should expose metadata, derived CRLs, shared groups, change history, manual connectivity/validation testing, and clone/template actions.

### the agent's Discretion
- Exact fingerprint algorithm and normalization, as long as it is stable and appropriate for certificate identity.
- Batch import UX details, provided large `.zip` uploads remain operationally manageable.
- Exact representation of effective-value previews and override comparison in the UI.
- Exact storage model for shared CRL execution reuse, provided auth boundaries remain certificate/group-scoped.

</decisions>

<specifics>
## Specific Ideas

- The product should remain faithful to domain truth: operators upload certificates and the system derives CRLs from them.
- Deduplicating CRL execution is an operational optimization, not a permission shortcut.
- Shared certificates need group-specific operational behavior without forcing duplicate certificate objects.
- Batch import should likely include a "do the same for all" mechanism for large archives, but that remains a planning/UX decision.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone scope
- `.planning/PROJECT.md` — Current milestone framing, certificate-first constraints, and product-level direction
- `.planning/REQUIREMENTS.md` — Phase 9 requirement IDs and milestone-wide boundaries
- `.planning/ROADMAP.md` — Phase 9 goal, dependencies, and success criteria
- `.planning/research/SUMMARY.md` — Recommended v1.1 architecture direction

### Phase dependencies
- `.planning/phases/08-identity-invitations-and-access-foundation/08-CONTEXT.md` — Auth/group/role constraints already locked
- `.planning/phases/08-identity-invitations-and-access-foundation/08-VERIFICATION.md` — What Phase 8 actually delivered and what later phases can rely on

### Domain and code context
- `src/storage/runtime-store.ts` — Current source-of-truth persistence layer that will likely host certificate/admin/group-sharing state
- `src/auth/authorization.ts` — Existing role and permission boundaries that admin flows must enforce
- `src/reporting/read-models.ts` — Existing reporting surface now constrained by group authorization
- `.planning/research/ARCHITECTURE.md` — App-owned auth/group model and packaging direction already chosen for v1.1
- `.planning/research/PITFALLS.md` — Shared-target and onboarding risks that must remain visible during planning

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/storage/runtime-store.ts` already persists targets, group shares, and auth entities, which makes it the natural place to extend certificate-first admin state.
- `src/auth/authorization.ts` already exposes `platform-admin`, `group-admin`, and group-scoped permission helpers.
- `src/app/reporting/*` and `src/reporting/read-models.ts` already depend on target identity and group visibility, so Phase 9 admin flows should preserve those contracts.

### Established Patterns
- Postgres-backed persistence is the established runtime pattern.
- Next.js App Router pages and route handlers are the established web surface.
- Validation scripts under `scripts/` are the established phase-level verification mechanism.

### Integration Points
- Phase 9 must integrate with Phase 8 auth/session/permission primitives.
- Certificate onboarding must eventually feed Phase 10 predictive/reporting work without breaking group isolation.
- Shared certificate/group configuration will need to coexist with deduplicated CRL runtime execution.

</code_context>

<deferred>
## Deferred Ideas

- Trust-list ingestion via ETSI TS 119 612 remains a future milestone.
- OCSP and CP/CPS/DPC monitoring remain future work.
- Multi-region/jurisdiction execution remains future work.
- Full i18n rollout belongs to Phase 11, even if Phase 9 should avoid hard-coding future-hostile UI strings.

</deferred>

---

*Phase: 09-certificate-first-onboarding-and-target-administration*
*Context gathered: 2026-04-07*
