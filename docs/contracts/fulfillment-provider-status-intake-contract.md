# Fulfillment Provider Status Intake Contract

```yaml
id: WH-FULFILLMENT-PROVIDER-STATUS-INTAKE
status: draft-contract-gated
owner: warehouse-fulfillment-owner
created: 2026-07-03
last_updated: 2026-07-03
completeness_level: partial
upstream:
  - docs/contracts/fulfillment-handoff-contract.md
  - docs/orchestrator/STATUS.md
  - src/fulfillment/fulfillment-order.entity.ts
  - src/fulfillment/fulfillment-orders.service.ts
  - orders-microservice/docs/orchestrator/2026-07-03-delivery-provider-shipment-status-plan.md
downstream:
  - docs/orchestrator/STATUS.md
  - docs/IMPLEMENTATION_STATE.md
related_adrs: []
```

## Intent Chain

- Vision: customers and operators should see accurate delivery progress after Warehouse hands a parcel to a carrier without making Orders or Warehouse store raw provider payloads or credentials.
- Goal Impact: Allegro-origin orders can later move from Warehouse handoff into delivery lifecycle updates through a bounded Warehouse intake before Orders projection.
- System: Allegro/provider owner owns provider API calls, OAuth scopes, credentials, raw shipment payloads, and provider retry semantics; Warehouse owns fulfillment-order status; Orders owns lifecycle projection and events.
- Feature: Warehouse-owned bounded intake for provider shipment status updates after `handed_to_delivery`.
- Task: define accepted payload, status mapping, idempotency, validation, and sensitive-field rejection while Worker E resolves exact Allegro shipment contract facts.
- Execution Plan: documentation-only until the Allegro status source contract, sanitized fixture set, and sensitive-data policy are approved; do not add fake provider code or persist raw provider payloads.
- Coding Prompt: remote-only on Alfares; allowed files are Warehouse fulfillment docs/status docs and narrow `src/fulfillment/**` tests only after contract facts are known; forbidden changes include Orders/Allegro edits, DB migrations, deploys, secrets, broad lifecycle schemas, and raw tracking persistence.
- Code: documentation only in this slice.
- Validation: `git diff --check` plus read-only inspection of Warehouse fulfillment status model, Warehouse fulfillment API, and Orders callback DTO/lifecycle mapping.

## Current Evidence

Warehouse already owns the fulfillment-order status model:

- `src/fulfillment/fulfillment-order.entity.ts` includes `handed_to_delivery`, `in_delivery`, `delivered`, `not_delivered`, `returned`, and `statusReference`.
- `src/fulfillment/fulfillment-orders.service.ts` guards transitions as `formed -> handed_to_delivery -> in_delivery -> delivered/not_delivered`, with `returned` allowed from post-handoff states.
- `POST /api/fulfillment-orders/order/:orderId/status` stores bounded status metadata and best-effort syncs to Orders.
- Orders read-only evidence shows `PUT /api/orders/:id/warehouse-fulfillment-status` accepts only bounded Warehouse statuses, `reasonCode`, `actor`, `reference`, `fulfillmentOrderId`, and `occurredAt`, then maps `in_delivery -> in_delivery`, `delivered -> received`, and `not_delivered -> not_received`.

## Accepted Bounded Payload

The provider-owned adapter must call Warehouse with a normalized internal command, not a raw Allegro webhook or polling response. The contract target is:

```json
{
  "orderId": "central-orders-uuid",
  "status": "in_delivery",
  "reasonCode": "PROVIDER_STATUS_UPDATE",
  "statusReference": "allegro-status-event-or-poll-id",
  "occurredAt": "2026-07-03T00:00:00.000Z",
  "provider": "allegro",
  "sourceChannel": "allegro"
}
```

Rules:

- `orderId` is the central Orders id already tied to the Warehouse fulfillment order.
- `provider` must be `allegro` for this first source lane.
- `sourceChannel` must be `allegro`; non-Allegro-origin orders are out of scope.
- `status` must be one of the accepted post-handoff statuses below.
- `reasonCode` must be a stable internal reason, normally `PROVIDER_STATUS_UPDATE` unless Worker E defines a narrower bounded reason list.
- `statusReference` must be an opaque, stable provider event id, poll observation id, or deterministic adapter id. It must not be a tracking number, tracking URL, token, full provider shipment JSON, email address, phone number, customer name, address, or credential-derived value.
- `occurredAt` must be an ISO timestamp from the provider event when available; otherwise the adapter must use its observation time and document that choice.

Current implementation note: Warehouse's existing status endpoint names the persisted reference field `reference` in the request DTO and stores it as `statusReference`. A future adapter can map `statusReference -> reference` without a DB migration, but exact endpoint/DTO naming remains `[MISSING: Worker E final Allegro-to-Warehouse command naming decision]`.

## Status Mapping

Accepted provider adapter output after Warehouse reaches `handed_to_delivery`:

| Current Warehouse status | Accepted next provider status | Orders lifecycle projection | Notes |
| --- | --- | --- | --- |
| `handed_to_delivery` | `in_delivery` | `in_delivery` | Normal courier movement after carrier handoff. |
| `handed_to_delivery` | `returned` | `returned` | Use only for provider-confirmed return before in-delivery scan. |
| `in_delivery` | `delivered` | `received` | Successful terminal delivery projection in Orders. |
| `in_delivery` | `not_delivered` | `not_received` | Failed delivery projection in Orders. |
| `in_delivery` | `returned` | `returned` | Return after in-delivery state. |
| `delivered` | `returned` | `returned` | Post-delivery return remains explicit. |
| `not_delivered` | `returned` | `returned` | Return after failed delivery remains explicit. |

Rejected transitions:

- Any provider update before Warehouse status is `handed_to_delivery`.
- Direct `handed_to_delivery -> delivered` or `handed_to_delivery -> not_delivered` unless Worker E proves Allegro has no reliable in-delivery equivalent and an explicit exception is approved.
- Reverse movement such as `in_delivery -> handed_to_delivery`, `delivered -> in_delivery`, or `not_delivered -> in_delivery`.
- Any provider status outside `in_delivery`, `delivered`, `not_delivered`, and `returned` for this intake lane.

## Idempotency And `statusReference`

The logical idempotency key is:

```text
provider + sourceChannel + orderId + statusReference
```

Required semantics:

- Replaying the same key with the same normalized `status` is idempotent.
- Replaying the same key with a different normalized `status` is a conflict.
- A new key with a valid forward transition may advance the fulfillment order.
- A new key with a stale or reverse transition must be rejected.
- If `statusReference` is missing, the provider adapter must not call Warehouse unless Worker E approves a deterministic fallback key such as a provider shipment id plus normalized status plus occurredAt.

Current implementation gap: Warehouse stores only the latest `statusReference` on `fulfillment_orders`; it does not have a provider-status event ledger. Strong replay conflict detection across older references is `[MISSING: approved event-ledger design or adapter-owned dedupe contract]`. Until that is resolved, the provider adapter must own durable dedupe before retrying Warehouse updates.

## Validation And Sensitive-Field Rejection

Warehouse intake must reject or ignore provider-owned/raw fields before persistence or Orders sync:

- tracking number
- tracking URL
- carrier raw payload
- provider webhook body
- OAuth token, refresh token, API key, secret, cookie, authorization header
- customer address, customer name, email, phone, buyer account id
- provider label/document URL or binary document reference
- marketplace raw shipment/package object

The bounded Warehouse status sync to Orders must continue to include only status, reason, actor/service identity, bounded reference, fulfillment order id, and timestamp. Orders lifecycle events and Notifications must not receive raw tracking fields.

## Blockers Waiting On Worker E

- `[MISSING: Allegro shipment status source contract: endpoint or polling source, OAuth scopes, authentication method, retry/error semantics, timestamp semantics, and sanitized sample payloads.]`
- `[MISSING: mapping from Allegro shipment/package/fulfillment statuses to Warehouse statuses when Allegro skips or combines in-delivery states.]`
- `[MISSING: approved tracking number/URL visibility policy by role and explicit event-exclusion rule.]`
- `[MISSING: provider adapter durable idempotency store or Warehouse provider-status event ledger decision.]`
- `[MISSING: sanitized fixture set proving sensitive provider fields are rejected or excluded.]`

## Validation Commands

Validation run for this slice:

```bash
git diff --check
npm test -- --runInBand test/fulfillment-orders.service.spec.ts
```

Recommended implementation validation after Worker E unblocks source-specific tests:

```bash
npm test -- --runInBand test/fulfillment-orders.service.spec.ts
npm run build
git diff --check
```

## Parallel Execution

| Workstream | Status | Owner role | Allowed files | Forbidden files/actions | Dependencies | Expected output | Validation evidence | Handoff notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Worker E Allegro source contract | dependency-gated | Allegro provider owner | `allegro` docs and narrow read-only adapter/tests after contract approval | Orders/Warehouse edits, fake simulator, Vault mutation, deploy, shipment label/document writes | approved source premise exists; exact payload facts missing | endpoint/source choice, sanitized payload, status mapping, idempotency source | provider fixture tests and sensitive scan | Must return bounded command to Warehouse only. |
| Worker F Warehouse intake contract | ready now, docs-only complete in this slice | Warehouse fulfillment owner | `docs/contracts/fulfillment-provider-status-intake-contract.md`, status docs | Orders/Allegro edits, DB migrations, deploys, secrets, raw provider persistence | Worker E for implementation | bounded accepted payload, transition/idempotency/rejection rules | `git diff --check` | No source change until missing facts are resolved. |
| Orders verification | final integration | Orders lifecycle owner | Orders verifier/docs only if status enum changes | raw tracking fields, DB migrations, deploys | Worker E plus Worker F implementation evidence | lifecycle/event projection still bounded | Orders verifier/event contract tests | Existing callback already accepts current Warehouse statuses. |

Integration owner: Orders lifecycle orchestrator.
Validation owner: final integration lane after Worker E provides provider fixtures and Warehouse implementation evidence.
Merge order: Worker E contract, Worker F implementation/tests if needed, Orders verifier, Notifications verification if event copy changes.

## Change Note

2026-07-03: Created documentation-only bounded Warehouse intake contract for Allegro-origin provider status updates. Source implementation remains blocked on Worker E missing Allegro shipment contract facts.
