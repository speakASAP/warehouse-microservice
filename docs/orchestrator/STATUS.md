Service-to-service authentication follows the [canonical service identity standard](../../../auth-microservice/docs/SERVICE_IDENTITY_CONSUMER_STANDARD.md).

2026-07-04: Goal 24 Warehouse no-mutation acknowledgement recorded. [RESOLVED/NARROWED: owner-approved Warehouse no-mutation acknowledgement for Goal 24 centralOrderHash 04d7d08c82a07853 accepts the selected read-only lookup state with two expired component reservation rows and zero active/fulfilled/cancelled/released/returned rows; Warehouse cleanup operation matrix is no-op for release/fulfill/cancel/return/expire, and no Warehouse mutation is required for this selected unpaid cancellation path] Remaining hard stops: [MISSING: Orders actor/approvedBy and unused-key preflight for centralOrderHash 04d7d08c82a07853]; [MISSING: sideEffectsHandled.notification and sideEffectsHandled.crm acknowledgements for centralOrderHash 04d7d08c82a07853]; [MISSING: sideEffectsHandled.channel acknowledgement for centralOrderHash 04d7d08c82a07853]; [MISSING: final redacted evidence content for Orders, Warehouse, channel cleanup, idempotency, and validation sections]. Boundary: mutation: false; db_write: false; warehouse_mutation: false; warehouse_cleanup: false; orders_mutation: false; provider_call: false; channel_cleanup_mutation: false; secret_output: false; raw_ids_printed: false. Report: reports/validation/VAL-GOAL-24-warehouse-no-mutation-ack-2026-07-04.md.
2026-07-04: Goal 24 selected Warehouse reservation lookup resolved read-only. [RESOLVED/NARROWED: Warehouse selected reservation lookup state is resolved for Goal 24 centralOrderHash 04d7d08c82a07853 as two component reservation rows, both expired, zero active/fulfilled/cancelled/released/returned rows, component quantities 1 and 1, and warehouseHash 797d678626149afa40b76b5ba48971350bc526727553da7e62846f238b711bea; no Warehouse mutation occurred] Operation matrix: release=false because activeCount=0; fulfill=false because selected payment remains unpaid/processing; cancel=false because active/fulfilled counts are 0; return=false because no delivered/customer-received evidence exists; expire mutation was not run because rows are already expired. Remaining hard stops: [MISSING: Orders-owned sideEffectsHandled.warehouse acknowledgement for centralOrderHash 04d7d08c82a07853]; [MISSING: Orders route invocation packet actor/approvedBy and unused-key preflight]; [MISSING: channel side-effect acknowledgement for centralOrderHash 04d7d08c82a07853]; [MISSING: final redacted evidence content for Orders, Warehouse, channel cleanup, idempotency, and validation sections]. Boundary: mutation: false; db_write: false; warehouse_mutation: false; warehouse_cleanup: false; orders_mutation: false; provider_call: false; channel_cleanup_mutation: false; secret_output: false; raw_ids_printed: false. Report: reports/validation/VAL-GOAL-24-selected-reservation-lookup-2026-07-04.md.
2026-07-04: Goal 24 Warehouse reservation lookup blocker packet recorded source-only. [RESOLVED/NARROWED: Warehouse non-mutating reservation lookup command and redacted evidence shape are source-defined for future selected order readback]; [MISSING: exact selected Warehouse reservation lookup state for cleanup] remains unresolved until a future permitted checkout creates the selected order and Warehouse reservation rows. Lookup route: GET /api/reservations/order/:orderId. Deterministic match key: orderId + channel + productId + warehouseId + quantity plus reservationId when supplied. Payments final evidence path is source-reserved, but runtime content remains missing. mutation: false; live_checkout_executed: false; checkout_created: false; payment_created: false; provider_call: false; orders_route_invocation: false; warehouse_reservation: false; warehouse_mutation: false; warehouse_cleanup: false; secret_output: false; token_output: false; raw_ids_printed: false. Report: reports/validation/VAL-GOAL-24-warehouse-reservation-lookup-blocker-2026-07-04.md.
2026-07-04: Goal 24 Warehouse consumed current Payments/Orders/Catalog/FlipFlop/Auth heads source-only. [RESOLVED/NARROWED: Warehouse consumed Payments 445c4e7 pre-side-effect packet, Orders 6360baa Payments pre-side-effect consumption, Catalog 1a51b61 current Payments/Orders head sync, FlipFlop 793f8ef owner-authority sync, and Auth c389c1e actor token provisioning proof as source-governance inputs only; Warehouse stock/reservation effects remain hard-stopped until exact selected reservation lookup state, exact future payment/order/provider hashes, Orders sideEffectsHandled acknowledgements, provider proof or unpaid acknowledgement, channel acknowledgement, and final redacted evidence exist] Runtime remains blocked by [MISSING: current side-effect execution window owned by a separate newer integration owner thread]; [MISSING: future paymentId/orderId/variableSymbolHash/providerTransactionHash for exact smoke]; [MISSING: Fiobanka provider-side completed-transfer refund/reversal/correction proof hash, or owner-approved unpaid no-provider-cancel acknowledgement]; [MISSING: exact Orders target order hash/state, cancellation actor, approval id, safe reason code, idempotency key, and sideEffectsHandled payment|warehouse|notification|crm|channel acknowledgements for the future smoke]; [MISSING: exact selected Orders cleanup packet runtime values and sideEffectsHandled acknowledgements]; [MISSING: exact selected Warehouse reservation lookup state for cleanup]; [MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]. Warehouse must not infer reserve, release, fulfill, cancel, return, expire, restock, decrement, or reservation cleanup from Payments refund state, authenticated transaction-polling state, Orders no-go state, Catalog bundle identity, Auth token state, or channel cleanup state. mutation: false; live_checkout_executed: false; checkout_created: false; payment_created: false; provider_call: false; refund_or_reversal: false; orders_route_invocation: false; orders_mutation: false; warehouse_reservation: false; warehouse_mutation: false; warehouse_cleanup: false; channel_cleanup_mutation: false; deployment: false; migration: false; db_write: false; secret_output: false; token_output: false; raw_provider_payload_output: false; raw_customer_or_payment_evidence: false. Report: reports/validation/VAL-GOAL-24-warehouse-consume-current-payments-orders-catalog-heads-2026-07-04.md.
2026-07-04: Goal 24 Warehouse consumed Orders `9287e3f docs: consume goal24 live no-go preflight`, Payments `cc49c08 docs: record goal24 live no-go preflight`, Catalog `d1eef3d docs: consume goal24 live no-go preflight`, and FlipFlop `9a7c664 docs: sync goal24 durable migration provider marker` source-only. [RESOLVED/NARROWED: Warehouse consumed Orders 9287e3f live no-go consumer sync, Payments cc49c08 live no-go preflight, Catalog d1eef3d no-go consumer sync, and FlipFlop 9a7c664 durable migration provider marker as source-governance inputs only; Warehouse stock/reservation effects remain hard-stopped until exact selected reservation lookup state, selected order/payment/provider hashes, Orders sideEffectsHandled acknowledgements, provider proof or unpaid acknowledgement, channel acknowledgement, and final redacted evidence exist] Runtime remains blocked by [MISSING: exact selected Warehouse reservation lookup state for cleanup]; [MISSING: deterministic Warehouse component reservation state for cleanup]; [MISSING: exact Orders target order hash/state, cancellation actor, approval id, safe reason code, idempotency key, and sideEffectsHandled payment|warehouse|notification|crm|channel acknowledgements for the future smoke]; [MISSING: exact selected Orders cleanup packet runtime values and sideEffectsHandled acknowledgements]; [RESOLVED/NARROWED: owner statement names Sergey Stasok / Сергей Сташок as the human Payments/provider rollback owner, bank/refund authority, and bank/refund executor for Goal 24 runtime planning; runtime side effects remain blocked until exact future payment/order/provider hashes, provider proof, Orders/Warehouse/channel packets, idempotency keys, and final redacted evidence exist]; [MISSING: future paymentId/orderId/variableSymbolHash/providerTransactionHash for exact smoke]; [MISSING: Fiobanka provider-side completed-transfer refund/reversal/correction proof hash, or owner-approved unpaid no-provider-cancel acknowledgement]; [MISSING: owner-approved channel side-effect acknowledgement for the selected central order hash]; [MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]. Warehouse must not infer reserve, release, fulfill, cancel, return, expire, restock, decrement, or reservation cleanup from Payments refund state, Orders no-go state, provider state, Auth token state, Catalog bundle identity, or channel cleanup state. A Payments refund alone is not Warehouse return evidence. mutation: false; live_checkout_executed: false; checkout_created: false; payment_created: false; provider_call: false; refund_or_reversal: false; orders_route_invocation: false; orders_mutation: false; warehouse_reservation: false; warehouse_mutation: false; warehouse_cleanup: false; channel_cleanup_mutation: false; deployment: false; migration: false; db_write: false; secret_output: false; token_output: false; raw_provider_payload_output: false; raw_customer_or_payment_evidence: false. Report: reports/validation/VAL-GOAL-24-warehouse-consume-live-no-go-preflight-9287e3f-cc49c08-d1eef3d-9a7c664-2026-07-04.md.
2026-07-04: Goal 24 Warehouse consumed Catalog `fa88917`, Payments `59be11e`, Orders `8bb22e2`, and FlipFlop `9a7c664` source-only cleanup runtime-values sync. [RESOLVED/NARROWED: Warehouse consumed Catalog fa88917, Payments 59be11e, Orders 8bb22e2, and FlipFlop 9a7c664 cleanup runtime-values sync; hold duration and one-attempt final bounded reservation approval are source-defined for packet planning only, while exact selected reservation lookup state remains missing] Runtime remains blocked by [MISSING: exact selected Warehouse reservation lookup state for cleanup]; [MISSING: exact selected Orders cleanup packet runtime values and sideEffectsHandled acknowledgements]; [MISSING: Payments provider proof and bank/refund authority before fulfilled cleanup]; [MISSING: future paymentId/orderId/variableSymbolHash/providerTransactionHash for exact smoke]; [MISSING: named runtime Orders cancellation actor/approvedBy and exact target order hash/state for the paid/provider packet]; [MISSING: owner-approved payment/warehouse/notification/crm/channel sideEffectsHandled acknowledgements for the selected central order hash]; [MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]. Warehouse must not infer stock effects from Payments refund state, provider state, Auth token state, or channel cleanup state. mutation: false; live_checkout_executed: false; payment_creation: false; provider_call: false; refund_or_reversal: false; orders_mutation: false; warehouse_reservation: false; warehouse_mutation: false; warehouse_cleanup: false; deployment: false; migration: false; db_write: false; secret_output: false; token_output: false; raw_customer_or_payment_evidence: false. Report: reports/validation/VAL-GOAL-24-warehouse-consume-cleanup-runtime-values-fa88917-59be11e-8bb22e2-9a7c664-2026-07-04.md.
2026-07-04: Goal 24 Warehouse stale top-line readback blocker sync completed source-only. [RESOLVED/NARROWED: live current target row readback at execution time captured through protected Warehouse API without mutation] is now consistently consumed in the current top Decision; Warehouse still fails closed on [MISSING: exact selected Warehouse reservation lookup state for cleanup], [MISSING: Payments provider proof and bank/refund authority before fulfilled cleanup], [MISSING: exact Orders target order hash/state and sideEffectsHandled acknowledgements], and [MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]. mutation: false; provider_call: false; orders_mutation: false; warehouse_mutation: false; live_checkout_executed: false; secret_output: false; raw_customer_or_payment_evidence: false. Report: reports/validation/VAL-GOAL-24-warehouse-stale-readback-sync-2026-07-04.md.
## 2026-07-04 - Goal 24 Warehouse Hold Window Approval Intake 004

IPS: Vision -> future Fiobanka paid/provider smoke must bound Warehouse component stock exposure; Goal Impact -> Warehouse hold duration and final Warehouse mutation approval are narrowed for exactly one Goal 24 component-line smoke attempt; System -> Warehouse owns component-line holds, Orders owns lifecycle correction, Payments owns provider/bank evidence, FlipFlop owns channel cleanup; Feature -> bounded Warehouse hold-window approval; Task -> record owner approval intake 004 source-only; Execution Plan -> docs/verifier only, no live mutation; Coding Prompt -> fail closed on non-Warehouse facts; Code -> Warehouse cleanup packet, validation report, state/status, verifier; Validation -> targeted verifier and diff check.

Decision: `[RESOLVED/NARROWED: Warehouse hold/release duration is owner-approved for the bounded Goal 24 smoke as 15 minutes source-default TTL or shorter caller-supplied expiresAt]`; `[RESOLVED/NARROWED: final owner approval before live Warehouse reservation mutation is bounded to one Goal 24 component-line smoke attempt with max quantity 1 per component after live readback]`. Runtime remains blocked by `[MISSING: exact selected Warehouse reservation lookup state for cleanup]`, `[MISSING: Payments provider proof and bank/refund authority before fulfilled cleanup]`, `[MISSING: exact Orders target order hash/state and sideEffectsHandled acknowledgements]`, and `[MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]`; `[RESOLVED/NARROWED: live current target row readback at execution time captured through protected Warehouse API without mutation]` is consumed as protected readback evidence only.

Boundary: no live checkout, payment creation, provider call, refund/reversal, Orders mutation, Warehouse reservation, stock mutation, cleanup mutation, deploy, migration, DB write, secret/token output, raw IDs, or raw customer/order/payment/provider evidence occurred.

2026-07-04: Goal 24 Warehouse consumed live target row readback into current verifier surfaces source-only. [RESOLVED/NARROWED: live current target row readback at execution time captured through protected Warehouse API without mutation] [RESOLVED/NARROWED: Warehouse hold/release duration is owner-approved for the bounded Goal 24 smoke as 15 minutes source-default TTL or shorter caller-supplied expiresAt] [RESOLVED/NARROWED: final owner approval before live Warehouse reservation mutation is bounded to one Goal 24 component-line smoke attempt with max quantity 1 per component after live readback] Current Warehouse owner surfaces no longer publish live row readback, hold duration, or bounded one-attempt mutation approval as missing; runtime remains blocked by [MISSING: exact selected Warehouse reservation lookup state for cleanup], [MISSING: Payments provider proof and bank/refund authority before fulfilled cleanup], [MISSING: exact Orders target order hash/state and sideEffectsHandled acknowledgements], and [MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]. This does not authorize live checkout, reservation, fulfillment, release, cancel, return, expire, Orders mutation, Payments/provider call, deploy, migration, DB write, secret/token output, or raw customer/order/payment/provider evidence. Report: reports/validation/VAL-GOAL-24-warehouse-live-readback-consumption-2026-07-04.md.
2026-07-04: Goal 24 Warehouse live target row readback captured without mutation. [RESOLVED/NARROWED: live current target row readback at execution time captured through protected Warehouse API without mutation] Read-only protected API evidence showed both target component stock rows present with `rowCount=1`, `reserved=0`, and available quantities `118` and `108`; tokenOutput=false, secretOutput=false, rawIdsPrinted=false, mutation=false, provider_call=false. Warehouse hold/release duration and final owner approval before any live Warehouse reservation/cleanup mutation remain missing. Report: `reports/validation/VAL-GOAL-24-warehouse-live-target-readback-runtime-2026-07-04.md`.
2026-07-04: Goal 24 current-head verifier sync completed source-only. [RESOLVED/NARROWED: Goal 24 current-head verifier sync GOAL24-CURRENT-HEADS-2026-07-04H requires Auth c389c1e, Payments 0207876 docs: sync goal24 fiobanka runtime image evidence, Catalog 0e37b4c docs: sync goal24 catalog payments runtime image evidence, FlipFlop 1113b9e docs: consume goal24 auth token proof in verifier, Orders 154c5cd docs: sync goal24 orders payments runtime image evidence, and Warehouse 0289dc2 docs: require goal24 current heads in verifier as the pre-H validation input heads; the H sync commits and later source-only status commits are validation evidence only; historical Wave A-G markers are evidence only; runtime side effects remain blocked] Runtime remains blocked by [MISSING: fresh Auth actor-bound token generated through the Auth c389c1e no-print/no-decode/no-persist pattern for the exact guarded discount-fixture step], [MISSING: sanitized auth/admin evidence path for guarded discount-code generation using the fresh selected actor-bound token], [RESOLVED/NARROWED: owner statement names Sergey Stasok / Сергей Сташок as the human Payments/provider rollback owner, bank/refund authority, and bank/refund executor for Goal 24 runtime planning; runtime side effects remain blocked until exact future payment/order/provider hashes, provider proof, Orders/Warehouse/channel packets, idempotency keys, and final redacted evidence exist], [MISSING: future paymentId/orderId/variableSymbolHash/providerTransactionHash for exact smoke], [MISSING: exact selected Orders cleanup packet runtime values and sideEffectsHandled acknowledgements], [RESOLVED/NARROWED: live current target row readback at execution time captured through protected Warehouse API without mutation], [RESOLVED/NARROWED: Warehouse hold/release duration is owner-approved for the bounded Goal 24 smoke as 15 minutes source-default TTL or shorter caller-supplied expiresAt]; [MISSING: exact selected Warehouse reservation lookup state for cleanup], [RESOLVED/NARROWED: final owner approval before live Warehouse reservation mutation is bounded to one Goal 24 component-line smoke attempt with max quantity 1 per component after live readback], [MISSING: approved runtime route invocation evidence; do not call the route until all packet fields are present], and [MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]. No live checkout, payment creation, provider call, refund/reversal, Orders route invocation, Warehouse mutation, channel cleanup, deploy, migration, DB write, secret/token output, or raw customer/order/payment/provider evidence occurred. Report: reports/validation/VAL-GOAL-24-current-head-verifier-sync-2026-07-04.md.
2026-07-04: Goal 24 Warehouse live target readback wording sync completed. [RESOLVED/NARROWED: candidate target component stock rows and max component quantity are source-documented from Catalog packet] remains source-governance evidence only, while runtime consumes [RESOLVED/NARROWED: live current target row readback at execution time captured through protected Warehouse API without mutation], while still failing closed on [MISSING: exact selected Warehouse reservation lookup state for cleanup]. This does not approve live checkout, reservation, fulfillment, release, cancel, return, expire, Orders mutation, Payments/provider call, deploy, migration, DB write, secret/token output, or raw customer/order/payment/provider evidence. Report: `reports/validation/VAL-GOAL-24-warehouse-live-target-readback-wording-sync-2026-07-04.md`.
2026-07-04: Goal 24 target facts reconciled source-only: [RESOLVED/NARROWED: candidate target component stock rows and max component quantity are source-documented from Catalog packet]; [RESOLVED/NARROWED: Warehouse hold/release duration is owner-approved for the bounded Goal 24 smoke as 15 minutes source-default TTL or shorter caller-supplied expiresAt]; [RESOLVED/NARROWED: final owner approval before live Warehouse reservation mutation is bounded to one Goal 24 component-line smoke attempt with max quantity 1 per component after live readback]; [MISSING: exact selected Warehouse reservation lookup state for cleanup]. No live stock mutation approved.

## 2026-07-04 - Goal 24 Reserved/Timeout Cleanup Approval Narrowed

IPS: Vision -> paid/provider bundle smoke must preserve deterministic component-line cleanup; Goal Impact -> requested Warehouse operation-state blocker is source-policy narrowed while candidate max quantity is source-documented and renewed hold/release duration, deterministic cleanup lookup, and final mutation approval remain missing; System -> Warehouse owns stock effects, Orders owns lifecycle gates, Payments owns provider evidence, Catalog owns bundle identity; Feature -> reserved/fulfilled/return/partial/timeout cleanup boundary; Task -> docs/verifier narrowing; Execution Plan -> Warehouse docs/status/verifier only; Coding Prompt -> no live mutation or invented approvals; Code -> approval packet, bundle contract, validation report, state/status, verifier; Validation -> focused tests, verifier, build, diff check.

Decision: reserved-only active holds use `release`; fulfilled cancellation/reversal uses `cancel`; fulfilled inventory return uses `return`; partial component failures are cleaned line-by-line by current reservation state; timeout uses `expire` only when Warehouse TTL/expiry owns the event, otherwise explicit smoke abort cleanup should use `release`.

Resolved/narrowed blocker:

- `[RESOLVED/NARROWED: Warehouse owner-approved cleanup operation for reserved-only, fulfilled/stock-decremented, return, partial component failure, and timeout component-line states; candidate max quantity is source-documented from Catalog packet, while exact selected reservation lookup state remains missing]`

Remaining gates:

- `[RESOLVED/NARROWED: candidate target component stock rows and max component quantity are source-documented from Catalog packet]; [RESOLVED/NARROWED: live current target row readback at execution time captured through protected Warehouse API without mutation]; [RESOLVED/NARROWED: Warehouse hold/release duration is owner-approved for the bounded Goal 24 smoke as 15 minutes source-default TTL or shorter caller-supplied expiresAt]; [RESOLVED/NARROWED: final owner approval before live Warehouse reservation mutation is bounded to one Goal 24 component-line smoke attempt with max quantity 1 per component after live readback]; [MISSING: exact selected Warehouse reservation lookup state for cleanup]`
- `[RESOLVED/NARROWED: Orders/Payments completed|failed|cancelled source mapping plus Orders cancellation cleanup gate are source-defined; runtime remains blocked on exact provider proof, target order hash/state, named actor, side-effect acknowledgements, Warehouse live readback, bounded final approval, and exact selected reservation lookup state]`
- `[MISSING: final integration owner approval before any live Warehouse reservation, fulfillment, decrement, cancel, return, expire, or release smoke]`

Boundary decision: no Warehouse source reservation behavior, live stock, live reservation, fulfillment, decrement, release, cancel, return, expire, provider call, Orders mutation, Payments mutation, migration, deploy, Kubernetes manifest, or secret value was changed or executed.

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
- Unknown/ambiguous component state: no Warehouse operation; fail closed with `[MISSING: exact selected Warehouse reservation lookup state for cleanup]`.

Resolved/narrowed blockers:

- `[RESOLVED/NARROWED: candidate target component stock rows and max component quantity are source-documented from Catalog packet]; [RESOLVED/NARROWED: live current target row readback at execution time captured through protected Warehouse API without mutation]; [RESOLVED/NARROWED: Warehouse hold/release duration is owner-approved for the bounded Goal 24 smoke as 15 minutes source-default TTL or shorter caller-supplied expiresAt]; [RESOLVED/NARROWED: final owner approval before live Warehouse reservation mutation is bounded to one Goal 24 component-line smoke attempt with max quantity 1 per component after live readback]; [MISSING: exact selected Warehouse reservation lookup state for cleanup]`
- `[RESOLVED/NARROWED: Warehouse owner-approved cleanup operation for reserved-only, fulfilled/stock-decremented, return, partial component failure, and timeout component-line states; candidate max quantity is source-documented from Catalog packet, while exact selected reservation lookup state remains missing]`

Remaining gates:

- `[MISSING: owner-approved paid/provider checkout smoke with stock and refund/cancel rollback plan]`
- `[RESOLVED/NARROWED: candidate target component stock rows and max component quantity are source-documented from Catalog packet]; [RESOLVED/NARROWED: live current target row readback at execution time captured through protected Warehouse API without mutation]; [RESOLVED/NARROWED: Warehouse hold/release duration is owner-approved for the bounded Goal 24 smoke as 15 minutes source-default TTL or shorter caller-supplied expiresAt]; [RESOLVED/NARROWED: final owner approval before live Warehouse reservation mutation is bounded to one Goal 24 component-line smoke attempt with max quantity 1 per component after live readback]; [MISSING: exact selected Warehouse reservation lookup state for cleanup]`
- `[RESOLVED/NARROWED: Orders/Payments completed|failed|cancelled source mapping plus Orders cancellation cleanup gate are source-defined; runtime remains blocked on exact provider proof, target order hash/state, named actor, side-effect acknowledgements, Warehouse live readback, bounded final approval, and exact selected reservation lookup state]`
- `[MISSING: final integration owner approval before any live Warehouse reservation, fulfillment, decrement, cancel, return, or release smoke]`

Boundary decision: no Warehouse source reservation behavior, live stock, live reservation, fulfillment, decrement, release, return, provider call, Orders mutation, Payments mutation, migration, deploy, Kubernetes manifest, or secret value was changed or executed.

Next action: hand the operation matrix back to Orders/Catalog integration; keep runtime paid/provider stock effects blocked until the owner-approved cross-service packet exists.

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
- Code: `docs/contracts/fulfillment-provider-status-intake-contract.md`, `docs/contracts/fulfillment-handoff-contract.md`, `docs/12_validation/VAL-WH-ALLEGRO-SNAPSHOT-CONSUMER.md`, state/status docs.
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

# 2026-06-29 - TASK-STOCK-004 Warehouse Stock Authority Verifier Deployed

Result: added and deployed a read-only live Warehouse verifier at `warehouse-microservice@8a66b27` (`fix: ignore historical job pods in Warehouse deploy preflight`, following `adf5569 test: add Warehouse stock authority verifier`). The verifier queries Warehouse DB state directly for configured product IDs, checks stock-row invariants, optional expected totals, latest movement evidence, stock event outbox evidence, and active reservation totals. It does not call mutation endpoints or change stock.

Validation evidence before deploy: `git diff --check`, `bash -n scripts/deploy.sh`, `node --check scripts/verify-stock-authority-live.js`, and `npm run build` passed. A pre-deploy in-pod verifier run with the 9 current Allegro-authoritative product IDs and expected totals passed with `checkedProductCount=9`, `failedProductCount=0`, `totalQuantity=496`, `totalReserved=0`, `totalAvailable=496`, outbox status `published`, and movement reason `ALLEGRO_OFFER_STOCK_IMPORT`.

Deployment evidence: `./scripts/deploy.sh` initially exposed pre-existing failed reservation-expiry Job pods blocking preflight; the deploy script now ignores historical Failed/Completed Job pods while still checking active Running/Pending unhealthy pods. Retry built and pushed image `localhost:5000/warehouse-microservice:8a66b27` with digest `sha256:6b5370d939d6f89b3e1c9fb7457da5396657aaf038c9924504e50175848d938a`, ran migrations with no pending migrations, rolled out successfully, and health returned database and RabbitMQ `up`.

Post-deploy verifier evidence: packaged `npm run verify:stock-authority-live` inside the running `8a66b27` pod passed for all 9 product IDs with expected totals `124`, `87`, `50`, `25`, `110`, `60`, `10`, `3`, and `27`. Summary: `mutatesWarehouse=false`, `checkedProductCount=9`, `failedProductCount=0`, `totalQuantity=496`, `totalReserved=0`, `totalAvailable=496`, `expectedTotalsChecked=9`, outbox statuses `published`, movement reasons `ALLEGRO_OFFER_STOCK_IMPORT`, and no product issues.

Boundary decision: no Warehouse stock import, stock mutation, reservation, order ingestion, channel draft, publish, queue, confirmation, or external marketplace mutation was run. Complete physical stock beyond the 9 current Allegro-authoritative products remains gated on `[MISSING: owner-approved BizBox/current physical stock export]`, `[MISSING: owner confirmation that stock:minimumRequiredLevel:* fields are authoritative physical stock for Warehouse]`, or `[MISSING: correctly authorized additional seller account exposing additional current full offers]`.

Next action: after a complete owner-approved physical stock source is available, rerun this verifier with accepted expected totals as the Warehouse-side acceptance gate.
