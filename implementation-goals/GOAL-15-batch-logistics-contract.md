# GOAL-15 - Batch Product Logistics Contract

Metadata:
- id: WH-G15
- status: done
- owner: warehouse-owner
- created: 2026-06-13
- last_updated: 2026-06-13
- completeness_level: complete

## Intent

Expose Warehouse-owned product logistics route planning as a batch contract so Catalog and channel projections can consume logistics without deriving route semantics themselves.

## Scope

- Add POST /api/warehouses/logistics/batch.
- Reuse the existing WH-G14 single-product route planner.
- Preserve request order.
- Keep the endpoint read-only.

## Validation

- npm test -- --runInBand
- npm run build
- git diff --check

## Completion Evidence

- Added POST /api/warehouses/logistics/batch.
- Reused WH-G14 route planning semantics.
- Added request-order batch coverage.
- Validation passed: npm test -- --runInBand, npm run build, git diff --check.
