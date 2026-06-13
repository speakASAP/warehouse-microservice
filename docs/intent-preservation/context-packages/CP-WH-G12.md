# CP-WH-G12 - Context Package

Metadata:
- id: CP-WH-G12
- goal_id: WH-G12
- status: active
- created: 2026-06-13
- last_updated: 2026-06-13

## Context

WH-G11 added warehouse origin metadata to batch availability rows. Catalog and Suppliers now have source-level propagation/reconciliation slices. The remaining Warehouse operator need is a directory-style topology read that answers which warehouses exist and which origin each stock row belongs to.

## Boundaries

- Catalog owns product identity and sellable content.
- Warehouse owns warehouses, stock, reservations, movements, and availability.
- Suppliers owns supplier import orchestration and supplier-side data mapping.

## Files Expected

- src/warehouses/warehouses.service.ts
- src/warehouses/warehouses.controller.ts
- src/warehouses/warehouses.module.ts
- test/warehouses.service.spec.ts
- docs/contracts/availability-contracts.md
- docs/IMPLEMENTATION_STATE.md
- TASKS.md
- STATE.json
