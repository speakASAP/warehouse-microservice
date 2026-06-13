# EP-WH-G12 - Inventory Topology Read Model

Metadata:
- id: EP-WH-G12
- goal_id: WH-G12
- task_ids: WH-G12-T1
- status: active
- created: 2026-06-13
- last_updated: 2026-06-13

## Plan

1. Add Warehouse service read model types and getInventoryTopology method.
2. Inject Stock repository into WarehousesService for read-only aggregation.
3. Add GET /api/warehouses/topology with optional productId query parameter.
4. Add focused service tests for grouped own and dropship warehouse totals.
5. Update contracts and state documents with validation evidence.

## Risk Controls

- Use existing Warehouse and Stock entities only.
- Read active warehouses first, then stock rows for those warehouse IDs.
- Keep productId as opaque Catalog-owned identifier.
- Do not call mutation methods.
