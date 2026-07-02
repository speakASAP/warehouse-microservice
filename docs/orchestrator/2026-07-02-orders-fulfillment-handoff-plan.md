# Orders Paid Fulfillment Handoff Plan

Date: 2026-07-02
Parent plan: `orders-microservice/docs/orchestrator/2026-07-02-order-lifecycle-warehouse-status-rollout-plan.md`

## Objective

Warehouse must remain the stock authority and must receive a paid-order handoff that is strong enough to pick, pack, and dispatch the reserved items to the delivery address.

## Current Evidence

- Reservation lifecycle endpoints exist: reserve, release, fulfill, cancel, expire, return.
- Orders already calls reserve during order creation and fulfill after payment.
- Discovery confirmed current `POST /api/reservations/fulfill` only finalizes stock/reservation/movement state and does not persist delivery address, shipping method, SKU/title snapshots, order item ids, or customer contact fields.
- WH-G16 adds `POST /api/fulfillment-orders` to persist the paid-order handoff after the referenced reservation ids are fulfilled.

## Workstream

Owner role: Warehouse fulfillment owner
Status: ready for discovery, implementation dependency-gated by contract decision

Allowed files:

- `src/reservations/**`
- fulfillment or dispatch modules if present
- Warehouse docs and tests
- validation scripts/reports

Forbidden files:

- `public/index.html`
- `public/landing.css`
- unrelated landing or identity work

## Required Work

1. Confirm whether current `fulfill` stores a durable paid-order handoff or only finalizes stock.
2. If it only finalizes stock, add a fulfillment-order or pick-ticket contract for paid Orders handoff.
3. Preserve idempotency by central order id and reservation ids.
4. Store enough data for warehouse operations: item ids, SKU/title, warehouse ids, quantities, delivery address, shipping method, and allowed customer contact fields.
5. Keep return/cancel behavior explicit and tested.

## Validation

- fulfill is idempotent
- fulfillment handoff cannot exist without reservation ids
- pick-ticket/fulfillment order includes delivery address and line items
- return path is explicit
- no stock mutation occurs without an authenticated actor and reservation context

## Contract Decision

Current `fulfill` is not enough for warehouse operations because it is a stock transition only. The bounded Warehouse contract is:

1. Orders fulfills the reserved item rows through the existing reservation lifecycle.
2. Orders sends `POST /api/fulfillment-orders` with central `orderId`, order number, channel, fulfilled reservation ids, order item ids, product ids, SKU/title snapshots, warehouse ids, quantities, shipping method, delivery address, and allowed contact fields.
3. Warehouse stores the fulfillment order as the pick/pack/dispatch handoff and rejects non-equivalent replays.
4. Cancel and return handoff states are explicit on fulfillment orders; stock effects remain on `POST /api/reservations/cancel` and `POST /api/reservations/return`.

Detailed contract: `docs/contracts/fulfillment-handoff-contract.md`.
