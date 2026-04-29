# v1.3 Research Summary: Monitoring Source Expansion

**Date:** 2026-04-28  
**Milestone:** v1.3 Monitoring Source Expansion

## Stack Additions

- Existing TypeScript/Node/Postgres/Docker stack is sufficient for v1.3.
- Add a lightweight PKI/ASN.1 parsing path only if current certificate parsing cannot extract AIA OCSP and Certificate Policies CPS URIs reliably.
- Prefer `pkijs`/`asn1js` or `@peculiar/x509` evaluation over hand-written ASN.1 or shelling out to `openssl`.
- Reuse/generalize existing SSRF-safe fetch behavior from trust-list sync for all certificate-derived URLs.
- Add bounded document snapshot storage and optional bounded text extraction; do not add object storage or AI analysis yet.

## Feature Table Stakes

1. **Derived source discovery**
   - OCSP URLs from AIA `id-ad-ocsp`.
   - CPS URLs from RFC 5280 Certificate Policies CPS Pointer URIs.
   - CP/DPC best-effort only when discoverable from existing parsed certificate/trust-list/provenance data.

2. **OCSP technical monitoring**
   - Bounded request to responder.
   - Persist HTTP/content-type/timing/size/hash/failure evidence.
   - Store response evidence for future full validation.
   - Do not claim full revocation validation in v1.3.

3. **Document monitoring**
   - Fetch CP/CPS/DPC URLs safely.
   - Store snapshots, hashes, basic metadata, change history, and bounded extracted text when feasible.
   - Preserve policy OIDs and certificate/trust-list provenance for future AI compliance analysis.

4. **Reporting**
   - Operational detail for new source kinds.
   - Simple executive aggregate cards for OCSP and policy-document availability/change risk.
   - Visibility inherited from parent certificate/group authorization.

## Recommended Architecture

Create a generic child `monitoring_sources` layer tied to certificate/provenance records:

- `monitoring_sources` for derived source definitions.
- `monitoring_source_events` for check outcomes.
- `document_snapshots` for CP/CPS/DPC evidence.
- Optional OCSP response snapshot metadata if raw payloads should be separated.

Build order:

1. Source derivation and schema.
2. Shared safe fetch and document snapshot pipeline.
3. OCSP technical polling pipeline.
4. Worker integration.
5. Reporting and executive summary integration.
6. Operator documentation and validators.

## Watch Out For

- OCSP reachability is not OCSP semantic validity.
- Issuer context may be missing; represent as `not checkable`, not outage.
- Certificate-derived URLs are attacker-controlled inputs for SSRF purposes.
- DPC may not be consistently discoverable.
- Document storage must be bounded.
- Do not introduce crawling or manual source UI in v1.3.
- Future AI readiness means provenance and clean snapshots now, not AI interpretation now.

## Requirement Implications

Requirements should cover:

- automatic derivation from imported/trust-list certificates;
- explicit source states including `not discovered` and `not checkable`;
- OCSP technical evidence capture;
- CP/CPS/DPC document snapshot/hash/metadata/text capture;
- operational and executive reporting;
- safety limits, SSRF protection, and docs;
- AI compliance analysis explicitly deferred to a future milestone.
