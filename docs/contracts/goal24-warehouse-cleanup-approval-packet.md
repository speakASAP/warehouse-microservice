2026-07-04: Goal 24 Warehouse consumed current Payments/Orders/Catalog/FlipFlop/Auth heads source-only. [RESOLVED/NARROWED: Warehouse consumed Payments 445c4e7 pre-side-effect packet, Orders 6360baa Payments pre-side-effect consumption, Catalog 1a51b61 current Payments/Orders head sync, FlipFlop 793f8ef owner-authority sync, and Auth c389c1e actor token provisioning proof as source-governance inputs only; Warehouse stock/reservation effects remain hard-stopped until exact selected reservation lookup state, exact future payment/order/provider hashes, Orders sideEffectsHandled acknowledgements, provider proof or unpaid acknowledgement, channel acknowledgement, and final redacted evidence exist] Runtime remains blocked by [MISSING: current side-effect execution window owned by a separate newer integration owner thread]; [MISSING: future paymentId/orderId/variableSymbolHash/providerTransactionHash for exact smoke]; [MISSING: Fiobanka provider-side completed-transfer refund/reversal/correction proof hash, or owner-approved unpaid no-provider-cancel acknowledgement]; [MISSING: exact Orders target order hash/state, cancellation actor, approval id, safe reason code, idempotency key, and sideEffectsHandled payment|warehouse|notification|crm|channel acknowledgements for the future smoke]; [MISSING: exact selected Orders cleanup packet runtime values and sideEffectsHandled acknowledgements]; [MISSING: exact selected Warehouse reservation lookup state for cleanup]; [MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]. Warehouse must not infer reserve, release, fulfill, cancel, return, expire, restock, decrement, or reservation cleanup from Payments refund state, authenticated transaction-polling state, Orders no-go state, Catalog bundle identity, Auth token state, or channel cleanup state. mutation: false; live_checkout_executed: false; checkout_created: false; payment_created: false; provider_call: false; refund_or_reversal: false; orders_route_invocation: false; orders_mutation: false; warehouse_reservation: false; warehouse_mutation: false; warehouse_cleanup: false; channel_cleanup_mutation: false; deployment: false; migration: false; db_write: false; secret_output: false; token_output: false; raw_provider_payload_output: false; raw_customer_or_payment_evidence: false. Report: reports/validation/VAL-GOAL-24-warehouse-consume-current-payments-orders-catalog-heads-2026-07-04.md.
2026-07-04: Goal 24 Warehouse consumed Orders `9287e3f docs: consume goal24 live no-go preflight`, Payments `cc49c08 docs: record goal24 live no-go preflight`, Catalog `d1eef3d docs: consume goal24 live no-go preflight`, and FlipFlop `9a7c664 docs: sync goal24 durable migration provider marker` source-only. [RESOLVED/NARROWED: Warehouse consumed Orders 9287e3f live no-go consumer sync, Payments cc49c08 live no-go preflight, Catalog d1eef3d no-go consumer sync, and FlipFlop 9a7c664 durable migration provider marker as source-governance inputs only; Warehouse stock/reservation effects remain hard-stopped until exact selected reservation lookup state, selected order/payment/provider hashes, Orders sideEffectsHandled acknowledgements, provider proof or unpaid acknowledgement, channel acknowledgement, and final redacted evidence exist] Runtime remains blocked by [MISSING: exact selected Warehouse reservation lookup state for cleanup]; [MISSING: deterministic Warehouse component reservation state for cleanup]; [MISSING: exact Orders target order hash/state, cancellation actor, approval id, safe reason code, idempotency key, and sideEffectsHandled payment|warehouse|notification|crm|channel acknowledgements for the future smoke]; [MISSING: exact selected Orders cleanup packet runtime values and sideEffectsHandled acknowledgements]; [RESOLVED/NARROWED: owner statement names Sergey Stasok / Сергей Сташок as the human Payments/provider rollback owner, bank/refund authority, and bank/refund executor for Goal 24 runtime planning; runtime side effects remain blocked until exact future payment/order/provider hashes, provider proof, Orders/Warehouse/channel packets, idempotency keys, and final redacted evidence exist]; [MISSING: future paymentId/orderId/variableSymbolHash/providerTransactionHash for exact smoke]; [MISSING: Fiobanka provider-side completed-transfer refund/reversal/correction proof hash, or owner-approved unpaid no-provider-cancel acknowledgement]; [MISSING: owner-approved channel side-effect acknowledgement for the selected central order hash]; [MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]. Warehouse must not infer reserve, release, fulfill, cancel, return, expire, restock, decrement, or reservation cleanup from Payments refund state, Orders no-go state, provider state, Auth token state, Catalog bundle identity, or channel cleanup state. A Payments refund alone is not Warehouse return evidence. mutation: false; live_checkout_executed: false; checkout_created: false; payment_created: false; provider_call: false; refund_or_reversal: false; orders_route_invocation: false; orders_mutation: false; warehouse_reservation: false; warehouse_mutation: false; warehouse_cleanup: false; channel_cleanup_mutation: false; deployment: false; migration: false; db_write: false; secret_output: false; token_output: false; raw_provider_payload_output: false; raw_customer_or_payment_evidence: false. Report: reports/validation/VAL-GOAL-24-warehouse-consume-live-no-go-preflight-9287e3f-cc49c08-d1eef3d-9a7c664-2026-07-04.md.
# Goal 24 Warehouse Cleanup Approval Packet

```yaml
id: WH-G24-WAREHOUSE-CLEANUP-APPROVAL-PACKET
status: blocked-owner-approval-required
owner: warehouse-reservation-owner
created: 2026-07-03
scope: Warehouse cleanup approval packet for catalog.bundle.v1 paid/provider smoke
allowed_files:
  - Warehouse docs/reports/verifier evidence only
forbidden_runtime_effects:
  - live stock mutation
  - direct database writes
  - deployments
  - migrations
  - Orders or Payments source edits
  - marketplace state changes
```

## Intent Preservation Chain

Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding Prompt -> Code -> Validation

- Vision: paid/provider `catalog.bundle.v1` validation must not risk customer, provider, order, or Warehouse stock state without a bounded owner-approved cleanup packet.
- Goal Impact: addresses the Warehouse-owned operation-selection part of `[MISSING: owner-approved operation for reserved-only, fulfilled/stock-decremented, return, partial component failure, and timeout states, including max quantity and hold/release window]`; reserved-only, fulfilled/stock-decremented, return, partial component failure, and timeout/expiry operation choices are source-policy resolved/narrowed, and the deterministic component-line cleanup packet shape is source-defined, while max quantity and the live hold/release window remain owner-approval blockers. It also addresses `[MISSING: owner-approved post-fulfillment cancellation/return workflow that maps a Payments refund or correction to Orders and Warehouse without inferring stock effects]` as far as source/docs can safely prove.
- System: Warehouse owns component-line reservation state and stock effects; Orders owns canonical lifecycle/cancellation gates; Payments owns provider payment, refund, correction, and status evidence; Catalog owns bundle identity; channel services own checkout UX.
- Feature: fail-closed approval packet for future paid/provider cleanup and rollback planning.
- Task: prove what Warehouse can approve from source, list unavailable approvals as explicit `[MISSING]`, and provide agent-ready owner approval questions.
- Execution Plan: inspect Warehouse source/contracts plus Orders/Payments docs read-only; update Warehouse docs and static verifier only; run non-mutating validation gates.
- Coding Prompt: do not create live orders, payments, refunds, provider callbacks, Warehouse reservations, fulfillment, release, cancel, return, deployments, migrations, DB writes, or external marketplace state.
- Code: this packet plus the existing Warehouse bundle component contract/report/verifier references.
- Validation: `npm run verify:bundle-component-reservation`, focused reservation/stock tests, build, and `git diff --check`.

## Source Evidence Summary

Warehouse source-policy evidence is already sufficient for component-line operation selection only:

- `release` removes reserved-only active holds before fulfillment and restores availability.
- `fulfill` converts an active hold to a stock decrement after a Payments-owned completed signal reaches Orders.
- `expire` removes an active timed-out hold only when the Warehouse TTL/expiry workflow owns the event; explicit paid/provider smoke abort cleanup should still use `release` unless the owner-approved packet names expiry as cleanup owner.
- `cancel` restocks a fulfilled reservation only when an approved Orders/provider cancellation workflow owns the rollback event.
- `return` restocks a fulfilled reservation only when an approved return workflow owns the inventory-return event.
- partial component failure is line-by-line only: release active holds, choose `cancel` or `return` for fulfilled lines only from the approved business event, and do nothing for never-reserved lines.
- unknown, duplicate, ambiguous, or missing component reservation state has no approved Warehouse operation and must fail closed.

Read-only Orders evidence inspected on 2026-07-03 states that Orders can map `orders.payment-status.v1` `completed` to Warehouse `fulfill`, and `failed` or `cancelled` before fulfillment to Warehouse `release`. Orders still rejects refund-like payment statuses and paid downgrades, and requires a separate owner-approved cancellation/correction workflow before post-fulfillment cleanup.

Read-only Payments evidence inspected on 2026-07-03 states that Payments can bridge source-verified `completed`, `failed`, and `cancelled` payment statuses to Orders, but completed-payment refund/correction and post-fulfillment cancellation/return remain blocked pending provider refund/reversal evidence plus Orders/Warehouse correction approval. The Payments repo was dirty with unresolved conflicts during this Warehouse pass, so Payments evidence is treated as read-only non-final integration context, not clean merge evidence.

## Decision

`[MISSING: owner-approved operation for reserved-only, fulfilled/stock-decremented, return, partial component failure, and timeout states, including max quantity and hold/release window]` is narrowed: Warehouse source-policy approves the operation choice for reserved-only (`release`), fulfilled cancellation (`cancel`), fulfilled inventory return (`return`), partial component failure (line-by-line by current reservation state), and timeout (`expire` only under Warehouse TTL/expiry ownership; otherwise explicit smoke abort cleanup uses `release`). The same blocker is now narrowed for candidate target component stock rows and max component quantity only: Catalog packet `2026-07-03-goal24-paid-provider-smoke-approval-packet.md` source-documents bundle `919be990-1c76-4f9c-b100-829281c6a709`, component products `ce4a51aa-2d12-4ab7-a965-7a36609d01fc` and `dbc51dde-fc66-4511-b178-f929183f4647`, Warehouse `c0de0000-0000-4000-8000-000000000013`, and max hold quantity `1` per component. [RESOLVED/NARROWED: candidate target component stock rows and max component quantity are source-documented from Catalog packet]; [RESOLVED/NARROWED: live current target row readback at execution time captured through protected Warehouse API without mutation]; [RESOLVED/NARROWED: Warehouse hold/release duration is owner-approved for the bounded Goal 24 smoke as 15 minutes source-default TTL or shorter caller-supplied expiresAt]; [RESOLVED/NARROWED: final owner approval before live Warehouse reservation mutation is bounded to one Goal 24 component-line smoke attempt with max quantity 1 per component after live readback]; [MISSING: exact selected Warehouse reservation lookup state for cleanup]. The blocker remains unresolved for timeout/TTL override, target order ids, rollback owner, and deterministic cleanup lookup.

`[RESOLVED/NARROWED: Warehouse hold/release duration is owner-approved for the bounded Goal 24 smoke as 15 minutes source-default TTL or shorter caller-supplied expiresAt]; [RESOLVED/NARROWED: final owner approval before live Warehouse reservation mutation is bounded to one Goal 24 component-line smoke attempt with max quantity 1 per component after live readback]; [MISSING: exact selected Warehouse reservation lookup state for cleanup]` is the current Warehouse-owned runtime gate. The 15-minute TTL/shorter `expiresAt` and one-attempt final bounded approval are source-defined for packet planning only; they do not authorize a live canary without the exact selected reservation lookup, provider proof, Orders packet values, and final redacted evidence. [RESOLVED/NARROWED: Warehouse hold/release duration is owner-approved for the bounded Goal 24 smoke as 15 minutes source-default TTL or shorter caller-supplied expiresAt]; [RESOLVED/NARROWED: final owner approval before live Warehouse reservation mutation is bounded to one Goal 24 component-line smoke attempt with max quantity 1 per component after live readback]; [MISSING: exact selected Warehouse reservation lookup state for cleanup].

`[MISSING: owner-approved post-fulfillment cancellation/return workflow that maps a Payments refund or correction to Orders and Warehouse without inferring stock effects]` remains unresolved. Warehouse can approve `cancel` versus `return` only after an external owner-approved event identifies whether the real-world business event is cancellation/reversal or inventory return. A refund alone is not inventory-return evidence and must not be used to infer Warehouse stock effects.

Runtime paid/provider bundle progression must stay blocked until both missing approvals are supplied and accepted by the integration owner.

## Required Owner Approval Packet

The next owner-approved packet must name these facts before any live stock effect:

| Required fact | Owner | Required value | Current status |
| --- | --- | --- | --- |
| Selected provider and payment method | Payments/provider owner | Stripe, Fiobanka QR, PayPal, WebPay, PayU, or another named method, plus sandbox/live mode | `[MISSING: selected paid/provider method and environment]` |
| Stock hold window | Commerce/Warehouse owner | maximum hold duration, expiry owner, cleanup owner if the smoke aborts before fulfillment, and whether timeout cleanup uses Warehouse expiry or explicit release | `[RESOLVED/NARROWED: Warehouse hold/release duration is owner-approved for the bounded Goal 24 smoke as 15 minutes source-default TTL or shorter caller-supplied expiresAt]; [MISSING: exact selected Warehouse reservation lookup state for cleanup]` |
| Maximum Warehouse quantity | Commerce/Warehouse owner | exact maximum component quantity per product line and maximum total units across the smoke | `[RESOLVED/NARROWED: candidate target component stock rows and max component quantity are source-documented from Catalog packet]` for candidate max hold quantity `1` per component; final runtime approval still `[RESOLVED/NARROWED: final owner approval before live Warehouse reservation mutation is bounded to one Goal 24 component-line smoke attempt with max quantity 1 per component after live readback]` |
| Timeout-state cleanup owner | Commerce/Warehouse owner | owner-approved choice between TTL/expiry-owned `expire` and explicit abort-owned `release` for active holds | `[RESOLVED/NARROWED: Warehouse source operation is defined; live owner selection remains missing]`; `[RESOLVED/NARROWED: Warehouse hold/release duration is owner-approved for the bounded Goal 24 smoke as 15 minutes source-default TTL or shorter caller-supplied expiresAt]; [MISSING: exact selected Warehouse reservation lookup state for cleanup]` |
| Target product/reservation scope | Catalog/Warehouse owner | component product ids, warehouse ids, order id strategy, and deterministic reservation lookup | `[RESOLVED/NARROWED: candidate target component stock rows and max component quantity are source-documented from Catalog packet]` for candidate Catalog product ids and Warehouse id; live current readback and target order id still missing |
| Provider success evidence | Payments owner | bounded proof that production-equivalent provider/callback path reports `completed` to Orders | narrowed for source only; runtime packet still required |
| Provider cancel/failure evidence before fulfillment | Payments owner | bounded proof that `failed` or `cancelled` reaches Orders and maps to Warehouse `release` | narrowed for source only; runtime packet still required |
| Completed-payment refund/reversal evidence | Payments owner | approved provider refund, void, cancel, reversal, or `[MISSING: provider-side cancellation unavailable]` | `[MISSING: completed-payment refund/reversal workflow]` |
| Orders post-fulfillment correction | Orders owner | owner-approved cancellation/correction workflow with side-effect acknowledgements | `[MISSING: Orders post-fulfillment correction approval]` |
| Warehouse post-fulfillment operation | Warehouse owner | explicit `cancel` for cancellation/reversal or `return` for inventory return; no inference from refund alone | `[MISSING: post-fulfillment cancellation/return workflow mapping]` |
| Evidence redaction plan | Integration validator | no tokens, raw provider payloads, customer PII, raw DB rows, or payment secrets in artifacts | `[MISSING: approved redaction/evidence plan]` |

## Deterministic Component-Line Cleanup Packet

Future paid/provider cleanup must be driven by a packet with exactly one row per component reservation. This is source-defined only; it does not approve target ids, live reservation reads, or cleanup mutations.

| Field | Source | Required rule |
| --- | --- | --- |
| `bundleContractVersion` | Catalog/Orders evidence | must equal `catalog.bundle.v1` for audit only; must not be sent to Warehouse as stock identity |
| `orderId` | central Orders id | same value used by Warehouse reservation lifecycle calls |
| `channel` | checkout/channel owner | same value used when the reservation was created, for example `flipflop` |
| `productId` | Catalog component line | existing Catalog product id; never `bundleId` or synthetic bundle SKU |
| `warehouseId` | Warehouse allocation | existing Warehouse row id selected by the owner-approved target packet |
| `quantity` | Orders/Warehouse component allocation | exact reserved quantity; must be within the still-missing owner-approved max quantity |
| `reservationId` | Warehouse read or fulfillment handoff | required when available from fulfillment handoff; otherwise the live lookup must still resolve exactly one reservation row |
| `currentReservationStatus` | read-only Warehouse lookup | one of `active`, `fulfilled`, `released`, `cancelled`, `expired`, or `returned` at cleanup decision time |
| `approvedCleanupOperation` | this packet plus external owner event | `release`, `expire`, `cancel`, `return`, or `none` by state matrix; no aggregate bundle operation |
| `cleanupReasonCode` and `actor` | integration owner | redacted audit strings supplied by the approved runtime packet before any mutation |

The deterministic read path is Warehouse-owned source behavior: `GET /api/reservations/order/:orderId` returns reservation rows with `id`, `productId`, `warehouseId`, `quantity`, `orderId`, `channel`, and `status`. A future validator may use that read-only result to build the packet, but it must fail closed unless each component line matches exactly one row by `orderId + channel + productId + warehouseId + quantity` and, when provided, `reservationId`. Rows already in terminal cleanup states (`released`, `cancelled`, `returned`, `expired`) require `none` unless the owner-approved packet explicitly treats an idempotent replay as validation evidence.

Result: `[RESOLVED/NARROWED: deterministic Warehouse component-line cleanup packet for reserved-only, fulfilled, cancel, return, partial failure, and timeout states]`. Remaining unavailable facts stay explicit: `[RESOLVED/NARROWED: candidate target component stock rows and max component quantity are source-documented from Catalog packet]`, `[RESOLVED/NARROWED: live current target row readback at execution time captured through protected Warehouse API without mutation]`, `[RESOLVED/NARROWED: Warehouse hold/release duration is owner-approved for the bounded Goal 24 smoke as 15 minutes source-default TTL or shorter caller-supplied expiresAt]; [MISSING: exact selected Warehouse reservation lookup state for cleanup]`, `[RESOLVED/NARROWED: final owner approval before live Warehouse reservation mutation is bounded to one Goal 24 component-line smoke attempt with max quantity 1 per component after live readback]`, and `[MISSING: final integration owner approval before any live Warehouse cleanup mutation]`.


## 2026-07-04 Catalog Candidate Target Facts Reconcile

Catalog packet `/home/ssf/Documents/Github/catalog-microservice/docs/orchestrator/2026-07-03-goal24-paid-provider-smoke-approval-packet.md` source-documents candidate Warehouse target facts for the future paid/provider `catalog.bundle.v1` smoke: bundle `919be990-1c76-4f9c-b100-829281c6a709`, component products `ce4a51aa-2d12-4ab7-a965-7a36609d01fc` and `dbc51dde-fc66-4511-b178-f929183f4647`, Warehouse `c0de0000-0000-4000-8000-000000000013`, and max hold quantity `1` per component. [RESOLVED/NARROWED: candidate target component stock rows and max component quantity are source-documented from Catalog packet].

This is source-document reconciliation only. It does not prove live current stock rows at execution time, authorize any reservation, or renew the expired 2026-07-03 execution window. Runtime remains blocked by [RESOLVED/NARROWED: candidate target component stock rows and max component quantity are source-documented from Catalog packet]; [RESOLVED/NARROWED: live current target row readback at execution time captured through protected Warehouse API without mutation]; [RESOLVED/NARROWED: Warehouse hold/release duration is owner-approved for the bounded Goal 24 smoke as 15 minutes source-default TTL or shorter caller-supplied expiresAt]; [RESOLVED/NARROWED: final owner approval before live Warehouse reservation mutation is bounded to one Goal 24 component-line smoke attempt with max quantity 1 per component after live readback]; [MISSING: exact selected Warehouse reservation lookup state for cleanup].

## Fail-Closed Runtime Rules

- Do not create a live paid/provider bundle smoke if the renewed execution window, Warehouse hold/release duration, timeout cleanup owner, exact selected reservation lookup state, cleanup owner, or final redacted evidence is missing. Candidate Catalog target facts and max quantity are source-documented only: [RESOLVED/NARROWED: candidate target component stock rows and max component quantity are source-documented from Catalog packet]; [RESOLVED/NARROWED: live current target row readback at execution time captured through protected Warehouse API without mutation]; [RESOLVED/NARROWED: Warehouse hold/release duration is owner-approved for the bounded Goal 24 smoke as 15 minutes source-default TTL or shorter caller-supplied expiresAt]; [RESOLVED/NARROWED: final owner approval before live Warehouse reservation mutation is bounded to one Goal 24 component-line smoke attempt with max quantity 1 per component after live readback]; [MISSING: exact selected Warehouse reservation lookup state for cleanup].
- Do not fulfill Warehouse reservations unless Orders receives a Payments-owned completed status through the approved `orders.payment-status.v1` path.
- Do not release fulfilled reservations. Use `release` only for active holds before stock decrement.
- Do not use a Payments refund, correction, provider callback, or order status string by itself as Warehouse stock evidence.
- Do not call Warehouse `cancel` after fulfillment unless the approved event is order/provider cancellation or reversal and all side-effect acknowledgements are present.
- Do not call Warehouse `return` after fulfillment unless the approved event is an inventory-return workflow.
- Stop with `[MISSING: exact selected Warehouse reservation lookup state for cleanup]` when a component reservation cannot be resolved exactly once by the cleanup packet keys.
- Treat the 15-minute default reservation TTL as a source implementation fact only; it is not approval to run a paid/provider smoke for 15 minutes or with any nonzero quantity.

## 2026-07-04 Owner Approval Intake 004 - Bounded Warehouse Hold Window

Owner continuation approval in the Goal 24 integration thread is consumed as a Warehouse-scoped bounded approval only for the previously prepared `catalog.bundle.v1` smoke packet. It does not approve payment/provider calls, Fiobanka refund/reversal, Orders mutation, channel cleanup, deploy, migration, DB writes, secret output, raw customer/order/payment/provider evidence, aggregate bundle stock, or any unbounded Warehouse mutation.

Approved Warehouse runtime facts for one future Goal 24 attempt:

- Target bundle remains `catalog.bundle.v1 919be990-1c76-4f9c-b100-829281c6a709` with component products `ce4a51aa-2d12-4ab7-a965-7a36609d01fc` and `dbc51dde-fc66-4511-b178-f929183f4647`.
- Maximum Warehouse quantity remains `1` per component line and `2` total component units.
- Warehouse hold duration is the source default `15 minutes` from `DEFAULT_RESERVATION_TTL_MS = 15 * 60 * 1000`, unless the checkout caller supplies a shorter explicit `expiresAt`.
- Timeout cleanup owner is Warehouse TTL/expiry only after the approved hold expires; explicit smoke abort before TTL expiry must use `release` for active reserved-only component lines.
- Final Warehouse mutation approval is narrowed to this one bounded Goal 24 smoke attempt only and only after live current target row readback passes immediately before checkout.
- Any fulfilled or stock-decremented cleanup still requires Payments provider proof, Orders cancellation approval, side-effect acknowledgements, and the deterministic component-line cleanup packet before `cancel` or `return`.

[RESOLVED/NARROWED: Warehouse hold/release duration is owner-approved for the bounded Goal 24 smoke as 15 minutes source-default TTL or shorter caller-supplied expiresAt]
[RESOLVED/NARROWED: final owner approval before live Warehouse reservation mutation is bounded to one Goal 24 component-line smoke attempt with max quantity 1 per component after live readback]

Runtime still fails closed on `[RESOLVED/NARROWED: live current target row readback at execution time captured through protected Warehouse API without mutation]`, `[MISSING: exact selected Warehouse reservation lookup state for cleanup]`, `[MISSING: Payments provider proof and bank/refund authority before fulfilled cleanup]`, `[MISSING: exact Orders target order hash/state and sideEffectsHandled acknowledgements]`, and `[MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]`.

No aggregate bundle reservation, synthetic bundle SKU stock, or aggregate bundle cleanup operation is approved.

## Agent-Ready Approval Request

Objective: approve or reject one bounded paid/provider `catalog.bundle.v1` smoke packet.

Scope: provide owner-approved values for selected provider/method/environment, component product ids, warehouse ids, central Orders UUID strategy, max quantity, hold/release window, provider success/cancel/refund evidence source, Orders post-fulfillment correction workflow, Warehouse cleanup operation, redaction plan, validation owner, and abort criteria.

Allowed output: one approval document or signed handoff that answers every required fact above.

Forbidden actions: live checkout, live payment capture, provider refund/cancel/reversal, Warehouse reservation/fulfillment/release/cancel/return, DB writes, deployments, migrations, source edits, or marketplace mutations before the packet is approved.

Validation evidence expected after approval: source verifier pass, pre-smoke dry-run packet review, bounded runtime evidence with redacted ids/counts only, and post-smoke Warehouse/Orders/Payments cleanup proof.

Handoff: return the approved packet to the Catalog commerce integration owner and Warehouse reservation owner. If any required fact remains unavailable, keep paid/provider runtime progression blocked.

## Parallel Execution

| Workstream | Status | Owner role | Scope | Dependencies | Validation evidence | Handoff notes |
| --- | --- | --- | --- | --- | --- | --- |
| Warehouse cleanup approval packet | complete-source-docs | Warehouse reservation owner | this packet and static verifier | existing Warehouse lifecycle source evidence | verifier, focused tests, build, diff check | Ready for owner review; reserved-only, fulfilled, return, partial, and timeout operation choices are source-defined; max quantity and live hold/release window remain blocked. |
| Orders post-fulfillment correction approval | dependency-gated | Orders lifecycle owner | cancellation/correction workflow and side-effect acknowledgements | Payments refund/reversal evidence and Warehouse operation choice | `[MISSING: Orders validation evidence]` | Must not infer Warehouse stock effects from refund alone. |
| Payments completed-payment refund/reversal proof | dependency-gated | Payments provider owner | provider-specific refund, void, cancel, reversal, or unavailable decision | selected provider/method/environment | `[MISSING: Payments validation evidence]` | Must precede Orders/Warehouse post-fulfillment cleanup. |
| Owner-approved canary packet | final integration | Commerce validation owner | bounded paid/provider smoke with max quantity, hold window, rollback plan, redaction | all facts above | `[MISSING: owner-approved packet]` | Final integration only after owners sign off. |

Shared contracts: Catalog `catalog.bundle.v1`, Orders `orders.payment-status.v1`, Warehouse reservation lifecycle, Payments provider/refund boundary.

Integration owner: Catalog commerce integration owner until a dedicated paid/provider bundle smoke owner is assigned.

Validation owner: final integration validator.

Merge order: Payments provider evidence, Orders correction approval, Warehouse cleanup packet, channel/canary dry-run, final integration smoke.

## 2026-07-04 Cleanup Runtime-Values Consumption

[RESOLVED/NARROWED: Warehouse consumed Catalog fa88917, Payments 59be11e, Orders 8bb22e2, and FlipFlop 9a7c664 cleanup runtime-values sync; hold duration and one-attempt final bounded reservation approval are source-defined for packet planning only, while exact selected reservation lookup state remains missing]

Current Warehouse owner facts preserve the 15-minute source-default TTL/shorter expiresAt hold-duration approval and one-attempt final bounded reservation approval as source-defined packet-planning facts only. Runtime remains blocked by [MISSING: exact selected Warehouse reservation lookup state for cleanup], [MISSING: exact selected Orders cleanup packet runtime values and sideEffectsHandled acknowledgements], provider/bank proof, and final redacted evidence. Warehouse must not infer stock effects from Payments refund state, provider state, Auth token state, or channel cleanup state.
