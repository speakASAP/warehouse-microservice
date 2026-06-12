# Tasks: warehouse-microservice

> Coordinator-maintained. Tasks must stay aligned with `docs/orchestrator/warehouse-intent-plan.md`.
> `GOALS.md`, `SPEC.md`, and `PLAN.md` are absent and should be created only after owner approval.

## Backlog

- [x] WH-G3-T1 Require validated stock mutation DTOs/contracts with reason code and actor (goal_id: WH-G3, priority: 1)
- [x] WH-G3-T2 Wrap stock write plus movement record in one transaction (goal_id: WH-G3, priority: 1)
- [ ] WH-G4-T1 Implement reservation row lifecycle for reserve, release, fulfill, cancel, expire, and return (goal_id: WH-G4, priority: 1)
- [ ] WH-G5-T1 Define catalog product identity validation or trusted ingestion path for stock rows (goal_id: WH-G5, priority: 2)
- [ ] WH-G5-T2 Add batch availability contract for storefront and channel consumers (goal_id: WH-G5, priority: 2)
- [ ] WH-G6-T1 Audit stock levels vs supplier data (goal_id: WH-G6, priority: 2)
- [ ] WH-G7-T1 Add operator runbook for deploy, rollback, auth-token testing, and event verification (goal_id: WH-G7, priority: 2)

## Completed
<!-- AI appends here. Never modifies previous entries. -->
- [x] 2026-04-05 Documentation standard applied
- [x] 2026-06-12 WH-DOC-T1 Created `docs/orchestrator/warehouse-intent-plan.md` to preserve warehouse intent, ecosystem ownership boundaries, goal sequence, and evidence log.
- [x] 2026-06-12 WH-G1-T1 Fixed deploy health path to `http://localhost:3201/api/health` and verified deploy health check during rollout.
- [x] 2026-06-12 WH-G1-T2 Fixed Dockerfile package-manager mismatch by using Debian `apt-get` in `node:24-slim`; verified Docker image build.
- [x] 2026-06-12 WH-G1-T3 Split health/readiness evidence: `/api/health` reports DB/RabbitMQ dependencies and `/api/ready` reports `not_ready` while RabbitMQ is unreachable.
- [x] 2026-06-12 WH-G2-T1 Restored RabbitMQ broker reachability as Kubernetes `service/rabbitmq` + `statefulset/rabbitmq`; warehouse connects to `amqp://guest:guest@rabbitmq:5672`.
- [x] 2026-06-12 WH-G2-T2 Documented stock events in `docs/events/stock-events.md` and added runtime validation before publishing `stock.updated`, `stock.low`, and `stock.out`.
- [x] 2026-06-12 WH-G3-T1 Added stock mutation DTOs for set, increment, decrement, reserve, and unreserve; each requires `reasonCode` and `actor`.
- [x] 2026-06-12 WH-G3-T2 Wrapped stock row writes and stock movement inserts in TypeORM transactions with write locks on existing stock rows.
- [x] 2026-06-12 WH-G3 verification passed: `npm test` and `npm run build`.
- [x] 2026-06-12 WH-G3 deployed image `localhost:5000/warehouse-microservice:773c216`; rollout and production health check passed.
