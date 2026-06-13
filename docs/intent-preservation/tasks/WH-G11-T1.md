# WH-G11-T1 - Warehouse Availability Origin Metadata

Metadata:
- id: WH-G11-T1
- status: done
- goal_id: WH-G11
- owner: warehouse-owner
- created: 2026-06-13
- last_updated: 2026-06-13
- completeness_level: complete
- sensitive_data: no secrets, no production samples
- contract_schema_impact: additive response fields on batch availability warehouse rows
- replay_determinism_impact: read-only deterministic aggregation
- operational_gates: pre-coding, npm-test, npm-build

## Objective

Add Warehouse-owned origin metadata to POST /api/stock/availability/batch so consumers can identify whether product availability comes from an Alfares physical warehouse or a supplier/dropship warehouse.

## Upstream Links

- BUSINESS.md
- SYSTEM.md
- docs/orchestrator/warehouse-intent-plan.md
- implementation-goals/GOAL-11-stock-origin-visibility.md

## Goal Impact

This makes Warehouse the source of both stock quantities and stock-origin classification while keeping Catalog as product truth and Suppliers as import orchestration.

## Project Invariant Impact

- Warehouse remains stock and availability authority.
- Catalog remains product identity and sellable-content authority.
- Supplier credentials remain outside Warehouse responses.
- Auth/RBAC boundaries remain unchanged.

## Sensitive-Data Classification

No secrets, credentials, raw supplier payloads, or production customer data are used. Supplier linkage is limited to supplier IDs already modeled on Warehouse records.

## Contract/Schema Impact

No database schema change. Batch availability response rows gain additive optional metadata under each warehouse row: warehouseCode, warehouseName, warehouseType, and supplierId.

## Replay/Determinism Impact

Read-only aggregation. No mutation or event publishing.

## Scope

- Update Warehouse batch availability types and mapping.
- Load warehouse relation for batch availability rows.
- Document the additive response fields.
- Add focused Jest coverage.

## Non-Goals

- No production stock mutation.
- No supplier credential handling.
- No Catalog or Suppliers source edits in this task.
- No deployment without explicit owner approval.

## Acceptance Criteria

- Batch availability preserves existing totals and row shape.
- Each stock row includes warehouse origin metadata when the warehouse relation is available.
- Supplier/dropship rows expose supplierId; own warehouse rows can leave it null.
- Focused tests and build pass.

## Required Context

- src/stock/stock.service.ts
- src/stock/stock.controller.ts
- src/warehouses/warehouse.entity.ts
- docs/contracts/availability-contracts.md
- test/stock.service.spec.ts

## Validation Task

Run npm test -- --runInBand, npm run build, and git diff --check after implementation.
