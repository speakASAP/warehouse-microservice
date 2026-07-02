# VAL-GOAL-25 W4A Warehouse Quantity Default

Date: 2026-07-03
Status: implemented-and-validated

## IPS Chain

- Vision: Product imports should not fail or publish incorrect stock state when channel/source payloads omit quantity.
- Goal Impact: Goal 25 keeps stock truth in Warehouse while ensuring missing source quantity defaults to `0`.
- System: Warehouse owns stock quantity reconciliation; Catalog remains the product-quality review contract owner.
- Feature: Supplier/import stock reconciliation accepts absent/null/blank quantity as zero and rejects invalid quantities.
- Task: Resolve `[MISSING: Warehouse import/supplier reconciliation evidence that absent quantity defaults to 0]`.
- Execution Plan: Patch only Warehouse supplier reconciliation DTO/service/spec; do not edit Catalog, channel services, deploy scripts, Kubernetes, migrations, secrets, or runtime data.
- Coding Prompt: Bounded W4A Warehouse continuation from Catalog Goal 25 orchestrator.
- Code: `SupplierStockReconciliationDto` now defaults absent/null/blank quantity to `0`; `SupplierReconciliationService` normalizes quantity before stock writes, movement evidence, reconciliation records, and mutation logs.
- Validation: focused supplier reconciliation spec, full build, and diff hygiene passed.
- State Update: W4A blocker is resolved on branch `catalog-goal25-w4a-quantity-default`.

## Files Changed

- `src/suppliers/dto/supplier-stock-reconciliation.dto.ts`
- `src/suppliers/supplier-reconciliation.service.ts`
- `test/supplier-reconciliation.service.spec.ts`
- `reports/validation/VAL-GOAL-25-W4-warehouse-quantity-default.md`

## Validation Evidence

Remote repo: `/home/ssf/Documents/Github/warehouse-microservice-goal25-w4a`

- `npm test -- --runInBand test/supplier-reconciliation.service.spec.ts` -> PASS, 1 suite, 12 tests.
- `npm run build` -> PASS.
- `git diff --check` -> PASS.

## Blockers

None for W4A source validation.

## Deployment

Not run. This branch is source/test/report only.

## Next Action

Merge `catalog-goal25-w4a-quantity-default` after integration review, then refresh the Catalog W4/W5 rollup if the orchestrator wants Warehouse import quantity evidence included in Goal 25 closure state.
