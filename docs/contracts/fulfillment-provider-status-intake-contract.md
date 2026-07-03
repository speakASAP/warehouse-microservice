# Fulfillment Provider Status Intake And Allegro Snapshot Consumer Contract

```yaml
id: WH-ALLEGRO-SHIPMENT-SNAPSHOT-CONSUMER
status: draft-contract-gated
owner: warehouse-fulfillment-owner
created: 2026-07-03
last_updated: 2026-07-03
completeness_level: partial
source_contract:
  provider: allegro
  name: allegro.shipment_status_snapshot.v1
  source_commit: e626e5c
upstream:
  - docs/contracts/fulfillment-handoff-contract.md
  - docs/orchestrator/STATUS.md
  - src/fulfillment/fulfillment-order.entity.ts
  - src/fulfillment/fulfillment-orders.service.ts
  - allegro-service commit e626e5c source-only snapshot verifier
  - orders-microservice/docs/orchestrator/2026-07-03-delivery-provider-shipment-status-plan.md
downstream:
  - docs/orchestrator/STATUS.md
  - docs/IMPLEMENTATION_STATE.md
related_adrs: []
```

## Intent Chain

- Vision: customers and operators should see accurate delivery progress after Warehouse hands a parcel to a carrier without making Orders or Warehouse store raw provider payloads, tracking numbers, tracking URLs, customer data, or credentials.
- Goal Impact: Allegro-origin orders can later move from Warehouse handoff into delivery lifecycle updates through a bounded Warehouse consumer for read-only Allegro shipment status snapshots.
- System: Allegro owns provider API calls, OAuth scopes, credentials, raw shipment payloads, snapshot verification, provider retry semantics, and redaction before cross-service handoff. Warehouse owns fulfillment-order status, snapshot intake validation, transition enforcement, and any Warehouse-side ledger decision. Orders owns lifecycle projection/events through the existing Warehouse fulfillment status callback.
- Feature: Warehouse-owned consumer contract for `allegro.shipment_status_snapshot.v1` after Warehouse fulfillment reaches `handed_to_delivery`.
- Task: define accepted snapshot envelope, status mapping, idempotency/ledger expectations, redaction policy, rejection rules, Orders lifecycle callback role, and exact gates before runtime implementation.
- Execution Plan: documentation-only in this Worker H slice. Do not add runtime consumer code, DB migrations, fake provider calls, deploy changes, secrets, or live calls. Implementation remains blocked until the missing Warehouse consumer/runtime adapter and ledger/correlation decisions are approved.
- Coding Prompt: remote-only on Alfares; allowed files are Warehouse docs/status docs only. Forbidden changes include Orders or Allegro repo edits, `src/**`, migrations, Kubernetes/deploy scripts, package scripts, DB/secret reads, live Allegro calls, and raw tracking persistence.
- Code: documentation only in this slice.
- Validation: `git diff --check`, repository docs/source inspection around fulfillment status intake and fulfillment order service, and any safe docs-only/static checks discovered in repo scripts.

## Current Evidence

Warehouse already owns the fulfillment-order status model:

- `src/fulfillment/fulfillment-order.entity.ts` includes `handed_to_delivery`, `in_delivery`, `delivered`, `not_delivered`, `returned`, and `statusReference`.
- `src/fulfillment/fulfillment-orders.service.ts` guards transitions as `formed -> handed_to_delivery -> in_delivery -> delivered/not_delivered`, with `returned` allowed from post-handoff states.
- `POST /api/fulfillment-orders/order/:orderId/status` stores bounded status metadata and best-effort syncs to Orders.
- Orders read-only evidence in the existing Warehouse docs says `PUT /api/orders/:id/warehouse-fulfillment-status` accepts bounded Warehouse statuses, `reasonCode`, `actor`, `reference`, `fulfillmentOrderId`, and `occurredAt`, then maps `in_delivery -> in_delivery`, `delivered -> received`, and `not_delivered -> not_received`.

Allegro now has a source-only verifier contract in commit `e626e5c`:

- Contract name: `allegro.shipment_status_snapshot.v1`.
- Snapshot identity fields are hashed for account, order, shipment, and waybill ids.
- Snapshot statuses are bounded by the Allegro verifier before Warehouse sees them.
- Snapshot includes `sourceRead.status`, `sourceRead.reason`, `packageCount`, `latestStatus`, `latestStatusAt`, and `trackingUpdatedAt`.
- Snapshot excludes raw provider payloads, tracking numbers, tracking URLs, and provider document URLs.

Warehouse now has a source-only provider-status ledger and sanitized snapshot adapter mapper. It still has no runtime consumer loop, correlation resolver, status mutation path, deployed migration, or live provider intake. Orders must continue to treat runtime shipment-status consumption as gated.

## Accepted Snapshot Envelope

The future Warehouse consumer must accept a normalized read-only snapshot envelope, not a raw Allegro webhook, raw polling response, or provider shipment object.

Contract target:

```json
{
  "contract": "allegro.shipment_status_snapshot.v1",
  "provider": "allegro",
  "sourceChannel": "allegro",
  "identity": {
    "accountIdHash": "sha256:...",
    "orderIdHash": "sha256:...",
    "shipmentIdHash": "sha256:...",
    "waybillIdHash": "sha256:..."
  },
  "sourceRead": {
    "status": "ok",
    "reason": "shipment_status_read"
  },
  "packageCount": 1,
  "latestStatus": "IN_TRANSIT",
  "latestStatusAt": "2026-07-03T00:00:00.000Z",
  "trackingUpdatedAt": "2026-07-03T00:00:00.000Z",
  "observedAt": "2026-07-03T00:00:01.000Z"
}
```

Warehouse consumer rules:

- `contract` must be exactly `allegro.shipment_status_snapshot.v1` until a new version is approved.
- `provider` and `sourceChannel` must both be `allegro`.
- `identity.accountIdHash`, `identity.orderIdHash`, `identity.shipmentIdHash`, and `identity.waybillIdHash` must be hash strings from the Allegro verifier, not raw identifiers.
- `sourceRead.status` and `sourceRead.reason` must be bounded verifier outputs; Warehouse must not infer success from transport success alone.
- `latestStatus` must map to a Warehouse post-handoff status through the bounded mapping table below.
- `latestStatusAt`, `trackingUpdatedAt`, and `observedAt` must be ISO timestamps when present.
- `packageCount` must be a non-negative integer. Multiple packages do not create multiple Warehouse fulfillment orders unless a future approved mapping says so.
- The snapshot must not include provider payload blobs, tracking numbers, tracking URLs, customer identity/address/contact fields, labels, documents, OAuth credentials, cookies, authorization headers, or raw marketplace shipment/package objects.

## Correlation To Fulfillment Orders

Warehouse status updates still require the central `fulfillment_orders.order_id` and existing status transition guard. The Allegro snapshot contract only exposes hashed provider identities, so Warehouse cannot safely update a fulfillment order from the snapshot alone.

Required correlation gate:

- `[MISSING: Warehouse consumer/runtime adapter for read-only shipment snapshots that resolves a verified Allegro snapshot to exactly one Warehouse fulfillment order without persisting raw provider identifiers.]`
- `[MISSING: approved correlation source between Allegro hashed order/shipment/waybill identity and fulfillment_orders.order_id or an approved Warehouse-owned shipment correlation table.]`
- `[MISSING: collision/replay handling when a snapshot hash set matches zero or more than one fulfillment order.]`

Until those gates are closed, the only approved Warehouse action is documentation and offline contract review.

## Status Mapping After `handed_to_delivery`

Warehouse must ignore or reject snapshot status updates unless the matched fulfillment order is already `handed_to_delivery` or later.

Accepted mapping after `handed_to_delivery`:

| Allegro snapshot class | Warehouse status | Orders lifecycle projection | Notes |
| --- | --- | --- | --- |
| source read unavailable or not authorized | no status transition | unchanged | Record only in adapter/ledger diagnostics after approval; do not call Orders. |
| shipment created but no carrier movement | no status transition | unchanged | Warehouse remains `handed_to_delivery`; do not regress or invent movement. |
| in transit / carrier accepted / delivery in progress | `in_delivery` | `in_delivery` | Normal movement after carrier handoff. |
| delivered / picked up by recipient | `delivered` | `received` | Terminal successful delivery. |
| delivery failed / not delivered / refused / undeliverable | `not_delivered` | `not_received` | Terminal failed delivery unless a later return is confirmed. |
| returned / return in progress / returned to sender | `returned` | `returned` | Return remains explicit and may follow post-handoff states. |

Existing Warehouse transition constraints still apply:

- `handed_to_delivery -> in_delivery`
- `handed_to_delivery -> returned`
- `in_delivery -> delivered`
- `in_delivery -> not_delivered`
- `in_delivery -> returned`
- `delivered -> returned`
- `not_delivered -> returned`

Rejected transitions:

- Any snapshot update before Warehouse status is `handed_to_delivery`.
- Direct `handed_to_delivery -> delivered` or `handed_to_delivery -> not_delivered` unless an explicit mapping exception is approved for Allegro statuses that lack a reliable in-delivery equivalent.
- Reverse movement such as `in_delivery -> handed_to_delivery`, `delivered -> in_delivery`, or `not_delivered -> in_delivery`.
- Any Allegro `latestStatus` that cannot be mapped to `in_delivery`, `delivered`, `not_delivered`, `returned`, or no-op.
- Any update where `sourceRead.status` indicates the source was not read successfully, except for approved diagnostics/ledger storage that does not call Orders.

## Idempotency And Ledger Expectations

The future consumer must be idempotent before it calls the existing Warehouse status endpoint.

Minimum logical idempotency key:

```text
contract + provider + sourceChannel + accountIdHash + orderIdHash + shipmentIdHash + waybillIdHash + latestStatus + latestStatusAt + trackingUpdatedAt
```

Required semantics:

- Replaying the same key with the same normalized Warehouse status is idempotent.
- Replaying the same key with different normalized status, timestamps, package count, or source-read result is a conflict and must not call Orders.
- A new key with a valid forward transition may advance the fulfillment order once correlation is approved.
- A new key with stale timestamps or reverse movement must be rejected or recorded as no-op, not projected to Orders.
- `sourceRead.status != ok` must be deduped separately from successful status snapshots and must not advance Warehouse fulfillment status.
- Snapshot dedupe must survive process restarts before runtime implementation is accepted.

Current implementation state: Warehouse has a source-only provider-status observation ledger and snapshot adapter mapper, but no deployed migration, no correlation resolver, and no status-mutating runtime consumer. Runtime updates remain blocked until correlation and deploy gates close.

## Redaction Policy

Warehouse must treat the Allegro verifier output as already redacted but still fail closed if unsafe fields appear.

Allowed snapshot fields:

- contract/version
- provider/source channel
- hashed account/order/shipment/waybill ids
- bounded `sourceRead.status` and `sourceRead.reason`
- bounded `latestStatus`
- `packageCount`
- `latestStatusAt`
- `trackingUpdatedAt`
- `observedAt`

Forbidden fields:

- raw Allegro account id, order id, shipment id, waybill id, package id, or provider event id
- tracking number
- tracking URL
- provider webhook body
- provider polling response body
- marketplace raw shipment/package object
- carrier raw payload
- provider label/document URL or binary document reference
- OAuth token, refresh token, API key, secret, cookie, authorization header
- customer address, customer name, email, phone, buyer account id, recipient identity, or delivery address

The bounded Warehouse status sync to Orders must continue to include only Warehouse status, reason, actor/service identity, bounded reference, fulfillment order id, and timestamp. Orders lifecycle events and Notifications must not receive Allegro snapshot identity hashes unless an explicit Orders event contract is approved.

## Rejection Rules

The future consumer must reject and not persist/project a snapshot when any of these are true:

- Unknown `contract` or version.
- Provider or source channel is not `allegro`.
- Required identity hash is missing, malformed, or raw-looking.
- Any forbidden raw provider, tracking, credential, or customer field is present.
- `sourceRead.status` is missing, unknown, or not successful for a status-advancing update.
- `latestStatus` is missing or cannot map to a bounded Warehouse status/no-op.
- Timestamp fields are malformed or violate approved stale/replay limits.
- `packageCount` is negative or not an integer.
- Snapshot correlation finds zero fulfillment orders, more than one fulfillment order, or a fulfillment order not yet at `handed_to_delivery`.
- The normalized Warehouse transition would violate the existing fulfillment transition graph.
- The idempotency ledger detects a same-key/different-content conflict.

## Role Of Orders Lifecycle Callback

Orders must not consume Allegro shipment snapshots directly in this lane. The expected runtime flow after missing gates close is:

1. Allegro verifies and redacts `allegro.shipment_status_snapshot.v1`.
2. Warehouse consumer validates snapshot contract, redaction, correlation, idempotency, and status mapping.
3. Warehouse advances only its own fulfillment order status when the transition is valid.
4. Existing Warehouse callback calls Orders `PUT /api/orders/:id/warehouse-fulfillment-status` with bounded Warehouse metadata.
5. Orders projects lifecycle/events from Warehouse status only.

This keeps Orders lifecycle callback as the projection bridge and avoids moving provider API ownership or raw shipment data into Orders.

## Exact Missing Gates

- `[PARTIAL: source-only sanitized snapshot adapter mapper exists; runtime consumer loop remains missing]`
- `[MISSING: approved Warehouse shipment snapshot ledger or adapter-owned durable idempotency store]`
- `[MISSING: approved correlation source between Allegro hashed order/shipment/waybill identity and exactly one Warehouse fulfillment order]`
- `[MISSING: approved Allegro latestStatus to Warehouse status mapping fixture set for in-delivery, delivered, not-delivered, returned, and no-op classes]`
- `[MISSING: explicit exception decision for direct handed_to_delivery -> delivered/not_delivered if Allegro lacks an in-delivery equivalent]`
- `[MISSING: rejection test fixtures proving raw tracking numbers, URLs, provider payloads, credentials, and customer/contact/address fields are excluded]`
- `[MISSING: Orders lifecycle callback verification after Warehouse consumer implementation, proving no Allegro snapshot hashes/raw fields enter Orders events]`
- `[MISSING: owner-approved runtime implementation task before any Warehouse src/**, migration, secret, deploy, or live-call work]`

## Validation Commands

Validation run for this slice:

```bash
git diff --check
npm run check:hosted-auth
```

`npm run check:hosted-auth` is not shipment-specific; it is the only discovered safe repository static checker and remains a general Auth contract smoke.

Recommended implementation validation after the missing gates close:

```bash
npm test -- --runInBand test/fulfillment-orders.service.spec.ts
npm run build
git diff --check
```

## Parallel Execution

| Workstream | Status | Owner role | Allowed files | Forbidden files/actions | Dependencies | Expected output | Validation evidence | Handoff notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Allegro source verifier | complete upstream premise | Allegro provider owner | Allegro source/docs in commit `e626e5c` | Warehouse/Orders edits from that lane | none for docs; runtime still gated | `allegro.shipment_status_snapshot.v1` with hashed ids and redacted bounded fields | Allegro source-only verifier evidence from upstream commit | Warehouse treats this as input contract only, not runtime readiness. |
| Worker H Warehouse consumer contract | complete in this docs-only slice | Warehouse fulfillment owner | `docs/**` | `src/**`, migrations, deploys, secrets, live calls, Orders/Allegro repos | Allegro verifier premise from `e626e5c` | bounded consumer contract, mapping, redaction, idempotency/ledger expectations, rejection rules, gates | `git diff --check`, safe static checker | No runtime code until missing gates close. |
| Warehouse runtime consumer | blocked | Warehouse fulfillment owner | future approved `src/**`, tests, migration only if ledger approved | fake provider calls, raw provider persistence, deploy without owner approval | all missing gates above | implemented consumer/ledger/correlation with tests | focused tests, build, diff check, sensitive-field fixtures | Must preserve existing fulfillment transition graph. |
| Orders lifecycle verification | final integration | Orders lifecycle owner | Orders verifier/docs only after Warehouse consumer implementation | direct Allegro snapshot ingestion, raw tracking fields, DB migrations unless approved | Warehouse runtime evidence | proof Orders receives only bounded Warehouse callback | Orders callback/event tests | Existing callback remains the projection bridge. |

Shared contracts: Allegro snapshot verifier contract, Warehouse fulfillment status transition graph, Orders fulfillment status callback.
Integration owner: Orders lifecycle orchestrator.
Validation owner: final integration lane after Warehouse runtime implementation exists.
Merge order: Allegro verifier contract, Warehouse docs contract, Warehouse runtime consumer/ledger if approved, Orders lifecycle verifier, Notifications/event verification if event copy changes.

## Change Notes

- 2026-07-03: Worker F created the documentation-only bounded Warehouse intake contract for generic Allegro-origin provider status updates.
- 2026-07-03: Worker H updated the contract for Allegro's `allegro.shipment_status_snapshot.v1` source-only verifier, documenting hashed identity fields, source-read status, package/status timestamps, redaction, rejection rules, idempotency/ledger expectations, Orders callback role, and runtime gates.


## Source Adapter Checkpoint

Warehouse source now contains `FulfillmentProviderStatusSnapshotAdapterService` for sanitized Allegro shipment snapshot mapping. The adapter:

- accepts only `allegro.shipment_status_snapshot.v1`;
- requires an already-resolved `centralOrderId` and `fulfillmentOrderId`;
- rejects raw-looking identifiers and raw tracking/provider/customer fields before ledger writes;
- maps bounded Allegro snapshot classes to Warehouse candidate statuses or no-op diagnostics;
- records only a provider-status ledger observation through `FulfillmentProviderStatusLedgerService`;
- does not resolve correlation, update `fulfillment_orders.status`, call Orders, read Allegro/provider APIs, deploy, or run migrations.

Runtime consumer work remains gated by correlation, retry/dead-letter, tracking visibility, deployment, and smoke approval.
