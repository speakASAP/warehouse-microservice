# CP-WH-G16 - Paid Fulfillment Handoff Context

```yaml
id: CP-WH-G16
status: draft
owner: warehouse-fulfillment-owner
created: 2026-07-02
last_updated: 2026-07-02
completeness_level: complete
upstream:
  - docs/intent-preservation/execution-plans/EP-WH-G16.md
downstream:
  - docs/intent-preservation/coding-prompts/PROMPT-WH-G16.md
related_adrs: []
```

## Task Summary

Current `fulfill` deducts stock and marks a reservation fulfilled. It does not persist paid-order dispatch data. WH-G16 adds a separate fulfillment order handoff record keyed by central Orders id and Warehouse reservation ids.

## Source Documents

- `docs/orchestrator/2026-07-02-orders-fulfillment-handoff-plan.md`
- `docs/orchestrator/warehouse-intent-plan.md`
- `docs/governance/PROJECT_INVARIANTS.md`
- Orders parent plan and current Warehouse client were inspected read-only.

## Relevant Files

- `src/reservations/**`
- `src/stock/stock.service.ts`
- `src/fulfillment/**`
- `src/migrations/1781500000000-CreateFulfillmentOrders.ts`
- `test/stock.service.spec.ts`
- `test/fulfillment-orders.service.spec.ts`

## Current Behavior

`POST /api/reservations/fulfill` accepts one reservation line by product, warehouse, order, and optional channel. It finalizes stock and movement history but stores no delivery address or pick-ticket data.

## Required Behavior

`POST /api/fulfillment-orders` persists an order-level handoff with fulfilled reservation ids, order item ids, SKU/title snapshots, warehouse ids, quantities, shipping method, delivery address, and allowed customer contact fields.

## Constraints

No deployment, no public landing file edits, no Orders repo edits, and no production stock mutation.

## Known Risks

Orders must be updated separately to call the new endpoint and supply reservation ids. Delivery-provider status remains `[MISSING: delivery provider or shipment-status source contract]`.

## Validation Commands

- `npm test -- --runInBand`
- `npm run build`
- `git diff --check`
