# Warehouse Availability Contracts

Warehouse remains the stock and availability authority. Catalog remains the product identity and sellable product content authority.

## Product identity boundary

Warehouse stock rows store `productId` as the catalog product identifier. Until a synchronous catalog validation client is added, product identity enters warehouse only through a trusted service-to-service ingestion path:

- Catalog admin or catalog ingestion creates/updates the sellable product first.
- Catalog, supplier reconciliation, or an approved operator task calls warehouse stock mutation endpoints with the catalog `productId`.
- Every stock mutation must include `reasonCode`, `actor`, and optional `reference`.
- Reconciliation jobs must compare warehouse `productId` values against catalog products and report unknown IDs before publication or channel sync.
- Storefront, order, and channel services must not create their own stock truth; they may cache warehouse availability for display.

Compensating checks required before WH-G5 is extended with live catalog validation:

- Unknown `productId` rows are reported as catalog reconciliation defects.
- Channel publication should require both catalog readiness and warehouse availability.
- Manual stock creation must be tied to an owner-approved task or catalog/admin workflow.

## Batch availability read

Use one batch call for product lists instead of N+1 calls.

`POST /api/stock/availability/batch`

Headers:

```http
Authorization: Bearer <service-token>
Content-Type: application/json
```

Request:

```json
{
  "productIds": ["catalog-product-1", "catalog-product-2"],
  "warehouseIds": ["warehouse-1"]
}
```

`warehouseIds` is optional. Omit it to aggregate across all warehouses.

Response:

```json
{
  "success": true,
  "data": [
    {
      "productId": "catalog-product-1",
      "totalQuantity": 12,
      "totalReserved": 2,
      "totalAvailable": 10,
      "warehouses": [
        {
          "warehouseId": "warehouse-1",
          "quantity": 12,
          "reserved": 2,
          "available": 10
        }
      ]
    },
    {
      "productId": "catalog-product-2",
      "totalQuantity": 0,
      "totalReserved": 0,
      "totalAvailable": 0,
      "warehouses": []
    }
  ]
}
```

Missing stock rows are returned with zero totals so consumers can preserve the original product list shape.

## Authorized write examples

Initial stock after catalog/admin approval:

```json
{
  "productId": "catalog-product-1",
  "warehouseId": "warehouse-1",
  "quantity": 12,
  "reasonCode": "CATALOG_INITIAL_STOCK",
  "actor": "catalog-microservice",
  "reference": "catalog-product-1"
}
```

Checkout reservation:

```json
{
  "productId": "catalog-product-1",
  "warehouseId": "warehouse-1",
  "quantity": 1,
  "orderId": "order-123",
  "channel": "flipflop",
  "expiresAt": "2026-06-12T10:15:00.000Z",
  "reasonCode": "CHECKOUT_HOLD",
  "actor": "flipflop-service",
  "reference": "cart-456"
}
```

Payment confirmation:

```json
{
  "productId": "catalog-product-1",
  "warehouseId": "warehouse-1",
  "orderId": "order-123",
  "channel": "flipflop",
  "reasonCode": "PAYMENT_CONFIRMED",
  "actor": "orders-microservice",
  "reference": "payment-789"
}
```

## Consumer responsibilities

- FlipFlop should call the batch endpoint for product listing, cart hydration, and checkout review pages.
- Channel services should use the batch endpoint before feed/publication sync and consume `stock.updated` events for incremental refreshes.
- Orders should use reservation lifecycle endpoints for payment success, failure, expiry, cancellation, and return flows.
- Consumers must treat `totalAvailable` as display/check availability, not as a guarantee after checkout begins; reservation lifecycle is the authority for holds.
