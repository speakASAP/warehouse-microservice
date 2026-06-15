# WH-G12-T1 - Automatic Reservation Expiry

Metadata:
- id: WH-G12-T1
- goal_id: WH-G12
- status: active
- created: 2026-06-13
- last_updated: 2026-06-13
- completeness_level: planned

## Task

Expire timed-out active reservations automatically so stock holds are released without relying on manual `/reservations/expire` calls.

## Goal Impact

This keeps Warehouse authoritative for checkout availability after payment timeout or abandoned checkout flows. It preserves the existing reservation lifecycle transaction logic while making expiry observable and deploy-controlled.

## Project Invariant Impact

Applies to invariants 1, 6, 7, 8, 9, 10, 11, and 12. Automatic expiry mutates Warehouse-owned reservation and stock state, must keep movement evidence append-only, must use a fixed service actor and reason code, must preserve non-negative stock state, must be idempotent across retries, must expose failures in logs/job status, must avoid unapproved production stock mutation during validation, and must not deploy without approval.

## Sensitive-Data Classification

Internal operational metadata. Do not include secrets, real JWTs, raw customer data, or production order payloads in tests or reports.

## Contract/Schema Impact

Adds a protected internal batch endpoint for due reservation expiry and a Kubernetes CronJob manifest. No database schema change is expected because `stock_reservations(status, expiresAt)` is already indexed.

## Replay/Determinism Impact

The CronJob must be retry-safe. Each due reservation is processed through the existing `expireReservation` transition, which is transactionally guarded and idempotent for already-expired reservations.

## Required Behavior

- Find active reservations with `expiresAt <= current service time`.
- Expire each due reservation through existing lifecycle code, not ad hoc stock updates.
- Use actor `warehouse-reservation-expiry-cron` and reason `RESERVATION_TTL_EXPIRED`.
- Run through an explicit Kubernetes CronJob or worker endpoint, not a hidden in-process loop.
- Report examined, expired, and failed counts.
- Fail the CronJob when any reservation fails, so operators see drift.

## Validation

- `npm test -- --runInBand`
- `npm run build`
- `git diff --check`
