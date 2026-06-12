# CP-WH-G3: Stock Mutation Invariants Context Package

```yaml
id: CP-WH-G3
status: validated
owner: warehouse-owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: validated
upstream:
  - docs/intent-preservation/execution-plans/EP-WH-G3.md
downstream:
  - docs/intent-preservation/coding-prompts/PROMPT-WH-G3.md
related_adrs: []
```

## Task Summary

Implement WH-G3 by enforcing validated stock mutation contracts, required reason/actor evidence, non-negative stock state, and transactional stock movement evidence.

## Source Documents

- `docs/orchestrator/warehouse-intent-plan.md`
- `docs/governance/PROJECT_INVARIANTS.md`
- `implementation-goals/GOAL-03-stock-mutation-invariants.md`
- `docs/intent-preservation/tasks/WH-G3-T1.md`
- `docs/intent-preservation/tasks/WH-G3-T2.md`
- `docs/intent-preservation/tasks/WH-G3-T3.md`
- `docs/intent-preservation/execution-plans/EP-WH-G3.md`

## Relevant Files

- `remote-sync/warehouse-live/src/stock/stock.controller.ts`
- `remote-sync/warehouse-live/src/stock/stock.service.ts`
- `remote-sync/warehouse-live/src/stock/dto/stock-mutation.dto.ts`
- `remote-sync/warehouse-live/src/stock/stock.entity.ts`
- `remote-sync/warehouse-live/src/movements/movements.service.ts`
- `remote-sync/warehouse-live/src/movements/stock-movement.entity.ts`
- `remote-sync/warehouse-live/test/stock.service.spec.ts`
- `remote-sync/warehouse-live/package.json`

## Current Behavior

The intent plan records that stock mutation controllers use inline TypeScript structural body types, so the global validation pipe cannot enforce those request shapes. Reason codes are optional in some paths. Stock save, movement creation, and event publishing can drift under failure or concurrency because explicit transaction boundaries are missing.

## Required Behavior

- Invalid stock mutation payloads are rejected before service mutation logic.
- All stock-changing operations touched by WH-G3 require a reason code and actor/service identity.
- Negative quantity, reserved, and available states are rejected.
- Stock update and movement record are committed atomically.
- Test evidence proves the behavior.

## Constraints

- Do not implement WH-G4 reservation lifecycle.
- Do not implement WH-G5 catalog identity validation.
- Do not mutate production stock without owner approval.
- Do not deploy without owner approval.
- Do not store secrets or production data in tests, prompts, or reports.

## Known Risks

- Existing callers may omit `reasonCode` or actor evidence and need updates.
- Transaction changes may require adapting existing tests or service dependencies.
- Event publishing behavior must remain observable without weakening stock/movement atomicity.

## Validation Commands

```bash
npm run build
npm test
```

Remote equivalent:

```bash
ssh alfares 'cd /home/ssf/Documents/Github/warehouse-microservice && npm run build'
ssh alfares 'cd /home/ssf/Documents/Github/warehouse-microservice && npm test'
```
