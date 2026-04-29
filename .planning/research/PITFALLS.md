# v1.3 Research: Pitfalls for OCSP and CP/CPS/DPC Monitoring

**Milestone:** v1.3 Monitoring Source Expansion  
**Date:** 2026-04-28

## Pitfall 1: Treating OCSP reachability as revocation validity

**Risk:** A responder can be reachable while the response is stale, unauthorized, malformed, or semantically `unknown`.  
**Prevention:** Label v1.3 OCSP as technical monitoring/evidence capture. Do not claim full revocation validation until signature, responder authorization, `thisUpdate`/`nextUpdate`, and status semantics are implemented.  
**Phase control:** OCSP polling phase.

## Pitfall 2: Failing when OCSP issuer context is missing

**Risk:** OCSP request construction needs issuer name/key hash and serial context. Imported certificates may not always include the issuer certificate.  
**Prevention:** Store derived OCSP URL separately from checkability. Emit `issuer-context-missing` as an evidence state, not an outage.  
**Phase control:** Source derivation/storage phase.

## Pitfall 3: SSRF through document or OCSP URLs

**Risk:** Certificate-controlled URLs can point to private/internal networks, metadata services, or redirect chains.  
**Prevention:** Reuse/generalize trust-list URL controls: HTTPS for deployed URLs, private/link-local/multicast block, redirect validation, timeout, size limits.  
**Phase control:** Shared fetch safety phase before polling.

## Pitfall 4: Unbounded document storage

**Risk:** CP/CPS/DPC PDFs and HTML can be large or malicious. Keeping every raw body unbounded will grow Postgres and can exhaust memory.  
**Prevention:** Add byte limits, hash-first metadata, bounded extracted text, truncation flags, and retention decisions.  
**Phase control:** Document snapshot phase.

## Pitfall 5: Assuming DPC is discoverable everywhere

**Risk:** DPC terminology and publication practices vary by jurisdiction/ecosystem; certificates may only contain CPS pointers or policy OIDs.  
**Prevention:** Model document roles as `cps`, `cp`, `dpc`, `terms`, `unknown-policy-document`; record `not discovered` explicitly.  
**Phase control:** Requirements and derivation phase.

## Pitfall 6: Web crawling CA sites

**Risk:** Crawling expands scope, increases SSRF/legal/operational risk, and creates noisy evidence.  
**Prevention:** v1.3 should only use URLs explicitly present in certificates, trust-list/provenance fields, or already parsed metadata.  
**Phase control:** Requirements gate.

## Pitfall 7: Breaking the operator UX with a new inventory silo

**Risk:** Operators already have certificate/trust-list flows. A separate monitoring-source app area would fragment the model.  
**Prevention:** Treat OCSP/doc sources as child evidence under certificate/trust-list provenance and expose them in existing reporting/admin detail.  
**Phase control:** Architecture and reporting phases.

## Pitfall 8: Over-promising AI compliance readiness

**Risk:** Storing documents is necessary but not sufficient for AI analysis. The future agent will need provenance, policy OIDs, certificate fields, document version history, and extracted text quality flags.  
**Prevention:** Store structured provenance and extraction metadata now; explicitly defer compliance interpretation.  
**Phase control:** Document snapshot phase and requirements wording.

## Pitfall 9: Incorrect executive aggregation

**Risk:** Mixing CRL, OCSP, document availability, and certificate health into one health number can mislead leadership.  
**Prevention:** Add simple separate cards for OCSP and policy documents, plus top risks; do not merge into existing SLA until semantics are mature.  
**Phase control:** Reporting phase.

## Pitfall 10: Content-type trust

**Risk:** Servers may send PDFs as `application/octet-stream`, HTML as text, or incorrect types.  
**Prevention:** Store declared content-type and sniff only enough to choose safe extraction. Never execute/render fetched HTML.  
**Phase control:** Document snapshot phase.

## Requirement Implications

- Require explicit source states: healthy, degraded, unavailable, not discovered, not checkable.
- Require shared fetch safety for every URL derived from certificates.
- Require bounded document retention and extraction metadata.
- Require future-AI readiness through provenance, not AI analysis in v1.3.
