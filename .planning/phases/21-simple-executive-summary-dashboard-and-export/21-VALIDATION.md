# Phase 21 Validation Strategy: Simple Executive Summary Dashboard and Export

**Date:** 2026-04-23
**Status:** Ready for execution

## Validation Objective

Prove that the product ships a management-facing executive summary surface with preserved group-scoped authorization, clear links to operational evidence, browser-print support, richer executive PDF export, and packaged-runtime proof.

## Automated Checks

Add/extend validators to prove:

1. Executive read models exist separately from the operational grid summary.
2. The executive route is available to authenticated authorized users and does not require platform-admin-only access.
3. `/reporting` links to the executive route.
4. Executive UI contains summary cards, top risks, upcoming risks, short trend, and evidence links.
5. Executive PDF export uses the richer executive summary model.
6. Browser-print support exists for the executive route.
7. Packaging validation covers the executive route/export path in compose runtime.
8. `npm run build`, `npm run typecheck`, reporting validators, packaging validators, and `validate-all` pass.

## Manual/UAT Checks

- Open `/reporting/executive` as an authorized non-admin user and confirm scope is limited correctly.
- From `/reporting`, navigate into the executive route and back.
- Print the executive page from the browser and verify a management-readable layout.
- Export the executive PDF and verify that top risks, upcoming issues, trend/posture, and summary counts match the UI scope.
- Run the packaged stack and confirm executive route and export work through the shipped topology.

## Failure Conditions

- If the executive screen is only accessible to admins, Phase 21 fails.
- If the executive page merely duplicates the operational grid, Phase 21 fails.
- If PDF/print output omit the key executive summary sections, Phase 21 fails.
- If packaged-runtime proof for the executive path is missing, `OPS-05` remains open and Phase 21 fails.
