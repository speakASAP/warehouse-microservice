# WH-G16-T1 - Paid Fulfillment Handoff Contract

```yaml
id: WH-G16-T1
status: draft
owner: warehouse-fulfillment-owner
created: 2026-07-02
last_updated: 2026-07-02
completeness_level: complete
upstream:
  - implementation-goals/GOAL-16-fulfillment-handoff.md
  - docs/orchestrator/2026-07-02-orders-fulfillment-handoff-plan.md
downstream:
  - docs/21_execution_plans/EP-WH-G16.md
  - docs/12_validation/VAL-WH-G16.md
related_adrs: []
```

## Objective

Persist paid-order Warehouse fulfillment orders with line items, delivery address, shipping method, and allowed contact fields after reservation fulfillment.

## Goal Impact

Warehouse remains stock authority and gains the operational handoff record required for pick, pack, and dispatch.

## Project Invariant Impact

Preserves invariants 1, 4, 6, 7, 8, 9, 11, and 12. Orders still owns order state; Warehouse owns stock effects and warehouse operation records.

## Sensitive-Data Classification

Delivery address and bounded customer contact fields are sensitive operational data. They are stored in Warehouse for dispatch but must not be logged, copied into validation evidence, or emitted in broad events.

## Contract/Schema Impact

Adds `fulfillment_orders` and `fulfillment_order_lines` tables plus `POST /api/fulfillment-orders`, read-by-order, cancel, and return handoff endpoints.

## Replay/Determinism Impact

Same central `orderId` and equivalent handoff payload is idempotent. Same `orderId` with different payload fails. Each reservation id can be attached to one fulfillment line.

## Scope

Allowed files are Warehouse fulfillment module files, reservation tests, docs, migrations, and validation evidence.

## Non-Goals

No Orders repo edits, no public landing edits, no deploy, and no delivery provider integration.

## Acceptance Criteria

- Fulfillment handoff references fulfilled reservation ids.
- Handoff stores item ids, product ids, SKU/title snapshots, warehouse ids, quantities, delivery address, shipping method, and allowed contact fields.
- Return and cancel handoff states are explicit.
- Existing stock fulfillment replay stays idempotent.

## Validation Task

Run `npm test -- --runInBand`, `npm run build`, and `git diff --check`.

## Required Gates

Pre-coding gate passed with documented risk: Docs RAG unavailable due missing `JWT_TOKEN`; repo-local plans and Orders source were read instead.
