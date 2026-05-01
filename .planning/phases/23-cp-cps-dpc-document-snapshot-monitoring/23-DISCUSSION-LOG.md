# Phase 23: CP/CPS/DPC Document Snapshot Monitoring - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-01  
**Phase:** 23-cp-cps-dpc-document-snapshot-monitoring  
**Areas discussed:** Fetch safety and URL policy, Snapshot storage and retention, Text and metadata extraction, Events and change semantics, Worker execution

---

## Fetch Safety and URL Policy

| Option | Description | Selected |
|--------|-------------|----------|
| HTTPS required in production, localhost only in dev | Stronger default; aligns with Caddy/public origin posture while allowing local tests. | |
| Accept public HTTP too | More flexible for real CP/CPS/DPC URLs while still requiring private-network and redirect protections. | yes |
| Mark non-HTTPS as not_checkable | Strictest security posture, but may miss real legacy policy-document endpoints. | |

**User's choice:** 1B — Accept public HTTP too.  
**Notes:** Public HTTP is allowed only for public targets; private/internal targets and unsafe redirects remain blocked.

---

## Snapshot Storage and Retention

| Option | Description | Selected |
|--------|-------------|----------|
| Raw bytes + hash/metadados/text | Store bounded raw bytes in Postgres plus hash, metadata, and extracted text for future AI/audit reprocessing. | yes |
| Only hash/metadados/text | Lighter storage, but loses original evidence. | |
| Only metadata/hash | Simplest and safest storage, but weak for future conformance analysis. | |

**User's choice:** 2A — Store bounded raw bytes plus hash/metadados/text.  
**Notes:** Raw storage must be bounded by env-configurable limits.

---

## Text and Metadata Extraction

| Option | Description | Selected |
|--------|-------------|----------|
| HTML/text only; PDF raw/hash | Lowest Docker risk; PDF extraction deferred. | |
| HTML/text + lightweight PDF extraction fallback | More useful for future AI; dependency must be build-safe and failures must fall back safely. | yes |
| No text extraction | Minimum scope; delays future AI value. | |

**User's choice:** 3B — Try lightweight PDF extraction with fallback.  
**Notes:** PDF extraction failure records extraction failure/truncation but does not fail snapshot storage.

---

## Events and Change Semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Event every check; snapshot only on hash change | Full operational audit trail without duplicating raw content every run. | yes |
| Snapshot every check | Maximum evidence, high storage growth. | |
| Event only on change/failure | Smaller data volume, weaker proof of continuous availability. | |

**User's choice:** 4A — Event every check, snapshot only on hash change.  
**Notes:** Failed checks keep the latest valid snapshot intact.

---

## Worker Execution

| Option | Description | Selected |
|--------|-------------|----------|
| Integrate worker now | End-to-end Docker-demonstrable Phase 23 with env-controlled limits. | yes |
| Manual service/validator only | Lower risk, less runtime proof. | |
| Storage + snapshot function only | Smallest implementation, not demonstrable as monitoring. | |

**User's choice:** 5A — Integrate with worker now.  
**Notes:** Only `policy-document` sources are in scope; OCSP remains Phase 24.

---

## the agent's Discretion

- Exact schema/helper/module names.
- Exact status labels and metadata JSON shape.
- PDF extraction dependency selection after compatibility research.
- Plan decomposition.

## Deferred Ideas

- OCSP polling and evidence capture.
- Derived-source reporting UI and executive cards.
- Manual source entry, crawling, and AI compliance scoring.
