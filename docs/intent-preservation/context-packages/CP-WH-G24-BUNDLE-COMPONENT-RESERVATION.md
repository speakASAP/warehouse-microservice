# CP-WH-G24-BUNDLE-COMPONENT-RESERVATION

## Context

Catalog `catalog.bundle.v1` is a standalone bundle aggregate over existing Catalog product IDs. It is not a product row, SKU, stock item, order, or payment price record. Catalog docs still carried `[MISSING: Warehouse approval that first ecosystem bundle selling reserves component lines only]`.

Warehouse already owns stock rows, reservations, and lifecycle transitions keyed by existing `productId`, `warehouseId`, order id, channel, quantity, actor, and reason. Validation must remain source-only and must not mutate live stock.

## Required Boundary

Accept component product lines. Reject bundle aggregate identity as Warehouse stock identity.
