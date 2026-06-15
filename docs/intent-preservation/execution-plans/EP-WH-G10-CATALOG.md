# EP-WH-G10-CATALOG - Catalog Identity Reconciliation Report

```yaml
id: EP-WH-G10-CATALOG
status: draft-work
goal_id: WH-G10-CATALOG-IDENTITY-VALIDATION
task_ids:
  - WH-G10-CATALOG-T1
created: 2026-06-13
```

## Scope

- `src/stock/catalog-product-reconciliation.service.ts`
- `src/stock/stock.controller.ts`
- `src/stock/stock.module.ts`
- `test/catalog-product-reconciliation.service.spec.ts`
- `docs/contracts/availability-contracts.md`
- WH-G10-CATALOG IPS artifacts only.

## Plan

1. Add a stock-scoped read-only reconciliation service.
2. Read unique Warehouse stock `productId` values, optionally filtered by caller-supplied product IDs or warehouse IDs.
3. Check each product ID against Catalog's existing public `GET /api/products/:id` product identity read.
4. Return known, unknown, and Catalog-unavailable outcomes separately.
5. Expose the report behind existing Warehouse JWT/RBAC protection.
6. Document that live mutation-time validation remains blocked until service-auth and write-path failure behavior are approved.

## Parallel Execution

| Workstream | Parallel status | Owner role | Write ownership | Validation ownership | Notes |
| --- | --- | --- | --- | --- | --- |
| Reconciliation endpoint | ready now | WH-G10 worker | `src/stock`, focused tests | WH-G10 worker | Does not share files with reservation/supplier/admin workers except `stock.controller.ts` constructor/route integration. |
| IPS/contract docs | ready now | WH-G10 worker | WH-G10-CATALOG-specific docs and availability contract | WH-G10 worker | Avoids shared orchestrator state files per delegation. |
| Final integration/deploy | blocked | Orchestrator | shared state/deploy scripts | Orchestrator | Deployment is not approved. |

## Invariants

- Catalog remains product identity owner.
- Warehouse remains stock and availability authority.
- Auth remains identity/RBAC owner; endpoint relies on existing Warehouse guard.
- No production stock mutation or deployment occurs.

## Validation Commands

```text
npm test -- --runInBand test/catalog-product-reconciliation.service.spec.ts
npm test -- --runInBand
npm run build
git diff --check
```
