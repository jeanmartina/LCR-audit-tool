# Phase 4: Runtime Inventory, Polling, and Persistence Wiring - Discussion Log

## Inventory Source Of Truth

User chose the database as the source of truth for real runtime targets.

## Persistence Scope

User wants production-grade persistence in this phase, not a dev-only stopgap.

## Validation And Snapshot Handling

User decided:
- invalid artifacts are persisted for audit and still mark the resource unavailable
- repeated hashes do not create a duplicate blob
- repeated hashes still create a verification/event record

## Alert Emission Ordering

User decided alert events must be persisted before delivery is attempted.

## Phase Boundary

User decided Phase 4 closes backend/runtime wiring plus minimal read contracts only.
UI/reporting consumption remains in Phase 5.
