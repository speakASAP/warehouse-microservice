# Warehouse Microservice Intent Plan

Created: 2026-06-12

## Intent

Warehouse must be the stock and availability authority for goods sold across the Statex commerce ecosystem. It must support own warehouses and supplier dropship stock, protect stock mutations behind auth/RBAC, preserve a complete movement history, and publish stock events so channel services can react without creating their own inventory truth.

The preserved intent is:

- Warehouse owns stock quantities, reserved quantities, availability, warehouse locations, stock movements, reservations, and stock events.
- Catalog owns product identity, sellable product content, categories, attributes, media, pricing, channel eligibility, and publication readiness.
- Every warehouse stock row must reference a catalog product ID. The current schema stores this as `productId`; production-grade behavior must validate that identity through a trusted catalog contract or a documented internal ingestion path.
- FlipFlop and channel services read catalog product data and warehouse availability. They may cache stock for display, but warehouse remains the stock of record.
- Orders and checkout flows use warehouse for reservation and fulfillment transitions: add-to-cart checks availability, checkout creates soft reservations, payment confirmation converts reserved stock to real deduction, payment failure or timeout releases reservations, and returns/cancellations restore stock only after the required human/business approval.
- Auth owns login, JWT, RBAC, and service identity. Warehouse must not expose stock mutation, reservations, movement history, or warehouse mutation outside the approved auth boundary.
- AI or agents must never adjust stock without explicit owner-approved task context. Stock adjustments must include a reason code and actor.
- Negative stock is forbidden at the service and persistence boundary.
- Stock history is append-only business evidence. It must not be deleted or silently rewritten.

## Current Findings

Warehouse is deployed in Kubernetes as `warehouse-microservice` in namespace `statex-apps`, with one ready replica and public health at `https://warehouse.alfares.cz/api/health`.

The source repo is `/home/ssf/Documents/Github/warehouse-microservice`, branch `main`, commit `781855a`, with a clean working tree at the time of inspection.

The service is NestJS + PostgreSQL and exposes stock, warehouse, movement, reservation, health, and readiness routes under the `/api` prefix.

Global JWT/RBAC protection is present through `JwtRolesGuard`. Public routes are `/api/health` and `/api/ready`; protected routes require `global:superadmin` or `internal:warehouse-microservice:admin`.

The production stock API rejects unauthenticated reads with `401`, which confirms the restricted-service boundary is active.

The app build currently succeeds with `npm run build`.

RabbitMQ event publishing is not production-functional. Pod startup logs show `Failed to connect to RabbitMQ: getaddrinfo ENOTFOUND host.k3s.internal`, while Kubernetes has no visible RabbitMQ service or pod. This breaks the `stock.updated` event part of the immutable business intent.

The current health endpoint reports healthy even when RabbitMQ is unavailable, so service health does not currently prove warehouse can fulfill its event contract.

The deploy script health check calls `http://localhost:3201/health`, but the app serves health at `/api/health` because `main.ts` sets a global `/api` prefix. A fresh deploy is likely to fail its post-rollout health check.

The Dockerfile uses `FROM node:24-slim` and then runs `apk add --no-cache curl`. `node:*-slim` is Debian-based, so this should be changed before relying on image rebuilds.

Stock mutations are not wrapped in explicit database transactions. Stock save, movement creation, and event publishing can drift under failure or concurrency.

Reservation behavior is split: `StockService.reserveStock` updates `stock.reserved` and records a movement, but it does not create a `stock_reservations` row. `ReservationsService` can read reservations, but no reservation lifecycle write path is currently connected to checkout semantics.

Reason codes are optional in controller bodies and service methods, with default fallback strings. This does not satisfy the business rule that stock adjustments must be logged with a reason code.

Inbound request bodies use TypeScript structural types in controllers, not DTO classes or Zod contracts. The global `ValidationPipe` is configured, but it cannot enforce those plain inline body types.

There are no visible test files or contract tests in the warehouse repo.

## Ecosystem Relationships

| Service | Ownership | Warehouse relationship |
| --- | --- | --- |
| `catalog-microservice` | Product truth, pricing, media, channel readiness | Warehouse stock rows reference catalog product IDs. Catalog admin should be the single manual product entry point and should orchestrate initial stock creation. |
| `auth-microservice` | Login, JWT, RBAC, service identity | Warehouse verifies JWTs using the shared secret and role claims. Service-to-service callers need approved JWT/service identity. |
| `flipflop-service` | Storefront, cart, checkout UX, channel projection | Reads catalog products, checks warehouse availability, creates checkout reservations, releases or fulfills stock after payment outcomes. |
| `orders-microservice` | Central order state and fulfillment status | Order lifecycle should drive reservation fulfillment, stock deduction, cancellation, and return flows through warehouse. |
| `suppliers-microservice` | Supplier integrations/imports | Supplier dropship stock should be reconciled into warehouse through trusted import/update flows. |
| `allegro-service`, `aukro-service`, `bazos-service`, `heureka-service` | Sales/feed/channel services | Consume warehouse availability and/or stock events; they must not become stock authorities. |
| `logging-microservice` | Central logs | Warehouse is configured to depend on it and should emit useful operational logs for stock changes and failures. |
| RabbitMQ | Event transport | Warehouse must publish durable `stock.updated` events and related low/out-of-stock events. Current runtime connection is broken. |

## Missing Implementation

1. Production deploy reliability
   - Dockerfile package manager mismatch.
   - Deploy health path mismatch.
   - No deploy-time event-path validation.

2. RabbitMQ/event contract
   - No reachable RabbitMQ service in Kubernetes.
   - Event publisher only logs and continues when the channel is unavailable.
   - Health does not include event transport readiness.
   - Event schemas are not documented or validated.

3. Stock mutation correctness
   - No explicit transactions around stock, movement, reservation, and event side effects.
   - Negative stock is checked for decrement and reserve, but not consistently validated for set/increment inputs, reserved overflows, or persistence-level constraints.
   - Reason code and actor are optional.
   - No idempotency or reference protection for order/payment retries.

4. Reservation lifecycle
   - `stock_reservations` reads exist, but reserve/unreserve does not create/update reservation rows.
   - TTL expiry, fulfillment, cancellation, and return lifecycle are not implemented as first-class state transitions.
   - RAG-documented checkout semantics are not encoded in warehouse docs or tests.

5. Catalog identity and availability contract
   - `productId` is a string with no catalog validation.
   - No batch availability endpoint for storefront/channel consumers.
   - No documented trusted path for supplier/catalog/admin stock creation.

6. Auth and service identity contract
   - Warehouse verifies JWT locally, but service-to-service token issuance/rotation and role expectations are not documented in warehouse.
   - Consumer services need explicit contract examples for authorized stock reads/writes.

7. Contract validation and tests
   - Controllers lack DTO/Zod contracts for request and response shapes.
   - No contract test suite exists.
   - No smoke test proves catalog product ID plus warehouse availability reaches FlipFlop.

8. Intent preservation docs
   - Warehouse has `BUSINESS.md`, `SYSTEM.md`, `AGENTS.md`, `TASKS.md`, and `STATE.json`, but no warehouse-owned orchestrator intent plan before this file.
   - `GOALS.md`, `SPEC.md`, and `PLAN.md` are absent. Per the shared documentation standard, goals and specs are human-owned or human-approved; agents should not silently invent them as authoritative files.

## Goal Sequence For Future Sessions

### WH-G1 - Make deployment and health truthful

Objective: Make warehouse safe to rebuild and redeploy before changing domain behavior.

Acceptance criteria:

- Dockerfile builds from a valid base/package-manager combination.
- Deploy script checks `/api/health` or the app exposes the documented path consistently.
- Readiness/health reports database and RabbitMQ readiness separately enough to catch a broken event path.
- `npm run build` passes.
- Deployment completes and production `/api/health` remains healthy after rollout.

### WH-G2 - Restore RabbitMQ stock event publishing

Objective: Make `stock.updated` events reliable because channels depend on warehouse as the availability authority.

Acceptance criteria:

- RabbitMQ has a reachable Kubernetes service or warehouse is configured to a resolvable broker endpoint.
- `StockEventsService` connects in production without DNS errors.
- `stock.updated`, `stock.low`, and `stock.out` event payloads are documented and validated.
- Failed event publishing is observable and cannot silently masquerade as a fully healthy stock update.
- A smoke test proves a stock mutation publishes the expected event.

### WH-G3 - Enforce stock mutation invariants

Objective: Make stock changes auditable, authorized, non-negative, and concurrency-safe.

Acceptance criteria:

- Stock write requests require validated DTOs/contracts.
- `reasonCode` and actor/service identity are required for all adjustment, increment, decrement, reserve, unreserve, transfer, cancellation, and return flows.
- Negative `quantity`, `reserved`, and `available` states are rejected at service level and guarded at persistence level where practical.
- Stock update plus movement write happens in one transaction.
- Tests cover insufficient stock, negative input, missing reason, and concurrent update behavior.

### WH-G4 - Implement reservation lifecycle as stock authority

Objective: Align warehouse with cart, checkout, payment, cancellation, and return semantics.

Acceptance criteria:

- Reserve creates or updates a `stock_reservations` row with order ID, channel, status, quantity, and expiry.
- Unreserve, fulfill, cancel, expire, and return are explicit state transitions.
- Payment-confirmed flow supports the documented sequence: release hold then deduct stock, or an equivalent transactionally correct model.
- Idempotency protects repeated order/payment webhooks.
- Tests cover TTL expiry, payment failure release, payment success deduction, cancellation reversal, and return restock.

### WH-G5 - Define catalog and consumer availability contracts

Objective: Make product identity and stock availability consistent across catalog, warehouse, and storefront/channel consumers.

Acceptance criteria:

- Warehouse validates catalog product identity or documents a trusted ingestion path with compensating reconciliation checks.
- Batch availability endpoint exists for product lists.
- Contract examples show authorized service-to-service reads and writes.
- FlipFlop can obtain availability without N+1 unauthenticated calls.
- Smoke test proves at least one catalog product has warehouse stock and appears through FlipFlop with correct availability.

### WH-G6 - Supplier dropship reconciliation

Objective: Make warehouse the central point for own and supplier stock availability.

Acceptance criteria:

- Supplier stock updates enter warehouse through an idempotent reconciliation contract.
- Dropship warehouses/locations are modeled distinctly from own warehouses.
- Reconciliation records movement/reference evidence without deleting history.
- Conflicts between supplier stock and reserved/committed stock are detected and surfaced.

### WH-G7 - Production observability and operations

Objective: Make operators able to trust warehouse in production.

Acceptance criteria:

- Logs include actor, product ID, warehouse ID, reason code, reference/order ID, and event result for stock changes.
- Metrics or health checks expose database, RabbitMQ, and mutation failure status.
- Runbook documents deploy, rollback, smoke tests, auth token testing, and event verification.
- `STATE.json` and task records reflect current goal state after each approved implementation cycle.

## First Next Step

Implement WH-G1 first. Do not start with catalog integration, reservation redesign, or UI. The current deploy and Dockerfile issues can block any production-grade change from rolling out, and health currently does not prove the event path is available.

After WH-G1, implement WH-G2 because RabbitMQ failure directly violates the immutable business intent that warehouse publishes stock events.

## Future Session Protocol

Each future session should:

1. Re-read `BUSINESS.md`, `SYSTEM.md`, `AGENTS.md`, `TASKS.md`, `STATE.json`, and this file.
2. Query docs RAG before reading source, using the command in `CLAUDE.md` or `AGENTS.md`.
3. Re-run baseline checks before editing:
   - `npm run build` in `warehouse-microservice`
   - `curl -sk https://warehouse.alfares.cz/api/health`
   - `curl -sk -o /dev/null -w "%{http_code}\n" https://warehouse.alfares.cz/api/stock/test-product`
   - `kubectl -n statex-apps logs deploy/warehouse-microservice --tail=80`
   - `kubectl -n statex-apps get svc | grep -Ei "warehouse|rabbit|catalog|auth|logging"`
4. Work on the earliest unfinished goal unless the owner explicitly chooses another goal.
5. Keep ownership boundaries intact:
   - Catalog owns product truth.
   - Warehouse owns stock truth.
   - Auth owns login, JWT, RBAC, and service identity.
   - Orders owns order state.
   - FlipFlop owns storefront and checkout UX.
   - Channel services own channel-specific compliance and publication behavior.
6. Do not edit `BUSINESS.md` or create authoritative `GOALS.md` entries without owner approval.
7. Update this file only by appending evidence/status notes or tightening acceptance criteria. Do not silently change the preserved intent.

## Evidence Log

- 2026-06-12: RAG query confirmed warehouse is the authoritative stock source, FlipFlop mirrors stock locally for display, cart add checks availability, checkout creates soft reservations, and payment/cancel/return flows must update warehouse.
- 2026-06-12: `npm run build` passed in `warehouse-microservice`.
- 2026-06-12: `https://warehouse.alfares.cz/api/health` returned healthy.
- 2026-06-12: unauthenticated `https://warehouse.alfares.cz/api/stock/test-product` returned `401`.
- 2026-06-12: pod logs showed RabbitMQ DNS failure for `host.k3s.internal`.
- 2026-06-12: Kubernetes service list showed warehouse, catalog, auth, logging, suppliers, orders, and FlipFlop services, but no RabbitMQ service.
- 2026-06-12: WH-G1 deployed image `localhost:5000/warehouse-microservice:wh-g1-health-20260612c`.
- 2026-06-12: WH-G1 fixed Dockerfile `node:24-slim` package installation by replacing `apk` with `apt-get`; Docker image build passed.
- 2026-06-12: WH-G1 fixed deploy script to check `http://localhost:3201/api/health`, use the unique build tag for rollout, select the newest running pod, and run `curl -fsS` inside the container.
- 2026-06-12: Production `/api/health` returned `status: healthy` with `database: up` and `rabbitmq: down`; production `/api/ready` returned `ready: false`, preserving the RabbitMQ failure as WH-G2 evidence.
- 2026-06-12: WH-G2 provisioned RabbitMQ in Kubernetes as `service/rabbitmq` and `statefulset/rabbitmq` in `statex-apps`; pod `rabbitmq-0` reached `1/1 Running`.
- 2026-06-12: WH-G2 changed warehouse `RABBITMQ_URL` to `amqp://guest:guest@rabbitmq:5672`; warehouse logs showed `Connected to RabbitMQ`.
- 2026-06-12: WH-G2 verified production `/api/health` returned `database: up`, `rabbitmq: up`, and `lastError: null`; `/api/ready` returned `ready: true`.
- 2026-06-12: WH-G2 verified RabbitMQ exchange `stock.events` exists with type `topic` and durable `true`.
- 2026-06-12: WH-G3 added DTO contracts for stock set, increment, decrement, reserve, and unreserve request bodies; mutation requests now require `reasonCode` and `actor`.
- 2026-06-12: WH-G3 changed stock mutation service methods to validate audit context and quantity invariants before writing.
- 2026-06-12: WH-G3 wraps stock row writes and stock movement inserts in a single TypeORM transaction, with pessimistic write locks for existing stock rows.
- 2026-06-12: WH-G3 added `test/stock.service.spec.ts`; `npm test` passed 4 tests covering missing reason, negative input, insufficient stock, and the lock/transaction write path.
- 2026-06-12: WH-G6 added supplier dropship reconciliation contract `POST /api/supplier-reconciliations`, persistent reconciliation evidence, idempotent supplier references, movement records for applied updates, and conflict records when supplier quantity falls below reserved stock.
- 2026-06-12: WH-G6 verification passed: `npm test -- --runInBand`, `npm run build`, production schema table/index creation for `supplier_stock_reconciliations`, deployment image `localhost:5000/warehouse-microservice:wh-g6-supplier-reconciliation-20260612`, production `/api/health`, unauthenticated reconciliation POST returning `401`, authenticated dry request reaching warehouse validation, and new pod startup with one RabbitMQ connection.
- 2026-06-12: WH-G7 added operational health fields for mutation attempts/failures and stock event publish attempts/failures, structured mutation/event logs with actor/product/warehouse/reason/reference/event result, and `docs/runbooks/operations.md`.
- 2026-06-12: WH-G7 verification passed: `npm test -- --runInBand`, `npm run build`, deployment image `localhost:5000/warehouse-microservice:wh-g7-ops-20260612`, production `/api/health` with `operations`, unauthenticated reconciliation POST returning `401`, authenticated dry failure recording mutation health fields, and `stock_mutation` log evidence.
- 2026-06-12: WH-G3 `npm run build` passed after DTO, service, and test changes.
- 2026-06-12: WH-G3 deployed image `localhost:5000/warehouse-microservice:0350b8e`; rollout completed and production `/api/health` returned `status: healthy` with database and RabbitMQ up.
- 2026-06-12: WH-G4 added reservation row lifecycle writes for reserve, release, fulfill, cancel, expire, and return. Stock, reservation status, and movement records are updated inside the same TypeORM transaction.
- 2026-06-12: WH-G4 reservation reserve is idempotent for repeated order/product/warehouse/channel holds by treating the request quantity as the desired held quantity instead of a blind increment.
- 2026-06-12: WH-G4 `npm test -- --runInBand test/stock.service.spec.ts`, full `npm test -- --runInBand`, and `npm run build` passed.
- 2026-06-12: WH-G4 fixed production Docker build hygiene by excluding `dist` and `node_modules` from the build context, cleaning `dist` before `nest build`, and running the real clean-build entrypoint `dist/src/main`.
- 2026-06-12: WH-G4 deployed image `localhost:5000/warehouse-microservice:6a8e166`; rollout completed and production `/api/health` returned `status: healthy` with database and RabbitMQ up.
- 2026-06-12: WH-G5 documented the trusted catalog product identity ingestion path, service-to-service availability examples, and consumer responsibilities in `docs/contracts/availability-contracts.md`.
- 2026-06-12: WH-G5 added `POST /api/stock/availability/batch`, returning aggregate quantity/reserved/available totals plus per-warehouse rows for up to 200 catalog product IDs.
- 2026-06-12: WH-G5 `npm test -- --runInBand test/stock.service.spec.ts`, full `npm test -- --runInBand`, and `npm run build` passed.
- 2026-06-12: WH-G5 deployed image `localhost:5000/warehouse-microservice:ee192be`; rollout completed and production `/api/health` returned `status: healthy` with database and RabbitMQ up.
- 2026-06-12: WH-G5 smoke verified catalog product `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4` (`FF-BOTTLE-SPORT-004`) exists in catalog, warehouse batch availability returns `totalAvailable: 55`, and FlipFlop API returns the same product with `stockQuantity: 55`.
