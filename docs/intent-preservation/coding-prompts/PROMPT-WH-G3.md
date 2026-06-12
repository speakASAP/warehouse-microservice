# PROMPT-WH-G3: Implement Stock Mutation Invariants

```yaml
id: PROMPT-WH-G3
status: archived
owner: warehouse-owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: validated
upstream:
  - docs/intent-preservation/context-packages/CP-WH-G3.md
  - docs/intent-preservation/execution-plans/EP-WH-G3.md
downstream:
  - docs/intent-preservation/validation-reports/VAL-WH-G3.md
related_adrs: []
```

## Task Summary

Implement WH-G3 stock mutation invariants in `warehouse-microservice`.

## Execution Plan Link

Use `docs/intent-preservation/execution-plans/EP-WH-G3.md`.

## Required Context

Read these documents before source edits:

- `docs/orchestrator/warehouse-intent-plan.md`
- `docs/governance/PROJECT_INVARIANTS.md`
- `implementation-goals/GOAL-03-stock-mutation-invariants.md`
- `docs/intent-preservation/context-packages/CP-WH-G3.md`

Inspect these files before implementation:

- `remote-sync/warehouse-live/src/stock/stock.controller.ts`
- `remote-sync/warehouse-live/src/stock/stock.service.ts`
- `remote-sync/warehouse-live/src/stock/dto/stock-mutation.dto.ts`
- `remote-sync/warehouse-live/src/movements/movements.service.ts`
- `remote-sync/warehouse-live/test/stock.service.spec.ts`

## Allowed Changes

- Stock mutation DTOs or runtime contracts.
- Stock controller mutation request handling.
- Stock service mutation invariants and transaction boundary.
- Movement service transaction support if needed.
- Focused WH-G3 tests.
- WH-G3 validation report and state documentation.

## Forbidden Changes

- Do not mutate production stock.
- Do not deploy without owner approval.
- Do not redesign reservation lifecycle.
- Do not implement catalog identity validation.
- Do not weaken auth/RBAC.
- Do not delete or rewrite movement history.
- Do not store secrets or real production data in tests or documentation.

## Implementation Instructions

1. Run and record the pre-coding gate.
2. Keep changes inside the file scope from `EP-WH-G3`.
3. Enforce validated request contracts for changed stock mutations.
4. Require reason code and actor/service identity for changed stock writes.
5. Reject negative quantity, reserved, and available states.
6. Commit stock update and movement record in one transaction.
7. Preserve event-path observability.
8. Add focused tests for missing reason, missing actor, negative input, insufficient stock, and transaction behavior.
9. Run validation commands.
10. Update `VAL-WH-G3.md`, `docs/IMPLEMENTATION_STATE.md`, `TASKS.md`, and `STATE.json`.

## Acceptance Criteria

- Stock write requests are validated before service mutation logic.
- Reason code and actor/service identity are required.
- Invalid negative stock states are rejected.
- Stock update and movement record are transactionally consistent.
- Tests cover documented WH-G3 invariants.
- Health/readiness behavior remains intact.

## Validation Commands

```bash
npm run build
npm test
```

## Expected Output

Report back with:

- files changed;
- DTO/contract changes;
- transaction boundary summary;
- invariant coverage summary;
- validation commands and results;
- remaining risks;
- next command.
