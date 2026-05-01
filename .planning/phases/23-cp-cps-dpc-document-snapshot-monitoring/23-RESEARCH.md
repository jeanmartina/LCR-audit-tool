# Phase 23 Research: CP/CPS/DPC Document Snapshot Monitoring

**Date:** 2026-05-01  
**Phase:** 23 - CP/CPS/DPC Document Snapshot Monitoring

## Research Questions

1. How should certificate-derived policy document URLs be fetched safely while allowing public HTTP?
2. What storage shape supports bounded raw evidence, hash-based change detection, and future AI reprocessing?
3. Which document extraction path is small enough for the current Docker/Node runtime?
4. How should the existing worker run document checks without creating a new service?

## Inputs Read

- `.planning/phases/23-cp-cps-dpc-document-snapshot-monitoring/23-CONTEXT.md`
- `.planning/phases/22-derived-monitoring-source-foundation/22-CONTEXT.md`
- `.planning/phases/22-derived-monitoring-source-foundation/22-VERIFICATION.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/research/SUMMARY.md`
- `.planning/research/ARCHITECTURE.md`
- `.planning/research/STACK.md`
- `.planning/research/PITFALLS.md`
- `src/monitoring-sources/derive.ts`
- `src/storage/runtime-store.ts`
- `src/trust-lists/sync.ts`
- `scripts/run-worker.js`
- `src/polling/scheduler.ts`

## Package/Dependency Findings

Checked current npm metadata on 2026-05-01:

| Package | Version | Engines | Notes |
|---------|---------|---------|-------|
| `pdf-parse` | `2.4.5` | `node >=20.16.0 <21 || >=22.3.0` | Pulls `pdfjs-dist` `5.4.296` and `@napi-rs/canvas`; useful but includes native canvas dependency risk. |
| `pdfjs-dist` | `5.7.284` | `node >=22.13.0 || >=24` | Compatible with current Node 22 runtime; may require careful server-side import/polyfills for text extraction. |
| `cheerio` | `1.2.0` | `node >=20.18.1` | Useful HTML parser, but HTML extraction can likely start with a small local sanitizer/stripper to avoid another dependency. |

Recommendation: the execution plan should evaluate PDF extraction during implementation before pinning the dependency. Prefer direct `pdfjs-dist` if it can extract text in Node 22 without native runtime drift. Fall back to `pdf-parse` only if build/typecheck/runtime smoke remains clean despite `@napi-rs/canvas`.

## Architecture Recommendation

### Storage

Add two storage concepts under `src/storage/runtime-store.ts`:

1. `monitoring_source_events`
   - one row per document check;
   - records `source_id`, `source_key`, `source_type`, status, timing, HTTP metadata, hash, failure reason, and optional snapshot linkage;
   - proves availability checks even when content is unchanged.

2. `document_snapshots`
   - one row only when no previous snapshot exists or content SHA-256 changes;
   - stores bounded raw bytes in Postgres as `bytea` and exposes base64 through TypeScript records;
   - stores extracted text, extraction status, truncation flag, metadata JSON, and full Phase 22 provenance.

### Safe Fetch

Generalize the existing trust-list safety posture into a monitoring-source-specific module:

- allow `http:` and `https:` schemes;
- block private, loopback, link-local, multicast, carrier-grade NAT, and unspecified IP ranges by default;
- allow localhost only when an explicit dev env flag is enabled;
- validate every redirect target before following it;
- enforce env-driven timeout, max redirects, and max byte limits before buffering unbounded content;
- record blocked/failure states as events rather than throwing out of the worker loop.

### Extraction

Use a layered extractor:

- `text/plain`: decode UTF-8, normalize whitespace, bound extracted text.
- HTML: remove scripts/styles/comments/tags, decode obvious entities, bound extracted text. Do not execute or render.
- PDF: evaluate `pdfjs-dist` vs `pdf-parse` at execution time; extraction failure returns `extractionStatus: "failed"` and stores raw/hash metadata.
- Unknown types: store raw/hash metadata and set `extractionStatus: "not_attempted"`.

### Worker

Add a document-source worker pass instead of a new service:

- load discovered `policy-document` sources from `monitoring_sources`;
- skip OCSP sources until Phase 24;
- maintain in-process last-check timestamps with `MONITORING_SOURCE_DOCUMENT_INTERVAL_SECONDS` defaulting to `3600`;
- call the document check service once per due source;
- log errors per source/cycle and continue.

## Validation Architecture

Phase 23 should use the existing validator-script pattern plus typecheck/build:

- Add `scripts/validate-document-snapshots.js`.
- Wire it into `scripts/validate-all.js`.
- Validate static architecture:
  - safe fetch helper exists and allows `http:`/`https:` while blocking private addresses;
  - storage schema contains `monitoring_source_events` and `document_snapshots`;
  - document snapshots store raw body, hash, content type, extracted text, truncation/extraction status, and provenance fields;
  - document checker creates event-per-check and snapshot-on-hash-change behavior;
  - worker invokes document-source checks;
  - env vars are present in `.env.example` and compose worker/web environment where needed;
  - no OCSP polling is introduced in Phase 23.

Recommended commands:

```bash
node scripts/validate-document-snapshots.js
node scripts/validate-all.js
npm run typecheck
npm run build
```

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| SSRF through certificate-derived URLs | Reuse/generalize trust-list DNS/IP checks and revalidate redirects. |
| Public HTTP weakens integrity | Store hash and full URL metadata; allow HTTP because real policy documents may require it, but never allow private targets. |
| Unbounded Postgres growth | Default `MONITORING_SOURCE_MAX_DOCUMENT_BYTES=5242880` and snapshot only on hash change. |
| PDF extraction breaks Docker build | Evaluate dependency before install; fallback to raw/hash metadata if extraction cannot be made build-safe. |
| Event volume grows | Default `MONITORING_SOURCE_DOCUMENT_INTERVAL_SECONDS=3600`; event every check is intentional audit evidence. |
| AI scope creep | Store evidence/provenance only; no compliance interpretation in Phase 23. |

## Planning Implications

Use four plans:

1. Storage/event schema and safe fetch foundation.
2. Snapshot/check service, extraction, and PDF dependency evaluation.
3. Worker integration and env/runtime wiring.
4. Validators, docs, and proof closure.
