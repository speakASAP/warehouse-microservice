# EP-WH-G11-T1 - Warehouse Availability Origin Metadata

Metadata:
- id: EP-WH-G11-T1
- status: validated
- goal_id: WH-G11
- task_ids: WH-G11-T1
- created: 2026-06-13
- last_updated: 2026-06-13
- completeness_level: complete

## Upstream Traceability

- implementation-goals/GOAL-11-stock-origin-visibility.md
- docs/intent-preservation/tasks/WH-G11-T1.md

## Goal Impact

Enables cross-service stock-origin visibility by making Warehouse batch availability return local-vs-supplier warehouse classification with each stock row.

## Project Invariants

Warehouse owns stock and warehouse-location facts. Catalog owns product facts. Suppliers owns supplier imports and credentials. No production mutation is allowed in this plan.

## Sensitive-Data Handling

Only source code and synthetic tests are used. Do not print tokens, credentials, or production stock data. Do not expose supplier credentials; only supplierId may appear in Warehouse-origin metadata.

## Contract Validation Plan

Additive response fields only. Existing productId, totalQuantity, totalReserved, totalAvailable, warehouses[].warehouseId, quantity, reserved, and available remain unchanged.

## Replay/Determinism Plan

No writes. Availability is still derived from current Warehouse stock rows and deterministic product ID order.

## Scope

- src/stock/stock.service.ts
- docs/contracts/availability-contracts.md
- test/stock.service.spec.ts
- WH-G11 IPS/state docs

## Non-Goals

No Catalog bridge propagation yet. No Suppliers-to-Warehouse mutation client. No migrations. No production deployment.

## Files To Inspect

- src/stock/stock.service.ts
- src/stock/dto/stock-mutation.dto.ts
- src/warehouses/warehouse.entity.ts
- test/stock.service.spec.ts

## Files To Create

- implementation-goals/GOAL-11-stock-origin-visibility.md
- docs/intent-preservation/tasks/WH-G11-T1.md
- docs/intent-preservation/execution-plans/EP-WH-G11-T1.md
- docs/intent-preservation/context-packages/CP-WH-G11-T1.md
- docs/intent-preservation/coding-prompts/PROMPT-WH-G11-T1.md
- docs/intent-preservation/validation-reports/VAL-WH-G11-T1.md

## Files To Modify

- src/stock/stock.service.ts
- docs/contracts/availability-contracts.md
- test/stock.service.spec.ts
- docs/IMPLEMENTATION_STATE.md
- TASKS.md
- STATE.json

## Files That Must Not Be Modified

- BUSINESS.md
- Supplier credentials or environment files
- Production Kubernetes secrets

## Implementation Steps

1. Update the WarehouseAvailability interface with additive origin fields.
2. Load the warehouse relation in batch availability reads.
3. Map warehouse code, name, type, and supplierId into each per-warehouse availability row.
4. Update contract documentation with the additive fields and origin interpretation.
5. Add focused Jest coverage for own and supplier warehouse rows.
6. Run validation commands and update validation/state docs.

## Test Plan

Add a unit test around StockService.getBatchAvailability using synthetic stock rows with warehouse relations. Run the full test suite.

## Validation Plan

- npm test -- --runInBand
- npm run build
- git diff --check

## Gate Commands

Manual pre-coding gate: verify task, execution plan, context package, coding prompt, validation draft, sensitive-data classification, contract impact, and validation commands exist before source edits.

## Documentation Updates

Update Warehouse availability contract and state/task documents with WH-G11 evidence.

## Rollback Plan

Revert the focused changes to src/stock/stock.service.ts, test/stock.service.spec.ts, and WH-G11 documentation. No migration or data rollback is required.

## Agent Handoff Prompt

Implement WH-G11-T1 exactly as scoped: enrich Warehouse batch availability warehouse rows with additive origin metadata, preserve existing totals and auth behavior, document the contract, and validate with tests/build/diff check.

## Completion Checklist

- [x] Source updated.
- [x] Contract docs updated.
- [x] Tests updated.
- [x] Validation passed.
- [x] State docs updated.
