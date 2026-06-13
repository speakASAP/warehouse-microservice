# GOAL-14 - Product Logistics Route Read Model

Metadata:
- id: WH-G14
- status: done
- owner: warehouse-owner
- created: 2026-06-13
- last_updated: 2026-06-13
- completeness_level: complete

## Intent

Make product logistics explicit for operators and downstream services. For a Catalog product ID, Warehouse should explain whether available goods can ship from Alfares-owned stock, require supplier replenishment, or route through dropship/direct supplier fulfillment.

## Scope

- Add read-only product logistics route planning from Warehouse stock origin data.
- Keep Catalog product ID opaque and Catalog-owned.
- Expose supplierId linkage only where Warehouse already owns that reference.
- Do not mutate stock, reservations, supplier reconciliations, or production data.

## Acceptance Criteria

- Product route endpoint returns local, supplier replenishment, and dropship route options where stock exists.
- Response contains totals and preferred route ordering that prefers local stock before supplier routes.
- Tests, build, and diff check pass.

## Completion Evidence

- Added GET /api/warehouses/logistics/:productId.
- Added route semantics for local fulfillment, supplier replenishment, and supplier dropship.
- Added focused logistics route test coverage.
- Validation passed: npm test -- --runInBand, npm run build, git diff --check.
- No production deployment was performed.
