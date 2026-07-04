# Tasks: warehouse-microservice

> Coordinator-maintained. Tasks must stay aligned with `docs/orchestrator/warehouse-intent-plan.md`, `docs/IMPLEMENTATION_STATE.md`, and `implementation-goals/`.
> Owner approval to organize work using the GoalKeeper orchestrator model was given on 2026-06-12.

## Backlog

- [x] WH-G3-T1 Require validated stock mutation DTOs/contracts with reason code and actor (goal_id: WH-G3, priority: 1)
- [x] WH-G3-T2 Wrap stock write plus movement record in one transaction (goal_id: WH-G3, priority: 1)
- [x] WH-G4-T1 Implement reservation row lifecycle for reserve, release, fulfill, cancel, expire, and return (goal_id: WH-G4, priority: 1)
- [x] WH-G5-T1 Define catalog product identity validation or trusted ingestion path for stock rows (goal_id: WH-G5, priority: 2)
- [x] WH-G5-T2 Add batch availability contract for storefront and channel consumers (goal_id: WH-G5, priority: 2)
- [x] WH-G6-T1 Audit stock levels vs supplier data (goal_id: WH-G6, priority: 2)
- [x] WH-G7-T1 Add operator runbook for deploy, rollback, auth-token testing, and event verification (goal_id: WH-G7, priority: 2)
- [x] WH-G8-T1 Add committed TypeORM migration workflow and baseline schema migration (goal_id: WH-G8, priority: 1)
- [x] WH-G9-T1 Deploy production warehouse admin console for operators (goal_id: WH-G9, priority: 2)
- [x] WH-G10-T1 Public landing page and Auth-backed warehouse admin login/register gate (goal_id: WH-G10, priority: 2)

## Completed
<!-- AI appends here. Never modifies previous entries. -->
- [x] 2026-07-04 WH-G24-DETERMINISTIC-CLEANUP-PACKET-T1 Defined deterministic Warehouse component-line cleanup packet for reserved-only, fulfilled, cancel, return, partial failure, and timeout states; max quantity, live hold/release window, target stock rows, and final runtime approval remain missing; no live stock, reservation, fulfillment, release, cancel, return, expire, provider, Orders, Payments, deploy, migration, or secret mutation performed.
- [x] 2026-07-04 WH-G24-RESERVED-TIMEOUT-CLEANUP-NARROWING-T1 Narrowed Warehouse cleanup approval for reserved-only, fulfilled/stock-decremented, return, partial component failure, and timeout component-line states; max quantity and live hold/release window remain missing; no live stock, reservation, fulfillment, release, cancel, return, expire, provider, Orders, Payments, deploy, migration, or secret mutation performed.
- [x] 2026-07-03 WH-G24-BUNDLE-COMPONENT-ROLLBACK-EVIDENCE-T1 Hardened Warehouse component-line stock rollback evidence docs/verifier for catalog.bundle.v1 hold/release/fulfill/cancel/return mapping; no live checkout, stock decrement, reservation/release mutation, deploy, migration, provider flow, secret read, or production DB mutation performed.
- [x] 2026-07-03 WH-G24-PAID-PROVIDER-ROLLBACK-READINESS-T1 Hardened Warehouse paid/provider bundle rollback readiness docs/verifier; no live stock, reservation, fulfillment, release, provider, Orders, Payments, deploy, migration, or secret mutation performed.
- [x] 2026-07-03 WH-G24-BUNDLE-COMPONENT-RESERVATION-T1 Added source-verified Warehouse sign-off that Catalog bundle selling reserves component lines only; no deploy, migration, live stock mutation, or external service call performed.
- [x] 2026-07-03 WH-SHIPMENT-CORRELATION-ENDPOINT-SOURCE-T1 Added source-only correlation registration endpoint for existing fulfillment orders; no deploy, migration run, status mutation, live call, or raw provider payload persistence performed.
- [x] 2026-07-03 WH-SHIPMENT-CORRELATION-SOURCE-T1 Added source-only provider shipment correlation registry/resolver and adapter resolver wiring; no deploy, migration run, status mutation, live call, or raw provider payload persistence performed.
- [x] 2026-07-03 WH-ALLEGRO-SNAPSHOT-ADAPTER-SOURCE-T1 Added source-only sanitized Allegro shipment snapshot adapter mapper and focused tests; no correlation resolver, status mutation, deploy, live call, or provider payload persistence performed.
- [x] 2026-07-03 WH-PROVIDER-LEDGER-SOURCE-T1 Added source-only provider-status observation ledger entity, service, migration, and focused tests; no provider adapter, deploy, live call, or fulfillment mutation performed.
- [x] 2026-07-03 WH-PROVIDER-LEDGER-POLICY-T1 Defined Warehouse-owned provider-status ledger and timestamp/replay policy; validation passed with `git diff --check` and `npm run check:hosted-auth`. No runtime adapter, migration, deploy, live provider call, or fulfillment mutation performed.
- [x] 2026-07-03 WH-ALLEGRO-CHECKOUT-MAPPING-T1 Added provisional Allegro checkout-form fulfillment status mapping contract; validation passed with `git diff --check` and `npm run check:hosted-auth`. No runtime adapter, migration, deploy, or stock/order mutation performed.
- [x] 2026-07-02 WH-G16-T1 Added paid fulfillment handoff/pick-ticket contract; validation passed with `npm test -- --runInBand` (10 suites / 69 tests), `npm run build`, and `git diff --check`. No deployment or push performed.
- [x] 2026-06-13 WH-G14-T1 Added product logistics route read model; validation passed with npm test, npm run build, and git diff --check.
- [x] 2026-06-13 WH-G13-T1 Added admin inventory topology visibility; validation passed with node --check, npm run build, and git diff --check.
- [x] 2026-06-13 WH-G12-T1 Added Warehouse inventory topology read model; validation passed with npm test, npm run build, and git diff --check.
- [x] 2026-06-13 WH-G11-T1 Added Warehouse origin metadata to batch availability rows; validation passed with npm test, npm run build, and git diff --check.
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
- [x] 2026-06-12 WH-G3 deployed image `localhost:5000/warehouse-microservice:0350b8e`; rollout and production health check passed.
- [x] 2026-06-12 WH-G6-T1 Added supplier dropship reconciliation endpoint, idempotent reconciliation evidence, applied movement records, and conflict detection for supplier stock below reserved stock.
- [x] 2026-06-12 WH-G6 verification passed: tests, build, production schema creation, rollout image `localhost:5000/warehouse-microservice:wh-g6-supplier-reconciliation-20260612`, health, auth boundary, and route smoke checks.
- [x] 2026-06-12 WH-G4-T1 Added reservation lifecycle writes for reserve, release, fulfill, cancel, expire, and return with stock, reservation, and movement changes kept transactional.
- [x] 2026-06-12 WH-G4 verification passed: `npm test -- --runInBand`, `npm test -- --runInBand test/stock.service.spec.ts`, and `npm run build`.
- [x] 2026-06-12 WH-G4 deployed image `localhost:5000/warehouse-microservice:6a8e166`; rollout and production health check passed.
- [x] 2026-06-12 WH-G4 fixed Docker production build hygiene by excluding stale `dist` from context and using `dist/src/main` as the runtime entrypoint.
- [x] 2026-06-12 WH-G5-T1 Documented trusted catalog product identity ingestion and compensating reconciliation checks in `docs/contracts/availability-contracts.md`.
- [x] 2026-06-12 WH-G5-T2 Added `POST /api/stock/availability/batch` for storefront/channel batch availability reads.
- [x] 2026-06-12 WH-G5 verification passed: focused stock service tests, full `npm test -- --runInBand`, `npm run build`, rollout, production health, authenticated batch endpoint smoke, and catalog/FlipFlop product availability smoke.
- [x] 2026-06-12 WH-G7-T1 Added operational mutation metrics in health/readiness, stock event publish counters, structured `stock_mutation` and `stock_event_publish` logs, and `docs/runbooks/operations.md`.
- [x] 2026-06-12 WH-G7 verification passed: `npm test -- --runInBand`, `npm run build`, rollout image `localhost:5000/warehouse-microservice:wh-g7-ops-20260612`, production health with `operations`, unauthenticated `401`, authenticated dry failure, and log/health mutation failure evidence.
- [x] 2026-06-12 WH-G8-T1 Added shared TypeORM data source, migration npm scripts, Kubernetes migration Job template, and deploy-time migration execution.
- [x] 2026-06-12 WH-G8 verification passed: `npm test -- --runInBand`, `npm run build`, migration Job executed `InitialWarehouseSchema1781200000000`, rollout image `localhost:5000/warehouse-microservice:wh-g8-migrations-20260612`, production `/api/health`, and running pod `migration:show:prod` reported `[X] 1 InitialWarehouseSchema1781200000000`.
- [x] 2026-06-12 WH-G9-T1 Added production admin console supplier reconciliation workflow, RabbitMQ/event-bus status, operation counters, and dependency/operations overview panels.
- [x] 2026-06-12 WH-G9 verification passed: `node --check public/admin/app.js`, `npm test -- --runInBand`, `npm run build`, rollout image `localhost:5000/warehouse-microservice:wh-g9-admin-console-20260612`, production `/api/health`, `/admin` HTTP 200, unauthenticated supplier reconciliation API `401`, and browser smoke checks with no console warnings.
- [x] 2026-06-12 WH-IPS-T1 Added Intent Preservation System overlay with traceability, pre-coding gate, WH-G3 retrospective task docs, execution plan, context package, coding prompt, and validation report.
- [x] 2026-06-12 WH-ORCH-T1 Adopted GoalKeeper-style orchestration on the remote Warehouse repo: master orchestrator, implementation state, process gates, goal briefs, templates, and next-goal helper while preserving WH-G1 through WH-G9 completion state.

- [x] 2026-06-13 WH-G10-T1 Added public landing page, generated warehouse hero asset, Auth-backed login/register gate, and warehouse-admin role gate before showing `/admin`; validation passed without production deployment.

- [x] 2026-06-14 WH-G10-CATALOG-T1 Collected catalog identity validation worker output; combined validation passed with full Jest, build, and diff check.
- [x] 2026-06-14 WH-G11-OUTBOX-T1 Collected transactional stock event outbox worker output; combined validation passed with full Jest, build, and diff check.
- [x] 2026-06-14 WH-G12-T1 Collected automatic reservation expiry worker output; combined validation passed with full Jest, build, and diff check.
- [x] 2026-06-14 WH-G13-CONFLICTS-T1 Added missing IPS artifacts for supplier conflict operations and validated combined source with full Jest, build, and diff check.
- [x] 2026-06-14 WH-G14-AUTH-T1 Collected authenticated actor enforcement worker output; combined validation passed with full Jest, build, and diff check.

- [x] 2026-06-15 WH-G10+ integrated wave deployed from commit fab5bee; production health, readiness, admin, and manual reservation-expiry CronJob smoke passed.

- [x] 2026-06-15 WH-G12-CRON-MONITOR Natural reservation-expiry CronJob monitoring passed for three scheduled jobs; each completed with `success:true`, `expired=0`, and `failed=0`.

## Project Completion Marker

- 2026-06-21: Project marked completed/frozen after remote inventory. There are no active goals, active plans, open tasks, blockers, or pending human/AI actions. Do not ask for a new goal during routine status checks unless the owner explicitly creates one.

- 2026-07-04 Goal 24 Warehouse target facts reconcile: [RESOLVED/NARROWED: candidate target component stock rows and max component quantity are source-documented from Catalog packet]; [MISSING: renewed owner-approved execution window and Warehouse hold/release duration]; [MISSING: final owner approval before any live Warehouse reservation/cleanup mutation].
