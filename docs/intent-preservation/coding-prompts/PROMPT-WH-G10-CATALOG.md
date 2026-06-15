# PROMPT-WH-G10-CATALOG - Coding Prompt

Implement a protected read-only Warehouse report at `GET /api/stock/catalog/reconciliation` that checks Warehouse stock `productId` values against Catalog's product identity read endpoint and reports unknown IDs. Preserve Catalog as product identity owner and Warehouse as stock authority. Separate true unknown product IDs from Catalog dependency outages. Do not mutate stock, reservations, suppliers, movements, events, schema, admin assets, or production. Do not deploy. Validate with focused Jest, full Jest, Nest build, and diff check.
