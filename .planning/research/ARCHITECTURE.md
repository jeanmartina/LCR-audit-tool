# v1.3 Research: Architecture for OCSP and CP/CPS/DPC Monitoring

**Milestone:** v1.3 Monitoring Source Expansion  
**Date:** 2026-04-28

## Architectural Direction

Extend the current certificate-first model with a generic derived monitoring-source layer. OCSP responders and CP/CPS/DPC documents should be children of certificates or trust-list-derived certificate projections, not standalone top-level assets disconnected from authorization/provenance.

## Proposed Data Flow

1. Certificate import or trust-list projection produces/updates a certificate record.
2. A source-derivation helper parses certificate extensions and provenance fields.
3. The helper upserts deterministic `monitoring_sources` records for OCSP and policy-document candidates.
4. Worker polls enabled monitoring sources:
   - OCSP: construct request, POST/GET responder, store response evidence.
   - Document: fetch URL, hash/store snapshot, extract bounded metadata/text.
5. Reporting read models join source health through parent certificate/group visibility.
6. Executive summary aggregates source health into simple cards.

## New Components

### `src/monitoring-sources/derive.ts`

Responsibilities:

- Extract AIA OCSP responder URLs.
- Extract CPS Pointer URIs and policy OIDs.
- Accept optional CP/DPC candidates from trust-list/provenance when available.
- Normalize URLs and produce deterministic source keys.

### `src/monitoring-sources/poll.ts`

Responsibilities:

- Poll a source by kind.
- Apply shared URL safety checks and limits.
- Record events and snapshots.
- Return structured health status.

### `src/monitoring-sources/ocsp.ts`

Responsibilities:

- Build minimal OCSP request from target certificate and issuer context.
- Perform bounded HTTP request.
- Store response evidence.
- Optionally parse envelope metadata if safe.

### `src/monitoring-sources/documents.ts`

Responsibilities:

- Fetch CP/CPS/DPC documents.
- Store hash/snapshot metadata.
- Extract bounded text/metadata when feasible.
- Identify changed vs unchanged snapshots.

### Runtime store additions

Add database-backed helpers for:

- upsert/list monitoring sources
- record source events
- record document snapshots
- load source health for reporting

## Modified Components

### Certificate admin/import

After certificate parse/import:

- call derivation helper
- upsert derived monitoring sources
- preserve source derivation warnings as non-blocking results

### Trust-list sync

After certificate projection/import:

- call the same derivation helper
- preserve trust-list source/snapshot/run provenance on derived sources

### Worker

Add a polling pass for monitoring sources. Keep it simple:

- same process as current worker
- bounded per-source timeout
- no parallel fan-out until needed
- no new service in v1.3

### Reporting read models

Add derived-source health to existing principal-scoped read models. The authorization rule should be: if the principal can see the parent certificate/target, they can see child source status/evidence.

### Executive summary

Add aggregate counts only:

- OCSP healthy/degraded/unavailable/not discovered
- policy documents available/changed/unavailable/not discovered
- top source risks with links to operational evidence

## Storage Shape

Suggested tables:

```text
monitoring_sources(
  id, source_key, source_type, certificate_id, trust_list_source_id,
  trust_list_snapshot_id, url, policy_oid, document_role,
  enabled, created_at, updated_at
)

monitoring_source_events(
  id, source_id, status, status_label, duration_ms, http_status,
  content_type, content_length, content_sha256, failure_reason,
  checked_at
)

document_snapshots(
  id, source_id, event_id, url, content_type, size_bytes,
  sha256, title, extracted_text, metadata_json, captured_at
)
```

OCSP payloads can either use a separate table or event metadata. If raw OCSP bodies are stored, enforce a small byte limit.

## Build Order

1. Source derivation and storage schema.
2. Document fetch/snapshot pipeline with safety limits.
3. OCSP technical request/evidence pipeline.
4. Worker integration and lifecycle events.
5. Reporting/executive integration.
6. Docs/validation.

## Architectural Risks

- Issuer context may be required for real OCSP request construction. If unavailable, source should become `discovered-but-not-checkable` with reason, not a false outage.
- DPC may not be consistently discoverable from certificates. Treat it as best-effort derived evidence.
- Raw document storage can grow quickly. Enforce strict defaults and record truncation/extraction state.
- Do not introduce manual URL entry as a workaround unless explicitly planned.
