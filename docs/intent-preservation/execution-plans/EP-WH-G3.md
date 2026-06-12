# EP-WH-G3: Stock Mutation Invariants

```yaml
id: EP-WH-G3
status: validated
source_task:
  - ../tasks/WH-G3-T1.md
  - ../tasks/WH-G3-T2.md
  - ../tasks/WH-G3-T3.md
owner: warehouse-owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: validated
```

## Metadata

Goal: WH-G3 - Stock Mutation Invariants.

Lifecycle state: retrospectively documented from completed WH-G3 evidence.

## Upstream Traceability

- Original intent: `docs/orchestrator/warehouse-intent-plan.md`
- Invariants: `docs/governance/PROJECT_INVARIANTS.md`
- Goal brief: `implementation-goals/GOAL-03-stock-mutation-invariants.md`
- Tasks: `WH-G3-T1`, `WH-G3-T2`, `WH-G3-T3`
- Current state: `docs/IMPLEMENTATION_STATE.md`

## Goal Impact

WH-G3 makes stock changes auditable, authorized, non-negative, and transactionally consistent. This protects warehouse as the stock authority before reservation lifecycle, catalog availability, supplier reconciliation, and production observability work continue.

## Project Invariants

- Invariant 1: warehouse remains stock and availability authority.
- Invariant 6: stock movement history remains append-only business evidence.
- Invariant 7: stock mutations require actor/service identity, reason code, and authorization.
- Invariant 8: negative quantity, reserved, or available states are invalid.
- Invariant 9: retry-sensitive state changes must not introduce nondeterministic partial writes.
- Invariant 11: no production stock mutation without owner-approved task context.
- Invariant 12: no production deployment without owner approval.

## Sensitive-Data Handling

Classification: internal service implementation and synthetic test data.

Do not place secrets, real JWTs, production stock rows, customer identifiers, supplier records, or real order data in prompts, tests, logs, screenshots, or validation reports.

## Contract Validation Plan

Stock mutation input contracts are in scope. Validate by adding DTO/runtime contract tests and by running the project test suite. Any required request-field change must be listed in the validation report.

## Replay/Determinism Plan

Stock update plus movement write must commit atomically. Tests must show deterministic behavior for rejected negative or insufficient mutations and for a simulated failure before commit when practical.

## Scope

- Convert changed stock mutation bodies to validated DTOs or equivalent runtime contracts.
- Require `reasonCode` and actor/service identity for stock-changing operations touched by WH-G3.
- Reject negative `quantity`, `reserved`, and `available` states.
- Wrap stock write plus movement write in one transaction.
- Add focused tests for missing reason, negative input, insufficient stock, and transaction behavior.

## Non-Goals

- Reservation lifecycle rows and payment semantics remain WH-G4.
- Catalog product identity validation and batch availability remain WH-G5.
- Supplier reconciliation remains WH-G6.
- Production deployment and production stock mutation are out of scope unless explicitly approved by the owner in the active session.

## Files To Inspect

- `remote-sync/warehouse-live/src/stock/stock.controller.ts`
- `remote-sync/warehouse-live/src/stock/stock.service.ts`
- `remote-sync/warehouse-live/src/stock/dto/stock-mutation.dto.ts`
- `remote-sync/warehouse-live/src/stock/stock.entity.ts`
- `remote-sync/warehouse-live/src/movements/movements.service.ts`
- `remote-sync/warehouse-live/src/movements/stock-movement.entity.ts`
- `remote-sync/warehouse-live/test/stock.service.spec.ts`
- `remote-sync/warehouse-live/package.json`

## Files To Create

Create only if needed by the inspected NestJS patterns:

- additional DTO files under `remote-sync/warehouse-live/src/stock/dto/`;
- focused test files under `remote-sync/warehouse-live/test/`.

## Files To Modify

Allowed implementation files:

- `remote-sync/warehouse-live/src/stock/stock.controller.ts`
- `remote-sync/warehouse-live/src/stock/stock.service.ts`
- `remote-sync/warehouse-live/src/stock/dto/stock-mutation.dto.ts`
- `remote-sync/warehouse-live/src/stock/stock.entity.ts`
- `remote-sync/warehouse-live/src/movements/movements.service.ts`
- `remote-sync/warehouse-live/test/stock.service.spec.ts`

Allowed documentation files:

- `docs/IMPLEMENTATION_STATE.md`
- `TASKS.md`
- `STATE.json`
- `docs/intent-preservation/validation-reports/VAL-WH-G3.md`

## Files That Must Not Be Modified

- immutable or owner-authored product intent documents not present in this sync, including any future `BUSINESS.md`;
- completed WH-G1 and WH-G2 history except appending evidence;
- unrelated service modules outside stock/movements/tests unless the execution plan is updated with a documented deviation.

## Implementation Steps

1. Complete the pre-coding gate and record evidence.
2. Inspect stock controller, service, movement service, entities, and current tests.
3. Define validated request contracts for stock mutations.
4. Require reason and actor/service identity for changed stock writes.
5. Add or tighten non-negative state checks.
6. Introduce a transaction boundary for stock update plus movement evidence.
7. Add focused tests for invalid payloads and transaction behavior.
8. Run build and tests.
9. Update validation report, implementation state, task log, and machine state.

## Test Plan

- Unit tests for missing `reasonCode`.
- Unit tests or controller tests for missing actor/service identity.
- Unit tests for negative quantity/reserved/available input.
- Unit tests for insufficient stock.
- Transaction behavior test where stock and movement cannot drift.
- Build verification.

## Validation Plan

Run from the target warehouse repository:

```bash
npm run build
npm test
```

If implementation happens on the remote repository:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/warehouse-microservice && npm run build'
ssh alfares 'cd /home/ssf/Documents/Github/warehouse-microservice && npm test'
```

## Gate Commands

Manual gate for this project:

```bash
git status --short --branch
./scripts/next_goal.sh
```

Reference IPS gates if the IPS scripts are copied into this repository later:

```bash
python3 scripts/pre_coding_gate.py --root .
python3 scripts/deployment_readiness_gate.py --root .
```

## Documentation Updates

- Update `docs/intent-preservation/validation-reports/VAL-WH-G3.md` with evidence.
- Update `docs/IMPLEMENTATION_STATE.md` with goal status and validation evidence.
- Update `TASKS.md` with completed WH-G3 tasks.
- Update `STATE.json` with current state and next focus.

## Rollback Plan

Revert only WH-G3 implementation changes. Preserve documentation evidence by appending a rollback note rather than deleting history. Do not revert unrelated human or agent changes.

## Agent Handoff Prompt

Implement WH-G3 from `docs/intent-preservation/execution-plans/EP-WH-G3.md`. Preserve the warehouse intent from `docs/orchestrator/warehouse-intent-plan.md`, keep stock authority and movement evidence intact, do not mutate production stock, do not deploy without owner approval, and report validation evidence in `docs/intent-preservation/validation-reports/VAL-WH-G3.md`.

## Completion Checklist

- [x] DTO/runtime validation implemented
- [x] Reason and actor/service identity enforced
- [x] Transaction boundary implemented
- [x] Invariant tests added
- [x] Build passed
- [x] Tests passed
- [x] Validation report updated
- [x] Implementation state updated
- [x] Task log and `STATE.json` updated
- [x] Pre-coding gate requirement added for future goals
