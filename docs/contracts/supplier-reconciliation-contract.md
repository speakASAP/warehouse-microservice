# Supplier Dropship Reconciliation Contract

Warehouse remains the availability authority for supplier dropship stock. Supplier integrations must send absolute stock snapshots into warehouse instead of exposing supplier stock directly to storefront or channel services.

## Endpoint

`POST /api/supplier-reconciliations`

Requires the same service JWT/RBAC boundary as the other warehouse mutation endpoints.

## Request

```json
{
  "supplierId": "supplier-123",
  "warehouseId": "dropship-location-uuid",
  "productId": "catalog-product-uuid",
  "quantity": 12,
  "externalReference": "supplier-feed-20260612T090000Z-line-42",
  "actor": "suppliers-microservice",
  "observedAt": "2026-06-12T09:00:00.000Z"
}
```

Rules:

- `quantity` is the supplier's absolute available-to-sell quantity for that product/location.
- `externalReference` is required and idempotent per `supplierId`, `warehouseId`, and `productId`.
- `warehouseId` must point to an active warehouse modeled as `supplier` or `dropship`.
- Supplier-managed warehouses must have a Warehouse-owned `supplierId`, and it must match the request supplier.

## Response

Applied reconciliation:

```json
{
  "success": true,
  "data": {
    "supplierId": "supplier-123",
    "warehouseId": "dropship-location-uuid",
    "productId": "catalog-product-uuid",
    "supplierQuantity": 12,
    "previousQuantity": 10,
    "reservedQuantity": 1,
    "externalReference": "supplier-feed-20260612T090000Z-line-42",
    "status": "applied",
    "actor": "suppliers-microservice"
  }
}
```

Conflict reconciliation:

```json
{
  "success": true,
  "data": {
    "supplierQuantity": 2,
    "previousQuantity": 10,
    "reservedQuantity": 4,
    "status": "conflict",
    "conflictReason": "Supplier quantity 2 is below reserved quantity 4 across 2 active reservation(s)"
  }
}
```

Conflict records preserve evidence and do not change stock quantity. Operators or the supplier service must resolve the oversold/reserved mismatch through explicit reservation or stock mutation flows.
