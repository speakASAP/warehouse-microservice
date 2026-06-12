# WH-G4 - Reservation Lifecycle

Status: ready after WH-G3.

## Objective

Align Warehouse with cart, checkout, payment, cancellation, expiry, fulfillment, and return semantics.

## Intent Link

Orders and checkout flows use Warehouse for reservation and fulfillment transitions. Warehouse must remain the stock authority through the entire order lifecycle.

## Scope

- Reserve creates or updates a `stock_reservations` row.
- Reservation rows include order/reference ID, channel, status, quantity, actor, reason, and expiry.
- Unreserve, fulfill, cancel, expire, and return are explicit state transitions.
- Payment success and failure flows are idempotent.
- Return/cancellation restock preserves movement evidence.

## Non-Goals

- Do not change catalog identity ownership.
- Do not implement supplier reconciliation.
- Do not adjust production stock without owner-approved payloads.

## Acceptance Criteria

- Reservation write path updates stock and reservation row transactionally.
- Payment failure releases reserved stock.
- Payment success converts reserved stock into committed deduction through a transactionally correct model.
- Repeated order/payment webhook references are idempotent.
- Tests cover TTL expiry, payment failure, payment success, cancellation reversal, and return restock.

## Validation

Run build and tests for reservation and stock services. Add focused tests if absent.

