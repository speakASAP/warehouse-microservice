# GOAL-12 - Inventory Topology Read Model

Metadata:
- id: WH-G12
- status: done
- owner: warehouse-owner
- created: 2026-06-13
- last_updated: 2026-06-13
- completeness_level: complete
- upstream: GOAL-11-stock-origin-visibility.md, docs/contracts/availability-contracts.md, docs/intent-preservation/TRACEABILITY_MATRIX.md
- downstream: docs/intent-preservation/tasks/WH-G12-T1.md, docs/intent-preservation/execution-plans/EP-WH-G12.md

## Intent

Operators need a Warehouse-owned view of inventory topology: which warehouses are Alfares-owned physical locations, which are supplier or dropship warehouses, and where catalog product stock is currently available. This read model must make the source of stock visible without moving product truth from Catalog or supplier identity truth from Suppliers.

## Scope

- Add a read-only Warehouse endpoint for inventory topology.
- Include active warehouses grouped by type: own, supplier, dropship, and other.
- Include stock totals per warehouse and overall totals.
- Support optional catalog product filtering with productId.
- Preserve Warehouse as the only stock quantity source.

## Non-Goals

- No stock mutation.
- No supplier credential exposure.
- No Catalog product persistence in Warehouse beyond existing productId stock rows.
- No production deploy without owner approval.

## Acceptance Criteria

- Operators can list local and supplier-managed warehouses in one response.
- Operators can filter the topology by catalog productId to see where that product is stocked.
- Response includes quantities, reserved quantities, available quantities, product count per warehouse, warehouse type, and supplierId where present.
- Tests, build, and diff check pass.


## Completion Evidence

- Added GET /api/warehouses/topology with optional productId filtering.
- Added Warehouse inventory topology read model with own, supplier, dropship, and other groups.
- Added focused service coverage for local and supplier-managed warehouse stock totals.
- Validation passed: npm test -- --runInBand, npm run build, git diff --check.
- No production deployment was performed.
