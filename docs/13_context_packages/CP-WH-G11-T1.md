# CP-WH-G11-T1 - Context Package

Warehouse already models warehouses with type values such as own, supplier, and dropship, plus optional supplierId. Stock rows reference Catalog productId and a Warehouse warehouseId. The current batch availability endpoint returns totals and per-warehouse quantity, reserved, and available rows, but only exposes warehouseId, so Catalog and UI consumers cannot classify stock origin without extra calls.

The implementation should keep Warehouse as the stock authority and add only response metadata derived from the Warehouse relation: warehouse code, name, type, and supplier ID. No credentials, supplier payloads, production data, migrations, or stock mutations are involved.
