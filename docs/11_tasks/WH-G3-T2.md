# WH-G3-T2: Transactional Stock Movement Evidence

```yaml
id: WH-G3-T2
status: validated
owner: warehouse-owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: validated
upstream:
  - implementation-goals/GOAL-03-stock-mutation-invariants.md
  - docs/orchestrator/warehouse-intent-plan.md
  - docs/governance/PROJECT_INVARIANTS.md
downstream:
  - docs/21_execution_plans/EP-WH-G3.md
  - docs/12_validation/VAL-WH-G3.md
related_adrs: []
```

## Objective

Make stock updates and movement record writes transactionally consistent.

## Upstream Links

- Goal: `implementation-goals/GOAL-03-stock-mutation-invariants.md`
- Intent: `docs/orchestrator/warehouse-intent-plan.md`
- Invariants: `docs/governance/PROJECT_INVARIANTS.md`

## Goal Impact

This task protects stock movement history as business evidence. A stock quantity change must not commit without its movement record, and a movement record must not claim a stock change that failed.

## Project Invariant Impact

Applies to invariants 1, 6, 7, and 8. The implementation must preserve stock authority, append-only evidence, actor/reason evidence, and non-negative state.

## Sensitive-Data Classification

Internal operational state. Tests must use synthetic product IDs, warehouse IDs, actors, reason codes, and references.

## Contract/Schema Impact

Service behavior changes around failure atomicity. Persistence-level constraints may be added if practical and must be documented in the validation report.

## Replay/Determinism Impact

State-changing operations must be deterministic under failure: either stock and movement evidence both commit, or neither commits.

## Scope

- Inspect stock service and movement service write paths.
- Introduce a transaction boundary for stock mutation plus movement write.
- Preserve event publication observability without allowing event failure to corrupt stock/movement consistency.
- Reject negative quantity, reserved, or available states before commit.

## Non-Goals

- Do not create reservation lifecycle records.
- Do not redesign RabbitMQ.
- Do not run production mutation smoke tests without owner approval.

## Acceptance Criteria

- Stock update and movement write share one transaction.
- Failure before commit leaves no partial stock/movement state.
- Negative stock states are rejected.
- Tests cover transaction behavior.

## Required Context

- `remote-sync/warehouse-live/src/stock/stock.service.ts`
- `remote-sync/warehouse-live/src/movements/movements.service.ts`
- `remote-sync/warehouse-live/src/stock/stock.entity.ts`
- `remote-sync/warehouse-live/src/movements/stock-movement.entity.ts`

## Validation Task

Historical validation evidence is recorded in `TASKS.md`: WH-G3 wrapped stock row writes and stock movement inserts in TypeORM transactions with write locks on existing stock rows; `npm test` and `npm run build` passed.

## Required Gates

- Warehouse pre-coding gate.
- Invariant validation evidence.
- Replay/determinism evidence.
