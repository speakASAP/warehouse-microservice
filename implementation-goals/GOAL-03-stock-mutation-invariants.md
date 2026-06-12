# WH-G3 - Stock Mutation Invariants

Status: ready.

## Objective

Make stock changes auditable, authorized, non-negative, and concurrency-safe.

## Intent Link

Warehouse owns stock quantities, reserved quantities, movement history, and stock events. Every stock mutation must include actor and reason evidence, must not create negative stock state, and must preserve movement history.

## Scope

- Replace inline controller body types for stock mutations with validated DTOs or equivalent runtime contracts.
- Require `reasonCode` and actor/service identity for adjustment, increment, decrement, reserve, unreserve, transfer, cancellation, and return flows touched by this goal.
- Reject negative `quantity`, `reserved`, and `available` states at service level.
- Add persistence-level checks where practical.
- Wrap stock write plus movement write in one transaction.
- Add tests for insufficient stock, negative input, missing reason, and concurrency-sensitive updates.

## Non-Goals

- Do not redesign checkout reservation lifecycle. That is WH-G4.
- Do not implement catalog product identity validation. That is WH-G5.
- Do not mutate production stock as part of validation unless the owner explicitly approves the exact task and payload.

## Acceptance Criteria

- Stock write requests are validated before service mutation logic.
- Reason code and actor are required for stock-changing operations.
- Invalid negative quantity/reserved/available states are rejected.
- Stock update and movement record are transactionally consistent.
- Tests prove missing reason, negative input, insufficient stock, and transaction behavior.
- Existing health/readiness behavior remains intact.

## Required Reading

- `docs/orchestrator/warehouse-intent-plan.md`
- `docs/governance/PROJECT_INVARIANTS.md`
- `docs/process/OPERATIONAL_GATES.md`
- `remote-sync/warehouse-live/src/stock/stock.controller.ts`
- `remote-sync/warehouse-live/src/stock/stock.service.ts`
- `remote-sync/warehouse-live/src/movements/movements.service.ts`
- `remote-sync/warehouse-live/src/stock/dto/stock-mutation.dto.ts`

## Validation

Use the narrowest available local or remote commands:

```bash
npm run build
npm test
```

If working on the remote repository:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/warehouse-microservice && npm run build'
ssh alfares 'cd /home/ssf/Documents/Github/warehouse-microservice && npm test'
```

## Completion Report Requirements

Include:

- DTO/contract changes;
- transaction boundary summary;
- invariant coverage summary;
- test evidence;
- risks or remaining reservation lifecycle gaps;
- changed files.

