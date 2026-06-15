# CP-WH-G10-CATALOG - Context Package

Warehouse stores Catalog-owned product IDs on stock rows. WH-G5 documented a trusted ingestion path and compensating reconciliation requirement, but Warehouse did not yet expose a first-class unknown-product reconciliation report.

Catalog currently exposes public read-only product identity endpoints:

- `GET /api/products/:id`
- `GET /api/products/sku/:sku`

Catalog write endpoints remain guarded by Catalog auth. Warehouse write endpoints remain guarded by Warehouse JWT/RBAC. The cross-service service-token contract for live stock-write validation is [UNKNOWN: not approved for this goal].

Relevant Warehouse files:

- `src/stock/stock.entity.ts`
- `src/stock/stock.service.ts`
- `src/stock/stock.controller.ts`
- `src/stock/stock.module.ts`
- `docs/contracts/availability-contracts.md`

Decision:

- Implement reconciliation-only report now.
- Do not add live mutation-time Catalog validation until the owner approves the service-auth token, timeout behavior, failure policy, and migration impact.
