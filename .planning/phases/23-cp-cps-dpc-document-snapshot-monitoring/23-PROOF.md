# Phase 23 Proof - CP/CPS/DPC Document Snapshot Monitoring

Status: implemented and verified

## Requirement coverage

| Requirement | Evidence |
|---|---|
| DOCS-01 | `src/monitoring-sources/fetch-safety.ts` enforces public HTTP/HTTPS URL validation, DNS/IP private-network blocking, redirect revalidation, timeout, redirect count, and byte limits; `src/monitoring-sources/worker.ts` runs discovered policy-document checks. |
| DOCS-02 | `src/storage/runtime-store.ts` adds `monitoring_source_events` and `document_snapshots` with content type, size, SHA-256, source URL, capture timestamp, and raw bytes. |
| DOCS-03 | `src/monitoring-sources/documents.ts` extracts bounded plain text, stripped HTML text, and PDF text with `pdfjs-dist`; extraction failures preserve raw/hash evidence. |
| DOCS-04 | `src/monitoring-sources/documents.ts` compares latest snapshot hash and records `available`, `changed`, or `unchanged` events while avoiding duplicate raw snapshots for unchanged content. |
| DOCS-05 | `recordDocumentSnapshot` stores certificate ID, fingerprint, policy OID, document role, trust-list source ID, trust-list snapshot ID, and trust-list run ID for future AI compliance analysis. |
| SEC-01 | `assertPublicMonitoringSourceUrl` blocks private/internal/loopback/link-local targets by default and revalidates redirect targets before fetching. |

## Validation commands

```bash
node scripts/validate-document-snapshots.js
node scripts/validate-all.js
npm run typecheck
npm run build
```

## Scope boundary

Phase 23 stores safe policy-document evidence only. OCSP polling, reporting UI, manual source entry, CA website crawling, and AI compliance interpretation remain out of scope for this phase.

## Runtime notes

- Public `http://` and `https://` policy-document URLs are accepted.
- Private/internal targets and unsafe redirects remain blocked.
- Worker cadence and fetch/extraction limits are controlled by `MONITORING_SOURCE_*` env vars in `.env.example` and `compose.yaml`.
