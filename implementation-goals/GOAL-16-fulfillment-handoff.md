# GOAL-16 - Paid Order Fulfillment Handoff

```yaml
id: WH-G16
status: draft
owner: warehouse-owner
created: 2026-07-02
last_updated: 2026-07-02
completeness_level: complete
upstream:
  - docs/orchestrator/2026-07-02-orders-fulfillment-handoff-plan.md
  - docs/orchestrator/warehouse-intent-plan.md
  - docs/governance/PROJECT_INVARIANTS.md
downstream:
  - docs/intent-preservation/tasks/WH-G16-T1.md
  - docs/contracts/fulfillment-handoff-contract.md
related_adrs: []
```

## Objective

Add a Warehouse-owned paid-order fulfillment handoff that persists enough order data for warehouse operators to pick, pack, and dispatch paid reserved items.

## Current Evidence

- `POST /api/reservations/fulfill` finalizes stock and reservation state only.
- Existing fulfill does not persist delivery address, shipping method, order item ids, SKU/title snapshots, or allowed customer contact fields.
- Orders stores those fields and currently calls Warehouse reservation lifecycle endpoints per item.

## Scope

- Add fulfillment order/pick-ticket API and entities inside Warehouse.
- Preserve existing reservation lifecycle behavior.
- Keep idempotency by central Orders id and Warehouse reservation ids.
- Add contract docs, tests, and migration.

## Non-Goals

- Do not change Orders code in this repository workstream.
- Do not deploy.
- Do not alter public landing files.
- Do not create a delivery-provider integration.

## Acceptance Criteria

- Existing fulfill behavior remains idempotent and reservation-context based.
- Fulfillment handoff cannot be created without reservation ids.
- Fulfillment handoff requires already-fulfilled Warehouse reservations.
- Persisted handoff includes delivery address, shipping method, order item ids, SKU/title, warehouse ids, quantities, and allowed customer contact fields.
- Cancel and return handoff paths are explicit and do not hide stock mutation.

## Validation

- `npm test -- --runInBand`
- `npm run build`
- `git diff --check`
