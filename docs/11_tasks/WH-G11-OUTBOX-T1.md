# WH-G11-OUTBOX-T1 - Transactional Stock Event Outbox

Metadata:
- id: WH-G11-OUTBOX-T1
- status: implemented-no-deploy
- goal_id: WH-G11-OUTBOX
- owner: warehouse-owner
- created: 2026-06-13
- last_updated: 2026-06-13
- completeness_level: complete
- sensitive_data: no secrets, no production samples
- contract_schema_impact: additive database table and additive `eventId` event payload field
- replay_determinism_impact: at-least-once replay with consumer dedupe by `eventId`

## Objective

Persist stock event intents atomically with stock mutations and replay RabbitMQ publishes from durable outbox rows.

## Upstream Links

- docs/orchestrator/warehouse-intent-plan.md
- docs/governance/PROJECT_INVARIANTS.md
- docs/process/OPERATIONAL_GATES.md
- implementation-goals/GOAL-11-transactional-stock-event-outbox.md

## Goal Impact

Stock changes, movement evidence, and event intent become transactionally coupled. RabbitMQ failure no longer loses event intent; operators can see pending and failed rows.

## Scope

- `src/stock/stock-event-outbox.entity.ts`
- `src/migrations/1781300000000-StockEventOutbox.ts`
- `src/stock/stock.service.ts`
- `src/stock/stock-events.service.ts`
- TypeORM registration, health visibility, tests, and stock event contract docs

## Non-Goals

- No deploy or migration execution.
- No production stock mutation.
- No retention purge implementation.
- No changes to Catalog, Orders, Suppliers, or channel services.

## Pre-Coding Gate Evidence

Gate: Warehouse Pre-Coding Gate
Date: 2026-06-13
Goal: WH-G11-OUTBOX
Task: WH-G11-OUTBOX-T1
Repository root: `/home/ssf/Documents/Github/warehouse-microservice`
Git status: clean before edits on `main...origin/main`
Remote status: remote-only edits over SSH
Execution plan: `docs/21_execution_plans/EP-WH-G11-OUTBOX.md`
Context package: `docs/13_context_packages/CP-WH-G11-OUTBOX.md`
Coding prompt: `docs/14_prompts/PROMPT-WH-G11-OUTBOX.md`
Invariants checked: 1, 6, 7, 8, 9, 10, 11, 12
Sensitive-data classification: no secrets, no production payloads
Contract/schema impact: additive outbox table, additive `eventId` in stock event payloads
Replay/determinism impact: at-least-once replay, dedupe by `eventId`, no automatic deletion
Validation commands: `npm test -- --runInBand`, `npm run build`, `git diff --check`
Result: pass-with-documented-risk; deploy and migration execution remain blocked pending owner approval.
