# Phase 24: OCSP Technical Evidence Monitoring - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-04  
**Phase:** 24-ocsp-technical-evidence-monitoring  
**Areas discussed:** OCSP check depth, issuer context minimum, OCSP event semantics, OCSP evidence retention, worker and operational limits

---

## OCSP Check Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Real DER OCSPRequest | Send a real DER OCSPRequest when enough context exists and retain response without claiming full semantic validation. | ✓ |
| HTTP reachability only | Check responder HTTP reachability without generating OCSP request bytes. | |
| Reachability fallback | Use HTTP reachability when issuer context is missing. | |

**User's choice:** Real DER OCSPRequest.  
**Notes:** This makes Phase 24 evidence more useful while preserving the future semantic-validation boundary.

---

## Issuer Context Minimum

| Option | Description | Selected |
|--------|-------------|----------|
| Require issuer certificate | Require issuer certificate availability in inventory/trust-list context; otherwise mark `not_checkable`. | ✓ |
| Partial inference | Attempt low-confidence partial checks when issuer is missing. | |
| Storage only | Prepare storage and mark missing issuer cases as `not_checkable` without request generation. | |

**User's choice:** Require issuer certificate.  
**Notes:** Missing issuer context should produce explicit `not_checkable` evidence rather than weak checks.

---

## OCSP Event Semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Technical states only | Use `available`, `unavailable`, `blocked`, `oversized`, `malformed`, `not_checkable`; avoid `good/revoked/unknown` health. | ✓ |
| Include semantic states with disclaimer | Store `good/revoked/unknown` when parseable but label carefully. | |
| HTTP status only | Store only raw HTTP status and failure reason. | |

**User's choice:** Technical states only.  
**Notes:** This protects Phase 24 from implying full revocation-status validation.

---

## OCSP Evidence Retention

| Option | Description | Selected |
|--------|-------------|----------|
| Raw request and response | Store raw OCSP request + response, hashes, sizes, content type, HTTP status, duration, responder URL, certificate and issuer fingerprints. | ✓ |
| Raw response only | Store response and metadata; reconstruct request later. | |
| Hashes/metadata only | Retain minimal evidence to reduce storage. | |

**User's choice:** Raw request and response.  
**Notes:** Future semantic validation should be able to reprocess original request/response evidence.

---

## Worker and Operational Limits

| Option | Description | Selected |
|--------|-------------|----------|
| Existing worker with dedicated OCSP env vars | Integrate into current worker with separate timeout, max response bytes, interval, and localhost dev allowance. | ✓ |
| Reuse document env vars | Reuse Phase 23 document monitoring limits. | |
| No worker integration | Implement service/storage only, no scheduled execution yet. | |

**User's choice:** Existing worker with dedicated OCSP env vars.  
**Notes:** OCSP checks should be demonstrable in Docker but independently tunable from document checks.

---

## the agent's Discretion

- Exact OCSP library/package, table names, helper boundaries, and issuer matching algorithm are left to research/planning.

## Deferred Ideas

- Full OCSP semantic validation: responder authorization, signature validation, status interpretation, and freshness windows.
- Reporting/executive visibility for OCSP source health.
