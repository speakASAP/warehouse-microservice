# CP-WH-G13-CONFLICTS - Context Package

Metadata:
- id: CP-WH-G13-CONFLICTS
- goal_id: WH-G13-CONFLICTS
- status: complete
- created: 2026-06-14
- last_updated: 2026-06-14

## Required Context

- `implementation-goals/GOAL-13-supplier-conflict-operations.md`
- `docs/11_tasks/WH-G13-CONFLICTS-T1.md`
- `src/suppliers/supplier-reconciliation.service.ts`
- `src/suppliers/supplier-reconciliation.controller.ts`
- `src/suppliers/dto/supplier-stock-reconciliation.dto.ts`
- `src/suppliers/supplier-stock-reconciliation.entity.ts`
- `test/supplier-reconciliation.service.spec.ts`
- `src/migrations/1781400000000-AddSupplierConflictReviewMetadata.ts`

## Boundaries

- Warehouse remains supplier reconciliation evidence owner.
- Conflict review metadata must not mutate stock quantity or supplier feed truth.
- Auth-derived actors are preferred for operational evidence; body actors are deprecated compatibility input only.
- Production deployment and migration execution require explicit owner approval.

## Validation Commands

- `npm test -- --runInBand test/supplier-reconciliation.service.spec.ts`
- `npm test -- --runInBand`
- `npm run build`
- `git diff --check`
