# CP-WH-G12 - Automatic Reservation Expiry Context

Metadata:
- id: CP-WH-G12
- goal_id: WH-G12
- status: active
- created: 2026-06-13
- last_updated: 2026-06-13

## Context

WH-G4 created first-class reservation lifecycle transitions. Manual `/api/reservations/expire` already releases a single timed-out active reservation through `StockService.expireReservation`, but production still needs a visible scheduling mechanism so expired holds do not depend on manual calls.

## Existing Behavior To Preserve

- Reservation expiry must reduce `stock.reserved` and restore `stock.available`.
- Reservation status changes to `expired`.
- A stock movement with type `expire` is recorded in the same transaction.
- Stock events and mutation metrics are emitted by the stock mutation wrapper.
- Expiry rejects reservations whose TTL has not elapsed.

## Scheduler Choice

Use Kubernetes CronJob plus a protected batch endpoint. Do not add an in-process interval or bootstrap mutation loop.

## Boundaries

- Warehouse owns reservation state and stock effects.
- Orders owns order state and payment timeout decisions.
- Auth owns JWT/service identity; the CronJob uses the existing Warehouse internal admin role.
- No production deploy or mutation validation is approved.

## Files Expected

- `src/reservations/reservations.service.ts`
- `src/reservations/reservations.controller.ts`
- `src/stock/dto/stock-mutation.dto.ts`
- `k8s/reservation-expiry-cronjob.yaml`
- `scripts/deploy.sh`
- `test/reservations.service.spec.ts`
- `docs/runbooks/operations.md`
- WH-G12-specific IPS artifacts
