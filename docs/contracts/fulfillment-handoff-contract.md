# Warehouse Fulfillment Handoff Contract

Date: 2026-07-02

## Purpose

Persist the paid-order warehouse handoff that operators need for pick, pack, and dispatch. This contract supplements the existing reservation lifecycle; it does not replace Warehouse stock authority or Orders order-state authority.

## Current Fulfill Behavior

`POST /api/reservations/fulfill` remains the stock transition endpoint. It requires authenticated actor context, `productId`, `warehouseId`, `orderId`, optional `channel`, and `reasonCode`. It marks the matching active reservation as `fulfilled`, deducts stock, writes a stock movement, and enqueues stock events. It does not store delivery address, shipping method, order item ids, SKU/title snapshots, customer contact fields, or dispatch instructions.

## Paid Handoff Endpoint

`POST /api/fulfillment-orders`

Orders calls this after the referenced reservation rows have been fulfilled. The endpoint is idempotent by central `orderId` and by `items[].reservationId`.

Required payload:

```json
{
  "orderId": "central-orders-uuid",
  "orderNumber": "ORD-2026-0001",
  "channel": "flipflop",
  "shippingMethod": "carrier",
  "reasonCode": "PAYMENT_CONFIRMED",
  "reference": "external-or-checkout-id",
  "deliveryAddress": {
    "name": "recipient name",
    "street": "street and house number",
    "city": "city",
    "postalCode": "postal code",
    "country": "CZ"
  },
  "customerContact": {
    "name": "customer name",
    "email": "customer@example.test",
    "phone": "+420000000000"
  },
  "items": [
    {
      "orderItemId": "orders-order-item-id",
      "reservationId": "warehouse-reservation-id",
      "productId": "catalog-product-id",
      "sku": "SKU-1",
      "title": "Product title snapshot",
      "warehouseId": "warehouse-id",
      "quantity": 1
    }
  ]
}
```

The authenticated Warehouse service actor is taken from the bearer token, not trusted from request body data.

## Validation Rules

- `items[]` must be non-empty.
- Each line must include `orderItemId`, `reservationId`, `productId`, `title`, `warehouseId`, and positive `quantity`.
- Each `reservationId` must exist in `stock_reservations`.
- Each reservation must belong to the same central `orderId`.
- Each reservation must already be `fulfilled`.
- Reservation `productId`, `warehouseId`, and `quantity` must match the payload line.
- A reservation id can be attached to only one fulfillment order.
- Same `orderId` plus equivalent payload returns the existing fulfillment order.
- Same `orderId` with different payload is rejected as an idempotency conflict.

## Read And Exception Endpoints

- `GET /api/fulfillment-orders/order/:orderId` returns the persisted handoff and lines.
- `POST /api/fulfillment-orders/order/:orderId/cancel` marks the handoff `cancelled`.
- `POST /api/fulfillment-orders/order/:orderId/return` marks the handoff `returned`.

The cancel and return handoff endpoints do not mutate stock. Stock effects remain explicit through existing reservation lifecycle endpoints:

- `POST /api/reservations/cancel`
- `POST /api/reservations/return`

## Orders Sequence

1. Orders reserves each order item through `POST /api/reservations/reserve`.
2. On paid status, Orders fulfills each reserved item through `POST /api/reservations/fulfill`.
3. Orders sends `POST /api/fulfillment-orders` with the fulfilled reservation ids and dispatch payload.
4. Operators and future dispatch systems read Warehouse fulfillment orders for pick/pack/dispatch.

If Orders does not yet have reservation ids from the reserve response, it can read them through `GET /api/reservations/order/:orderId` before creating the handoff.

## Provider Shipment Status Intake

Warehouse's bounded Allegro shipment snapshot consumer contract for after `handed_to_delivery` is documented in `docs/contracts/fulfillment-provider-status-intake-contract.md`.

Summary:

- Allegro commit `e626e5c` defines the source-only verifier contract `allegro.shipment_status_snapshot.v1`.
- The source verifier emits hashed account/order/shipment/waybill ids, bounded source-read status/reason, `packageCount`, `latestStatus`, `latestStatusAt`, and `trackingUpdatedAt`.
- Raw Allegro shipment payloads, tracking numbers/URLs, credentials, customer address/contact fields, labels, provider response bodies, and raw marketplace shipment/package objects must not be sent to Orders or persisted in Warehouse fulfillment status metadata.
- Accepted post-handoff Warehouse statuses are constrained to `in_delivery`, `delivered`, `not_delivered`, and `returned`, plus documented no-op classes, with the existing Warehouse transition order.
- Warehouse still lacks the consumer/runtime adapter, correlation source, and ledger/idempotency decision required to consume snapshots.
- Orders lifecycle updates must continue through the existing Warehouse fulfillment status callback; Orders must not consume Allegro snapshots directly.

## Missing Contracts

- `[MISSING: Warehouse consumer/runtime adapter for read-only shipment snapshots]`
- `[MISSING: approved Warehouse shipment snapshot ledger or adapter-owned durable idempotency store]`
- `[MISSING: approved correlation source between Allegro hashed order/shipment/waybill identity and exactly one Warehouse fulfillment order]`
- `[MISSING: approved Allegro latestStatus to Warehouse status mapping fixture set for in-delivery, delivered, not-delivered, returned, and no-op classes]`
- `[MISSING: Orders lifecycle callback verification after Warehouse consumer implementation, proving no Allegro snapshot hashes/raw fields enter Orders events]`
