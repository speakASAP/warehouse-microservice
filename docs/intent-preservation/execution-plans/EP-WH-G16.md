# EP-WH-G16 - Paid Fulfillment Handoff

```yaml
id: EP-WH-G16
status: draft
owner: warehouse-fulfillment-owner
created: 2026-07-02
last_updated: 2026-07-02
completeness_level: complete
upstream:
  - docs/intent-preservation/tasks/WH-G16-T1.md
downstream:
  - docs/intent-preservation/context-packages/CP-WH-G16.md
  - docs/intent-preservation/coding-prompts/PROMPT-WH-G16.md
  - docs/intent-preservation/validation-reports/VAL-WH-G16.md
related_adrs: []
```

## Upstream Traceability

Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding Prompt -> Code -> Validation is preserved through the W1 plan, WH-G16 goal, WH-G16-T1 task, this plan, context package, prompt, source changes, and validation report.

## Goal Impact

Adds a durable Warehouse handoff record for paid orders without moving order lifecycle ownership from Orders or stock ownership away from Warehouse.

## Project Invariants

Warehouse remains stock authority; Orders remains order state owner; stock mutation remains on reservation endpoints with authenticated actor and reason context; production deployment is not performed.

## Sensitive-Data Handling

Store delivery address and bounded contact fields only in the Warehouse fulfillment order. Do not print raw customer data in logs or validation reports.

## Contract Validation Plan

Validate DTOs at Nest boundary and service-level checks in unit tests. Require fulfilled reservation ids and reject non-equivalent idempotency replay.

## Replay/Determinism Plan

Unique central `orderId` and unique line `reservationId` enforce replay safety. Equivalent replay returns the existing row.

## Scope

Files to create: fulfillment module, entities, DTOs, migration, contract doc, tests, IPS docs.

Files to modify: `src/app.module.ts`, `src/database/typeorm-data-source.ts`, `test/stock.service.spec.ts`, state docs.

Files that must not be modified: `public/index.html`, `public/landing.css`, unrelated identity/landing work.

## Implementation Steps

1. Add fulfillment order and line entities.
2. Add DTOs, service, controller, and module.
3. Wire module into app and TypeORM entities.
4. Add migration for fulfillment tables and indexes.
5. Add tests for idempotency, reservation-id requirement, fulfilled-reservation requirement, dispatch fields, cancel, and return.
6. Document the exact Orders handoff contract.
7. Run validation and update state.

## Test Plan

Focused Jest coverage plus full Jest/build/diff validation.

## Rollback Plan

Before deployment, revert the WH-G16 source/docs commit or remove the module import and migration. After deployment, schema rollback uses the migration `down` path only if owner-approved.

## Agent Handoff Prompt

Continue WH-G16 by validating and integrating the Warehouse fulfillment handoff. Do not edit public landing files. Do not deploy or push without owner approval.
