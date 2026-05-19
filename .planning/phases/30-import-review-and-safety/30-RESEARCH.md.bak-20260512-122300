# Phase 30: Import Review and Safety - Research

**Researched:** 2026-05-12  
**Domain:** Next.js import review flows, certificate import persistence, and provenance-preserving revalidation  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Review-before-save is part of the import flow.
- Review-before-save is the default behavior for this phase.
- The same review experience must apply to all import types.
- This includes single certificate import, ZIP batch import, and trust-list-derived import paths that enter the certificate pipeline.
- The review screen should show only the final value the user is about to save.
- The review screen should not expose the full correction history inline.
- Historical provenance and correction details belong in the detail view or record history after save.

### Claude's Discretion
- Exact route structure for the review surface versus the main import submission surface.
- Whether the separate review mode is a dedicated page, a toggle, or a reusable panel.
- The detailed presentation of the history view that sits behind the review surface.
- The precise mechanics for mapping the review UI across single, ZIP, and trust-list-derived import paths.

### Deferred Ideas (OUT OF SCOPE)
- Exact implementation shape for the separate review invocation.
- Detailed provenance/history UI beyond the final-value review screen.
- Any future AI-assisted normalization or explanation layer, which is out of scope for this phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-04 | Import flows should use review-before-save, allow accept/edit/ignore/reject decisions, revalidate on the server, and preserve provenance across corrections. | Use a shared review contract, keep commit routes server-authoritative, and persist provenance/history through `recordCertificateChangeEvent`, trust-list projection records, and certificate detail history [VERIFIED: src/storage/runtime-store.ts; src/inventory/certificate-admin.ts; src/app/admin/certificates/[certificateId]/page.tsx; src/trust-lists/sync.ts]. |
</phase_requirements>

## Summary

The current codebase already separates preview from commit for single-certificate import, but the UI still posts directly to the commit route from the same form, ZIP import still commits immediately, and trust-list sync still auto-imports certificates into the pipeline [VERIFIED: src/app/admin/certificates/new/certificate-preview-form.tsx; src/app/api/admin/certificates/import/route.ts; src/app/api/admin/certificates/import-zip/route.ts; src/trust-lists/sync.ts]. The main planning gap is not validation logic; it is the absence of a shared review snapshot that can survive the round-trip from preview to final save without trusting client state [VERIFIED: src/app/admin/certificates/new/certificate-preview-form.tsx; src/app/admin/certificates/batch/page.tsx; src/trust-lists/admin.ts].

The strongest implementation direction is to make review a shared server-canonical contract across all import sources, then use thin UI adapters for single, ZIP, and trust-list-derived candidates [ASSUMED]. The server should re-parse and revalidate the raw inputs at commit time, compare them with the staged review payload, and reject stale or tampered reviews before any mutation happens [ASSUMED]. Provenance already has the right downstream landing zones: certificate detail pages render change history, trust-list provenance, and group/default state after save, so the review screen can stay focused on the final chosen value [VERIFIED: src/app/admin/certificates/[certificateId]/page.tsx; src/storage/runtime-store.ts].

**Primary recommendation:** introduce a shared review snapshot/token layer and route every import path through the same server-side revalidation and provenance recording helpers before final persistence [ASSUMED].

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | `^16.2.2` [VERIFIED: package.json] | App Router pages and route handlers for import review and commit flows | The current UI and API surfaces already live in Next.js routes and server components [VERIFIED: src/app/admin/certificates/new/page.tsx; src/app/api/admin/certificates/import/route.ts]. |
| React | `^19.2.4` [VERIFIED: package.json] | Client-side review interactions and state transitions | The current import forms are React client components and the review UI can stay in that model [VERIFIED: src/app/admin/certificates/new/certificate-preview-form.tsx; src/app/admin/trust-lists/trust-list-source-wizard.tsx]. |
| TypeScript | `^6.0.2` [VERIFIED: package.json] | Shared DTOs for review snapshots, commit payloads, and provenance records | The repo already uses typed helper objects and record interfaces for import and provenance data [VERIFIED: src/inventory/certificate-admin.ts; src/storage/runtime-store.ts]. |
| pg | `^8.20.0` [VERIFIED: package.json] | Runtime persistence for import runs, items, change events, and trust-list projections | The runtime store already persists import runs, import items, change events, and provenance records through the database path [VERIFIED: src/storage/runtime-store.ts]. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| fflate | `^0.8.2` [VERIFIED: package.json] | ZIP archive extraction for batch import | Use for ZIP candidate review and final ZIP import revalidation [VERIFIED: src/inventory/certificate-admin.ts]. |
| xml-crypto | `^6.1.2` [VERIFIED: package.json] | XML signature validation for trust-list preview/sync | Use for trust-list-derived candidate review when the pipeline needs to prove signature validity before save [VERIFIED: src/trust-lists/sync.ts]. |
| @xmldom/xmldom | `^0.9.10` [VERIFIED: package.json] | XML parsing support | Use alongside XMLDSig verification in the trust-list path [VERIFIED: src/trust-lists/sync.ts]. |
| @peculiar/x509 | `^2.0.0` [VERIFIED: package.json] | X.509 inspection utilities | Keep for certificate parsing and fingerprint-adjacent certificate handling already used in the repo [VERIFIED: package.json]. |
| pkijs | `^3.4.0` [VERIFIED: package.json] | ASN.1 / PKI helpers | Keep for certificate and trust-list cryptographic parsing paths already present in the dependency graph [VERIFIED: package.json]. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Shared review snapshot/token contract | Client-only preview state | Simpler UI, but it cannot safely survive the preview-to-commit round trip for file uploads or trust-list candidates [ASSUMED]. |
| Server-canonical final revalidation | Trusting preview output during commit | Lower implementation cost, but it reintroduces stale/tampered review risk and makes review screens authoritative when they should not be [ASSUMED]. |
| One review adapter per import path | A single normalized review model | Per-path logic is easier to start, but it will drift and make provenance/correction behavior inconsistent across single, ZIP, and trust-list flows [ASSUMED]. |

**Installation:** the repo already declares the needed packages in `package.json`; no new third-party stack is required for phase 30 [VERIFIED: package.json].

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
**What:** compute preview data on the server, then re-run the same normalization and permission checks at final commit time before mutating state [VERIFIED: src/app/api/admin/certificates/import/preview/route.ts; src/app/api/admin/certificates/import/route.ts; src/app/api/admin/certificates/import-zip/route.ts].  
**When to use:** every import source that can change between the review click and final save, especially file uploads and trust-list candidates [ASSUMED].  
**Example:**
```ts
// Source: src/app/api/admin/certificates/import/preview/route.ts and src/app/api/admin/certificates/import/route.ts
const preview = await previewCertificateImport(principal, input);
const result = await importCertificate(principal, input, "single", file.name);

// Source: src/trust-lists/sync.ts
const result = await importCertificate(actor, input, "trust-list", provenance);
```

### Pattern 2: Provenance travels with the certificate, not with the review surface
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

### Pattern 3: Use change events for corrections and post-save history
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
- **Directly trusting preview output during commit:** preview data is not a final authority; the commit route must reparse and revalidate the raw input [ASSUMED].
- **Splitting single, ZIP, and trust-list review logic into unrelated implementations:** the repo already has shared import helpers and provenance fields, so duplicating logic will create drift [VERIFIED: src/inventory/certificate-admin.ts; src/trust-lists/sync.ts].
- **Showing correction history inline on the review screen:** the phase decision explicitly keeps history in the detail view or record history after save [VERIFIED: .planning/phases/30-import-review-and-safety/30-CONTEXT.md].

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PEM/DER normalization and fingerprint extraction | Ad-hoc certificate parsing in the UI | `normalizeCertificatePem()` and `extractCertificateFingerprint()` [VERIFIED: src/inventory/certificate-admin.ts] | The repo already normalizes both PEM and DER input and computes the import fingerprint centrally. |
| ZIP archive extraction and limit checks | Custom zip parsing | `fflate` via `extractCertificateFilesFromZip()` [VERIFIED: src/inventory/certificate-admin.ts; package.json] | Existing code already enforces archive size, per-file size, file-count, and uncompressed limits. |
| Same-origin request protection | Frontend-only anti-CSRF assumptions | `rejectCrossOriginRequest()` on every POST route [VERIFIED: src/auth/request-security.ts] | Import commit routes already rely on server-side same-origin enforcement. |
| Group-level authorization | UI gating only | `assertAuthenticated()` plus `canManageGroup()` / trust-list operator checks [VERIFIED: src/app/api/admin/certificates/import/route.ts; src/inventory/certificate-admin.ts; src/trust-lists/admin.ts] | Review and final commit must remain backend-authoritative. |
| Provenance/audit history | Inline ad-hoc history blobs | `recordCertificateChangeEvent()` and the certificate detail history view [VERIFIED: src/storage/runtime-store.ts; src/app/admin/certificates/[certificateId]/page.tsx] | Existing history plumbing already exists and should absorb corrections. |
| Trust-list candidate deduplication | New per-path dedupe logic | `candidateKey` + `candidateDigest` + `findLatestTrustListProjection()` [VERIFIED: src/trust-lists/sync.ts; src/storage/runtime-store.ts] | Trust-list change detection already depends on these fields. |

**Key insight:** file upload review, ZIP review, and trust-list review all need one canonical server model; the repo already contains the normalization and provenance hooks, so the main job is to connect them with a review staging step rather than invent new parsing logic [ASSUMED].

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Certificate import runs, import items, certificate change events, trust-list snapshots, trust-list sync runs, extracted certificates, and trust-list projections all live in runtime storage [VERIFIED: src/storage/runtime-store.ts]. | Preserve the existing records and add new review-stage records or tokens if the implementation needs a durable preview-to-commit handoff [ASSUMED]. |
| Live service config | No external live-service config for import review was found in the repository; the import flows are app-local [VERIFIED: src/app/api/admin/certificates/import/route.ts; src/app/api/admin/trust-lists/preview/route.ts]. | None [VERIFIED]. |
| OS-registered state | No OS-registered state for import review was found in the repository [VERIFIED: repo search of src/ and .planning/ paths]. | None [VERIFIED]. |
| Secrets/env vars | No review-specific secret or env-var names were found for phase 30; current env vars are general import-size and trust-list fetch limits [VERIFIED: src/inventory/certificate-admin.ts; src/trust-lists/sync.ts]. | None for review flow naming; preserve existing env-var names for unrelated limits [VERIFIED]. |
| Build artifacts | No installed artifact or generated review bundle was found in the repository tree [VERIFIED: repo search of src/ and .planning/ paths]. | None [VERIFIED]. |

## Common Pitfalls

### Pitfall 1: Preview/commit drift
**What goes wrong:** the UI shows one thing, but the final server commit uses different parsed data or different authorization logic [ASSUMED].  
**Why it happens:** preview and commit are already separate routes, and the current single-import form still exposes both actions in one client component [VERIFIED: src/app/admin/certificates/new/certificate-preview-form.tsx; src/app/api/admin/certificates/import/preview/route.ts; src/app/api/admin/certificates/import/route.ts].  
**How to avoid:** make the commit route re-run normalization, group authorization, and provenance binding from the raw staged input before any write [ASSUMED].  
**Warning signs:** preview payloads are stored as the source of truth or commit code starts trusting client-supplied derived values [ASSUMED].

### Pitfall 2: Losing correction history before save
**What goes wrong:** the operator can edit or reject values during review, but the final certificate only records the last write and not the correction path [ASSUMED].  
**Why it happens:** the current persistence model has change events after save, but no review-draft record or review-history record exists yet [VERIFIED: src/storage/runtime-store.ts; src/inventory/certificate-admin.ts; src/app/admin/certificates/[certificateId]/page.tsx].  
**How to avoid:** persist review decisions and provenance separately from the final certificate row, then keep the post-save detail view as the history surface [ASSUMED].  
**Warning signs:** review-specific corrections disappear once the operator clicks save, or the detail page cannot explain why the final value differs from the imported candidate [ASSUMED].

### Pitfall 3: Treating trust-list sync as a special case
**What goes wrong:** the trust-list path keeps auto-importing candidates while single and ZIP move to review, creating inconsistent operator expectations [ASSUMED].  
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
        {event.occurredAt.toISOString()} — {event.eventType} — actor {event.actorUserId ?? "system"} — {JSON.stringify(event.details)}
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

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A shared review snapshot/token layer is the best implementation shape for all three import sources. | Summary, Architecture Patterns, State of the Art | The planner could over-invest in staging storage if the team prefers a simpler page-level review only. |
| A2 | The commit route should reject stale or tampered review payloads by re-running normalization and validation on the server. | Summary, Common Pitfalls | If the team wants a softer approach, this may need to be downgraded to warnings rather than hard rejection. |
| A3 | A new review-stage persistence mechanism may be needed to preserve uploaded bytes or staged candidate state between review and final save. | Runtime State Inventory, Common Pitfalls | If the repo can reuse another existing storage primitive, the planner should not create a new table or token store. |
| A4 | Trust-list-derived candidates should use the same review DTO and commit contract as manual imports. | Common Pitfalls, State of the Art | If trust-list review is meant to stay automated, the planner will need a different operator-confirmation boundary. |
| A5 | The exact route shape for review pages should be added as a concrete implementation decision during planning. | Summary, Architecture Patterns | A different route layout could shift task decomposition and test coverage. |

## Open Questions

1. **Where should the staged review payload live?**
   - What we know: there is no existing draft/review-token store in the repo, and the current model only persists runs, items, and change events after import [VERIFIED: src/storage/runtime-store.ts; src/inventory/certificate-admin.ts].
   - What's unclear: whether phase 30 should use a dedicated database table, a short-lived signed token, or another existing runtime primitive.
   - Recommendation: choose the smallest server-stored mechanism that can survive file uploads and trust-list candidate edits without depending on client replay [ASSUMED].

2. **Should trust-list review happen per candidate or per sync batch?**
   - What we know: the sync pipeline processes candidates one by one and already stores per-candidate projection records and provenance [VERIFIED: src/trust-lists/sync.ts; src/storage/runtime-store.ts].
   - What's unclear: whether operators need one review screen per candidate, a batch summary with per-item actions, or both.
   - Recommendation: make the data contract per-candidate and let the UI aggregate it if needed [ASSUMED].

3. **What is the review history granularity after save?**
   - What we know: post-save detail pages already expose a chronological `changeHistory` list and trust-list provenance section [VERIFIED: src/app/admin/certificates/[certificateId]/page.tsx].
   - What's unclear: whether review-time corrections should become a dedicated event type or be folded into the existing import/update event payload.
   - Recommendation: keep the detail view simple and store enough metadata in the event `details` object to reconstruct the correction path later [ASSUMED].

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected; the repo currently uses script-based validation only [VERIFIED: package.json; rg --files]. |
| Config file | none — no `jest.config.*`, `vitest.config.*`, `pytest.ini`, or similar test runner config was found [VERIFIED: rg --files]. |
| Quick run command | `npm run typecheck` [VERIFIED: package.json] |
| Full suite command | `npm run quality` [VERIFIED: package.json] |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-04 | Review-before-save on single import, ZIP import, and trust-list-derived candidates; server-side final revalidation; provenance preserved across corrections | integration + storage unit + route smoke | `npm run quality` after adding targeted phase tests [VERIFIED: package.json] | ❌ Wave 0 [VERIFIED: rg --files] |

### Sampling Rate
- **Per task commit:** `npm run typecheck` [VERIFIED: package.json]
- **Per wave merge:** `npm run quality` [VERIFIED: package.json]
- **Phase gate:** full suite green before `/gsd-verify-work` [ASSUMED]

### Wave 0 Gaps
- [ ] No dedicated test runner config was found [VERIFIED: rg --files].
- [ ] No phase-specific review/commit test files were found [VERIFIED: rg --files].
- [ ] No shared test fixtures for import review or provenance preservation were found [VERIFIED: rg --files].
- [ ] Add targeted tests for single import review, ZIP import review, trust-list-derived candidate review, and replay/tamper rejection [ASSUMED].

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes [VERIFIED: src/app/api/admin/certificates/import/route.ts; src/app/api/admin/trust-lists/preview/route.ts] | `assertAuthenticated()` on every review and commit route [VERIFIED: src/app/api/admin/certificates/import/route.ts]. |
| V3 Session Management | yes [VERIFIED: src/auth/authorization.ts; src/auth/session.ts] | Existing session-cookie auth and authorization guards [VERIFIED: src/auth/session.ts; src/auth/authorization.ts]. |
| V4 Access Control | yes [VERIFIED: src/inventory/certificate-admin.ts; src/trust-lists/admin.ts] | `canManageGroup()` plus trust-list operator/group scoping [VERIFIED: src/inventory/certificate-admin.ts; src/trust-lists/admin.ts]. |
| V5 Input Validation | yes [VERIFIED: src/app/api/admin/certificates/import/preview/route.ts; src/app/api/admin/certificates/import/route.ts; src/app/api/admin/certificates/import-zip/route.ts] | Server-side parsing, size checks, and helper normalization before mutation [VERIFIED: src/app/api/admin/certificates/import/preview/route.ts; src/inventory/certificate-admin.ts]. |
| V6 Cryptography | yes [VERIFIED: src/inventory/certificate-admin.ts; src/trust-lists/sync.ts] | Use the existing certificate and XMLDSig libraries; never hand-roll crypto validation [VERIFIED: package.json; src/trust-lists/sync.ts]. |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Tampered review payload or replayed stale review token | Tampering | Recompute normalization and validation on the server at commit time, and reject mismatches [ASSUMED]. |
| Cross-site POST to review/commit routes | Spoofing | Preserve `rejectCrossOriginRequest()` on every mutating route [VERIFIED: src/auth/request-security.ts]. |
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
- `src/storage/runtime-store.ts` - run, item, event, and projection record schemas and persistence helpers [VERIFIED].
- `src/auth/request-security.ts` - same-origin enforcement for mutating requests [VERIFIED].
- `package.json` - declared dependency and script versions [VERIFIED].
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
