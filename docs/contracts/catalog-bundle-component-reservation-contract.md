# Catalog Bundle Component Reservation Contract

```yaml
id: WH-CATALOG-BUNDLE-COMPONENT-RESERVATION
status: accepted-source-verified-no-deploy-paid-provider-blocked
owner: warehouse-reservation-owner
created: 2026-07-03
scope: Warehouse reservation behavior for Catalog catalog.bundle.v1 first ecosystem bundle selling
upstream:
  - /home/ssf/Documents/Github/catalog-microservice/docs/contracts/catalog-bundle-aggregate-v1.md
  - /home/ssf/Documents/Github/catalog-microservice/docs/contracts/catalog-bundle-commerce-contract.md
```

## Intent Preservation Chain

Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding Prompt -> Code -> Validation -> State Update

- Vision: Warehouse remains the stock and reservation authority for existing sellable Catalog product lines without taking bundle merchandising, checkout, order, or payment ownership.
- Goal Impact: resolves `[MISSING: Warehouse approval that first ecosystem bundle selling reserves component lines only]` for Catalog `catalog.bundle.v1` while keeping bundle identity in Catalog and order/payment effects in their owning services; narrows `[MISSING: owner-approved paid/provider checkout smoke with stock and refund/cancel rollback plan]` to cross-service owner approval because Warehouse can only approve the component-line stock lifecycle boundary.
- System: Catalog owns `bundleId` and component metadata; Orders/checkout submit normal product lines; Warehouse reserves stock rows by existing `productId`, `warehouseId`, quantity, order id, channel, actor, and reason; Payments remains amount/currency owner only through its accepted caller contract.
- Feature: source-verified Warehouse sign-off for first bundle-selling reservation semantics.
- Task: document and verify that bundle selling uses existing component-line reservation lifecycle and that bundle aggregate reservation attempts fail closed.
- Execution Plan: additive Warehouse docs, DTO guard, focused unit tests, and static verifier only; no migration, deploy, live stock mutation, Orders/Payments/FlipFlop call, Catalog edit, or Kubernetes change.
- Coding Prompt: reject `bundleId`, synthetic bundle SKU/stock, and bundle contract evidence as Warehouse reservation identity; prove existing component product reservation remains compatible.
- Code: `ReserveStockDto` and reservation lifecycle DTOs inherit explicit forbidden bundle aggregate fields; tests cover rejection and component-line forwarding; verifier checks source/docs boundaries.
- Validation: non-mutating local source validation only: focused Jest, static verifier, build, and `git diff --check`.
- State Update: `[RESOLVED: Warehouse approval that first ecosystem bundle selling reserves component lines only]`; `[MISSING: owner-approved paid/provider checkout smoke with stock and refund/cancel rollback plan]` remains blocked beyond existing pending-order reservation/release evidence.

## Accepted Reservation Behavior

For `catalog.bundle.v1`, Warehouse accepts only normal component product reservation lines. A bundle sale must be decomposed before Warehouse into existing reservation requests, one per reservable component product/warehouse allocation:

```json
{
  "productId": "catalog-component-product-id",
  "warehouseId": "warehouse-1",
  "quantity": 1,
  "orderId": "central-order-id",
  "channel": "flipflop",
  "reasonCode": "CHECKOUT_HOLD",
  "reference": "cart-or-order-line-reference"
}
```

Warehouse must reserve, release, fulfill, cancel, expire, and return each component line through the existing reservation lifecycle. If a downstream checkout/order path treats multiple component reservations as one bundle sale, that grouping is external evidence owned by Catalog/Orders and must not replace Warehouse stock identity.

Warehouse must not reserve `bundleId`, create synthetic bundle SKU/stock, infer bundle eligibility, calculate bundle pricing, mutate live stock in validation, or call Orders, Payments, FlipFlop, Catalog, or marketplace services from this sign-off. If any component reservation fails, the caller-owned checkout/order workflow must fail closed and compensate already reserved component lines using the existing release/cancel lifecycle.

## Component-Line Stock Effect Evidence

This source-only readiness pass proves the Warehouse-owned rollback mapping for each component product line, not an end-to-end paid/provider checkout. Evidence is static source plus unit coverage only; it does not prove live provider, Orders, Payments, refund, or checkout orchestration behavior.

| Component-line stage | Warehouse source path | Stock effect | Source evidence | Paid/provider readiness result |
| --- | --- | --- | --- | --- |
| Checkout hold | `StockService.reserveStock` | increases `reserved`, decreases `available`, writes `active` reservation and `reserve` movement | `test/stock.service.spec.ts` covers `creates a reservation row and increases reserved stock on checkout hold`; `test/reservations.service.spec.ts` covers component-line forwarding | source-proven for component lines |
| Pre-fulfillment release/payment failure | `StockService.unreserveStock` / `ReservationsService.release` | decreases `reserved`, restores `available`, writes `released` reservation and `unreserve` movement | `test/stock.service.spec.ts` covers `releases reserved stock on payment failure`; Catalog Rung 2 proved pending-order cleanup release only | source-proven; live paid/provider release still gated |
| Payment/provider success fulfillment | `StockService.fulfillReservation` | decreases both `reserved` and `quantity`, keeps `available` consistent, writes `fulfilled` reservation and `fulfill` movement | `test/stock.service.spec.ts` covers `deducts stock and clears the hold on payment success` and replay no-op | source-proven only; live provider success mapping remains `[MISSING: ...]` |
| Timeout before fulfillment | `StockService.expireReservation` | decreases `reserved`, restores `available`, writes `expired` reservation | `test/stock.service.spec.ts` covers `expires a timed-out reservation and releases reserved stock` | source-proven for component holds |
| Cancel after fulfillment | `StockService.cancelReservation` | restocks `quantity`, keeps `reserved=0`, writes `cancelled` reservation | `test/stock.service.spec.ts` covers `restocks a fulfilled reservation when an order cancellation is reversed` | source-proven only; business approval and refund source event remain `[MISSING: ...]` |
| Return after fulfillment | `StockService.returnReservation` | restocks `quantity`, keeps `reserved=0`, writes `returned` reservation and `return` movement | `test/stock.service.spec.ts` covers `restocks inventory for a fulfilled reservation return` | source-proven only; provider/refund/return authorization remains `[MISSING: ...]` |
| Aggregate bundle identity attempt | `ReserveStockDto` / `ReservationLifecycleDto` | rejected before stock identity mutation | `test/reservations.service.spec.ts` covers bundle aggregate rejection; verifier checks DTO forbidden fields | fail-closed source boundary |

Result: `[RESOLVED: Warehouse source evidence for component-line stock hold/release/fulfill/cancel/return mapping]` for existing component product reservations. The original runtime blocker is only narrowed, not globally cleared: `[MISSING: owner-approved paid/provider checkout smoke with stock and refund/cancel rollback plan]` and `[MISSING: Orders/Payments provider-success, provider-cancel, refund, and post-fulfillment cancellation event contract that maps to Warehouse fulfill/cancel/return calls]` still block any live paid/provider stock effect.

## Paid/Provider Checkout Smoke Boundary

Warehouse cannot approve a paid/provider bundle checkout smoke beyond the already recorded pending-order reservation and release evidence unless the integration owner provides an owner-approved cross-service plan. The Warehouse-owned part of that plan is limited to component-line stock effects:

- pending checkout: create or update `active` component reservations only after Orders/checkout submits normal product lines with `productId`, `warehouseId`, `quantity`, `orderId`, `channel`, actor, and reason evidence;
- payment/provider success: transition each active component reservation to `fulfilled`, which decrements `reserved` and `quantity` transactionally for that component line;
- payment failure, provider cancel, or checkout timeout before fulfillment: transition each active component reservation through `release`, `cancel`, or `expire`, which removes the hold without decrementing stock;
- refund/cancel after fulfillment: use the existing fulfilled-reservation reversal path (`cancel` or `return`) only after Orders/Payments define the refund/cancel source event, idempotency key, and business approval state;
- partial component failure: fail closed at the caller-owned workflow layer and compensate any prior component-line holds through Warehouse release/cancel calls.

Warehouse does not own provider payment status, refund authorization, order cancellation policy, bundle pricing, external marketplace publication, customer communication, or the end-to-end paid smoke decision. Until those owner-approved inputs exist, runtime paid/provider progression for `catalog.bundle.v1` remains blocked and must not be inferred from this source sign-off.

## Fail-Closed Source Boundary

The reservation DTO boundary explicitly rejects these aggregate identity fields when present on reservation or reservation-lifecycle requests:

- `bundleId`
- `bundleSku`
- `bundleStockId`
- `bundleContractVersion`

The global Nest validation pipe uses `whitelist: true` and `forbidNonWhitelisted: true`; the explicit forbidden fields add a stable error message for bundle aggregate attempts instead of silently accepting bundle evidence as stock identity.

Normal component reservation compatibility is preserved: existing `productId`, `warehouseId`, `quantity`, `orderId`, `channel`, `reasonCode`, `actor`, and `reference` fields continue to forward to `StockService.reserveStock` unchanged.

## Remaining Blockers

- `[RESOLVED: Orders additive bundleEvidence metadata contract on create-order and idempotent replay]`
- `[RESOLVED: Payments bounded bundle metadata allowlist test covering free-shipping evidence without pricing authority]`
- `[RESOLVED: FlipFlop adoption contract for catalog.bundle.v1 read/display before ecosystem checkout]`
- `[RESOLVED: owner-approved Catalog bundle aggregate migration application/deploy/runtime smoke]`
- `[RESOLVED: owner-approved Rung 1 non-mutating real checkout smoke credentials and target products]`
- `[RESOLVED: owner-approved Rung 2 live pending-order smoke proved pending Orders create, Warehouse reservation, and payment-status cleanup release]`
- `[MISSING: owner-approved paid/provider checkout smoke with stock and refund/cancel rollback plan]`
- `[MISSING: Orders/Payments provider-success, provider-cancel, refund, and post-fulfillment cancellation event contract that maps to Warehouse fulfill/cancel/return calls]`
- `[MISSING: final integration owner approval before any live Warehouse reservation, fulfillment, decrement, cancel, return, or release smoke]`

## Parallel Execution

| Workstream | Status | Owner role | Scope | Dependencies | Validation evidence | Handoff notes |
| --- | --- | --- | --- | --- | --- | --- |
| Warehouse component reservation sign-off | complete | Warehouse reservation owner | this contract, DTO guard, focused tests, static verifier | Catalog `catalog.bundle.v1` contracts | focused Jest, stock-service lifecycle tests, verifier, build, diff check | Safe to hand to Catalog/Orders integration as Warehouse component-line source evidence. |
| Warehouse paid/provider rollback verifier | dependency-gated | Warehouse reservation owner | prove source mapping for hold/release/fulfill/cancel/return without live mutation | Orders/Payments status mapping and approved stock window | stock-service lifecycle tests, verifier, build, diff check | Runtime smoke remains blocked until owner-approved canary facts and rollback packet exist. |
| Orders bundle evidence contract | dependency-gated outside this repo | Orders contract owner | additive order metadata only | Warehouse sign-off plus Catalog aggregate | `[MISSING: Orders validation evidence]` | Must preserve normal item lines. |
| Payments metadata allowlist | dependency-gated outside this repo | Payments boundary owner | audit metadata only | Orders metadata contract | `[MISSING: Payments validation evidence]` | Must preserve caller-owned amount/currency. |
| Final checkout smoke | final integration | Commerce integration validator | paid/provider smoke with rollback plan | Catalog/Orders/Warehouse/Payments/FlipFlop contracts, provider/refund/cancel mapping, owner credentials | `[MISSING: owner-approved paid/provider checkout smoke with stock and refund/cancel rollback plan]` | Warehouse must not run or approve live stock effects outside the owner-approved integration plan. |

Shared contracts: Catalog bundle aggregate/commerce contracts, Orders create-order metadata contract, Payments payment-validation metadata contract, and Warehouse reservation lifecycle.

Integration owner: Catalog commerce integration owner until a dedicated bundle-selling owner is assigned.

Validation owner: final integration validator.

Merge order: Catalog aggregate, Orders metadata, Warehouse sign-off, Payments allowlist, FlipFlop display/smoke, final integration.
