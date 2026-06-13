# WH-G12-T1 - Add Inventory Topology Read Model

Metadata:
- id: WH-G12-T1
- goal_id: WH-G12
- status: active
- created: 2026-06-13
- last_updated: 2026-06-13
- completeness_level: planned

## Task

Implement a read-only endpoint in warehouse-microservice that summarizes active warehouses and their stock origin totals for operator visibility.

## Required Behavior

- Endpoint returns Warehouse-owned warehouse records and stock aggregates.
- Endpoint can be filtered by catalog productId.
- Warehouse type and supplierId are visible for source classification.
- Inactive warehouses are excluded, matching current findAll behavior.
- No stock mutation, reservation mutation, or supplier reconciliation write occurs.

## Validation

- npm test -- --runInBand
- npm run build
- git diff --check
