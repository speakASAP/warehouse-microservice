# Allegro Checkout Fulfillment Status Mapping For Warehouse

```yaml
id: WH-ALLEGRO-CHECKOUT-FULFILLMENT-STATUS-MAPPING
status: provisional-contract-gated
owner: warehouse-fulfillment-owner
created: 2026-07-03
last_updated: 2026-07-03
completeness_level: partial
source_contract:
  provider: allegro
  source: checkout-form polling
  implemented_reads:
    - GET /order/checkout-forms
    - GET /order/checkout-forms/{id}
upstream:
  - docs/contracts/fulfillment-handoff-contract.md
  - docs/contracts/fulfillment-provider-status-intake-contract.md
  - docs/orchestrator/2026-07-02-orders-fulfillment-handoff-plan.md
  - src/fulfillment/fulfillment-order.entity.ts
  - src/fulfillment/fulfillment-orders.service.ts
  - allegro/docs/orchestrator/ALLEGRO_IMPORT_EXPORT_MAPPING.md
  - allegro/docs/orchestrator/2026-07-03-allegro-shipment-status-source-contract.md
downstream:
  - Orders fulfillment handoff worker
  - Allegro source-contract worker
  - future Warehouse fulfillment status adapter only after approval
```

## Intent Chain

- Vision: Warehouse keeps a bounded fulfillment view for pick, pack, dispatch, and post-handoff delivery progress without becoming the Allegro provider API owner.
- Goal Impact: Allegro-origin orders can be reasoned about consistently by Orders and Warehouse while checkout-form status, shipment-management status, package/tracking status, and One Fulfillment remain separate domains.
- System: Allegro owns checkout-form polling, raw Allegro payloads, source evidence, and provider-specific interpretation. Orders owns central order lifecycle and the paid-order handoff. Warehouse owns stock, reservation effects, fulfillment-order status transitions, and the dispatch handoff record.
- Feature: Warehouse-facing provisional mapping from Allegro checkout-form status and fulfillment.status into candidate Warehouse fulfillment statuses.
- Task: document which checkout-form statuses may inform Warehouse, which must not map, the idempotency/join keys, and the missing facts before runtime use.
- Execution Plan: documentation-only contract note. No runtime consumer, DB schema, migrations, deployment, provider simulator, secret reads, live Allegro calls, or stock/reservation mutations.
- Coding Prompt: remote-only on Alfares in warehouse-microservice; allowed file is this docs contract; forbidden files are src/**, migrations, tests requiring runtime mutation, deploy files, Orders/Allegro source edits, and local project files.
- Code: documentation only.
- Validation: read-only source/docs inspection plus git diff checks after this docs edit.

## Source-Backed Facts

Current usable Allegro order projection facts are bounded to checkout-form reads:

- Implemented source is checkout-form polling: `/order/checkout-forms` and `/order/checkout-forms/{id}`.
- The current projection carries `AllegroOrder.allegroOrderId`, order `status`, `paymentStatus`, `fulfillmentStatus`, `deliveryMethod`, `orderDate`, `updatedAt`, line items, raw payload hash/evidence, and local forwarding-attempt evidence.
- `AllegroOrder.trackingNumber` exists as a nullable legacy/display field, but the local importer currently writes `trackingNumber: null`; Warehouse must not treat it as reliable.
- Shipment-management endpoints, order shipment endpoints, carrier tracking endpoints, and One Fulfillment endpoints are separate documented candidates, not implemented Warehouse-facing source contracts for this mapping.
- One Fulfillment stock is Allegro warehouse stock, not Alfares Warehouse canonical physical stock.

Warehouse evidence:

- Warehouse fulfillment statuses are `requested`, `collecting`, `forming`, `formed`, `handed_to_delivery`, `in_delivery`, `delivered`, `not_delivered`, `cancelled`, and `returned`.
- Warehouse transition guard allows `requested -> collecting -> forming -> formed -> handed_to_delivery -> in_delivery -> delivered/not_delivered`, with `returned` from post-handoff states.
- Warehouse already has a separate post-handoff Allegro shipment snapshot contract for carrier movement after `handed_to_delivery`; checkout-form status must not replace that contract.

## Provisional Mapping

This table is a Warehouse-facing candidate mapping only. It is not an approved runtime adapter and must not update Warehouse without an Orders-owned central order id, fulfilled reservation ids, and an approved idempotency/correlation path.

| Allegro source field | Source value/class | Warehouse candidate | Use class | Conditions | Notes |
| --- | --- | --- | --- | --- | --- |
| `paymentStatus` | `PAID` | eligible for Orders paid handoff | handoff gate, not Warehouse status | Orders must own central order lifecycle and fulfill reservations first | Payment alone does not create Warehouse fulfillment status. |
| checkout-form `status` | `READY_FOR_PROCESSING` | `requested` candidate | handoff-readiness signal | Only after Orders has central order id, reserved/fulfilled Warehouse reservation ids, and handoff payload | Treat as seller/order readiness, not carrier movement. |
| `fulfillment.status` | `NEW` or equivalent not-started value | `requested` candidate | handoff initial state | Only after paid handoff from Orders is valid | Do not create stock effects from this field alone. |
| `fulfillment.status` | `PROCESSING` or equivalent in-progress seller fulfillment | `collecting` or `forming` candidate | internal pick/pack progress hint | Requires existing Warehouse fulfillment order and approved source-to-status adapter | Exact split between collecting and forming is [MISSING: approved Warehouse interpretation of Allegro PROCESSING-like values]. |
| `fulfillment.status` | `SENT` or checkout-form `status=SENT` | `handed_to_delivery` candidate | dispatch handoff hint | Requires existing Warehouse fulfillment order already at `formed`, approved actor/reason/reference, and no raw tracking fields | This is not `in_delivery`; carrier movement must come from sanitized shipment snapshot contract. |
| `fulfillment.status` | `DELIVERED` if present in checkout-form projection | no direct Warehouse delivery transition | blocked/no-op for delivery | Use only as source evidence until shipment snapshot contract supplies sanitized carrier proof | Checkout-form delivery-like value must not bypass `handed_to_delivery -> in_delivery -> delivered` transition constraints. |
| checkout-form `status` or `fulfillment.status` | cancelled/refunded/returned-like values | no direct stock or fulfillment mutation | blocked/no-op pending Orders decision | Orders must decide central cancellation/return lifecycle and call Warehouse explicit endpoints when approved | Seller/marketplace lifecycle values are not enough to mutate Warehouse stock. |
| unknown/null/empty value | any unrecognized status | no status transition | reject or diagnostics-only | Record only in an approved adapter/ledger after approval | Do not infer Warehouse status from absent provider status. |

## Explicit Non-Mapping Table

| Domain/source | Do not map to Warehouse fulfillment status | Reason |
| --- | --- | --- |
| `AllegroOrder.trackingNumber` | any Warehouse status or join key | Current importer writes `trackingNumber: null`; field is not reliable or multi-shipment aware. |
| `/order/checkout-forms/{id}/shipments` payloads | package, parcel, waybill, tracking, or carrier status | Shipment payloads are not implemented as sanitized local projections for this checkout mapping. |
| `/order/carriers/{carrierId}/tracking` | `in_delivery`, `delivered`, `not_delivered`, `returned` | Carrier tracking belongs to the separate shipment snapshot contract after redaction and hashing. |
| `/shipment-management/*` | dispatch package state or Warehouse delivery state | Shipment-management is a separate provider domain and not implemented as local client/schema/projection. |
| One Fulfillment stock/status | Alfares Warehouse stock/reservation/availability | One Fulfillment stock is Allegro warehouse stock, not Warehouse canonical physical stock. |
| raw Allegro checkout-form payload | direct Warehouse metadata | Raw provider payload may contain provider/customer/shipment fields and must stay Allegro-owned. |
| line item first product/offer convenience fields | fulfillment-order identity | Multi-line checkout forms require line-level mapping and fulfilled reservation ids. |

## Idempotency And Join Keys

Warehouse-owned runtime updates, if later approved, must use Warehouse and Orders identifiers as the write keys:

- Primary Warehouse join key: `fulfillment_orders.order_id`, the central Orders id.
- Required handoff line join key: `items[].reservationId`, already unique on `fulfillment_order_lines` and tied to fulfilled `stock_reservations`.
- Required line validation keys: `orderItemId`, `productId`, `warehouseId`, and `quantity` from the Orders handoff payload.
- Source evidence key candidate: `provider=allegro + source=checkout-form + AllegroOrder.allegroOrderId + status + paymentStatus + fulfillmentStatus + updatedAt + rawPayloadHash`.
- Existing Allegro-to-Orders candidate join: `AllegroOrderForwardingAttempt.responseSummary.id` can expose the central Orders id when forwarding succeeded.

Unproven or missing join/idempotency facts:

- [MISSING: approved Orders-to-Warehouse handoff contract proving every Allegro-origin central order preserves the source AllegroOrder.allegroOrderId or equivalent source evidence reference.]
- [MISSING: approved durable Warehouse adapter ledger for checkout-form status observations if this mapping becomes runtime behavior.]
- [MISSING: approved conflict behavior when the same Allegro checkout-form evidence maps to a different central Orders id or a different Warehouse fulfillment order.]
- [MISSING: approved timestamp ordering semantics for Allegro updatedAt, checkout-form status update time, raw payload observation time, and Warehouse transition occurredAt.]
- [MISSING: approved retry and dead-letter behavior for any future checkout-form status adapter.]

## Required Rejection Rules Before Runtime Use

A future runtime adapter must fail closed and not mutate Warehouse when any of these are true:

- central Orders id is missing;
- Warehouse fulfillment order is missing;
- fulfilled reservation ids are missing or do not belong to the same central order;
- source channel is not Allegro;
- source endpoint is not checkout-form polling;
- `trackingNumber`, shipment id, waybill id, package id, tracking URL, provider payload body, credential, or customer/contact/address raw provider field is proposed as status metadata;
- the transition would violate Warehouse status order;
- a checkout-form status attempts to skip from `handed_to_delivery` directly to `delivered` or `not_delivered`;
- the status value is unknown, null, stale, or not covered by an approved fixture;
- replay idempotency cannot be proven durable across process restarts.

## Handoff Notes

For the Allegro source-contract worker:

- Provide sanitized fixture examples for checkout-form `status`, `paymentStatus`, `fulfillment.status`, `updatedAt`, and raw payload hash/evidence without raw customer, shipment, package, or tracking fields.
- Confirm whether `fulfillment.status` enum values observed in production are limited to `NEW`, `PROCESSING`, `SENT`, `DELIVERED`, or include other values.
- Keep `/order/checkout-forms/{id}/shipments`, shipment-management, carrier tracking, labels, pickup, cancel commands, and One Fulfillment outside this checkout-form mapping.

For the Orders worker:

- Preserve central order id as the only Warehouse write join.
- Preserve Allegro source evidence reference on Allegro-origin central orders before asking Warehouse to consume checkout-form status observations.
- Do not route Allegro checkout-form or shipment payloads directly into Warehouse status metadata.
- Continue using Warehouse fulfillment status callback as the Orders lifecycle projection bridge.

## Exact Missing Facts

- [MISSING: sanitized checkout-form fulfillment.status fixture set and approved enum/class list]
- [MISSING: sanitized shipment payloads, package ids, waybill ids, carrier tracking statuses, and redaction proof for package/parcels/tracking domains]
- [MISSING: reliable tracking id source; current AllegroOrder.trackingNumber is nullable and importer writes null]
- [MISSING: timestamp semantics for Allegro checkout-form updatedAt, provider status occurrence time, local observation time, Warehouse transition occurredAt, stale-event rejection, and replay ordering]
- [MISSING: retry, dead-letter, replay, and poison-message policy for any future Warehouse checkout-form status adapter]
- [MISSING: owner approval for runtime implementation, Warehouse adapter ledger, source-to-status fixture set, and any mutation of src/**, migrations, deploy files, or production fulfillment rows]
- [MISSING: approved distinction between Allegro seller-managed fulfillment status SENT and carrier movement status in_delivery]
- [MISSING: approved behavior for checkout-form DELIVERED or return-like values without sanitized shipment snapshot evidence]

## Parallel Execution

| Workstream | Status | Owner role | Allowed files | Forbidden files/actions | Dependencies | Expected output | Validation evidence | Handoff notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Allegro checkout-form fixtures | ready now | Allegro source-contract worker | Allegro docs/fixtures only | Warehouse runtime edits, raw PII/tracking payload publication | Current checkout-form importer/source evidence | sanitized enum/value fixtures and timestamp evidence | docs/source inspection, fixture review | Needed before Warehouse mapping can be approved. |
| Orders source-reference preservation | ready now | Orders worker | Orders docs/source contract only | direct Warehouse stock mutations, raw Allegro shipment metadata | central Orders forwarding/read model | proof central order preserves Allegro source evidence and reservation ids | Orders contract tests/docs evidence | Provides Warehouse join path. |
| Warehouse mapping contract | complete in this slice | Warehouse status mapping owner | `docs/contracts/allegro-checkout-fulfillment-status-mapping.md` | `src/**`, migrations, deploys, secrets, live provider calls | Warehouse fulfillment docs/source and Allegro source facts | provisional mapping, non-mapping, missing gates | `git diff --check` | Runtime remains blocked. |
| Warehouse runtime adapter | blocked | Warehouse fulfillment owner | future approved adapter/tests/ledger files | fake providers, raw tracking persistence, deploy without owner approval | all missing facts above | idempotent adapter with durable ledger and fixtures | focused tests, build, diff check | Must preserve Warehouse transition graph. |
| Final integration | dependency-gated | Orders/Warehouse integration owner | integration docs/tests after adapter exists | direct Allegro-to-Orders shipment consumption | Allegro fixtures, Orders join, Warehouse adapter | end-to-end lifecycle proof | contract tests and callback verification | Orders sees bounded Warehouse callback only. |
