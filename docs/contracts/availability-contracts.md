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
          "warehouseCode": "OWN-PRG",
          "warehouseName": "Prague Main Warehouse",
          "warehouseType": "own",
          "supplierId": null,
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

## Warehouse origin metadata

Each per-warehouse availability row includes Warehouse-owned origin metadata so consumers can distinguish local physical stock from supplier or dropship stock without creating another stock truth:

| Field | Meaning | Ownership |
| --- | --- | --- |
| warehouseCode | Operator-facing warehouse code. | Warehouse |
| warehouseName | Operator-facing warehouse name. | Warehouse |
| warehouseType | Origin classification such as own, supplier, or dropship. | Warehouse |
| supplierId | Supplier linkage for supplier/dropship warehouses, when applicable. | Warehouse reference only; no supplier credentials are exposed. |

Catalog and storefront consumers may display or filter by these fields, but must treat Warehouse as the source of record for stock origin and quantities.

## Inventory topology read

Use the Warehouse topology endpoint when operators need to understand the source of stock across local and supplier-managed warehouses.

GET /api/warehouses/topology

Optional query:

- productId: catalog product identifier. When present, warehouse directory rows remain visible but stock totals are limited to that product.

Response shape:

- totals: totalQuantity, totalReserved, totalAvailable, productsWithStock, warehouseCount, ownWarehouseCount, supplierWarehouseCount.
- groups: own, supplier, dropship, and other warehouse rows.
- warehouses: flat active warehouse list in Warehouse priority/name order.
- each row: warehouseId, warehouseCode, warehouseName, warehouseType, originType, supplierId, isSupplierManaged, priority, city, country, totalQuantity, totalReserved, totalAvailable, productsWithStock.

This endpoint is read-only and must not be used as a stock mutation path. Warehouse remains the stock quantity authority, Catalog remains the product content authority, and Suppliers remains supplier import orchestration authority.

## Product logistics route read

Use the Warehouse product logistics endpoint when operators or downstream services need to understand how a catalog product can move from stock origin to customer.

GET /api/warehouses/logistics/:productId

Batch consumers should use:

POST /api/warehouses/logistics/batch

Request:

```json
{ "productIds": ["catalog-product-id"] }
```

Batch logistics requests require a non-empty `productIds` array, accept at most 200 product IDs per call, and require each product ID to be a non-empty string of at most 200 characters. The endpoint preserves request order and rejects duplicate product IDs so Catalog can map route plans back to requested goods without ambiguity.

The productId path parameter is the Catalog-owned product identifier stored on Warehouse stock rows.

Response shape:

- productId: normalized Catalog product identifier.
- totals: totalQuantity, totalReserved, totalAvailable, routeCount, ownAvailable, supplierAvailable, dropshipAvailable.
- preferredRoute: first reservable route after Warehouse allocation ordering, or null when every visible route is diagnostic-only. Local fulfillment is preferred before supplier replenishment and dropship when it has positive available stock.
- options: per-origin route options containing warehouse identity, originType, supplierId, quantity/reserved/available, routeType, routeLabel, canReserveFromWarehouse, requiresSupplierCoordination, and logistics legs. Supplier and dropship options remain visible for diagnostics when supplierId is missing, but they are not reservable until the Warehouse-owned supplier linkage is present. Checkout reservation and fulfillment also reject supplier-managed stock rows with missing supplier linkage, so the mutation path matches logistics reservability while still allowing release, expiry, cancellation, and return flows to clean up legacy holds.

Route types:

| routeType | Meaning |
| --- | --- |
| local_fulfillment | Alfares-owned warehouse ships to customer. |
| supplier_replenishment | Supplier warehouse replenishes Alfares receiving or handoff before customer fulfillment. |
| supplier_dropship | Supplier or dropship warehouse ships directly to customer. |
| unclassified | Warehouse type is not classified; operator review is required. |

Each route option also contains ordered `legs[]` so consumers can display the movement path without deriving logistics themselves:

| routeType | Required leg evidence |
| --- | --- |
| local_fulfillment | One Warehouse-responsible leg from the Alfares warehouse code to `customer`. |
| supplier_replenishment | A Supplier-responsible leg from supplier warehouse code to `alfares_receiving_or_handoff`, then a Warehouse-responsible leg from `alfares_receiving_or_handoff` to `customer`. |
| supplier_dropship | One Supplier-responsible leg from supplier/dropship warehouse code to `customer`. |
| unclassified | One mixed-responsibility leg to `operator_review`. |

Catalog, storefront, and order consumers must forward or display these legs as Warehouse-owned logistics evidence. They must not replace them with locally derived route semantics.

This endpoint is read-only. Reservations, fulfillment, and supplier coordination must still use their owning workflows and approved mutation endpoints.

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
