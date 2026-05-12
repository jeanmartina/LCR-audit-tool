# Phase 30: Import Review and Safety - Research

**Researched:** 2026-05-12  
**Domain:** Next.js review-before-save import flows, certificate provenance, and server-side revalidation  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
#### Review Scope
- Operators may edit all reviewable fields before final save, including technical fields and administrative metadata.

#### Divergence Handling
- If an operator-edited value diverges from the derived/original value, final save is blocked until the operator provides a mandatory justification.

#### Final Save Revalidation
- Final save is blocked if server-side revalidation finds new errors; the flow must return to review with highlighted errors.

#### Non-accepted Outcomes
- Items marked duplicate/rejected/ignored are not persisted as active certificates.
- These outcomes must be recorded in provenance/audit history with decision and reason.

#### Origin Policy Consistency
- The same review-and-save policy applies across single import, ZIP import, and trust-list-derived candidates.

### Claude's Discretion
- Exact route structure for the review surface versus the main import submission surface.
- Whether the review experience is a dedicated page, a toggle, or a reusable panel.
- The detailed presentation of the history view that sits behind the review surface.
- The precise mechanics for mapping the review UI across single, ZIP, and trust-list-derived import paths.

### Deferred Ideas (OUT OF SCOPE)
- Advanced policy exceptions per origin (manual vs trust-list) are out of scope; policy is unified in this phase.
- Any role-based secondary approval workflow for edits is out of scope for this phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-04 | Import flows should use review-before-save, allow accept/edit/ignore/reject decisions, revalidate on the server, and preserve provenance across corrections. | Use a shared review contract, keep commit routes server-authoritative, and persist provenance/history through `recordCertificateChangeEvent`, trust-list projection records, and certificate detail history [VERIFIED: src/storage/runtime-store.ts; src/inventory/certificate-admin.ts; src/app/admin/certificates/[certificateId]/page.tsx; src/trust-lists/sync.ts]. |
</phase_requirements>

## Summary

The current codebase already separates preview from commit for single-certificate import, but the UI still posts directly to the commit route from the same form, ZIP import still commits immediately, and trust-list sync still auto-imports certificates into the pipeline [VERIFIED: src/app/admin/certificates/new/certificate-preview-form.tsx; src/app/api/admin/certificates/import/route.ts; src/app/api/admin/certificates/import-zip/route.ts; src/trust-lists/sync.ts]. The main planning gap is not parsing or normalization; it is a durable review contract that can survive the preview-to-commit round trip without trusting browser state [VERIFIED: src/app/admin/certificates/new/certificate-preview-form.tsx; src/app/admin/certificates/batch/page.tsx; src/trust-lists/admin.ts].

The strongest implementation direction is to make review a shared server-canonical contract across all import sources, then use thin UI adapters for single, ZIP, and trust-list-derived candidates [ASSUMED]. The server should re-parse and revalidate the raw inputs at commit time, compare them with the staged review payload, and reject stale or tampered reviews before any mutation happens [ASSUMED]. Provenance already has the right downstream landing zones: certificate detail pages render change history, trust-list provenance, and group/default state after save, so the review screen can stay focused on the final chosen value [VERIFIED: src/app/admin/certificates/[certificateId]/page.tsx; src/storage/runtime-store.ts].

**Primary recommendation:** introduce a shared review snapshot/token layer and route every import path through the same server-side revalidation and provenance recording helpers before final persistence [ASSUMED].

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | `^16.2.2` [VERIFIED: package.json] | App Router pages and route handlers for review and commit flows | The current import surfaces already live in Next.js server components and route handlers [VERIFIED: src/app/admin/certificates/new/page.tsx; src/app/api/admin/certificates/import/route.ts]. |
| React | `^19.2.4` [VERIFIED: package.json] | Client-side review interactions and state transitions | The current review and preview forms are React client components [VERIFIED: src/app/admin/certificates/new/certificate-preview-form.tsx; src/app/admin/trust-lists/trust-list-source-wizard.tsx]. |
| TypeScript | `^6.0.2` [VERIFIED: package.json] | Shared DTOs for review snapshots, commit payloads, and provenance records | The repo already models import and provenance data as typed record interfaces [VERIFIED: src/inventory/certificate-admin.ts; src/storage/runtime-store.ts]. |
| pg | `^8.20.0` [VERIFIED: package.json] | Runtime persistence for import runs, items, change events, and trust-list projections | The runtime store already persists review-adjacent data through the database path [VERIFIED: src/storage/runtime-store.ts]. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fflate | `^0.8.2` [VERIFIED: package.json] | ZIP archive extraction for batch import | Use for ZIP candidate review and final ZIP import revalidation [VERIFIED: src/inventory/certificate-admin.ts]. |
| xml-crypto | `^6.1.2` [VERIFIED: package.json] | XML signature validation for trust-list preview/sync | Use for trust-list-derived candidate review when the pipeline needs to prove signature validity before save [VERIFIED: src/trust-lists/sync.ts]. |
| @xmldom/xmldom | `^0.9.10` [VERIFIED: package.json] | XML parsing support | Use alongside XMLDSig verification in the trust-list path [VERIFIED: src/trust-lists/sync.ts]. |
| @peculiar/x509 | `^2.0.0` [VERIFIED: package.json] | X.509 inspection utilities | Keep for certificate parsing and X.509 handling already present in the repo [VERIFIED: package.json]. |
| pkijs | `^3.4.0` [VERIFIED: package.json] | ASN.1 / PKI helpers | Keep for certificate and trust-list cryptographic parsing paths already present in the dependency graph [VERIFIED: package.json]. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Shared review snapshot/token contract | Client-only review state | Simpler UI, but it cannot safely survive file uploads or trust-list candidates without trusting browser state [ASSUMED]. |
| Server-canonical final revalidation | Trusting preview output during commit | Lower implementation cost, but it reintroduces stale/tampered review risk [ASSUMED]. |
| One review adapter per import path | A single normalized review model | Per-path logic is easier to start, but it will drift and make provenance/correction behavior inconsistent [ASSUMED]. |

**Installation:** the repo already declares the needed packages in `package.json`; no new third-party stack is required for Phase 30 [VERIFIED: package.json].

## Architecture Patterns

### Recommended Project Structure

```text
src/
├── app/admin/certificates/new/        # single-certificate review entry and final review page [VERIFIED: src/app/admin/certificates/new/page.tsx]
├── app/admin/certificates/batch/      # ZIP batch review entry and batch review page [VERIFIED: src/app/admin/certificates/batch/page.tsx]
├── app/admin/trust-lists/             # trust-list source and derived-candidate review surfaces [VERIFIED: src/app/admin/trust-lists/page.tsx]
├── app/api/admin/certificates/        # preview/review/commit endpoints for certificate imports [VERIFIED: src/app/api/admin/certificates/import/preview/route.ts; src/app/api/admin/certificates/import/route.ts; src/app/api/admin/certificates/import-zip/route.ts]
├── app/api/admin/trust-lists/         # trust-list preview/review endpoints [VERIFIED: src/app/api/admin/trust-lists/preview/route.ts]
├── inventory/                         # canonical certificate import, validation, and provenance helpers [VERIFIED: src/inventory/certificate-admin.ts]
├── trust-lists/                       # trust-list sync and derived-candidate helpers [VERIFIED: src/trust-lists/sync.ts; src/trust-lists/admin.ts]
└── storage/                           # runtime records for runs, items, events, and projection history [VERIFIED: src/storage/runtime-store.ts]
```

### Pattern 1: Server-canonical preview, server-canonical commit
**What:** compute preview data on the server, then re-run the same normalization, permission checks, and provenance binding at final commit time before mutating state [VERIFIED: src/app/api/admin/certificates/import/preview/route.ts; src/app/api/admin/certificates/import/route.ts; src/app/api/admin/certificates/import-zip/route.ts].  
**When to use:** every import source that can change between the review click and final save, especially file uploads and trust-list candidates [VERIFIED: src/trust-lists/sync.ts; src/inventory/certificate-admin.ts].  
**Example:**
```ts
// Source: src/app/api/admin/certificates/import/preview/route.ts and src/app/api/admin/certificates/import/route.ts
const preview = await previewCertificateImport(principal, input);
const result = await importCertificate(principal, input, "single", file.name);

// Source: src/trust-lists/sync.ts
const result = await importCertificate(actor, input, "trust-list", provenance);
```

### Pattern 2: Shared review contract across import origins
**What:** represent single, ZIP, and trust-list-derived candidates with one normalized review DTO so the same decisions, validation rules, and server-side recomputation apply everywhere [ASSUMED].  
**When to use:** whenever an operator can edit values before save and the backend must later prove that the final write matches the staged review state [ASSUMED].  
**Example:**
```ts
// Source: src/app/admin/certificates/new/certificate-preview-form.tsx
const response = await fetch("/api/admin/certificates/import/preview", {
  method: "POST",
  body: new FormData(formRef.current),
});
```

### Pattern 3: Provenance travels with the certificate, not with the review surface
**What:** store provenance in the import pipeline and show it later in the detail/history view instead of crowding the review screen [VERIFIED: src/inventory/certificate-admin.ts; src/app/admin/certificates/[certificateId]/page.tsx].  
**When to use:** any trust-list-derived import or corrected certificate record that needs an audit trail [VERIFIED: src/trust-lists/sync.ts; src/storage/runtime-store.ts].  
**Example:**
```ts
// Source: src/trust-lists/sync.ts
await importCertificate(
  actor,
  input,
  "trust-list",
  `${source.id}-${candidate.ordinal}.pem`,
  {
    trustListSourceId: source.id,
    trustListSnapshotId: snapshot.id,
    trustListRunId: run.id,
  },
);
```

### Pattern 4: Use change events for corrections and post-save history
**What:** persist corrections and operator actions as change events, then render them in the certificate detail page history [VERIFIED: src/storage/runtime-store.ts; src/inventory/certificate-admin.ts; src/app/admin/certificates/[certificateId]/page.tsx].  
**When to use:** after save, when operators edit display names, tags, group membership, ignored URLs, or other correction data [VERIFIED: src/inventory/certificate-admin.ts].  
**Example:**
```ts
// Source: src/inventory/certificate-admin.ts
await recordCertificateChangeEvent({
  certificateId: record.id,
  actorUserId: actor.userId,
  eventType: operation === "imported" ? "certificate.imported" : "certificate.updated",
  details: {
    filename,
    fingerprint,
    groupIds: input.groupIds,
    ignoredUrls: input.ignoredUrls,
    derivedUrls: urls,
  },
});
```

### Anti-Patterns to Avoid
- **Directly trusting preview output during commit:** preview data is not a final authority; the commit route must reparse and revalidate the raw input [VERIFIED: src/app/api/admin/certificates/import/preview/route.ts; src/app/api/admin/certificates/import/route.ts].
- **Splitting single, ZIP, and trust-list review logic into unrelated implementations:** the repo already has shared import helpers and provenance fields, so duplicating logic will create drift [VERIFIED: src/inventory/certificate-admin.ts; src/trust-lists/sync.ts].
- **Showing correction history inline on the review screen:** the phase decision explicitly keeps history in the detail view or record history after save [VERIFIED: .planning/phases/30-import-review-and-safety/30-CONTEXT.md].

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PEM/DER normalization and fingerprint extraction | Ad-hoc certificate parsing in the UI | `normalizeCertificatePem()` and `extractCertificateFingerprint()` | The repo already normalizes both PEM and DER input and computes the import fingerprint centrally [VERIFIED: src/inventory/certificate-admin.ts]. |
| ZIP archive extraction and limit checks | Custom zip parsing | `fflate` via `extractCertificateFilesFromZip()` | Existing code already enforces archive size, per-file size, file-count, and uncompressed limits [VERIFIED: src/inventory/certificate-admin.ts]. |
| Same-origin request protection | Frontend-only anti-CSRF assumptions | `rejectCrossOriginRequest()` on every POST route | Import commit routes already rely on server-side same-origin enforcement [VERIFIED: src/app/api/admin/certificates/import/route.ts; src/app/api/admin/certificates/import-zip/route.ts; src/app/api/admin/trust-lists/[sourceId]/sync/route.ts]. |
| Group-level authorization | UI gating only | `assertAuthenticated()` plus `canManageGroup()` / trust-list operator checks | Review and final commit must remain backend-authoritative [VERIFIED: src/app/api/admin/certificates/import/route.ts; src/inventory/certificate-admin.ts; src/trust-lists/admin.ts]. |
| Provenance/audit history | Inline ad-hoc history blobs | `recordCertificateChangeEvent()` and the certificate detail history view | Existing history plumbing already exists and should absorb corrections [VERIFIED: src/storage/runtime-store.ts; src/app/admin/certificates/[certificateId]/page.tsx]. |
| Trust-list candidate deduplication | New per-path dedupe logic | `candidateKey` + `candidateDigest` + `findLatestTrustListProjection()` | Trust-list change detection already depends on these fields [VERIFIED: src/trust-lists/sync.ts; src/storage/runtime-store.ts]. |

**Key insight:** file upload review, ZIP review, and trust-list review all need one canonical server model; the repo already contains the normalization and provenance hooks, so the main job is to connect them with a review staging step rather than invent new parsing logic [ASSUMED].

## Common Pitfalls

### Pitfall 1: Preview/commit drift
**What goes wrong:** the UI shows one thing, but the final server commit uses different parsed data or different authorization logic [VERIFIED: src/app/admin/certificates/new/certificate-preview-form.tsx; src/app/api/admin/certificates/import/preview/route.ts; src/app/api/admin/certificates/import/route.ts].  
**Why it happens:** preview and commit are already separate routes, and the current single-import form still exposes both actions in one client component [VERIFIED: src/app/admin/certificates/new/certificate-preview-form.tsx].  
**How to avoid:** make the commit route re-run normalization, group authorization, and provenance binding from the raw staged input before any write [ASSUMED].  
**Warning signs:** preview payloads are stored as the source of truth or commit code starts trusting client-supplied derived values [ASSUMED].

### Pitfall 2: Losing correction history before save
**What goes wrong:** the operator can edit or reject values during review, but the final certificate only records the last write and not the correction path [ASSUMED].  
**Why it happens:** the current persistence model has change events after save, but no review-draft record or review-history record exists yet [VERIFIED: src/storage/runtime-store.ts; src/inventory/certificate-admin.ts; src/app/admin/certificates/[certificateId]/page.tsx].  
**How to avoid:** persist review decisions and provenance separately from the final certificate row, then keep the post-save detail view as the history surface [ASSUMED].  
**Warning signs:** review-specific corrections disappear once the operator clicks save, or the detail page cannot explain why the final value differs from the imported candidate [ASSUMED].

### Pitfall 3: Treating trust-list sync as a special case
**What goes wrong:** the trust-list path keeps auto-importing candidates while single and ZIP move to review, creating inconsistent operator expectations [VERIFIED: src/trust-lists/sync.ts].  
**Why it happens:** trust-list sync currently calls `importCertificate()` directly with provenance fields, so it already behaves like a backend import pipeline rather than a review pipeline [VERIFIED: src/trust-lists/sync.ts].  
**How to avoid:** route trust-list-derived candidates through the same review DTO and final commit contract as other import sources [ASSUMED].  
**Warning signs:** the review screen is only implemented for manual uploads and not for trust-list-derived candidates [ASSUMED].

## Code Examples

Verified patterns from the current codebase:

### Single-import preview and commit split
```ts
// Source: src/app/api/admin/certificates/import/preview/route.ts
const preview = await previewCertificateImport(principal, {
  displayName: String(form.get("displayName") ?? "").trim(),
  pemText: normalizeCertificatePem(Buffer.from(await file.arrayBuffer())),
  tags: parseCsv(form.get("tags")),
  groupIds: parseCsv(form.get("groupIds")),
  ignoredUrls: parseCsv(form.get("ignoredUrls")),
  status: String(form.get("status") ?? "active").trim() === "disabled" ? "disabled" : "active",
  groupOverrides: parseOverrides(form.get("groupOverrides")),
});

// Source: src/app/api/admin/certificates/import/route.ts
const result = await importCertificate(
  principal,
  { ...sameInputShape },
  "single",
  file.name,
);
```

### Trust-list provenance propagation
```ts
// Source: src/trust-lists/sync.ts
const result = await importCertificate(
  actor,
  {
    displayName: `${source.label} certificate ${candidate.ordinal}`,
    pemText: candidate.pem,
    tags: ["trust-list", source.id],
    groupIds: source.groupIds,
    ignoredUrls: [],
    status: "active",
    groupOverrides: [],
  },
  "trust-list",
  `${source.id}-${candidate.ordinal}.pem`,
  {
    trustListSourceId: source.id,
    trustListSnapshotId: snapshot.id,
    trustListRunId: run.id,
  },
);
```

### Existing post-save history surface
```tsx
// Source: src/app/admin/certificates/[certificateId]/page.tsx
<section style={BOX_STYLE}>
  <h2 style={{ marginTop: 0 }}>{t("admin.certificates.detail.changeHistory")}</h2>
  <ul>
    {detail.changeHistory.map((event) => (
      <li key={event.id}>
        {event.occurredAt.toISOString()} - {event.eventType} - actor {event.actorUserId ?? "system"} - {JSON.stringify(event.details)}
      </li>
    ))}
  </ul>
</section>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Preview-only single import with direct commit from the same form | Shared review-before-save flow that stages a review snapshot before final save [ASSUMED] | Phase 30 | Prevents the commit route from relying on transient browser state. |
| ZIP import that commits every valid entry immediately | ZIP review page that validates the archive on the server before final entry-by-entry save [ASSUMED] | Phase 30 | Keeps the batch path consistent with single import review and makes partial decisions explicit. |
| Trust-list sync that auto-imports derived candidates | Trust-list-derived candidate review using the same review DTO as manual imports [ASSUMED] | Phase 30 | Preserves operator control and keeps provenance/correction semantics aligned. |

**Deprecated/outdated:**
- Direct final submit from the import form without a review stage is now out of scope for the default path in this phase [VERIFIED: .planning/phases/30-import-review-and-safety/30-CONTEXT.md].
- Showing correction history inline on the review screen is explicitly out of scope [VERIFIED: .planning/phases/30-import-review-and-safety/30-CONTEXT.md].

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this
> section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A shared server-stored review contract or token, backed by one normalized review DTO, is the right implementation shape for all import origins. | Summary, Architecture Patterns, Alternatives Considered, State of the Art | The planner could over-invest in staging storage or under-invest in replay protection if the final contract differs. |
| A2 | Final commit should re-run normalization, authorization, and provenance binding on the server and reject stale or tampered staged review data. | Summary, Common Pitfalls, Security Domain | If the team wants soft validation, this may need to become warning-only instead of a hard rejection. |
| A3 | The review screen should stay focused on the final chosen value and keep correction history in post-save detail/history. | Summary, Architecture Patterns, Common Pitfalls | If the team wants inline history, the review screen layout and read model both change. |
| A4 | Trust-list-derived candidates should use the same review DTO and commit contract as manual imports, and may need per-candidate review granularity. | Summary, Common Pitfalls, Open Questions, State of the Art | If trust-list review stays automated, the planner needs a different operator-confirmation boundary. |
| A5 | A dedicated review-stage storage primitive may be needed if no existing runtime record can safely survive file uploads and trust-list edits. | Open Questions, Summary | If a lighter token reuse works, the planner should not create a new table or token store. |
| A6 | The exact review route shape, including whether `/admin/certificates/import-runs/[runId]` is reused, should be decided during planning. | Open Questions, Claude's Discretion | Route wiring and validation scope could shift. |
| A7 | Phase 30 will need new validation coverage for tamper/replay rejection, divergence justification, and shared fixtures. | Validation Architecture | If existing scripts are enough, the planner can skip new validator work. |
| A8 | The phase gate remains the full quality suite plus `/gsd-verify-work`. | Validation Architecture | If the project workflow changes, the gate command changes. |
| A9 | Review payload tampering and replay are the main new threats; server-side recomputation is the mitigation. | Security Domain | If threat modeling identifies a different attack, the security task list changes. |
| A10 | The confidence note that pitfalls are inferred from current code shape is itself an assumption about evidence quality. | Metadata | If more explicit docs are found, the pitfall confidence can rise. |

## Open Questions

1. **Where should the staged review payload live?**
   - What we know: there is no existing draft/review-token store in the repo, and the current model only persists runs, items, and change events after import [VERIFIED: src/storage/runtime-store.ts; src/inventory/certificate-admin.ts].
   - What's unclear: whether Phase 30 should use a dedicated database table, a short-lived signed token, or another existing runtime primitive.
   - Recommendation: choose the smallest server-stored mechanism that can survive file uploads and trust-list candidate edits without depending on client replay [ASSUMED].

2. **Should trust-list review happen per candidate or per sync batch?**
   - What we know: the sync pipeline processes candidates one by one and already stores per-candidate projection records and provenance [VERIFIED: src/trust-lists/sync.ts; src/storage/runtime-store.ts].
   - What's unclear: whether operators need one review screen per candidate, a batch summary with per-item actions, or both.
   - Recommendation: make the data contract per-candidate and let the UI aggregate it if needed [ASSUMED].

3. **What is the review history granularity after save?**
   - What we know: post-save detail pages already expose a chronological `changeHistory` list and trust-list provenance section [VERIFIED: src/app/admin/certificates/[certificateId]/page.tsx].
   - What's unclear: whether review-time corrections should become a dedicated event type or be folded into the existing import/update event payload.
   - Recommendation: keep the detail view simple and store enough metadata in the event `details` object to reconstruct the correction path later [ASSUMED].

4. **Should the review handoff reuse an existing import result page?**
   - What we know: the repo already has `/admin/certificates/import-runs/[runId]`, but it is a post-save summary view [VERIFIED: src/app/admin/certificates/import-runs/[runId]/page.tsx].
   - What's unclear: whether Phase 30 should extend that route, add a sibling review route, or use a reusable review panel embedded in each import page.
   - Recommendation: decide this during planning because it changes both route wiring and validation scope [ASSUMED].

## Environment Availability

> Local runtime checks on 2026-05-12 showed Node, npm, and PostgreSQL availability [VERIFIED: local env check].

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | validation scripts and Next.js build/runtime | ✓ | `v22.22.2` [VERIFIED: local env check] | — |
| npm | package scripts and repo validation entrypoints | ✓ | `11.12.1` [VERIFIED: local env check] | — |
| PostgreSQL client/server | database-backed runtime store and persistence verification | ✓ | `16.13` via `pg_isready` [VERIFIED: local env check] | In-memory cache paths exist, but provenance and review persistence need DB-backed verification [VERIFIED: src/storage/runtime-store.ts]. |

**Missing dependencies with no fallback:**
- None verified in this session.

**Missing dependencies with fallback:**
- None verified in this session.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected; the repo currently uses script-based validation only [VERIFIED: package.json; scripts/validate-all.js]. |
| Config file | none - no `jest.config.*`, `vitest.config.*`, `pytest.ini`, or similar runner config was found [VERIFIED: rg --files]. |
| Quick run command | `npm run typecheck` [VERIFIED: package.json] |
| Full suite command | `npm run quality` [VERIFIED: package.json] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-04 | Review-before-save on single import, ZIP import, and trust-list-derived candidates; server-side final revalidation; provenance preserved across corrections | integration + storage unit + route smoke | `npm run quality` after adding a phase-specific Node validator patterned after `scripts/validate-onboarding-admin.js` [VERIFIED: scripts/validate-onboarding-admin.js; scripts/validate-all.js] | ❌ Wave 0 [VERIFIED: rg --files] |

### Sampling Rate
- **Per task commit:** `npm run typecheck` [VERIFIED: package.json]
- **Per wave merge:** `npm run quality` [VERIFIED: package.json]
- **Phase gate:** full suite green before `/gsd-verify-work` [ASSUMED]

### Wave 0 Gaps
- [ ] No phase-specific import review validator exists yet [VERIFIED: rg --files].
- [ ] No review draft/token persistence tests exist yet [VERIFIED: rg --files].
- [ ] No route smoke coverage exists yet for tamper/replay rejection or divergence justification paths [ASSUMED].
- [ ] No shared fixture layer exists yet for staged review payloads and provenance assertions [ASSUMED].

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes [VERIFIED: src/app/api/admin/certificates/import/route.ts; src/app/api/admin/trust-lists/[sourceId]/sync/route.ts] | `assertAuthenticated()` on every review and commit route [VERIFIED: src/app/api/admin/certificates/import/route.ts]. |
| V3 Session Management | yes [VERIFIED: src/auth/authorization.ts; src/auth/session.ts] | Existing session-cookie auth and authorization guards [VERIFIED: src/auth/session.ts; src/auth/authorization.ts]. |
| V4 Access Control | yes [VERIFIED: src/inventory/certificate-admin.ts; src/trust-lists/admin.ts] | `canManageGroup()` plus trust-list operator/group scoping [VERIFIED: src/inventory/certificate-admin.ts; src/trust-lists/admin.ts]. |
| V5 Input Validation | yes [VERIFIED: src/app/api/admin/certificates/import/preview/route.ts; src/app/api/admin/certificates/import/route.ts; src/app/api/admin/certificates/import-zip/route.ts] | Server-side parsing, size checks, and helper normalization before mutation [VERIFIED: src/app/api/admin/certificates/import/preview/route.ts; src/inventory/certificate-admin.ts]. |
| V6 Cryptography | yes [VERIFIED: src/inventory/certificate-admin.ts; src/trust-lists/sync.ts] | Use the existing certificate and XMLDSig libraries; never hand-roll crypto validation [VERIFIED: package.json; src/trust-lists/sync.ts]. |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Tampered review payload or replayed stale review token | Tampering | Recompute normalization and validation on the server at commit time, and reject mismatches [ASSUMED]. |
| Cross-site POST to review/commit routes | Spoofing | Preserve `rejectCrossOriginRequest()` on every mutating route [VERIFIED: src/app/api/admin/certificates/import/route.ts; src/app/api/admin/certificates/import-zip/route.ts; src/app/api/admin/trust-lists/[sourceId]/sync/route.ts]. |
| Oversized certificate archive or per-file bomb | Denial of Service | Keep size, file-count, and uncompressed-byte limits in the server import helper [VERIFIED: src/inventory/certificate-admin.ts]. |
| Private-network trust-list fetch target or redirect chain | Information Disclosure / SSRF | Keep the trust-list public-fetch checks and redirect validation in the sync path [VERIFIED: src/trust-lists/sync.ts]. |
| Lost provenance after correction | Repudiation | Persist correction events and show provenance in the post-save detail/history view [VERIFIED: src/storage/runtime-store.ts; src/app/admin/certificates/[certificateId]/page.tsx]. |

## Sources

### Primary (HIGH confidence)
- `src/app/admin/certificates/new/page.tsx` - single-import entry point and current preview-first surface [VERIFIED].
- `src/app/admin/certificates/new/certificate-preview-form.tsx` - current single-import form and preview button [VERIFIED].
- `src/app/admin/certificates/batch/page.tsx` - current ZIP import entry point [VERIFIED].
- `src/app/api/admin/certificates/import/preview/route.ts` - single-import preview API [VERIFIED].
- `src/app/api/admin/certificates/import/route.ts` - single-import commit API [VERIFIED].
- `src/app/api/admin/certificates/import-zip/route.ts` - ZIP import commit API [VERIFIED].
- `src/inventory/certificate-admin.ts` - canonical import helpers, provenance propagation, change-event recording, and ZIP extraction [VERIFIED].
- `src/trust-lists/admin.ts` - trust-list operator flows and trust-list certificate provenance lookup [VERIFIED].
- `src/trust-lists/sync.ts` - trust-list sync pipeline and direct certificate import path [VERIFIED].
- `src/app/admin/trust-lists/page.tsx` - trust-list wizard and admin surface [VERIFIED].
- `src/app/admin/trust-lists/trust-list-source-wizard.tsx` - current trust-list preview-and-save flow [VERIFIED].
- `src/app/admin/certificates/[certificateId]/page.tsx` - post-save provenance and history surface [VERIFIED].
- `src/app/admin/certificates/import-runs/[runId]/page.tsx` - import run result view [VERIFIED].
- `src/storage/runtime-store.ts` - run, item, event, and projection record schemas and persistence helpers [VERIFIED].
- `src/auth/request-security.ts` - same-origin enforcement for mutating requests [VERIFIED].
- `package.json` - declared dependency and script versions [VERIFIED].
- `scripts/validate-all.js` - current validation entrypoint [VERIFIED].
- `scripts/validate-onboarding-admin.js` - existing Node validation pattern to mirror for Phase 30 [VERIFIED].
- `scripts/validate-ui-guidance.js` - existing Node validation pattern to mirror for Phase 30 [VERIFIED].
- `.planning/phases/30-import-review-and-safety/30-CONTEXT.md` - locked phase decisions and out-of-scope items [VERIFIED].
- `.planning/REQUIREMENTS.md` - UI-04 requirement text [VERIFIED].
- `.planning/STATE.md` - current milestone context and phase position [VERIFIED].

### Secondary (MEDIUM confidence)
- None. This research intentionally stayed inside the repository and planning artifacts for higher-confidence claims [VERIFIED].

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - package versions and scripts are declared locally in `package.json` [VERIFIED].
- Architecture: HIGH - the current import/provenance code paths are directly visible in the repository [VERIFIED].
- Pitfalls: MEDIUM - the main risks are inferred from current code shape and phase decisions rather than explicitly documented behavior [ASSUMED].

**Research date:** 2026-05-12  
**Valid until:** 2026-06-11
