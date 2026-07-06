# Warehouse Business-Health Handoff

status: source-handoff-read-only
created_at: 2026-07-06
repository: /home/ssf/Documents/Github/warehouse-microservice
business_health_contract: stock-order-marketplace-business-health.v1
scope: Warehouse stock authority, reservation lifecycle, expiry, fulfillment, release, stock movement evidence, and stock event observability.

## Intent Preservation Chain

Vision -> Buyers, operators, and marketplace automation can trust that sellable stock is real, reserved stock is protected, expired or released stock returns to availability, fulfilled stock is deducted, and downstream services see observable stock events without becoming stock authorities.

Goal Impact -> `stock-order-marketplace-business-health.v1` receives a Warehouse-owned atomic health packet that separates stock authority evidence from Orders, Catalog, Payments, and channel readiness, while keeping live synthetic stock mutation blocked until owner-approved runtime facts exist.

System -> Warehouse owns stock quantity, reserved quantity, available quantity, reservation rows, reservation lifecycle stock effects, stock movement evidence, and stock event outbox evidence. Orders owns order state and calls Warehouse lifecycle endpoints. Catalog owns product identity and publication readiness. Channel services may consume or cache availability but cannot become stock authorities.

Feature -> Warehouse business-health source handoff for stock/order/marketplace aggregation.

Task -> Define read-only atomic assertions, evidence fields, aggregation semantics, live synthetic mutation blockers, and validation evidence for the Warehouse contribution to `stock-order-marketplace-business-health.v1`.

Execution Plan -> Use existing source/docs only; preserve invariants from `docs/governance/PROJECT_INVARIANTS.md`; map reservation lifecycle behavior from `src/stock/stock.service.ts`, `src/reservations/*`, `docs/contracts/fulfillment-handoff-contract.md`, and `scripts/verify-stock-authority-live.js`; add a static verifier that checks source/docs markers without querying or mutating production.

Coding Prompt -> Alfares remote-only lane. Allowed files are this handoff, a narrow read-only verifier, and optional package verify script. Do not edit stock mutation source, migrations, k8s/deploy files, or production data. Do not run live synthetic mutation.

Code -> `src/business-health/*`, `src/app.module.ts`, `scripts/verify-business-health-stock-authority-contract.js`, and this handoff document only. Endpoint path: `GET /api/business-health/stock-authority`.

Validation -> `npm run verify:business-health-stock-authority-contract`; `npm run build`; `git diff --check`.

## Business-Health Contract Boundary

`stock-order-marketplace-business-health.v1` should treat Warehouse as one atomic producer with contract id `warehouse.stock_authority_business_health.v1`. The aggregation layer may join this packet with Orders lifecycle, Catalog readiness, Payments/provider evidence, and marketplace/channel evidence, but it must not infer Warehouse stock health from those services.

This handoff is read-only. It defines what Warehouse can expose or prove; it does not authorize stock mutation, reservation creation, fulfillment, expiry, release, cancellation, return, deploy, migration, production DB writes, or provider calls.

## Atomic Assertions Warehouse Owns

| Assertion id | Warehouse-owned assertion | Source evidence | Aggregation meaning |
| --- | --- | --- | --- |
| `warehouse.stock_authority` | Warehouse is the stock and availability authority for `quantity`, `reserved`, and `available`. | `docs/governance/PROJECT_INVARIANTS.md` invariants 1, 5, 8; `src/stock/stock.service.ts` state validation. | Aggregator must fail closed when Warehouse stock authority evidence is missing or inconsistent. |
| `warehouse.availability_equation` | Every stock row must satisfy `available = quantity - reserved`; negative `quantity`, `reserved`, or `available` is invalid. | `assertValidStockState`; `scripts/verify-stock-authority-live.js` row checks. | Product/channel sellability cannot be healthy if this assertion fails for any target product/warehouse row. |
| `warehouse.mutation_context` | Stock mutations require actor/service identity and reason code. | `validateMutationContext`; authenticated actor handling in reservation controller; invariant 7. | Runtime synthetic mutation remains blocked without approved actor, reasonCode, and reference/idempotency packet. |
| `warehouse.reserve_active_hold` | `reserve` creates or updates an active reservation, increases `reserved`, decreases `available`, preserves `quantity`, writes movement/outbox when delta changes, and applies default or caller-supplied expiry. | `reserveStock`; `DEFAULT_RESERVATION_TTL_MS`; `StockReservation.status = active`. | Active reservation health is separate from fulfilled stock deduction and must be counted as protected stock, not sold stock. |
| `warehouse.release_active_hold` | `release`/`unreserve` operates only on active reservations, decreases `reserved`, increases `available`, marks full release as `released`, and is idempotent for already released rows. | `unreserveStock`; `POST /api/reservations/release`. | A failed release blocks cleanup readiness for abandoned, failed-payment, or pre-fulfillment cancelled orders. |
| `warehouse.expire_due_hold` | TTL-owned expiry only expires active rows whose `expiresAt` is due, releases reserved stock, records `expire`, and reports per-row failed/expired summary. | `expireReservation`; `expireDueReservations`; reservation expiry tests. | Expiry health contributes batch counts: examined, expired, failed, cutoff, and per-row failure classes. |
| `warehouse.fulfill_reserved_stock` | Fulfillment requires an active reservation, decrements `reserved` and `quantity`, keeps `available = quantity - reserved`, marks reservation `fulfilled`, records movement, and enqueues stock events. | `fulfillReservation`; fulfillment handoff contract. | Paid order stock effect is healthy only after Warehouse fulfillment succeeds and Orders has separate lifecycle evidence. |
| `warehouse.cancel_or_return_fulfilled_stock` | `cancel` can release an active hold or reverse a fulfilled reservation; `return` restocks only a fulfilled reservation. | `cancelReservation`; `returnReservation`; fulfillment handoff contract missing-contract blockers. | Post-fulfillment correction is not inferred from Orders/Payments alone; it needs approved business event evidence and Warehouse lifecycle result. |
| `warehouse.stock_movement_evidence` | Every effective stock mutation records an append-only stock movement with type, quantity, reason, actor, reference, and warehouse direction. | `recordMovement`; `StockMovement`; invariant 6. | Aggregator should expose latest movement hash/summary and movement-missing blockers without printing raw private data. |
| `warehouse.stock_event_observability` | Effective stock mutations enqueue stock event outbox rows (`stock.updated`, plus low/out signals) and replay pending outbox. Broken event path must not masquerade as readiness. | `enqueueStockEvents`; `buildStockEventOutboxRows`; `verify-stock-authority-live.js` outbox evidence; invariant 10. | Channel/marketplace health is degraded when stock state exists but event evidence is missing or failing. |
| `warehouse.fulfillment_handoff` | Warehouse fulfillment orders are operational pick/pack/dispatch handoffs after reservations are fulfilled; cancel/return handoff endpoints do not mutate stock by themselves. | `docs/contracts/fulfillment-handoff-contract.md`. | Business-health aggregation must separate fulfillment handoff status from stock lifecycle effects. |

## Evidence Fields To Expose

For each target product/warehouse/order scope, Warehouse can expose or derive these read-only fields for aggregation. Sensitive raw customer, token, provider, and private DB evidence must stay redacted or hashed upstream.

| Field | Type | Required | Producer source | Notes |
| --- | --- | --- | --- | --- |
| `contractId` | string | yes | handoff/verifier | `warehouse.stock_authority_business_health.v1`. |
| `businessHealthContract` | string | yes | aggregator contract | `stock-order-marketplace-business-health.v1`. |
| `mutatesWarehouse` | boolean | yes | verifier/runtime packet | Must be `false` for this lane. |
| `productIdHash` | string | yes for external report | aggregator/verifier wrapper | Use hash/redaction for owner-facing reports when product id is sensitive. |
| `warehouseIdHash` | string | yes for external report | aggregator/verifier wrapper | Use hash/redaction for owner-facing reports when warehouse id is sensitive. |
| `warehouseType` | string/null | optional | stock availability rows | `own`, `supplier`, `dropship`, or `[UNKNOWN]`; supplier-managed rows must keep supplier authority boundaries. |
| `quantity` | number | yes when row checked | stock row/read-only verifier | Must be non-negative. |
| `reserved` | number | yes when row checked | stock row/read-only verifier | Must be non-negative and not exceed `quantity`. |
| `available` | number | yes when row checked | stock row/read-only verifier | Must equal `quantity - reserved`. |
| `availabilityEquationOk` | boolean | yes | source/live verifier | False is a hard business-health failure. |
| `activeReservationCount` | number | yes for reservation scope | reservation read path/live verifier | Count active holds. |
| `activeReservedQuantity` | number | yes for reservation scope | reservation read path/live verifier | Sum active reserved quantity. |
| `reservationStatusesPresent` | string[] | optional | reservation read path | Expected known statuses: `active`, `released`, `fulfilled`, `cancelled`, `expired`, `returned`. |
| `expiryCutoff` | ISO timestamp/null | optional | expiry batch summary | Only present for expiry batch evidence. |
| `expiryExamined` | number | optional | expiry batch summary | Preserve failed rows separately. |
| `expiryExpired` | number | optional | expiry batch summary | Count successful expiries. |
| `expiryFailed` | number | optional | expiry batch summary | Non-zero degrades Warehouse health. |
| `latestMovementType` | string/null | yes when movement checked | stock movement read path/live verifier | Avoid raw private reference in public reports. |
| `latestMovementReason` | string/null | optional | stock movement read path/live verifier | Can be redacted if reason leaks private workflow. |
| `latestMovementActorClass` | string/null | optional | stock movement read path/live verifier | Prefer actor class/service id over raw token/session. |
| `movementEvidencePresent` | boolean | yes | movement read path/live verifier | Missing movement evidence blocks full readiness. |
| `outboxStatusCounts` | object | yes | stock event outbox read path/live verifier | Include counts by pending/published/failed where available. |
| `stockEventEvidencePresent` | boolean | yes | stock event outbox read path/live verifier | Missing event evidence degrades channel/marketplace health. |
| `fulfillmentHandoffStatus` | string/null | optional | fulfillment order read path | Operational status; not a stock effect by itself. |
| `ordersLifecycleEvidencePresent` | boolean | no, external | Orders | Warehouse must not fabricate this field. |
| `paymentsProviderEvidencePresent` | boolean | no, external | Payments/provider | Required before post-fulfillment correction, outside Warehouse authority. |
| `blockers` | string[] | yes | this handoff/runtime packet | Use `[MISSING: ...]` and `[UNKNOWN: ...]` markers. |
| `validation` | object | yes | verifier output | Include command, timestamp, result, and source markers checked. |

## Aggregation Semantics

`healthy` requires all required Warehouse assertions for the scoped product/order/warehouse to pass and no hard blocker. `degraded` means stock state is internally valid but event/movement/expiry/fulfillment handoff evidence is incomplete or delayed. `blocked` means the aggregation asks for live synthetic mutation, post-fulfillment correction, provider-dependent cleanup, or unapproved stock effects without the required owner-approved packet. `unknown` means source data or authoritative owner facts are not available and must be reported as `[UNKNOWN: ...]`, not guessed.

Warehouse should emit a single atomic status plus assertion-level details. Aggregators should not average or override Warehouse hard failures with green Orders/Catalog/channel evidence.

## Live Synthetic Mutation Blockers

The following remain hard blockers before any live reserve, release, expire, fulfill, cancel, return, stock adjustment, or provider-driven stock correction smoke:

- `[MISSING: final integration owner approval before any live Warehouse reservation, fulfillment, decrement, cancel, return, expire, release, or stock adjustment smoke]`
- `[MISSING: exact target product/warehouse/order/reservation lookup state captured through an approved read-only Warehouse path immediately before mutation]`
- `[MISSING: approved actor, reasonCode, reference/idempotency policy, max quantity, hold/release window, and rollback/no-rollback expectation]`
- `[MISSING: Orders lifecycle packet proving intended order state and side-effect acknowledgements before Warehouse stock effect]`
- `[MISSING: Payments/provider proof before fulfilled cancellation, refund-like correction, or returned stock effect]`
- `[MISSING: redacted evidence path for provider, Orders, Warehouse, and channel readback after mutation]`
- `[UNKNOWN: concurrent production stock changes between readback and proposed mutation unless protected by an approved runtime packet]`

## Parallel Execution Section

Current lane is not parallelized because the allowed write scope converges on one handoff and one verifier. Safe future parallel workstreams are:

| Workstream | Status | Owner role | Scope | Dependencies | Validation owner | Merge order |
| --- | --- | --- | --- | --- | --- | --- |
| Warehouse source/docs verifier | ready now | Warehouse validation worker | Static source/docs markers only; no DB/API calls. | This handoff. | Warehouse integration validator. | 1 |
| Business-health aggregator consumer | dependency-gated | Aggregator owner | Consume `warehouse.stock_authority_business_health.v1` without redefining Warehouse authority. | Stable aggregator schema and owner-approved field mapping. | Aggregator integration validator. | 2 |
| Live synthetic stock smoke | blocked | Runtime proof owner | Bounded reserve/release/fulfill/correction proof. | All live synthetic mutation blockers resolved. | Runtime integration validator. | 3 |

Shared files/contracts: this handoff and any future aggregator schema. Integration owner: business-health aggregator owner. Warehouse validation owner: Warehouse integration validator. Conflict rule: do not edit stock mutation source or shared public contract concurrently with this handoff unless one integration owner serializes changes.

## Validation Result

Result on 2026-07-06:

```bash
npm run verify:business-health-stock-authority-contract
# passed; emitted contract warehouse.stock_authority_business_health.v1, businessHealthContract stock-order-marketplace-business-health.v1, endpoint /api/business-health/stock-authority, mutatesWarehouse false, checkedAssertions 11, forbiddenEndpointCodePatternsChecked 26

npm run build
# passed; TypeScript compiled with BusinessHealthModule wired into AppModule

git diff --check
# passed; no whitespace or conflict-marker findings
```

## Handoff

Warehouse can contribute `warehouse.stock_authority_business_health.v1` to `stock-order-marketplace-business-health.v1` as read-only atomic evidence. The packet should center on stock equation validity, reservation lifecycle status, expiry batch outcomes, fulfillment stock effects, release/cancel/return semantics, movement evidence, and stock event outbox evidence. Live synthetic mutation remains blocked until the runtime packet facts and owner approval above are supplied.
