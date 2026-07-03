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
- Goal Impact: addresses the Warehouse-owned operation-selection part of `[MISSING: owner-approved operation for reserved-only, fulfilled/stock-decremented, return, partial component failure, and timeout states, including max quantity and hold/release window]`; reserved-only, fulfilled/stock-decremented, return, partial component failure, and timeout/expiry operation choices are source-policy resolved/narrowed, while max quantity and the live hold/release window remain owner-approval blockers. It also addresses `[MISSING: owner-approved post-fulfillment cancellation/return workflow that maps a Payments refund or correction to Orders and Warehouse without inferring stock effects]` as far as source/docs can safely prove.
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

`[MISSING: owner-approved operation for reserved-only, fulfilled/stock-decremented, return, partial component failure, and timeout states, including max quantity and hold/release window]` is narrowed: Warehouse source-policy approves the operation choice for reserved-only (`release`), fulfilled cancellation (`cancel`), fulfilled inventory return (`return`), partial component failure (line-by-line by current reservation state), and timeout (`expire` only under Warehouse TTL/expiry ownership; otherwise explicit smoke abort cleanup uses `release`). The same blocker remains unresolved for live max quantity, selected target stock rows, target order ids, hold/release duration, timeout/TTL override, and rollback owner for a paid/provider canary.

`[MISSING: owner-approved Warehouse stock hold/release window and max quantity]` remains unresolved. Warehouse source has `DEFAULT_RESERVATION_TTL_MS = 15 * 60 * 1000` and accepts an explicit `expiresAt`, but that is implementation behavior, not owner approval for a live canary window or maximum quantity.

`[MISSING: owner-approved post-fulfillment cancellation/return workflow that maps a Payments refund or correction to Orders and Warehouse without inferring stock effects]` remains unresolved. Warehouse can approve `cancel` versus `return` only after an external owner-approved event identifies whether the real-world business event is cancellation/reversal or inventory return. A refund alone is not inventory-return evidence and must not be used to infer Warehouse stock effects.

Runtime paid/provider bundle progression must stay blocked until both missing approvals are supplied and accepted by the integration owner.

## Required Owner Approval Packet

The next owner-approved packet must name these facts before any live stock effect:

| Required fact | Owner | Required value | Current status |
| --- | --- | --- | --- |
| Selected provider and payment method | Payments/provider owner | Stripe, Fiobanka QR, PayPal, WebPay, PayU, or another named method, plus sandbox/live mode | `[MISSING: selected paid/provider method and environment]` |
| Stock hold window | Commerce/Warehouse owner | maximum hold duration, expiry owner, cleanup owner if the smoke aborts before fulfillment, and whether timeout cleanup uses Warehouse expiry or explicit release | `[MISSING: owner-approved Warehouse stock hold/release window and max quantity]` |
| Maximum Warehouse quantity | Commerce/Warehouse owner | exact maximum component quantity per product line and maximum total units across the smoke | `[MISSING: owner-approved Warehouse stock hold/release window and max quantity]` |
| Timeout-state cleanup owner | Commerce/Warehouse owner | owner-approved choice between TTL/expiry-owned `expire` and explicit abort-owned `release` for active holds | `[RESOLVED/NARROWED: Warehouse source operation is defined; live owner selection remains missing]` |
| Target product/reservation scope | Catalog/Warehouse owner | component product ids, warehouse ids, order id strategy, and deterministic reservation lookup | `[MISSING: target component stock rows and deterministic cleanup lookup]` |
| Provider success evidence | Payments owner | bounded proof that production-equivalent provider/callback path reports `completed` to Orders | narrowed for source only; runtime packet still required |
| Provider cancel/failure evidence before fulfillment | Payments owner | bounded proof that `failed` or `cancelled` reaches Orders and maps to Warehouse `release` | narrowed for source only; runtime packet still required |
| Completed-payment refund/reversal evidence | Payments owner | approved provider refund, void, cancel, reversal, or `[MISSING: provider-side cancellation unavailable]` | `[MISSING: completed-payment refund/reversal workflow]` |
| Orders post-fulfillment correction | Orders owner | owner-approved cancellation/correction workflow with side-effect acknowledgements | `[MISSING: Orders post-fulfillment correction approval]` |
| Warehouse post-fulfillment operation | Warehouse owner | explicit `cancel` for cancellation/reversal or `return` for inventory return; no inference from refund alone | `[MISSING: post-fulfillment cancellation/return workflow mapping]` |
| Evidence redaction plan | Integration validator | no tokens, raw provider payloads, customer PII, raw DB rows, or payment secrets in artifacts | `[MISSING: approved redaction/evidence plan]` |

## Fail-Closed Runtime Rules

- Do not create a live paid/provider bundle smoke if max quantity, hold window, timeout cleanup owner, target component stock rows, or cleanup owner is missing.
- Do not fulfill Warehouse reservations unless Orders receives a Payments-owned completed status through the approved `orders.payment-status.v1` path.
- Do not release fulfilled reservations. Use `release` only for active holds before stock decrement.
- Do not use a Payments refund, correction, provider callback, or order status string by itself as Warehouse stock evidence.
- Do not call Warehouse `cancel` after fulfillment unless the approved event is order/provider cancellation or reversal and all side-effect acknowledgements are present.
- Do not call Warehouse `return` after fulfillment unless the approved event is an inventory-return workflow.
- Stop with `[MISSING: deterministic Warehouse component reservation state for cleanup]` when a component reservation cannot be resolved exactly once.
- Treat the 15-minute default reservation TTL as a source implementation fact only; it is not approval to run a paid/provider smoke for 15 minutes or with any nonzero quantity.

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
