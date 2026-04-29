# Phase 22: Derived Monitoring Source Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-28  
**Phase:** 22-derived-monitoring-source-foundation  
**Areas discussed:** Source states, deduplication, provenance, parser scope

---

## Source States

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit lifecycle states | `discovered`, `not_discovered`, `not_checkable`, `disabled`; polling health separate later. | ✓ |
| Simple presence-only model | Only create a source when discovered; absence implies `not_discovered`. | |
| Combined lifecycle and health | Include `healthy`, `degraded`, `unavailable`, `not_discovered`, `not_checkable` in one state model. | |

**User's choice:** 1A.  
**Notes:** Keep source lifecycle separate from future polling health.

---

## Deduplication

| Option | Description | Selected |
|--------|-------------|----------|
| Certificate-id key | `certificateId + sourceType + normalizedUrl + role/policyOid`. | |
| Fingerprint key | `fingerprint + sourceType + normalizedUrl + role/policyOid`, with current certificate id as provenance. | ✓ |
| Trust-list scoped key | `trustListProjection/source + fingerprint + sourceType + normalizedUrl + role/policyOid`. | |

**User's choice:** 2B.  
**Notes:** Fingerprint-based identity avoids duplicate derived sources across reimports while preserving provenance separately.

---

## Provenance

| Option | Description | Selected |
|--------|-------------|----------|
| Rich inline provenance | Store all currently available certificate/trust-list/policy/document derivation fields. | ✓ |
| Minimal provenance | Store only parent certificate + URL + type. | |
| Separate provenance table | Normalize multiple provenance records into a dedicated table from the start. | |

**User's choice:** 3A.  
**Notes:** Rich provenance is needed because future AI compliance analysis depends on policy/document/certificate traceability.

---

## Parser Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal parser only | Use current parser/regex extraction; record `not_discovered` when insufficient. | |
| Add X.509/ASN.1 library | Add a library if build impact is simple and extraction is more reliable. | ✓ |
| Schema only | Create schema first and defer real derivation to Phases 23/24. | |

**User's choice:** 4B.  
**Notes:** Library choice remains implementation discretion, but Phase 22 should attempt reliable AIA OCSP and CPS URI extraction if package compatibility is acceptable.

---

## the agent's Discretion

- Exact schema/helper names.
- Specific parser library after implementation research.
- Whether provenance remains inline or minimally factored if implementation requires it, as long as selected provenance fields are retained.

## Deferred Ideas

- Document fetch/snapshot polling.
- OCSP responder polling.
- Reporting UI/executive cards.
- Manual source entry.
- Full OCSP validation.
- Future AI policy compliance analysis.
