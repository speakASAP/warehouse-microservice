## 2026-07-04 - Goal 24 Reserved/Timeout Cleanup Approval Narrowed

IPS: Vision -> paid/provider bundle smoke must preserve deterministic component-line cleanup; Goal Impact -> requested Warehouse operation-state blocker is source-policy narrowed while max quantity and live hold/release window remain missing; System -> Warehouse owns stock effects, Orders owns lifecycle gates, Payments owns provider evidence, Catalog owns bundle identity; Feature -> reserved/fulfilled/return/partial/timeout cleanup boundary; Task -> docs/verifier narrowing; Execution Plan -> Warehouse docs/status/verifier only; Coding Prompt -> no live mutation or invented approvals; Code -> approval packet, bundle contract, validation report, state/status, verifier; Validation -> focused tests, verifier, build, diff check.

Decision: reserved-only active holds use `release`; fulfilled cancellation/reversal uses `cancel`; fulfilled inventory return uses `return`; partial component failures are cleaned line-by-line by current reservation state; timeout uses `expire` only when Warehouse TTL/expiry owns the event, otherwise explicit smoke abort cleanup should use `release`.

Resolved/narrowed blocker:

- `[RESOLVED/NARROWED: Warehouse owner-approved cleanup operation for reserved-only, fulfilled/stock-decremented, return, partial component failure, and timeout component-line states; max quantity and live hold/release window remain missing]`

Remaining gates:

- `[MISSING: owner-approved Warehouse stock hold/release window and max quantity]`
- `[MISSING: Orders/Payments provider-success, provider-cancel, refund, and post-fulfillment cancellation event contract that maps to Warehouse fulfill/cancel/return calls]`
- `[MISSING: final integration owner approval before any live Warehouse reservation, fulfillment, decrement, cancel, return, expire, or release smoke]`

Boundary decision: no Warehouse source reservation behavior, live stock, live reservation, fulfillment, decrement, release, cancel, return, expire, provider call, Orders mutation, Payments mutation, migration, deploy, Kubernetes manifest, or secret value was changed or executed.

## 2026-07-03 - Warehouse Internal Delivery Status Deployed And Smoked

Result: Warehouse image localhost:5000/warehouse-microservice:3868df3 deployed successfully after the internal delivery status intake source commit. The deploy built and pushed the image, applied manifests, ran the migration job with no pending migrations, rolled out successfully, and in-pod health returned healthy with database and RabbitMQ up. Route smoke with the Warehouse admin service token reached the new endpoint and returned the expected business 404 for a synthetic nonexistent order, proving auth and routing without mutating data. Bounded runtime smoke used the previously documented synthetic fulfillment order fixture, advanced it through forming -> formed -> handed_to_delivery, then posted warehouse.internal_delivery_status.v1 IN_DELIVERY. Warehouse returned HTTP 201, provider observation decision accepted, statusMutationApplied=true, and fulfillment status in_delivery. Orders projection readback showed the central order status shipped, payment paid, fulfillment Warehouse status in_delivery, and a fulfillmentOrderId present. No token values, customer PII, raw provider payloads, tracking values, or random live customer orders were used.

IPS chain: Vision -> Alfares-owned delivery status must update customer/admin order lifecycle without waiting for external carriers; Goal Impact -> internal Warehouse delivery path is now deployed and callback-proven into Orders; System -> Warehouse owns fulfillment/delivery validation and ledger, Orders owns lifecycle projection, frontends read Orders state; Feature -> Warehouse internal delivery status intake; Task -> deploy and smoke the bounded internal delivery path; Execution Plan -> deploy, route smoke, bounded synthetic fixture mutation, Orders projection readback; Coding Prompt -> no raw provider/customer/tracking/credential output; Code -> Warehouse 3868df3; Validation -> deploy phases, health, route smoke, runtime status mutation, Orders projection readback.

Resolved gates:

- [PROVEN: deploy new Warehouse image.]
- [PROVEN: bounded runtime smoke with one safe fulfillment order proving Warehouse status mutation and Orders callback/projection.]

Remaining gate:

- [MISSING: customer/admin frontend read-path verification across selling surfaces after Orders projection.]
## 2026-07-03 - Warehouse Internal Delivery Status Source Implemented

Result: Warehouse now has a source-implemented internal delivery status intake for Alfares-owned delivery operations, so the Orders reliability goal is no longer blocked on an external courier/provider owner for our own orders. The new endpoint is POST /api/fulfillment-orders/order/:orderId/internal-delivery-status, guarded by internal:warehouse-microservice:admin. It records a sanitized provider-status ledger observation under warehouse.internal_delivery_status.v1 and applies the existing Warehouse transition graph for IN_DELIVERY, DELIVERED, NOT_DELIVERED, and RETURNED; UNKNOWN records a no-op observation and does not call Orders.

IPS chain: Vision -> Alfares-owned delivery status must update customer/admin order lifecycle without waiting for external carriers; Goal Impact -> internal delivery source path is implemented in Warehouse and can drive existing Orders callbacks after deploy; System -> Warehouse owns fulfillment/delivery status validation and ledger, Orders owns lifecycle projection, marketplaces/frontends read Orders state; Feature -> Warehouse internal delivery status intake; Task -> add DTO/controller/service/tests/docs; Execution Plan -> source validation first, then deploy/runtime smoke; Coding Prompt -> no raw provider/customer/tracking/credential persistence; Code -> src/fulfillment/dto/fulfillment-order.dto.ts, src/fulfillment/fulfillment-orders.controller.ts, src/fulfillment/fulfillment-orders.service.ts; Validation -> focused Jest suites, build, diff check.

Validation:

- npm test -- --runInBand test/fulfillment-orders.service.spec.ts test/fulfillment-orders.controller.spec.ts test/fulfillment-provider-status-ledger.service.spec.ts passed: 3 suites / 20 tests.
- npm run build passed.
- git diff --check passed.

Remaining gates:

- [MISSING: deploy new Warehouse image.]
- [MISSING: bounded runtime smoke with one safe fulfillment order proving Warehouse status mutation and Orders callback/projection.]
- [MISSING: customer/admin frontend read-path verification across selling surfaces after Orders projection.]
## 2026-07-03 - Catalog Bundle Paid Cleanup Semantics Source-Verified

IPS: Vision -> paid/provider bundle cleanup must preserve Warehouse stock authority; Goal Impact -> Orders Goal 24 Warehouse-owned cleanup blockers are resolved/narrowed to source-policy operation mapping while live smoke remains blocked; System -> Warehouse owns component reservation state and stock effects, Orders owns lifecycle/cancellation gates, Payments owns provider/refund evidence, Catalog owns bundle identity; Feature -> `catalog.bundle.v1` component-line cleanup operation matrix; Task -> define future Orders `release`/`cancel`/`return` usage by component-line state; Execution Plan -> Warehouse docs/verifier/state only; Coding Prompt -> no live mutation, no invented provider facts, no aggregate bundle cleanup; Code -> bundle reservation contract, validation report, verifier, state/status; Validation -> focused Jest, static verifier, build, diff check.

Decision:

- Reserved-only active component hold: use Warehouse `release`.
- TTL-owned expiry: use `expire` only when Warehouse expiry owns the event; explicit smoke cleanup should use `release`.
- Fulfilled/stock-decremented cancellation rollback: use Warehouse `cancel` only after Orders cancellation gate and Payments/provider rollback evidence exist.
- Fulfilled/stock-decremented return workflow: use Warehouse `return` only for approved return evidence.
- Partial failure before fulfillment: `release` successful active holds; no operation for never-reserved components.
- Mixed active and fulfilled partial failure: line-by-line `release` active lines plus `cancel` or `return` fulfilled lines according to the approved business event.
- Unknown/ambiguous component state: no Warehouse operation; fail closed with `[MISSING: deterministic Warehouse component reservation state for cleanup]`.

Resolved/narrowed blockers:

- `[RESOLVED/NARROWED: owner-approved Warehouse stock decrement/fulfillment rollback criteria for paid bundle smoke at source-policy level; live stock window and max quantity remain missing]`
- `[RESOLVED/NARROWED: Warehouse owner-approved cleanup operation for reserved-only, fulfilled/stock-decremented, and partially failed bundle component-line states]`

Remaining gates:

- `[MISSING: owner-approved paid/provider checkout smoke with stock and refund/cancel rollback plan]`
- `[MISSING: approved Warehouse stock hold/release window and max quantity]`
- `[MISSING: Orders/Payments provider-success, provider-cancel, refund, and post-fulfillment cancellation event contract that maps to Warehouse fulfill/cancel/return calls]`
- `[MISSING: final integration owner approval before any live Warehouse reservation, fulfillment, decrement, cancel, return, or release smoke]`

Boundary decision: no Warehouse source reservation behavior, live stock, live reservation, fulfillment, decrement, release, return, provider call, Orders mutation, Payments mutation, migration, deploy, Kubernetes manifest, or secret value was changed or executed.

Next action: hand the operation matrix back to Orders/Catalog integration; keep runtime paid/provider stock effects blocked until the owner-approved cross-service packet exists.

# 2026-07-03 - Goal 24 Paid/Provider Bundle Rollback Readiness

Result: Warehouse paid/provider bundle readiness remains fail-closed beyond existing pending-order reservation/release evidence. The Warehouse-owned component-line lifecycle is documented as `reserve`, `release`, `fulfill`, `cancel`, `expire`, and `return`, but Warehouse cannot approve a paid/provider checkout smoke until an owner-approved cross-service plan maps Orders/Payments provider-success, provider-cancel, refund, and post-fulfillment cancellation events to component-line Warehouse calls.

IPS chain: Vision -> Warehouse remains stock and reservation authority for component product lines only; Goal Impact -> `[MISSING: owner-approved paid/provider checkout smoke with stock and refund/cancel rollback plan]` is narrowed but not resolved; System -> Catalog owns `catalog.bundle.v1`, Orders owns order lifecycle, Payments/provider owners own payment/refund/cancel events, Warehouse owns component stock effects; Feature -> paid/provider rollback readiness boundary; Task -> harden Warehouse docs/verifier without live mutation; Execution Plan -> docs/verifier/state only, no deploy, migration, live reservation, fulfillment decrement, release, provider call, Orders mutation, Payments mutation, or secret read; Coding Prompt -> fail closed and do not infer paid/provider approval from source sign-off; Code -> `docs/contracts/catalog-bundle-component-reservation-contract.md`, `scripts/verify-bundle-component-reservation-contract.js`, validation/status/state docs; Validation -> `npm test -- --runInBand test/reservations.service.spec.ts` passed 1 suite / 4 tests; `npm run verify:bundle-component-reservation` passed; `npm run build` passed; `git diff --check` passed.

Blockers:

- `[MISSING: owner-approved paid/provider checkout smoke with stock and refund/cancel rollback plan]`
- `[MISSING: Orders/Payments provider-success, provider-cancel, refund, and post-fulfillment cancellation event contract that maps to Warehouse fulfill/cancel/return calls]`
- `[MISSING: final integration owner approval before any live Warehouse reservation, fulfillment, decrement, cancel, return, or release smoke]`

Boundary decision: no Warehouse source reservation behavior, live stock, live reservation, fulfillment, decrement, release, return, provider call, Orders mutation, Payments mutation, migration, deploy, Kubernetes manifest, or secret value was changed or executed.

Next action: wait for final integration owner approval and a cross-service paid/provider rollback plan before any runtime Warehouse stock/reservation smoke.

## 2026-07-03 - Hardened Allegro Shipment Service Token Runtime Cutover

Result: Warehouse `d9ebb47` deployed successfully with hardened shipment endpoint RBAC requiring `internal:allegro-service:service`. Pre-deploy validation passed: `npm test -- --runInBand test/jwt-roles.guard.spec.ts test/fulfillment-orders.controller.spec.ts test/authenticated-actor.spec.ts` (3 suites / 24 tests), `npm run build`, and `git diff --check`. Deploy passed: build/push image `localhost:5000/warehouse-microservice:d9ebb47`, migration job with no pending migrations, rollout, and in-pod health `healthy` with database/rabbitmq up. Auth/Allegro cutover projected a dedicated token as `WAREHOUSE_INTERNAL_SERVICE_TOKEN`; Auth validate returns `serviceName=allegro-service` and role `internal:allegro-service:service`. Runtime smoke from Allegro pod proved old broad `ALLEGRO_INTERNAL_SERVICE_TOKEN` receives HTTP 403 on shipment correlation, while dedicated `WAREHOUSE_INTERNAL_SERVICE_TOKEN` passes auth and reaches synthetic business lookup HTTP 404. No token values, raw provider payloads, raw tracking values, customer fields, or real order mutations were printed or changed.

IPS chain: Vision -> Warehouse provider ingestion must accept only least-privilege source identities; Goal Impact -> the source hardening moved from pending to deployed and smoke-proven; System -> Auth owns service-principal roles, Warehouse owns route RBAC, Allegro owns dedicated token projection; Feature -> hardened Allegro shipment service role runtime; Task -> deploy Warehouse hardening and prove old broad token rejection/new token acceptance; Execution Plan -> focused tests/build, deploy, synthetic nonexistent-order auth smoke only; Coding Prompt -> no token/raw/provider/customer output; Code -> Warehouse `d9ebb47`; Validation -> tests/build/deploy/health/403-vs-404 smoke.

Remaining gates:

- [PROVEN: Warehouse shipment endpoints reject broad Allegro internal token after hardening.]
- [PROVEN: dedicated Allegro service token passes hardened Warehouse shipment endpoint auth.]
- [MISSING: product-approved tracking visibility policy for customer/admin surfaces.]
- [MISSING: live provider sample with non-UNKNOWN status if product requires real provider mutation evidence.]

## 2026-07-03 - Real Allegro Shipment Snapshot Accepted As No-Op Observation

Result: a bounded real Allegro provider live-read snapshot was accepted by the deployed Warehouse provider-status intake without exposing raw provider/customer/tracking data. Allegro selected one existing forwarded order from its local projection, decrypted the account OAuth token in memory, live-read the Allegro shipment endpoints, and posted one sanitized `allegro.shipment_status_snapshot.v1` snapshot to `POST /api/fulfillment-orders/provider-status/allegro-shipment-snapshots`. The provider returned `latestStatus=UNKNOWN` with `sourceRead.status=AVAILABLE` and reason `[UNKNOWN: carrier tracking details absent or older than provider retention]`. Warehouse intake returned HTTP 201. Warehouse DB readback showed `fulfillment_provider_status_observations=2`, `fulfillment_provider_shipment_correlations=1`, latest real-provider observation `decision=accepted`, `source_status_class=UNKNOWN`, `normalized_warehouse_status=noop`, `attempt_count=1`; the fulfillment order remained `in_delivery`. No Orders status change was expected or forced for this no-op provider status.

Runtime caveat: this evidence was gathered against the currently deployed Warehouse runtime that predates source hardening commit `ab7ac6e`; the source hardening requires a dedicated `internal:allegro-service:service` token path before cutover.

IPS chain: Vision -> real provider shipment evidence can enter Warehouse as sanitized lifecycle observations; Goal Impact -> optional real-provider read proof moved from missing to proven for no-op handling; System -> Allegro owns live provider read/projection, Warehouse owns correlation/ledger/transition, Orders owns lifecycle callbacks; Feature -> provider-status observation intake; Task -> accept one real sanitized Allegro shipment snapshot and verify ledger readback; Execution Plan -> use existing deployed endpoint, no raw output, no provider write, no forced status mutation; Coding Prompt -> no token/raw id/customer/tracking output; Code -> deployed Warehouse runtime plus existing endpoint; Validation -> HTTP 201 and DB readback `accepted/noop/UNKNOWN`.

Remaining gates:

- [PROVEN: real Allegro provider snapshot accepted into Warehouse ledger as no-op UNKNOWN.]
- [MISSING: deploy/cutover of hardened least-privilege Allegro service token path from source commit `ab7ac6e`.]
- [MISSING: live provider sample with non-UNKNOWN carrier status if product requires real provider status mutation evidence.]
- [MISSING: product-approved tracking visibility policy for customer/admin surfaces.]

## 2026-07-03 - Allegro Shipment Service Role Hardened In Source

Result: Warehouse provider-shipment correlation and Allegro shipment snapshot intake routes now require only `internal:allegro-service:service`; broad `internal:warehouse-microservice:admin` is no longer accepted for those provider-ingestion endpoints in source. Guard coverage proves an Auth-issued Allegro service principal with `serviceName=allegro-service` and role `internal:allegro-service:service` passes, while a broad Warehouse-admin service principal is forbidden on shipment-only routes. Actor derivation still records `service:allegro-service`.

IPS chain: Vision -> recurring provider ingestion must use least-privilege service identity; Goal Impact -> broad Warehouse-admin bearer fallback is removed from the Warehouse endpoint contract in source; System -> Auth owns service-principal issuance, Warehouse owns endpoint RBAC and mutation actor derivation, Allegro owns caller token projection; Feature -> minimal Allegro shipment service role; Task -> narrow Warehouse endpoint roles and add regression coverage; Execution Plan -> source/tests/docs only, no secret or runtime mutation; Coding Prompt -> no token values, raw provider payload, tracking value, customer field, DB query, deploy, or provider read; Validation -> focused guard/controller/actor tests, build, diff check.

Remaining gate: `[MISSING: Auth-issued Allegro service token projected to Allegro runtime as WAREHOUSE_SERVICE_TOKEN or WAREHOUSE_INTERNAL_SERVICE_TOKEN before deploy/runtime cutover.]`

## 2026-07-03 - Allegro Shipment Snapshot Intake Runtime Deployed And Proven

Result: Warehouse `2553452` deployed `POST /api/fulfillment-orders/provider-status/allegro-shipment-snapshots`. The endpoint accepts sanitized `allegro.shipment_status_snapshot.v1` snapshots from `internal:allegro-service:service`, resolves the existing provider shipment correlation, records a provider-status observation, and applies the mapped Warehouse status through the existing transition/callback service only when the observation is accepted and non-noop. Focused tests passed before deploy. Live proof advanced the existing Allegro fulfillment row through the normal transition graph to `handed_to_delivery`, then an Allegro pod posted a sanitized `IN_TRANSIT` snapshot. Warehouse returned HTTP 201 with `statusMutationApplied=true`, `observationDecision=accepted`, and fulfillment status `in_delivery`. Warehouse readback: `correlations=1`, `observations=1`, latest observation `accepted/in_delivery`, fulfillment status `in_delivery`.

Remaining gates:

- [MISSING: optional real Allegro provider live-read selection if provider API evidence is required.]
- [MISSING: product-approved tracking visibility policy.]

## 2026-07-03 - Allegro c00013b Disabled-Gate Replay Readback

Result: Allegro `c00013b` is deployed with the shipment dead-letter PVC/env path present and `ALLEGRO_WAREHOUSE_SHIPMENT_CORRELATION_ENABLED` still absent. A synthetic redacted Allegro apply replay returned `posted=0`, `disabled=1`, reason `ALLEGRO_WAREHOUSE_SHIPMENT_CORRELATION_ENABLED_NOT_TRUE`, so no Warehouse post or fulfillment status mutation was attempted. Warehouse readback remained unchanged before/after at `fulfillment_provider_shipment_correlations=1` and `fulfillment_provider_status_observations=0`.

IPS chain: Vision -> Warehouse accepts provider shipment status only after explicit safe correlation; Goal Impact -> deployed Allegro dead-letter readiness is proven without changing Warehouse ledger/status; System -> Allegro owns disabled producer gate, Warehouse owns correlation/ledger/status transitions, Orders owns lifecycle callbacks; Feature -> fail-closed shipment correlation readback; Task -> compare Warehouse counts around Allegro disabled replay; Execution Plan -> count-only DB readback, no status mutation; Coding Prompt -> no raw provider/customer/tracking data and no fulfillment status mutation; Code -> Warehouse unchanged, Allegro `c00013b`; Validation -> Warehouse count readback before/after replay.

Remaining gates:

- [MISSING: owner-approved Allegro live correlation producer enablement.]
- [MISSING: safe real order selection and expected exactly-one fulfillment order correlation.]
- [MISSING: Warehouse status mutation smoke after correlation registration, with Orders callback verification.]

## 2026-07-03 - Shipment Correlation Migration Deployed

Result: owner-approved Warehouse deploy/migration completed for the provider-status observation ledger and provider-shipment correlation registry. Image `localhost:5000/warehouse-microservice:174f92e` rolled out healthy. The migration job executed `CreateFulfillmentProviderStatusObservations1781600000000` and `CreateFulfillmentProviderShipmentCorrelations1781700000000`; post-deploy `npm run migration:show:prod` shows all six migrations applied. No fulfillment status mutation was performed. Allegro disabled-gate smoke left correlation and observation row counts at zero.

IPS chain: Vision -> Warehouse can own durable shipment correlation/ledger state without raw provider payloads; Goal Impact -> correlation schema gate moved from source-only to deployed; System -> Warehouse owns correlation/ledger and transition validation, Allegro owns provider snapshots, Orders owns lifecycle callbacks; Feature -> provider shipment correlation registry deployment; Task -> deploy approved migrations and verify health/counts; Execution Plan -> focused validation, deploy script, migration readback, count smoke; Coding Prompt -> no raw provider/tracking/customer data and no fulfillment status mutation; Code -> existing Warehouse `174f92e`; Validation -> focused Jest/build/checks, migration job, health, migration show, count readback.

Remaining gates:

- [MISSING: owner-approved Allegro live correlation producer enablement.]
- [MISSING: safe real order selection and expected exactly-one fulfillment order correlation.]
- [MISSING: Warehouse status mutation smoke after correlation registration, with Orders callback verification.]

2026-07-03: Implemented the source-only Warehouse shipment correlation producer surface. Added `POST /api/fulfillment-orders/order/:orderId/provider-shipment-correlations`, `ProviderShipmentCorrelationDto`, and controller coverage. The endpoint resolves the existing fulfillment order by central order id, derives the authenticated service/user actor, and registers only sanitized provider/source hashes through `FulfillmentProviderShipmentCorrelationService`. It does not mutate fulfillment status, call Orders, read providers, run migrations, deploy, read secrets, or persist raw payloads/tracking/customer fields. Validation: `npm test -- --runInBand test/fulfillment-orders.controller.spec.ts test/fulfillment-provider-shipment-correlation.service.spec.ts test/fulfillment-provider-status-snapshot-adapter.service.spec.ts test/fulfillment-orders.service.spec.ts`, `npm run build`, and `git diff --check`. Remaining gates: `[MISSING: deploy/migration approval for correlation table and endpoint]`, `[MISSING: approved channel producer call from Allegro/Orders runtime]`, `[MISSING: approved retention/retry/dead-letter policy]`, `[MISSING: product-approved tracking visibility matrix]`, and `[MISSING: owner approval for runtime status mutation]`.

2026-07-03: Implemented the source-only provider shipment correlation registry/resolver. Added `FulfillmentProviderShipmentCorrelation`, `FulfillmentProviderShipmentCorrelationService`, TypeORM migration `1781700000000-CreateFulfillmentProviderShipmentCorrelations`, adapter resolver wiring, and focused tests. Correlation stores sanitized provider/source hashes only, registers idempotent active mappings from Allegro shipment snapshot identity to exactly one central Orders id and Warehouse fulfillment order id, rejects raw-looking identifiers, and fails closed on zero or ambiguous matches. `FulfillmentProviderStatusSnapshotAdapterService.recordResolvedAllegroShipmentSnapshot` can now resolve correlation before recording a ledger observation, but it still does not mutate `fulfillment_orders.status`, call Orders, read providers, deploy, run migrations, or persist raw payloads/tracking/customer fields. Validation: `npm test -- --runInBand test/fulfillment-provider-shipment-correlation.service.spec.ts test/fulfillment-provider-status-snapshot-adapter.service.spec.ts test/fulfillment-provider-status-ledger.service.spec.ts test/fulfillment-orders.service.spec.ts`, `npm run build`, and `git diff --check`. Remaining gates: `[MISSING: approved runtime producer/population path for shipment correlations]`, `[MISSING: approved retention/retry/dead-letter policy]`, `[MISSING: product-approved tracking visibility matrix]`, and `[MISSING: owner approval for deploy/runtime status mutation]`.

2026-07-03: Implemented the source-only sanitized Allegro shipment snapshot adapter mapper. Added `FulfillmentProviderStatusSnapshotAdapterService` plus focused tests to convert `allegro.shipment_status_snapshot.v1` envelopes into Warehouse provider-status ledger observations only after an already-resolved central order and fulfillment order correlation is supplied. The mapper validates hashed identities, rejects raw tracking/provider/customer fields, maps `IN_TRANSIT`/pickup/in-progress classes to `in_delivery`, `DELIVERED` to `delivered`, `ISSUE` to `not_delivered`, `RETURNED` to `returned`, and `PENDING`/`UNKNOWN`/unavailable reads to no-op diagnostics. It does not resolve correlation, mutate `fulfillment_orders.status`, call Orders, read provider APIs, run migrations, deploy, read secrets, or persist raw payloads/tracking/customer fields. Validation: `npm test -- --runInBand test/fulfillment-provider-status-snapshot-adapter.service.spec.ts test/fulfillment-provider-status-ledger.service.spec.ts test/fulfillment-orders.service.spec.ts`, `npm run build`, and `git diff --check`. Remaining gates: `[MISSING: approved correlation source between Allegro hashed order/shipment/waybill identity and exactly one Warehouse fulfillment order]`, `[MISSING: approved retention/retry/dead-letter policy]`, `[MISSING: product-approved tracking visibility matrix]`, and `[MISSING: owner approval for deploy/runtime status mutation]`.

2026-07-03: Implemented the source-only Warehouse provider-status observation ledger foundation. Added `FulfillmentProviderStatusObservation`, `FulfillmentProviderStatusLedgerService`, TypeORM migration `1781600000000-CreateFulfillmentProviderStatusObservations`, module/data-source wiring, and focused tests for sanitized accepted observations, exact replay dedupe, same-key content conflict, raw tracking/provider/customer metadata rejection, future timestamp rejection, and stale source update rejection. No provider adapter, Warehouse status mutation, Orders callback, deploy, live provider call, secret read, raw provider payload, tracking value, customer field, or production fulfillment-row mutation was performed. Validation: `npm test -- --runInBand test/fulfillment-provider-status-ledger.service.spec.ts test/fulfillment-orders.service.spec.ts`, `npm run build`, and `git diff --check`. Remaining gates: `[MISSING: approved provider adapter source]`, `[MISSING: approved correlation source between Allegro hashed order/shipment/waybill identity and exactly one Warehouse fulfillment order]`, `[MISSING: approved retention/retry/dead-letter policy]`, `[MISSING: product-approved tracking visibility matrix]`, and `[MISSING: owner approval for deploy/runtime adapter]`.

2026-07-03: Defined the Warehouse-owned provider-status observation ledger and timestamp/replay policy in `docs/contracts/fulfillment-provider-status-ledger-policy.md`. The docs-only contract decides ledger ownership, minimal sanitized persistence shape, idempotency/replay/conflict behavior, and provisional timestamp ordering for checkout-form and shipment snapshot sources. No runtime adapter, `src/**`, DB migration, deploy, live provider call, secret read, raw provider payload, tracking value, customer field, or production fulfillment-row mutation was performed. Remaining gates: `[MISSING: approved ledger migration/schema implementation]`, `[MISSING: approved future clock-skew window]`, `[MISSING: approved stale-event age]`, `[MISSING: approved retention/retry/dead-letter policy]`, and `[MISSING: owner approval for runtime adapter/deploy]`.

# 2026-07-03 - Orders Allegro Source-Reference Preservation Integrated

Intent chain:

- Vision: Warehouse adapter work must join Allegro-origin fulfillment updates through central Orders and fulfilled Warehouse reservations, not raw Allegro payloads.
- Goal Impact: the Orders source-reference preservation gate moved from missing to executable verifier evidence.
- System: Orders owns central order id, channel, external checkout reference, paid handoff, and fulfilled reservation lookup; Warehouse owns fulfillment orders and reservation ids; Allegro owns raw checkout/provider payloads.
- Feature: Orders source-reference preservation evidence for Allegro Warehouse handoff joins.
- Task: integrate Orders commit `3c9526b` into Warehouse mapping state.
- Execution Plan: documentation-only Warehouse update; do not implement runtime adapter, DB schema, migration, deploy, live provider call, or stock/order mutation.
- Coding Prompt: no raw checkout-form ids beyond synthetic fixtures, buyer fields, addresses, raw payloads, tracking values, tokens, or provider response bodies.
- Code: Orders `3c9526b test: verify allegro fulfillment source references`; Warehouse docs checkpoint in this commit.
- Validation: Orders `npm run build`, `npm run verify:order-fulfillment-handoff`, pre-commit, Warehouse `git diff --check`.

Evidence:

- Orders verifier builds a synthetic central order with `channel=allegro` and a synthetic external checkout reference.
- The Warehouse handoff payload preserves central `orderId`, `channel=allegro`, `orderNumber/reference` from `externalOrderId`, and line `orderItemId`, `reservationId`, `productId`, `warehouseId`, and quantity.
- The verifier rejects payload leakage markers: `rawData`, `trackingNumber`, `waybill`, `buyerEmail`, `buyerLogin`, and `providerPayload`.

Remaining gates:

- `[PROVEN: Orders source-reference preservation for synthetic Allegro Warehouse fulfillment handoff payloads in orders-microservice commit 3c9526b.]`
- `[MISSING: live Allegro-origin central order with fulfilled reservations for runtime Warehouse handoff join smoke.]`
- `[MISSING: approved durable Warehouse adapter ledger for checkout-form status observations.]`
- `[MISSING: approved timestamp ordering/replay semantics for Allegro updatedAt, local observation time, and Warehouse transition occurredAt.]`
- `[MISSING: owner approval before any Warehouse runtime adapter, src/** mutation, migration, deploy, or production fulfillment-row mutation.]`

Next action:

- Decide durable Warehouse adapter ledger ownership and timestamp/replay policy before runtime adapter implementation.

# 2026-07-03 - Allegro Checkout Fulfillment Enum Fixtures Integrated

Intent chain:

- Vision: Warehouse must only consume Allegro checkout-form status evidence after the source enum shapes are known and sensitive fields remain excluded.
- Goal Impact: the sanitized Allegro fixture gate moved from missing to landed, narrowing future Warehouse adapter work to source-reference, ledger, timestamp/replay, and owner-approval gates.
- System: Allegro owns checkout-form polling and fixture evidence; Warehouse owns mapping and future fulfillment transition validation; Orders owns central lifecycle and paid handoff.
- Feature: Allegro checkout-form fulfillment enum fixture integration.
- Task: integrate Allegro commit `fc94b5d` into Warehouse mapping state.
- Execution Plan: documentation-only; do not implement runtime adapter, DB schema, migration, deploy, live provider call, or stock/order mutation.
- Coding Prompt: no raw checkout-form ids, buyer fields, addresses, raw payloads, tracking values, tokens, or provider response bodies.
- Code: Allegro `fc94b5d docs: record checkout fulfillment fixtures`; Warehouse docs checkpoint in this commit.
- Validation: Allegro sanitized probe, Allegro pre-commit, Warehouse `git diff --check`.

Evidence:

- Allegro sampled 117 local projected checkout-form rows from the live `allegro-service` runtime.
- Observed checkout `status`: `READY_FOR_PROCESSING=103`, `CANCELLED=14`.
- Observed `paymentStatus`: `PAID=112`, `[NULL]=5`.
- Observed `fulfillmentStatus`: `PICKED_UP=61`, `SENT=32`, `CANCELLED=22`, `RETURNED=2`.
- `trackingNumberPresent=0`, `rawShipmentFieldsPresent=0`, and `ordersWithForwardedCentralId=0`.
- Timestamp shapes are ISO-like for local `orderDate`/`updatedAt` and raw `updatedAt`; raw `createdAt` is absent in sampled rows.

Remaining gates:

- `[LANDED: sanitized Allegro checkout-form fulfillment enum fixtures in allegro commit fc94b5d.]`
- `[MISSING: Orders source-reference preservation evidence proving Allegro-origin central orders preserve source evidence and fulfilled reservation ids for Warehouse joins.]`
- `[MISSING: approved durable Warehouse adapter ledger for checkout-form status observations.]`
- `[MISSING: approved timestamp ordering/replay semantics for Allegro updatedAt, local observation time, and Warehouse transition occurredAt.]`
- `[MISSING: owner approval before any Warehouse runtime adapter, src/** mutation, migration, deploy, or production fulfillment-row mutation.]`

Next action:

- Verify Orders source-reference preservation for Allegro-origin Warehouse handoff joins.

# 2026-07-03 - Allegro Checkout Fulfillment Status Mapping Contract

Intent chain:

- Vision: Warehouse keeps the bounded fulfillment state for pick, pack, dispatch, and post-handoff delivery while Allegro remains the provider/source owner.
- Goal Impact: Allegro checkout-form status and fulfillment hints now have a Warehouse-facing provisional mapping that narrows future adapter requirements without allowing runtime mutations.
- System: Allegro owns checkout-form polling, raw provider evidence, and status interpretation; Orders owns central lifecycle/payment handoff; Warehouse owns stock, reservations, fulfillment-order transitions, and dispatch status authority.
- Feature: provisional Allegro checkout-form fulfillment status mapping for Warehouse.
- Task: document which Allegro checkout-form/payment/fulfillment values may inform Warehouse status, which domains must not map, required join keys, idempotency gates, rejection rules, and parallel follow-ups.
- Execution Plan: documentation-only; no runtime adapter, DB schema, migration, deployment, live provider call, secret read, or stock/order mutation.
- Coding Prompt: remote-only on Alfares, Warehouse `docs/**` and coordinator state only, no `src/**`.
- Code: `docs/contracts/allegro-checkout-fulfillment-status-mapping.md`, state/status docs, `TASKS.md`, and `STATE.json`.
- Validation: `git diff --check`; `npm run check:hosted-auth`.

Evidence:

- Mapping explicitly separates checkout-form/order readiness from carrier movement.
- Payment `PAID` is only a paid-handoff eligibility signal; it is not a Warehouse status transition.
- Checkout-form `READY_FOR_PROCESSING` and not-started fulfillment values are only `requested` candidates after Orders has a central order id, fulfilled reservation ids, and a valid Warehouse handoff payload.
- Seller fulfillment `SENT` is only a `handed_to_delivery` candidate and must not be treated as `in_delivery`.
- Delivery-like checkout-form values must not bypass the Warehouse post-handoff transition graph; carrier movement stays in the separate sanitized shipment snapshot contract.
- Explicit non-mappings reject `AllegroOrder.trackingNumber`, raw checkout-form payloads, shipment-management payloads, carrier tracking payloads, One Fulfillment stock/status, and convenience item fields as Warehouse write keys.
- Runtime remains blocked until approved join keys, durable adapter ledger, sanitized enum fixtures, timestamp semantics, retry/dead-letter policy, and owner approval exist.

Remaining gates:

- `[MISSING: sanitized checkout-form fulfillment.status fixture set and approved enum/class list.]`
- `[MISSING: approved Orders-to-Warehouse handoff contract proving Allegro-origin central orders preserve source evidence and fulfilled reservation ids for Warehouse joins.]`
- `[MISSING: approved durable Warehouse adapter ledger for checkout-form status observations.]`
- `[MISSING: approved timestamp ordering/replay semantics for Allegro updatedAt, local observation time, and Warehouse transition occurredAt.]`
- `[MISSING: owner approval before any Warehouse runtime adapter, src/** mutation, migration, deploy, or production fulfillment-row mutation.]`

Next action:

- Collect sanitized Allegro checkout-form fulfillment enum fixtures and Orders source-reference preservation evidence before any Warehouse runtime adapter implementation.

# 2026-07-03 - Worker H Allegro Shipment Snapshot Consumer Contract

Intent chain:

- Vision: customers and operators should see accurate post-handoff delivery progress without Orders or Warehouse storing raw Allegro shipment payloads, tracking numbers, tracking URLs, credentials, or customer data.
- Goal Impact: Allegro-origin orders now have a Warehouse-owned documentation contract for consuming read-only shipment status snapshots once runtime gates are approved.
- System: Allegro owns provider reads and `allegro.shipment_status_snapshot.v1`; Warehouse owns fulfillment status validation, transition enforcement, and future consumer/ledger decisions; Orders owns lifecycle projection through the existing Warehouse callback.
- Feature: bounded Warehouse consumer contract for read-only Allegro shipment status snapshots after `handed_to_delivery`.
- Task: document accepted snapshot envelope, status mapping, idempotency/ledger expectations, redaction policy, rejection rules, Orders callback role, and exact runtime gates.
- Execution Plan: docs-only; do not implement runtime consumer code, DB migrations, secrets, deploy changes, live calls, or Allegro/Orders edits.
- Coding Prompt: remote-only on Alfares, Warehouse `docs/**` only, no `src/**`.
- Code: `docs/contracts/fulfillment-provider-status-intake-contract.md`, `docs/contracts/fulfillment-handoff-contract.md`, `docs/intent-preservation/validation-reports/VAL-WH-ALLEGRO-SNAPSHOT-CONSUMER.md`, state/status docs.
- Validation: `git diff --check`; safe static checker `npm run check:hosted-auth`.

Evidence:

- Read-only source inspection confirmed Warehouse status transition graph and `reference`/`statusReference` path in `src/fulfillment/**`.
- The contract records Allegro commit `e626e5c` as the upstream source-only verifier for `allegro.shipment_status_snapshot.v1`.
- Snapshot intake is constrained to hashed account/order/shipment/waybill identities, bounded source-read status/reason, `packageCount`, `latestStatus`, `latestStatusAt`, and `trackingUpdatedAt`.
- The contract rejects raw provider payloads, tracking numbers/URLs, credentials, customer/contact/address fields, labels, documents, and raw marketplace shipment/package objects.
- Remaining gates include `[MISSING: Warehouse consumer/runtime adapter for read-only shipment snapshots]`, `[MISSING: approved Warehouse shipment snapshot ledger or adapter-owned durable idempotency store]`, and `[MISSING: approved correlation source between Allegro hashed order/shipment/waybill identity and exactly one Warehouse fulfillment order]`.

# 2026-06-29 - TASK-STOCK-004 Catalog Service Principal Receiver Coverage

Change: added focused Warehouse regression coverage for the Auth-compatible Catalog-to-Warehouse service principal. The guard spec now proves an Auth `/auth/validate` response with `serviceName=service=clientId=catalog-microservice`, `authMethod=auth-service-jwt`, and role `internal:warehouse-microservice:admin` passes the default Warehouse guard and attaches `serviceActor`; the actor spec proves Warehouse mutation actor derivation becomes `service:catalog-microservice`.

Validation evidence: `npm test -- --runInBand test/jwt-roles.guard.spec.ts test/authenticated-actor.spec.ts` passed `2` suites / `16` tests; `npm run build` passed; `git diff --check` passed.

Boundary decision: source tests only. No Auth helper execution, token issuance, Vault/Kubernetes secret mutation, Warehouse import, stock mutation, reservation, deployment, or live credential read was performed.

Next action: keep runtime provisioning approval-gated; after the Auth-owned Catalog Warehouse token is mounted, rerun Catalog stock credential wiring and acceptance gates.

# Warehouse Orchestrator Status

## 2026-07-03 - Allegro Fulfillment Provider Status Intake Contract

Intent chain:

- Vision: customers and operators should see accurate post-handoff delivery progress without Orders or Warehouse becoming raw courier-payload stores.
- Goal Impact: Allegro-origin orders can later advance delivery lifecycle status through Warehouse's bounded fulfillment status authority.
- System: Allegro/provider owner owns raw shipment APIs, credentials, provider payloads, and adapter dedupe; Warehouse owns fulfillment-order status; Orders owns lifecycle projection/events.
- Feature: bounded Warehouse intake contract for provider shipment status updates after `handed_to_delivery`.
- Task: define accepted payload, allowed transitions, idempotency/statusReference semantics, sensitive-field rejection, and blockers for Worker E.
- Execution Plan: documentation-only until Allegro source payloads, mapping, fixtures, and sensitive-data policy are approved; do not add fake provider code.
- Coding Prompt: remote-only, Warehouse docs/status files only, no Orders/Allegro edits, no deploys, no migrations, no secrets, no raw tracking persistence.
- Code: `docs/contracts/fulfillment-provider-status-intake-contract.md` plus fulfillment handoff contract link.
- Validation: read-only inspection of Warehouse fulfillment model/API, read-only Orders callback DTO/lifecycle mapping, and `git diff --check`.

Evidence:

- Warehouse model already has `handed_to_delivery`, `in_delivery`, `delivered`, `not_delivered`, `returned`, and `statusReference`.
- Current transition guard permits `handed_to_delivery -> in_delivery/returned`, `in_delivery -> delivered/not_delivered/returned`, and return from terminal delivery statuses.
- Orders callback accepts bounded Warehouse status metadata only and maps `in_delivery -> in_delivery`, `delivered -> received`, and `not_delivered -> not_received`.
- New contract rejects tracking numbers/URLs, raw provider payloads, credentials/tokens, customer address/contact data, label/document references, and marketplace shipment/package objects.
- Implementation remains blocked on `[MISSING: Worker E Allegro shipment status source contract]`, `[MISSING: Allegro-to-Warehouse status mapping]`, and `[MISSING: provider adapter durable idempotency store or Warehouse provider-status event ledger decision]`.

## 2026-07-03 - Fulfillment Delivery Status Source For Orders

Intent chain:

- Vision: Warehouse fulfillment progress should become the bounded source for post-handoff delivery lifecycle stages while Orders remains the customer-visible lifecycle authority.
- Goal Impact: Warehouse can now advance fulfillment orders from requested through pick/pack/delivery stages and notify Orders so marketplace cabinets receive updated lifecycle projections.
- System: Warehouse owns fulfillment-order operational status; Orders owns order lifecycle read models/events; delivery-provider integration remains future work unless a concrete provider is approved.
- Feature: protected `POST /api/fulfillment-orders/order/:orderId/status` with ordered status transitions and best-effort Orders sync.
- Task: extend fulfillment order statuses, enforce transition order, call Orders internal `PUT /api/orders/:id/warehouse-fulfillment-status`, and validate callback payload.
- Execution Plan: do not add a fake courier provider; represent Warehouse operational stages first and leave provider-specific tracking as a separate adapter.
- Coding Prompt: no secret logging, no customer payload dumps, no stock mutation in status transitions, preserve fulfilled-reservation handoff rules.
- Code: fulfillment entity/DTO/controller/service, config `ORDERS_SERVICE_URL`, focused fulfillment service tests.
- Validation: `npm run build`, `npm test -- --runInBand test/fulfillment-orders.service.spec.ts`, and `git diff --check` passed.

Evidence:

- Allowed progress statuses are `collecting`, `forming`, `formed`, `handed_to_delivery`, `in_delivery`, `delivered`, and `not_delivered`.
- Transition order is guarded: `requested -> collecting -> forming -> formed -> handed_to_delivery -> in_delivery -> delivered/not_delivered`, with explicit cancel/return paths preserved.
- Warehouse sends bounded status payloads to Orders with `x-service-name=warehouse-microservice` and the runtime service token; token values are never logged or documented.
- Tests cover successful status advance plus Orders callback headers/payload, invalid jump rejection, and existing cancel/return behavior.

Runtime evidence:

- Deployed Warehouse image `localhost:5000/warehouse-microservice:65e53c6`; deploy completed migrations, rollout, and in-pod health with database and RabbitMQ `up`.
- Runtime env check confirmed `ORDERS_SERVICE_URL=http://orders-microservice.statex-apps.svc.cluster.local:3203` and a service token are present without printing token values.
- Deployed Orders image `localhost:5000/orders-microservice:7bcfadd` first so the internal status callback endpoint and Warehouse token mapping were live.
- Live smoke order `94ce9a4b-7c6a-4625-85c7-8d1b13228b2d` advanced fulfillment order `6ada14af-20f8-4928-9a37-94a331d97be2` from `requested` to `collecting` through `POST /api/fulfillment-orders/order/:orderId/status`.
- Orders persisted `warehouseHandoff.fulfillmentOrderHandoff.warehouseStatus=collecting` and logged `order.warehouse_fulfillment_status.update` with `resultingStatus=warehouse_collecting`.
- Notifications Orders-events health after the smoke showed `received=2`, `sent=2`, `failed=0`, proving the Orders lifecycle event reached the notification pipeline.
- Provider-specific tracking/courier adapter remains `[MISSING: approved delivery provider contract]`; this lane intentionally uses Warehouse-owned operational fulfillment statuses only.

Last updated: 2026-06-15.

Current state:

- WH-G1 through WH-G9 are complete and preserve the original warehouse foundation sequence.
- Previously completed source goals WH-G10 through WH-G15 remain recorded in `docs/IMPLEMENTATION_STATE.md`.
- Owner-approved parallel wave WH-G10-CATALOG, WH-G11-OUTBOX, WH-G12, WH-G13-CONFLICTS, and WH-G14-AUTH has been collected, committed, and deployed.
- Source validation passed before deploy on 2026-06-15: `git diff --check`, `npm test -- --runInBand` (8 suites / 50 tests), and `npm run build`.
- Deployment passed on 2026-06-15 with image `localhost:5000/warehouse-microservice:fab5bee`.
- Natural scheduled reservation-expiry CronJob monitoring passed on 2026-06-15: last three scheduled jobs completed with `success:true`, `examined=0`, `expired=0`, and `failed=0`.
- Process debt: WH-G13 supplier-conflict operations code existed without dedicated IPS artifacts; artifacts were added during collection on 2026-06-14.
- Numbering debt: the repository already has completed historical WH-G10 through WH-G15 goals, so the new approved parallel wave uses suffixed IDs where needed to avoid overwriting completed evidence.

Deployment evidence:

- First deploy attempt applied migrations but reused old dirty-tree image tag `d1d7a6f`; the service stayed on older code and the new reservation-expiry CronJob returned 404. The integrated wave was then found committed as `fab5bee`.
- Cleanup removed failed job pods from the first attempt.
- Second deploy with `fab5bee` passed preflight, build, push, manifest apply, RabbitMQ wait, migration check, rollout, and in-pod health check.
- Production smoke passed: `https://warehouse.alfares.cz/api/health` 200, `https://warehouse.alfares.cz/api/ready` 200, and `https://warehouse.alfares.cz/admin` 200.
- Manual CronJob smoke passed: `warehouse-reservation-expiry-manual` completed with `expired=0`, `failed=0`.

What is left from the current plan:

1. Define the next owner-approved source goal with full IPS artifacts before coding.

Next command:

```text
WAREHOUSE ORCHESTRATOR: define next goal
```
# 2026-06-29 - TASK-STOCK-004 Warehouse Stock Authority Verifier Deployed

Result: added and deployed a read-only live Warehouse verifier at `warehouse-microservice@8a66b27` (`fix: ignore historical job pods in Warehouse deploy preflight`, following `adf5569 test: add Warehouse stock authority verifier`). The verifier queries Warehouse DB state directly for configured product IDs, checks stock-row invariants, optional expected totals, latest movement evidence, stock event outbox evidence, and active reservation totals. It does not call mutation endpoints or change stock.

Validation evidence before deploy: `git diff --check`, `bash -n scripts/deploy.sh`, `node --check scripts/verify-stock-authority-live.js`, and `npm run build` passed. A pre-deploy in-pod verifier run with the 9 current Allegro-authoritative product IDs and expected totals passed with `checkedProductCount=9`, `failedProductCount=0`, `totalQuantity=496`, `totalReserved=0`, `totalAvailable=496`, outbox status `published`, and movement reason `ALLEGRO_OFFER_STOCK_IMPORT`.

Deployment evidence: `./scripts/deploy.sh` initially exposed pre-existing failed reservation-expiry Job pods blocking preflight; the deploy script now ignores historical Failed/Completed Job pods while still checking active Running/Pending unhealthy pods. Retry built and pushed image `localhost:5000/warehouse-microservice:8a66b27` with digest `sha256:6b5370d939d6f89b3e1c9fb7457da5396657aaf038c9924504e50175848d938a`, ran migrations with no pending migrations, rolled out successfully, and health returned database and RabbitMQ `up`.

Post-deploy verifier evidence: packaged `npm run verify:stock-authority-live` inside the running `8a66b27` pod passed for all 9 product IDs with expected totals `124`, `87`, `50`, `25`, `110`, `60`, `10`, `3`, and `27`. Summary: `mutatesWarehouse=false`, `checkedProductCount=9`, `failedProductCount=0`, `totalQuantity=496`, `totalReserved=0`, `totalAvailable=496`, `expectedTotalsChecked=9`, outbox statuses `published`, movement reasons `ALLEGRO_OFFER_STOCK_IMPORT`, and no product issues.

Boundary decision: no Warehouse stock import, stock mutation, reservation, order ingestion, channel draft, publish, queue, confirmation, or external marketplace mutation was run. Complete physical stock beyond the 9 current Allegro-authoritative products remains gated on `[MISSING: owner-approved BizBox/current physical stock export]`, `[MISSING: owner confirmation that stock:minimumRequiredLevel:* fields are authoritative physical stock for Warehouse]`, or `[MISSING: correctly authorized additional seller account exposing additional current full offers]`.

Next action: after a complete owner-approved physical stock source is available, rerun this verifier with accepted expected totals as the Warehouse-side acceptance gate.
