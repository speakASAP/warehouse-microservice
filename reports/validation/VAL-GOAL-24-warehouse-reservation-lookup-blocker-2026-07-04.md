# VAL-GOAL-24 Warehouse Reservation Lookup Blocker

```yaml
id: VAL-GOAL-24-WAREHOUSE-RESERVATION-LOOKUP-BLOCKER
status: blocked-selected-reservation-not-created
repository: /home/ssf/Documents/Github/warehouse-microservice
captured_at: 2026-07-04
mutation: false
live_checkout_executed: false
warehouse_reservation: false
warehouse_mutation: false
warehouse_cleanup: false
orders_route_invocation: false
provider_call: false
secret_output: false
token_output: false
raw_ids_printed: false
```

## Intent Preservation Chain

Vision -> Goal Impact -> System -> Feature -> Task -> Execution Plan -> Coding Prompt -> Code -> Validation -> State Update

- Vision: Goal 24 paid/provider cleanup must not mutate Warehouse stock unless the selected component reservation state is known from Warehouse itself.
- Goal Impact: defines the exact non-mutating Warehouse lookup command/API shape and redacted evidence shape while preserving `[MISSING: exact selected Warehouse reservation lookup state for cleanup]` until a future permitted checkout creates the selected order and reservation rows.
- System: Warehouse owns component-line reservation rows and cleanup operation selection; Orders owns the central order state and side-effect acknowledgements; Payments owns provider/payment proof; FlipFlop/channel owns checkout/customer-visible cleanup.
- Feature: Warehouse reservation lookup blocker handoff packet.
- Task: record the deterministic read-only lookup route, matching keys, redacted evidence schema, and fail-closed conditions for the future runner.
- Execution Plan: source/docs/verifier only; no checkout, payment, provider call, Orders mutation, Warehouse reservation, cleanup mutation, deploy, migration, DB write, token output, secret output, or raw evidence output.
- Coding Prompt: do not invent selected order ids or reservation rows; do not query synthetic or historical order ids as if they are the selected smoke; keep raw identifiers out of reports.
- Code: this report, `docs/orchestrator/STATUS.md`, `docs/IMPLEMENTATION_STATE.md`, and `scripts/verify-bundle-component-reservation-contract.js`.
- Validation: `npm run verify:bundle-component-reservation` and `git diff --check`.
- State Update: `[MISSING: exact selected Warehouse reservation lookup state for cleanup]` remains unresolved; the lookup/evidence shape is source-defined.

## Exact Non-Mutating Lookup Shape

Warehouse source exposes the read path as `GET /api/reservations/order/:orderId`. The future runner must call it only after the approved checkout creates the selected central Orders id.

```bash
curl -sS \
  -H "Authorization: Bearer [REDACTED_ACTOR_TOKEN]" \
  "https://warehouse.alfares.cz/api/reservations/order/[REDACTED_SELECTED_ORDER_ID]"
```

Equivalent in-cluster read-only shape, when the runner is already inside an approved pod and uses an approved no-print service token handoff:

```bash
curl -sS \
  -H "Authorization: Bearer [REDACTED_ACTOR_TOKEN]" \
  "http://warehouse-microservice:3201/api/reservations/order/[REDACTED_SELECTED_ORDER_ID]"
```

Expected response envelope is `success=true` with `data` as reservation rows. Raw response bodies, raw order ids, raw reservation ids, raw customer/payment/provider identifiers, tokens, cookies, and decoded JWTs must not be stored in the final evidence.

## Deterministic Match Rule

Each Catalog component line for `catalog.bundle.v1` must resolve exactly one Warehouse reservation row by:

```text
orderId + channel + productId + warehouseId + quantity
```

When a `reservationId` is available from a fulfillment handoff or prior sanitized packet, it must also match. The accepted state values are `active`, `fulfilled`, `released`, `cancelled`, `expired`, and `returned`.

Fail closed before any cleanup mutation when the read returns zero rows, duplicate rows, aggregate bundle rows, a quantity mismatch, a warehouse/product mismatch, a missing channel, an unexpected status, or a row that cannot be tied to the selected central order.

## Redacted Evidence Shape

Future evidence must contain hashes, booleans, counts, status classes, route names, reason codes, approval ids, idempotency-key hashes, run ids, and timestamps only.

```json
{
  "mutation": false,
  "lookupRoute": "GET /api/reservations/order/:orderId",
  "selectedOrderHash": "sha256:<redacted>",
  "reservationLookupCount": 2,
  "componentRows": [
    {
      "componentHash": "sha256:<redacted>",
      "warehouseHash": "sha256:<redacted>",
      "reservationHash": "sha256:<redacted>",
      "quantity": 1,
      "channel": "flipflop",
      "status": "active|fulfilled|released|cancelled|expired|returned",
      "exactMatch": true,
      "approvedCleanupOperation": "release|expire|cancel|return|none",
      "cleanupIdempotencyKeyHash": "sha256:<redacted>"
    }
  ],
  "duplicates": 0,
  "missingRows": 0,
  "rawIdsOutput": false,
  "secretOutput": false,
  "tokenOutput": false,
  "complete": false
}
```

`complete` must remain `false` until provider proof, Orders sideEffectsHandled acknowledgements, Warehouse lookup rows, channel acknowledgement, idempotency keys, and final redacted evidence content all exist for the same selected run.

## Current Runtime State

Current source/runtime discovery did not find a selected central order id or selected Warehouse reservation rows for the future Goal 24 smoke. The Payments final evidence path is source-reserved as `reports/validation/VAL-GOAL-24-final-redacted-cleanup-evidence-2026-07-04.md`, but runtime content is still missing.

Current blocker remains: `[MISSING: exact selected Warehouse reservation lookup state for cleanup]`.

Boundary: mutation: false; live_checkout_executed: false; checkout_created: false; payment_created: false; provider_call: false; refund_or_reversal: false; orders_route_invocation: false; orders_mutation: false; warehouse_reservation: false; warehouse_mutation: false; warehouse_cleanup: false; channel_cleanup_mutation: false; deployment: false; migration: false; db_write: false; secret_output: false; token_output: false; raw_ids_printed: false; raw_customer_or_payment_evidence: false.
