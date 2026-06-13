# PROMPT-WH-G12 - Inventory Topology Read Model

Implement WH-G12-T1 in warehouse-microservice. Add a read-only topology endpoint that lists active warehouses grouped by origin type and includes stock totals. Keep the endpoint additive and avoid stock mutation. Preserve Catalog product ownership by treating productId as an opaque filter. Preserve supplier boundaries by exposing only Warehouse-owned supplierId linkage, never supplier credentials.
