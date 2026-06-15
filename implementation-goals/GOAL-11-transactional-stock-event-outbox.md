# GOAL-11 - Transactional Stock Event Outbox

Metadata:
- id: WH-G11-OUTBOX
- status: implemented-no-deploy
- owner: warehouse-owner
- created: 2026-06-13
- last_updated: 2026-06-13
- completeness_level: implementation-ready
- source_delegation: WH-G11 Transactional Stock Event Outbox

## Objective

Persist stock event intents in the same database transaction as stock movement, then retry/replay RabbitMQ publishes with operational visibility.

## Goal Impact

Warehouse remains stock and availability authority while making event publication recoverable. Stock state and movement evidence can no longer commit without also recording the intended stock events.

## Invariants

- Warehouse owns stock quantities, reservations, movements, and stock events.
- Stock movement history remains append-only evidence.
- Broken RabbitMQ publishing remains observable and does not hide committed stock event intent.
- Production deployment and migration execution require explicit owner approval.

## Acceptance Criteria

- Stock mutation transactions create durable outbox rows for `stock.updated` and threshold events.
- Outbox rows include a stable event ID for at-least-once replay deduplication.
- RabbitMQ publishes replay due pending/failed rows on startup, periodic timer, and after mutations.
- Health/ready operational status exposes outbox counts and replay counters.
- Migration is committed but not executed by this worker.
- Tests and build pass before handoff.

## Non-Goals

- No production deployment.
- No production stock mutation smoke test.
- No automatic retention purge until owner approves the retention window and cleanup mechanism.
