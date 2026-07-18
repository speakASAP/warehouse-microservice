# WH-G3-T1: Validated Stock Mutation Contracts

```yaml
id: WH-G3-T1
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
  - docs/14_prompts/PROMPT-WH-G3.md
related_adrs: []
```

## Objective

Replace inline stock mutation request body types with validated DTOs or equivalent runtime contracts.

## Upstream Links

- Goal: `implementation-goals/GOAL-03-stock-mutation-invariants.md`
- Intent: `docs/orchestrator/warehouse-intent-plan.md`
- Invariants: `docs/governance/PROJECT_INVARIANTS.md`

## Goal Impact

This task prevents invalid or under-specified stock mutation commands from reaching service logic. It directly supports the intent that stock changes are authorized, auditable, reasoned, and non-negative.

## Project Invariant Impact

Applies to invariants 6, 7, 8, and 11. The task must preserve append-only movement evidence, require actor and reason evidence, reject invalid negative states, and avoid production stock mutation during validation unless approved.

## Sensitive-Data Classification

Internal service contract metadata. Do not include secrets, real JWTs, raw production stock records, customer identifiers, or real order payloads in examples or tests.

## Contract/Schema Impact

Stock mutation request contracts change from TypeScript-only inline shapes to runtime validated DTOs or equivalent. Existing clients may need to include required `reasonCode` and actor/service identity fields.

## Replay/Determinism Impact

Not a replay mechanism by itself. It must produce deterministic validation behavior for accepted and rejected payloads.

## Scope

- Inspect stock mutation controller methods.
- Define DTOs or runtime contracts for changed mutation endpoints.
- Require `reasonCode` and actor/service identity for changed stock writes.
- Keep response shapes compatible unless the execution plan explicitly documents a contract change.

## Non-Goals

- Do not implement reservation lifecycle rows.
- Do not implement catalog identity validation.
- Do not deploy without owner approval.

## Acceptance Criteria

- Invalid payloads are rejected before mutation logic.
- Missing `reasonCode` is rejected for stock-changing operations.
- Missing actor/service identity is rejected or derived from authenticated request context according to the execution plan.
- Build and focused tests pass.

## Required Context

- `remote-sync/warehouse-live/src/stock/stock.controller.ts`
- `remote-sync/warehouse-live/src/stock/dto/stock-mutation.dto.ts`
- `remote-sync/warehouse-live/src/main.ts`
- `docs/process/OPERATIONAL_GATES.md`

## Validation Task

Historical validation evidence is recorded in `TASKS.md`: WH-G3 added stock mutation DTOs for set, increment, decrement, reserve, and unreserve, with required `reasonCode` and `actor`; `npm test` and `npm run build` passed.

## Required Gates

- Warehouse pre-coding gate.
- Contract validation plan.
- Validation report update.
