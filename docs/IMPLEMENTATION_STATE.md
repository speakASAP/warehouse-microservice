2026-07-03: Implemented the source-only Warehouse provider-status observation ledger foundation. Added `FulfillmentProviderStatusObservation`, `FulfillmentProviderStatusLedgerService`, TypeORM migration `1781600000000-CreateFulfillmentProviderStatusObservations`, module/data-source wiring, and focused tests for sanitized accepted observations, exact replay dedupe, same-key content conflict, raw tracking/provider/customer metadata rejection, future timestamp rejection, and stale source update rejection. No provider adapter, Warehouse status mutation, Orders callback, deploy, live provider call, secret read, raw provider payload, tracking value, customer field, or production fulfillment-row mutation was performed. Validation: `npm test -- --runInBand test/fulfillment-provider-status-ledger.service.spec.ts test/fulfillment-orders.service.spec.ts`, `npm run build`, and `git diff --check`. Remaining gates: `[MISSING: approved provider adapter source]`, `[MISSING: approved correlation source between Allegro hashed order/shipment/waybill identity and exactly one Warehouse fulfillment order]`, `[MISSING: approved retention/retry/dead-letter policy]`, `[MISSING: product-approved tracking visibility matrix]`, and `[MISSING: owner approval for deploy/runtime adapter]`.

2026-07-03: Defined the Warehouse-owned provider-status observation ledger and timestamp/replay policy in `docs/contracts/fulfillment-provider-status-ledger-policy.md`. The docs-only contract decides ledger ownership, minimal sanitized persistence shape, idempotency/replay/conflict behavior, and provisional timestamp ordering for checkout-form and shipment snapshot sources. No runtime adapter, `src/**`, DB migration, deploy, live provider call, secret read, raw provider payload, tracking value, customer field, or production fulfillment-row mutation was performed. Remaining gates: `[MISSING: approved ledger migration/schema implementation]`, `[MISSING: approved future clock-skew window]`, `[MISSING: approved stale-event age]`, `[MISSING: approved retention/retry/dead-letter policy]`, and `[MISSING: owner approval for runtime adapter/deploy]`.

2026-07-03: Integrated Orders source-reference preservation evidence from Orders commit `3c9526b`. Orders verifier proves synthetic Allegro Warehouse handoff payloads preserve central `orderId`, `channel=allegro`, external checkout reference as `orderNumber/reference`, and line-level `orderItemId`, `reservationId`, `productId`, `warehouseId`, and quantity, while rejecting raw provider/tracking/customer leakage markers. No Warehouse runtime adapter, DB migration, deploy, live provider call, stock/order mutation, raw provider payload, tracking value, or customer field was used. Remaining gates: `[MISSING: live Allegro-origin fulfilled-reservation smoke]`, `[MISSING: durable Warehouse adapter ledger]`, `[MISSING: timestamp/replay policy]`, and `[MISSING: owner approval for runtime adapter/deploy]`.

2026-07-03: Integrated sanitized Allegro checkout-form fulfillment enum fixtures from Allegro commit `fc94b5d`. Runtime aggregate evidence covers 117 local projected checkout-form rows with `READY_FOR_PROCESSING=103`, `CANCELLED=14`, `PAID=112`, `[NULL]=5`, fulfillment `PICKED_UP=61`, `SENT=32`, `CANCELLED=22`, `RETURNED=2`, `trackingNumberPresent=0`, `rawShipmentFieldsPresent=0`, and `ordersWithForwardedCentralId=0`. No Warehouse runtime adapter, DB migration, deploy, live provider call, stock/order mutation, raw provider payload, tracking value, or customer field was used. Remaining gates: `[MISSING: Orders source-reference preservation evidence]`, `[MISSING: durable Warehouse adapter ledger]`, `[MISSING: timestamp/replay policy]`, and `[MISSING: owner approval for runtime adapter/deploy]`.

2026-07-03: Added Warehouse provisional Allegro checkout-form fulfillment status mapping contract. The docs-only contract distinguishes paid/order readiness from Warehouse fulfillment transitions, keeps seller `SENT` separate from carrier `in_delivery`, rejects raw tracking/provider/customer fields and One Fulfillment stock/status as Warehouse write sources, and records required join/idempotency gates before runtime adapter work. No `src/**`, migration, secret, live provider call, stock/order mutation, deployment, Allegro edit, or Orders edit was performed. Validation: `git diff --check`; `npm run check:hosted-auth`. Remaining gates: `[MISSING: sanitized checkout-form fulfillment.status fixture set]`, `[MISSING: approved Orders source-reference preservation evidence]`, `[MISSING: durable Warehouse adapter ledger]`, `[MISSING: timestamp/replay policy]`, and `[MISSING: owner approval for runtime adapter/deploy]`.

2026-07-03: Worker H updated the Warehouse-owned Allegro shipment snapshot consumer contract for `allegro.shipment_status_snapshot.v1` from Allegro commit `e626e5c`. The docs now define accepted hashed snapshot fields, post-`handed_to_delivery` status mapping, idempotency/ledger expectations, redaction policy, rejection rules, and the role of the existing Orders lifecycle callback. No runtime code, DB migration, secret, deploy, live call, Allegro edit, or Orders edit was performed. Validation passed: `git diff --check`; `npm run check:hosted-auth` passed as the only discovered safe static checker, though it is not shipment-specific. Remaining gates: `[MISSING: Warehouse consumer/runtime adapter for read-only shipment snapshots]`, `[MISSING: approved Warehouse shipment snapshot ledger or adapter-owned durable idempotency store]`, `[MISSING: approved correlation source between Allegro hashed order/shipment/waybill identity and exactly one Warehouse fulfillment order]`, and `[MISSING: Orders lifecycle callback verification after Warehouse consumer implementation, proving no Allegro snapshot hashes/raw fields enter Orders events]`.

2026-07-03: Worker F defined the documentation-only Warehouse bounded intake contract for Allegro-origin provider shipment status updates after `handed_to_delivery`. Added `docs/contracts/fulfillment-provider-status-intake-contract.md` and linked it from `docs/contracts/fulfillment-handoff-contract.md`. The contract preserves the IPS chain, accepts only bounded post-handoff statuses (`in_delivery`, `delivered`, `not_delivered`, `returned`), defines `statusReference` idempotency semantics, rejects raw tracking/provider/customer/credential fields, and records blockers waiting on Worker E. No Orders/Allegro source, DB migration, secret, deployment, raw provider payload, or Warehouse DTO/service change was made. Validation: `git diff --check` passed and `npm test -- --runInBand test/fulfillment-orders.service.spec.ts` passed (1 suite / 8 tests).

2026-07-03: Fulfillment delivery status source deployed and live-smoked. Warehouse image `localhost:5000/warehouse-microservice:65e53c6` rolled out healthy after migrations; runtime config has `ORDERS_SERVICE_URL=http://orders-microservice.statex-apps.svc.cluster.local:3203` and a service token present. Smoke order `94ce9a4b-7c6a-4625-85c7-8d1b13228b2d` / fulfillment order `6ada14af-20f8-4928-9a37-94a331d97be2` advanced from `requested` to `collecting`; Orders persisted `warehouseStatus=collecting`, logged `resultingStatus=warehouse_collecting`, and Notifications Orders-events health showed `received=2`, `sent=2`, `failed=0`. Provider-specific courier tracking remains gated on `[MISSING: approved delivery provider contract]`.

# Warehouse Implementation State

2026-07-02: WH-G16 pre-deploy migration readiness was hardened. `npm run build`
now performs a full non-incremental TypeScript emit so the production TypeORM data
source includes entity files required by migration jobs; prior incremental host
build output could omit `dist/src/warehouses/warehouse.entity.js` and make
`migration:show:prod` fail before DB access. Validation passed: `npm run build`,
`node -e "require('./dist/src/database/typeorm-data-source.js')"`,
`npm test -- --runInBand test/fulfillment-orders.service.spec.ts`, and
`git diff --check`. Live read-only DB checks showed `warehouse_migrations`
contains the first three migrations and `fulfillment_orders` /
`fulfillment_order_lines` are not present, so `CreateFulfillmentOrders1781500000000`
remains pending. No deployment, migration execution, live stock/order mutation,
secret value print, or production row dump was performed.

2026-07-02: WH-G16 paid fulfillment handoff is implemented and source-validated
without deployment or push. Discovery confirmed `POST /api/reservations/fulfill`
only finalizes stock/reservation/movement state and does not persist delivery
address, shipping method, SKU/title snapshots, order item ids, or customer
contact fields. Added `POST /api/fulfillment-orders`, read-by-order, cancel,
and return handoff endpoints plus fulfillment order/line entities and migration.
The contract requires fulfilled reservation ids, central Orders id, line item
snapshots, delivery address, shipping method, and bounded contact fields.
Validation passed: `npm test -- --runInBand` (10 suites / 69 tests),
`npm run build`, and `git diff --check`. No production stock payload, live DB
row, deployment, push, public landing edit, or Orders repo edit was performed.

2026-07-01: Prepared Cliplot machine-auth receiver support for Warehouse
without Auth DB mutation. `JwtRolesGuard` accepts only
`CLIPLOT_WAREHOUSE_SERVICE_TOKEN` as a `cliplot` machine actor with
`internal:warehouse-microservice:admin`; mismatched tokens still fall through
to Auth `/auth/validate` and fail closed. The token is projected from
`secret/prod/cliplot#WAREHOUSE_SERVICE_TOKEN` through
`warehouse-microservice-secret`. Validation must not mutate stock; use
read-only `POST /api/stock/availability/batch` smoke only.

Last updated: 2026-07-02.

## Orchestrator Command

```text
2026-06-15: Integrated WH-G10+ wave deployed from commit fab5bee as image localhost:5000/warehouse-microservice:fab5bee. Deploy evidence passed: migrations, rollout, in-pod /api/health, production /api/health, production /api/ready, /admin HTTP 200, and manual reservation-expiry CronJob completed with expired=0 failed=0.
2026-06-15: Deployed integrated WH-G10+ wave from commit fab5bee with image localhost:5000/warehouse-microservice:fab5bee. Pre-deploy validation passed: git diff --check, npm test -- --runInBand (8 suites / 50 tests), and npm run build. Deploy passed: migrations, rollout, in-pod health, production health, production readiness, admin HTTP 200, and manual reservation-expiry CronJob smoke with expired=0 failed=0.
WAREHOUSE ORCHESTRATOR: define next goal
```

To define the next owner-approved goal:

```text
WAREHOUSE ORCHESTRATOR: define next goal
```

## Current Status

- Active goal: none
- Current wave: Wave 12 - WH-G16 source-only fulfillment handoff completed; pre-deploy migration readiness hardened; no deploy
- Completed goals: WH-G1 Deployment And Truthful Health, WH-G2 RabbitMQ Stock Events, WH-G3 Stock Mutation Invariants, WH-G4 Reservation Lifecycle, WH-G5 Catalog And Availability Contracts, WH-G6 Supplier Reconciliation, WH-G7 Production Observability, WH-G8 Database Migration Discipline, WH-G9 Production Admin Console, WH-G10 Landing Page And Authenticated Admin Entry, WH-G11 Stock Origin Visibility, WH-G12 Inventory Topology Read Model, WH-G13 Admin Inventory Topology Visibility, WH-G14 Product Logistics Route Read Model, WH-G15 Batch Product Logistics Contract, WH-G16 Paid Fulfillment Handoff
- Running goals: none
- Blocked goals: none
- Worker threads: none
- Intent source: `docs/orchestrator/warehouse-intent-plan.md`
- Agent entrypoint: `AGENTS.md`
- Process gates: `docs/process/OPERATIONAL_GATES.md`
- IPS gate: `docs/intent-preservation/PRE_CODING_GATE.md`
- IPS traceability: `docs/intent-preservation/TRACEABILITY_MATRIX.md`
- Project invariants: `docs/governance/PROJECT_INVARIANTS.md`
- Remote repository: `/home/ssf/Documents/Github/warehouse-microservice`
- Production URL: `https://warehouse.alfares.cz/api/health`
- Production stage: deployed, RabbitMQ ready, landing page available at https://warehouse.alfares.cz/, admin auth gate available at https://warehouse.alfares.cz/admin

## Goal Roadmap

| Goal | File | Status | Depends On | Primary Outcome |
| --- | --- | --- | --- | --- |
| WH-G1 | `implementation-goals/GOAL-01-deployment-health.md` | done | none | Rebuild/deploy path and health/readiness are truthful. |
| WH-G2 | `implementation-goals/GOAL-02-rabbitmq-stock-events.md` | done | WH-G1 | RabbitMQ is reachable and event payloads are documented/validated. |
| WH-G3 | `implementation-goals/GOAL-03-stock-mutation-invariants.md` | done | WH-G2 | Stock writes require DTOs, reason codes, actors, transactions, and non-negative invariants. |
| WH-G4 | `implementation-goals/GOAL-04-reservation-lifecycle.md` | done | WH-G3 | Reservation rows become first-class checkout/payment lifecycle records. |
| WH-G5 | `implementation-goals/GOAL-05-catalog-availability-contracts.md` | done | WH-G3 | Catalog identity and batch availability contracts are explicit. |
| WH-G6 | `implementation-goals/GOAL-06-supplier-reconciliation.md` | done | WH-G5 | Supplier dropship stock enters through idempotent reconciliation. |
| WH-G7 | `implementation-goals/GOAL-07-production-observability.md` | done | WH-G4, WH-G6 | Operators can verify deploy, rollback, auth, events, and mutation evidence. |
| WH-G8 | `implementation-goals/GOAL-08-database-migration-discipline.md` | done | WH-G7 | Schema changes are committed as repeatable TypeORM migrations and run during deploy. |
| WH-G9 | `implementation-goals/GOAL-09-production-admin-console.md` | done | WH-G8 | Production admin console exposes operator workflows and operations status. |
| WH-G10 | `implementation-goals/GOAL-10-landing-auth-admin-gate.md` | done | WH-G9 | Public landing page and Auth-backed admin login/register gate for warehouse admins. |
| WH-G11 | `implementation-goals/GOAL-11-stock-origin-visibility.md` | done | WH-G6, WH-G10 | Availability rows expose Warehouse-owned stock origin metadata. |
| WH-G12 | `implementation-goals/GOAL-12-inventory-topology-read-model.md` | done | WH-G11 | Operators can read local and supplier-managed warehouse topology with stock totals. |
| WH-G13 | `implementation-goals/GOAL-13-admin-inventory-topology.md` | done | WH-G12 | Admin console displays topology totals and origin rows for operators. |
| WH-G14 | `implementation-goals/GOAL-14-product-logistics-route-read-model.md` | done | WH-G12 | Warehouse explains product logistics route options by stock origin. |
| WH-G15 | `implementation-goals/GOAL-15-batch-logistics-contract.md` | done | WH-G14 | Catalog can consume Warehouse-owned logistics routes in one batch call. |
| WH-G16 | `implementation-goals/GOAL-16-fulfillment-handoff.md` | source validated, pre-deploy hardened, not deployed | WH-G4 | Orders can send a paid-order pick/pack/dispatch handoff after reservation fulfillment. |

## Execution Waves

| Wave | Goals | Mode | Gate Before Next Wave |
| --- | --- | --- | --- |
| 1 | WH-G1 | sequential | image builds, deploy health path works, DB/RabbitMQ readiness separated |
| 2 | WH-G2 | sequential | broker reachable, stock exchange exists, event payloads documented |
| 3 | WH-G3 | sequential | transaction and invariant tests pass |
| 4 | WH-G4 + WH-G5 | mostly sequential; contracts can be explored in parallel | checkout reservation semantics and availability contracts validated |
| 5 | WH-G6 | sequential | supplier reconciliation evidence and conflict handling validated |
| 6 | WH-G7 | sequential | production runbook and smoke checks complete |
| 7 | WH-G8 | sequential | migrations are committed, deployable, and status-checkable |
| 8 | WH-G9 | sequential | admin console and browser smoke checks complete |
| 12 | WH-G16 | source-only worker | Orders client integration and owner-approved deploy are separate follow-ups |

## Worker Threads

None.

When worker sessions are launched, record compressed summaries here:

```text
Worker:
Goal:
Branch/worktree:
Write ownership:
Status:
Summary:
Validation:
Risks:
Changed files:
```

## Validation Evidence Log

Append newest entries at the top.

```text
2026-07-02: WH-G16 pre-deploy readiness hardened. Full non-incremental build now emits TypeORM entity files required by production migration commands; data-source require check passed; focused fulfillment-orders spec passed; live read-only DB checks confirmed the fulfillment tables are absent and migration remains pending. No deploy or migration run.
2026-07-02: WH-G16 completed in source. Added fulfillment order/pick-ticket contract at `POST /api/fulfillment-orders`, read-by-order, cancel, and return handoff endpoints; added `fulfillment_orders` and `fulfillment_order_lines` migration; documented exact Orders handoff contract. Verification passed: `npm test -- --runInBand` (10 suites / 69 tests), `npm run build`, and `git diff --check`. No deployment or push performed.
2026-06-15: Natural reservation-expiry CronJob monitoring passed. Scheduled jobs `warehouse-reservation-expiry-29691965`, `warehouse-reservation-expiry-29691970`, and `warehouse-reservation-expiry-29691975` completed successfully; each returned `success:true`, `examined=0`, `expired=0`, and `failed=0`. Final source validation also passed: `git diff --check`, `npm test -- --runInBand` (8 suites / 50 tests), and `npm run build`.
2026-06-13: WH-G15 completed in source. Added batch product logistics contract for Catalog/channel consumers. Verification passed: npm test -- --runInBand, npm run build, and git diff --check. No production deployment performed.
2026-06-13: WH-G14 completed in source. Added product logistics route read model for local fulfillment, supplier replenishment, and supplier dropship/direct routes. Verification passed: npm test -- --runInBand, npm run build, and git diff --check. No production deployment performed.
2026-06-13: WH-G13 completed in source. Added admin console inventory topology visibility with optional productId filtering. Verification passed: node --check public/admin/app.js, npm run build, and git diff --check. No production deployment performed.
2026-06-13: WH-G12 completed in source. Added GET /api/warehouses/topology read model with optional productId filtering, origin groups, stock totals, and supplier linkage visibility. Verification passed: npm test -- --runInBand, npm run build, and git diff --check. No production deployment performed.
2026-06-13: WH-G10 deployed successfully with image localhost:5000/warehouse-microservice:a99e270. Deploy phases passed: build, push, manifests, RabbitMQ wait, migration job with no pending migrations, rollout, and health check. Production smoke passed for root landing page, admin page, warehouse hero image, API health, and unauthenticated API warehouses returned 401. A repeated same-image deployment was accidentally triggered while recording evidence and also completed deploy phases successfully.
2026-06-13: WH-G10 completed in repo. Added public `/` landing page, generated warehouse hero asset, Auth-backed `/admin` login/register gate, and client-side warehouse-admin role gating before the admin workspace is shown. Verification passed: `node --check public/admin/app.js`, `node --check public/landing.js`, `npm run build`, `npm test -- --runInBand`, and Playwright fallback screenshots for desktop/mobile landing plus admin auth gate. No production deployment performed without owner approval.
2026-06-12: Intent Preservation System documentation overlay added. WH-G3 has retrospective IPS task docs, execution plan, context package, coding prompt, and validation report tied to existing completion evidence. Future owner-approved goals must complete the IPS pre-coding gate before source edits. Documentation-only change; no service validation required.
2026-06-12: Orchestrator structure adopted from GoalKeeper on the remote Warehouse repo. Added master orchestrator, implementation state, process gates, goal prompts, templates, and next-goal helper while preserving actual WH-G1 through WH-G9 completion state. Documentation-only change; no service validation required.
2026-06-12: WH-G9 completed. Production admin console deployed at https://warehouse.alfares.cz/admin with supplier reconciliation and operations status. Verification passed: node --check public/admin/app.js, npm test -- --runInBand, npm run build, production /api/health, /admin HTTP 200, unauthenticated supplier reconciliation API 401, and browser smoke checks with no console warnings.
2026-06-12: WH-G8 completed. Added shared TypeORM data source, migration scripts, Kubernetes migration Job template, deploy-time migration execution, and baseline schema migration. Verification passed: npm test -- --runInBand, npm run build, migration Job, production health, and migration status.
2026-06-12: WH-G2 completed. RabbitMQ provisioned in Kubernetes as service/rabbitmq and statefulset/rabbitmq. Warehouse connects to amqp://guest:guest@rabbitmq:5672. Production /api/health reports database: up, rabbitmq: up, lastError: null. /api/ready reports ready: true. stock.events exchange exists, type topic, durable true.
2026-06-12: WH-G1 completed. Dockerfile package installation fixed for node:24-slim, deploy health path corrected to /api/health, readiness reports RabbitMQ failure separately, and production health remains available.
```

## State Update Rules

At the end of every implementation session, update:

- goal status: `ready`, `active`, `blocked`, `done`, or `superseded`;
- current wave;
- worker summaries;
- validation evidence;
- blockers and owner questions;
- next recommended command.

Do not paste full worker logs. Compress each worker result into no more than:

- 20 lines of implementation summary;
- 10 lines of validation evidence;
- 10 lines of risks or follow-ups;
- changed file list.

## Required Session Report

Every implementation, merge, or validation session must finish with:

```text
Goal:
Changed files:
Intent Compliance Report:
Validation:
Blockers:
Next command:
```

## Open Decisions

- Future goals after WH-G9 require owner approval and should be added to `implementation-goals/` before coding.
- Production deploys require explicit owner approval per session.

## Next Action

Warehouse WH-G16 is source-validated and not deployed. The next integration step is for Orders O1 to call `POST /api/fulfillment-orders` after existing reservation fulfillment, including fulfilled reservation ids and the dispatch payload. Warehouse deployment still requires explicit owner approval.

```text
ORDERS O1: wire paid payment transition to Warehouse `POST /api/fulfillment-orders`
```

Source documents:

```text
docs/orchestrator/warehouse-intent-plan.md
docs/IMPLEMENTATION_ORCHESTRATOR.md
docs/governance/PROJECT_INVARIANTS.md
docs/process/OPERATIONAL_GATES.md
docs/intent-preservation/README.md
docs/intent-preservation/TRACEABILITY_MATRIX.md
docs/intent-preservation/PRE_CODING_GATE.md
docs/contracts/fulfillment-handoff-contract.md
TASKS.md
STATE.json
```

2026-07-03: Fulfillment delivery status source implemented in source. Warehouse fulfillment orders now support ordered progress statuses and best-effort Orders sync through `PUT /api/orders/:id/warehouse-fulfillment-status`; validation passed with build, focused fulfillment-order tests, and diff hygiene. Runtime deploy/smoke pending.
