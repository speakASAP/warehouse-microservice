# Fulfillment Provider Status Ledger And Timestamp Policy

```yaml
id: WH-FULFILLMENT-PROVIDER-STATUS-LEDGER-POLICY
status: provisional-contract-gated
owner: warehouse-fulfillment-owner
created: 2026-07-03
last_updated: 2026-07-03
completeness_level: partial
applies_to:
  - docs/contracts/allegro-checkout-fulfillment-status-mapping.md
  - docs/contracts/fulfillment-provider-status-intake-contract.md
runtime_state: source_implemented_not_deployed
```

## Intent Chain

- Vision: Warehouse must consume marketplace/provider fulfillment status evidence exactly once, in order, without storing raw provider, tracking, credential, or customer payloads.
- Goal Impact: future provider adapters can update Warehouse fulfillment status safely and Orders/customer/admin projections can trust the bounded Warehouse callback.
- System: provider/source services own raw provider payloads and credentials; Orders owns central order lifecycle and paid handoff; Warehouse owns the durable fulfillment-order status authority and adapter observation ledger.
- Feature: durable Warehouse-owned ledger and timestamp/replay policy for sanitized provider status observations.
- Task: define the write ownership, minimal persistence shape, timestamp ordering rules, rejection behavior, and next implementation gate before any runtime adapter or migration.
- Execution Plan: documentation-only contract. Do not create a DB table, service, migration, adapter, deploy, live provider read, secret read, or production fulfillment mutation in this slice.
- Coding Prompt: remote-only on Alfares in warehouse-microservice; docs/status updates only; preserve raw-provider exclusion and Warehouse transition graph.
- Code: contract documentation plus source-only ledger foundation in `src/fulfillment/fulfillment-provider-status-observation.entity.ts`, `src/fulfillment/fulfillment-provider-status-ledger.service.ts`, `src/migrations/1781600000000-CreateFulfillmentProviderStatusObservations.ts`, and `test/fulfillment-provider-status-ledger.service.spec.ts`.
- Validation: `git diff --check`, hosted auth static checker.

## Ownership Decision

The durable provider-status observation ledger must be Warehouse-owned.

Reasons:

- Warehouse is the only service allowed to mutate `fulfillment_orders.status`.
- Orders should receive only bounded Warehouse lifecycle callbacks and must not become a raw Allegro/provider status processor.
- Allegro and other marketplace services should remain source owners for raw provider reads, redaction, source hashing, and sanitized event/projection production.
- The ledger must live beside Warehouse transition validation so idempotency, replay rejection, and status-order checks are evaluated with the same rules that protect fulfillment orders.

The future ledger must not store raw provider payloads, raw tracking numbers, tracking URLs, carrier credentials, labels, documents, customer names, customer contacts, delivery addresses from provider payloads, or raw marketplace shipment/package objects.

## Minimal Ledger Shape

A future migration can implement this as a table such as `fulfillment_provider_status_observations`, but the table name is intentionally not approved by this docs-only slice.

Required logical fields:

| Field | Purpose | Sensitive-data rule |
| --- | --- | --- |
| `id` | Warehouse observation row id | Warehouse-generated only. |
| `idempotencyKey` | stable replay key for one sanitized observation | Must be derived from sanitized ids and hashes only. |
| `contentHash` | detects same-key different-content conflicts | Hash only; no raw payload. |
| `provider` | marketplace/provider name such as `allegro` | Bounded enum/string. |
| `sourceChannel` | source contract such as `checkout-form` or `shipment-status-snapshot` | Bounded enum/string. |
| `centralOrderId` | Orders/Warehouse join id | Required before any mutation. |
| `fulfillmentOrderId` | Warehouse fulfillment order id when resolved | Required before any mutation. |
| `sourceReferenceHash` | hashed external checkout/shipment/waybill/account reference | Hash only; no raw tracking or provider object id unless already approved as non-sensitive. |
| `normalizedWarehouseStatus` | candidate Warehouse status or `noop` | Must be a current `FulfillmentOrderStatus` or no-op. |
| `sourceStatusClass` | bounded source status class | No raw payload. |
| `statusObservedAt` | provider/source occurrence timestamp after validation | ISO timestamp. |
| `sourceUpdatedAt` | source projection update timestamp after validation | ISO timestamp. |
| `observedAt` | local adapter observation timestamp | ISO timestamp. |
| `decision` | `accepted`, `duplicate`, `noop`, `rejected`, or `conflict` | Bounded enum. |
| `rejectionReason` | bounded reason code | No raw provider values unless allowlisted. |
| `firstSeenAt` / `lastSeenAt` | replay diagnostics | ISO timestamp. |
| `attemptCount` | retry/replay count | Numeric only. |

Provider/source-specific key material:

- Checkout-form status mapping key candidate: `contract + provider=allegro + sourceChannel=checkout-form + centralOrderId + sourceReferenceHash + status + paymentStatus + fulfillmentStatus + sourceUpdatedAt`.
- Shipment-status snapshot key candidate: `contract + provider=allegro + sourceChannel=shipment-status-snapshot + centralOrderId + accountIdHash + orderIdHash + shipmentIdHash + waybillIdHash + latestStatus + latestStatusAt + trackingUpdatedAt`.
- A future implementation may add a version prefix such as `wh-provider-status-ledger:v1` so key semantics can evolve without replay ambiguity.

## Timestamp Policy

The future adapter must persist and compare three timestamp classes:

- `sourceUpdatedAt`: timestamp from the sanitized source projection, for Allegro checkout forms this is the checkout-form raw `updatedAt` only after the source service has validated it as ISO-like and redacted the payload.
- `statusObservedAt`: the provider/source occurrence time for the status itself when present; for checkout-form status hints, use `sourceUpdatedAt` until a more specific status timestamp exists.
- `observedAt`: Warehouse adapter read/receive time, generated locally at adapter execution.

Warehouse transition `occurredAt` sent to Orders must be:

- `statusObservedAt` when it is present, parseable, not older than the current accepted observation for the same fulfillment order/status family, and not beyond the approved future clock-skew window.
- otherwise `observedAt`.

Missing policy constants before runtime implementation:

- `[MISSING: approved future clock-skew window for provider/source timestamps.]`
- `[MISSING: approved maximum stale-event age per provider/source channel.]`
- `[MISSING: approved retention period for accepted, duplicate, rejected, and conflict ledger rows.]`

## Replay And Conflict Policy

The future adapter must fail closed:

- Same `idempotencyKey` and same `contentHash`: treat as `duplicate`; do not mutate Warehouse twice.
- Same `idempotencyKey` and different `contentHash`: record `conflict`; do not mutate Warehouse.
- Older `sourceUpdatedAt` for the same fulfillment order and same source/status family: record `rejected` with stale reason; do not mutate Warehouse.
- Future timestamp beyond approved clock skew: record `rejected`; do not mutate Warehouse.
- Missing central `orderId`, missing `fulfillmentOrderId`, missing fulfilled reservation join, unknown provider/source channel, or unknown status: record `rejected`; do not mutate Warehouse.
- Any raw provider payload, tracking number, tracking URL, credential, customer/contact/address field, label, document, package body, or carrier object in metadata: reject before persistence.
- A provider event must not skip Warehouse transition order. In particular, checkout-form delivery-like evidence must not jump from `handed_to_delivery` directly to `delivered` or `not_delivered`.

## Adapter Gate

Runtime implementation remains blocked until all of these are true:

- owner approval exists for `src/**`, migrations, tests, and deploy planning;
- a migration-backed Warehouse ledger schema is approved;
- focused unit tests cover idempotent replay, same-key conflict, stale update rejection, future timestamp rejection, raw field rejection, and transition-order rejection;
- Allegro/source services provide sanitized source projections or events without raw provider/customer/tracking fields;
- Orders callback verification proves only bounded Warehouse status metadata reaches Orders, customer cabinets, and admin statistics.

## Parallel Execution

| Workstream | Status | Owner role | Allowed files | Forbidden files/actions | Dependencies | Expected output | Validation evidence | Handoff notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Warehouse ledger policy contract | complete in this slice | Warehouse fulfillment owner | `docs/contracts/fulfillment-provider-status-ledger-policy.md`, orchestrator docs/state | `src/**`, migrations, deploys, secrets, live provider calls | existing Warehouse transition graph and Allegro/Orders source-reference evidence | ledger ownership, minimal shape, timestamp/replay rules | `git diff --check`, `npm run check:hosted-auth` | Unlocks source-only adapter design but not runtime deployment. |
| Warehouse ledger migration/tests | dependency-gated | Warehouse runtime owner | future approved entity/migration/tests | production mutation without approval, raw payload persistence | owner approval and final schema naming | durable ledger and tests | focused Jest/build/diff check | Must happen before adapter consumption. |
| Allegro checkout-form adapter | blocked | Warehouse/Allegro integration owner | future approved adapter/tests | direct raw Allegro payload reads from Warehouse | ledger migration/tests and sanitized source contract | disabled-by-default adapter | contract tests | Reads sanitized source only. |
| Orders projection verification | dependency-gated | Orders integration owner | Orders callback/read-model tests | direct provider metadata in Orders events | Warehouse adapter callback payload | customer/admin projection proof | Orders tests/smoke | Orders remains bounded lifecycle owner. |


## Source Implementation Checkpoint

Warehouse commit for this slice implements the durable observation ledger foundation in source only:

- `FulfillmentProviderStatusObservation` stores sanitized observation fields, idempotency key/content hash, bounded decision/rejection reason, timestamp classes, replay diagnostics, and optional sanitized metadata.
- `FulfillmentProviderStatusLedgerService` records accepted observations, exact replay duplicates, same-key content conflicts, stale source updates, future source timestamps, and raw provider/tracking/customer metadata rejection.
- TypeORM migration `1781600000000-CreateFulfillmentProviderStatusObservations` creates the ledger table and indexes without running it in production.
- Focused tests cover accepted, duplicate, conflict, raw metadata rejection, future timestamp rejection, and stale update rejection.

This source implementation does not wire a provider adapter, mutate `fulfillment_orders.status`, call Orders, run a production migration, deploy, read a live provider, read secrets, or persist raw provider/tracking/customer fields.
