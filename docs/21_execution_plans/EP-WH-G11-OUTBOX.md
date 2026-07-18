# EP-WH-G11-OUTBOX - Transactional Stock Event Outbox

Metadata:
- id: EP-WH-G11-OUTBOX
- status: implemented-no-deploy
- goal_id: WH-G11-OUTBOX
- task_ids: WH-G11-OUTBOX-T1
- created: 2026-06-13
- last_updated: 2026-06-13

## Upstream Traceability

- implementation-goals/GOAL-11-transactional-stock-event-outbox.md
- docs/11_tasks/WH-G11-OUTBOX-T1.md

## Plan

1. Add `StockEventOutbox` entity and committed TypeORM migration.
2. Persist stock event rows inside each stock mutation transaction after stock/movement persistence.
3. Replace mutation-time direct RabbitMQ publish with post-commit outbox replay.
4. Replay pending/failed due rows on startup, interval, and after mutations.
5. Expose outbox counts and replay counters in health/ready operations status.
6. Document schema, retry defaults, retention posture, and replay safety.
7. Validate with focused unit tests, full Jest run, build, and diff check.

## Parallel Execution

| Workstream | Status | Write Ownership | Validation Ownership | Notes |
| --- | --- | --- | --- | --- |
| WH-G11 outbox implementation | ready now | `src/stock`, migration, health visibility, WH-G11 outbox docs/tests | WH-G11 worker | Conflicts with other workers touching `src/stock/stock.service.ts` or `src/stock/stock-events.service.ts`. |
| Migration execution/deploy | blocked | production environment | orchestrator/owner | Requires explicit owner approval. |
| Retention cleanup | dependency-gated | outbox worker or ops worker | operator validation | Requires owner-approved retention window and cleanup strategy. |

## Rollback Plan

Before deployment, revert the outbox entity, migration, service wiring, docs, and tests. After migration execution, rollback requires dropping `stock_event_outbox` only if no operator needs retained event evidence.
