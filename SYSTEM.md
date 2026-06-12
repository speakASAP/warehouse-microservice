# System: warehouse-microservice

## Architecture

NestJS + PostgreSQL. Real-time stock events via RabbitMQ.

- Stock types: own warehouse + supplier dropship
- Reserve stock for pending orders
- Events: `stock.updated` published on all changes

## Integrations

| Dependency | URL |
|-----------|-----|
| database-server | db-server-postgres:5432 |
| logging-microservice | logging-microservice:3367 |
| RabbitMQ | rabbitmq:5672 (`stock.events` exchange) |

## Current State
<!-- AI-maintained -->
Stage: production
Health: ok - HTTP health is up and RabbitMQ is reachable from the warehouse pod.

## Known Issues
<!-- AI-maintained -->
- Production schema changes are currently applied operationally; there is no committed migration framework in this service yet.

## Recent Fixes
<!-- AI-maintained -->
- 2026-06-12: WH-G1 fixed Dockerfile package installation for `node:24-slim`.
- 2026-06-12: WH-G1 fixed deploy health check path and changed rollout image updates to use the unique build tag.
- 2026-06-12: WH-G1 added dependency-aware `/api/health` and `/api/ready` output for database and RabbitMQ.
- 2026-06-12: WH-G2 provisioned Kubernetes RabbitMQ as `service/rabbitmq` and `statefulset/rabbitmq`.
- 2026-06-12: WH-G2 changed warehouse `RABBITMQ_URL` to `amqp://guest:guest@rabbitmq:5672`.
- 2026-06-12: WH-G2 documented and validates stock event payloads before publishing.
- 2026-06-12: WH-G3 added validated stock mutation DTOs requiring `reasonCode` and `actor`.
- 2026-06-12: WH-G3 wraps stock writes and movement inserts in one database transaction.
- 2026-06-12: WH-G3 added unit coverage for missing reason, negative input, insufficient stock, and pessimistic write locking.
- 2026-06-12: WH-G3 deployed image `localhost:5000/warehouse-microservice:0350b8e`; production health reported database and RabbitMQ up.
- 2026-06-12: WH-G4 added transactional reservation lifecycle writes for reserve, release, fulfill, cancel, expire, and return.
- 2026-06-12: WH-G5 added trusted catalog ingestion documentation and `POST /api/stock/availability/batch`.
- 2026-06-12: WH-G6 added supplier dropship reconciliation at `POST /api/supplier-reconciliations`.
- 2026-06-12: WH-G6 deployed image `localhost:5000/warehouse-microservice:wh-g6-supplier-reconciliation-20260612`; production health reported database and RabbitMQ up.
