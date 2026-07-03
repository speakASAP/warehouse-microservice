# Warehouse Internal Delivery Status Contract

id: WH-INTERNAL-DELIVERY-STATUS-V1
status: source-implemented
owner: warehouse-fulfillment-owner
created: 2026-07-03
last_updated: 2026-07-03
contract: warehouse.internal_delivery_status.v1
runtime_endpoint: POST /api/fulfillment-orders/order/:orderId/internal-delivery-status
required_role: internal:warehouse-microservice:admin

## Intent Chain

- Vision: Alfares can advance customer-visible delivery lifecycle for its own delivery operation without waiting for an external carrier/provider feed.
- Goal Impact: Warehouse becomes the internal delivery status owner after fulfillment handoff, while Orders continues to receive bounded lifecycle callbacks from Warehouse.
- System: Warehouse owns fulfillment orders, delivery-status validation, idempotent status observation ledger writes, guarded status transitions, and Orders callback triggering. Orders owns customer/admin lifecycle projection. Marketplaces and frontends must read Orders lifecycle state, not mutate Warehouse directly.
- Feature: Warehouse-owned internal delivery status intake.
- Task: add a bounded internal delivery endpoint that records a sanitized provider-status observation and applies the existing Warehouse transition graph when the observation is accepted and non-noop.
- Execution Plan: source implementation, focused tests, build, documentation, then owner-approved deploy/runtime smoke.
- Coding Prompt: do not store raw provider payloads, customer PII, credentials, tracking URLs, or marketplace raw payloads; keep status classes bounded; use existing Warehouse status transitions and Orders callback.
- Code: InternalDeliveryStatusUpdateDto, FulfillmentOrdersController.recordInternalDeliveryStatus, FulfillmentOrdersService.recordInternalDeliveryStatus.
- Validation: npm test -- --runInBand test/fulfillment-orders.service.spec.ts test/fulfillment-orders.controller.spec.ts test/fulfillment-provider-status-ledger.service.spec.ts; npm run build; git diff --check.

## Request Shape

JSON request body:

{
  "statusClass": "IN_DELIVERY",
  "reasonCode": "WAREHOUSE_INTERNAL_DELIVERY_OBSERVED",
  "deliveryReference": "bounded-internal-reference",
  "idempotencyKey": "optional-client-key",
  "observedAt": "2026-07-03T12:00:00.000Z"
}

Allowed statusClass values:

- IN_DELIVERY
- DELIVERED
- NOT_DELIVERED
- RETURNED
- UNKNOWN

reasonCode is required through the inherited stock-mutation audit DTO. The authenticated service/user actor is derived server-side.

## Status Mapping

| Internal class | Warehouse status | Orders projection |
| --- | --- | --- |
| IN_DELIVERY | in_delivery | existing Warehouse callback projects delivery in progress |
| DELIVERED | delivered | existing Warehouse callback projects received/delivered lifecycle |
| NOT_DELIVERED | not_delivered | existing Warehouse callback projects failed delivery lifecycle |
| RETURNED | returned | existing Warehouse callback projects return lifecycle where supported |
| UNKNOWN | no-op observation | no Orders callback |

The existing Warehouse transition graph remains authoritative. Invalid jumps fail through the same guarded status path as manual Warehouse status updates.

## Persistence And Redaction

Warehouse writes a provider-status observation with:

- provider=warehouse-internal-delivery
- sourceChannel=internal-delivery-status
- sourceMetadata.contract=warehouse.internal_delivery_status.v1
- bounded status class, timestamps, and optional bounded delivery reference
- generated or supplied idempotency key

Warehouse must not persist raw provider payloads, raw tracking URLs, customer names, emails, phones, addresses, credentials, tokens, cookies, or marketplace raw payloads in this intake path.

## Runtime Gates

- [SOURCE-IMPLEMENTED: Warehouse internal delivery status endpoint and service path.]
- [SOURCE-IMPLEMENTED: focused controller/service/ledger tests and TypeScript build pass.]
- [MISSING: deploy of the new Warehouse image.]
- [MISSING: bounded runtime smoke proving internal delivery status mutates one safe fulfillment order and triggers Orders callback/projection.]
- [MISSING: frontend marketplace/customer/admin read-path verification after Orders projection, across FlipFlop, Basus, Heureka, Allegro, Aukra and other selling surfaces.]
