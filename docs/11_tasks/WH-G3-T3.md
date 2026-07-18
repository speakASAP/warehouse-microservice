# WH-G3-T3: Stock Mutation Invariant Tests

```yaml
id: WH-G3-T3
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
  - docs/12_validation/VAL-WH-G3.md
related_adrs: []
```

## Objective

Add test coverage for WH-G3 stock mutation invariants.

## Upstream Links

- Goal: `implementation-goals/GOAL-03-stock-mutation-invariants.md`
- Intent: `docs/orchestrator/warehouse-intent-plan.md`
- Invariants: `docs/governance/PROJECT_INVARIANTS.md`

## Goal Impact

This task converts the documented stock authority rules into executable evidence before WH-G3 is marked complete.

## Project Invariant Impact

Applies to invariants 6, 7, 8, 9, and 11. Tests must prove mutation evidence, reason/actor requirements, non-negative state, deterministic failure handling, and no production mutation.

## Sensitive-Data Classification

Synthetic test data only.

## Contract/Schema Impact

Tests must cover DTO/runtime contract behavior for invalid mutation requests.

## Replay/Determinism Impact

Tests must include deterministic failure and retry-sensitive cases where practical. Idempotency remains primarily WH-G4, but WH-G3 must not introduce nondeterministic partial writes.

## Scope

- Add or update unit tests for stock service invariants.
- Add or update controller/DTO tests where available.
- Run `npm run build` and `npm test` in the target repository.

## Non-Goals

- Do not create broad end-to-end tests that mutate production stock.
- Do not add reservation lifecycle test cases beyond guarding WH-G3 behavior.

## Acceptance Criteria

- Missing reason is rejected.
- Missing actor/service identity is rejected or deterministically derived from auth context.
- Negative input is rejected.
- Insufficient stock is rejected.
- Transaction behavior is proven.
- Existing health/readiness behavior remains intact.

## Required Context

- `remote-sync/warehouse-live/test/stock.service.spec.ts`
- `remote-sync/warehouse-live/package.json`
- `docs/process/OPERATIONAL_GATES.md`

## Validation Task

Historical validation evidence is recorded in `TASKS.md` and `docs/12_validation/VAL-WH-G3.md`.

## Required Gates

- Warehouse validation gate.
- Completion gate.
