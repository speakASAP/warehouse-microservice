# EP-WH-G13-CONFLICTS - Supplier Conflict Operations Execution Plan

Metadata:
- id: EP-WH-G13-CONFLICTS
- goal_id: WH-G13-CONFLICTS
- task_ids:
  - WH-G13-CONFLICTS-T1
- status: executed
- created: 2026-06-14
- last_updated: 2026-06-14

## Plan

1. Extend supplier reconciliation DTOs with query filters and conflict review payload validation.
2. Add service method to list reconciliation rows with composable filters and safe limit bounds.
3. Add transactional service method to review only conflict rows with optional operator note updates.
4. Add controller routes for listing and review operations.
5. Add additive review metadata columns and migration coverage.
6. Add focused tests for listing filters and conflict review behavior.
7. Run focused tests, full tests, build, and diff check.

## Parallel Execution

- Parallel status: final integration.
- Dependencies: WH-G6 supplier reconciliation, WH-G8 migration discipline, WH-G14-AUTH for authenticated actor derivation where controllers accept mutation/review evidence.
- Shared files/contracts: `src/suppliers/**`, migrations, supplier reconciliation API contract.
- Integration owner: Warehouse orchestrator.
- Validation owner: Warehouse orchestrator.
- Merge order: after WH-G14-AUTH actor helper and before deployment validation.

## Blockers

- Deployment blocked until explicit owner approval.
- [MISSING: original worker pre-coding artifact] Reconstructed during collection from source diff and validation evidence.
