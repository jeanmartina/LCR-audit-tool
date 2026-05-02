# Plan 23-02 Summary - Document Snapshot Service and Text Extraction

Status: completed

## Implemented
- Evaluated `pdfjs-dist` and `pdf-parse`; selected direct `pdfjs-dist` to avoid `pdf-parse`'s native canvas dependency.
- Added `src/monitoring-sources/documents.ts` with bounded plain text, HTML stripping, and PDF text extraction.
- Added policy-document check service that records every check as an event and snapshots only new/changed hashes.
- Preserved raw bytes, SHA-256, extraction metadata, provenance, and extraction failure reason on snapshots.
- Extended `scripts/validate-document-snapshots.js` for DOCS-02 through DOCS-05 and extraction behavior.

## Verification
- `node scripts/validate-document-snapshots.js`
- `npm run typecheck`
- `npm run build`

## Dependency Note
- `npm install pdfjs-dist` reported 2 audit findings from the dependency tree. They were not auto-fixed in this plan to avoid unplanned dependency churn during phase execution.
