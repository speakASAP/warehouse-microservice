# VAL-WH-G12 - Validation Report

Metadata:
- id: VAL-WH-G12
- status: deployed
- goal_id: WH-G12
- task_ids: WH-G12-T1
- created: 2026-06-13
- last_updated: 2026-06-13
- completeness_level: partial-validation

## Planned Validation

| Command | Status | Notes |
| --- | --- | --- |
| Manual pre-coding gate | passed-with-documented-risk | WH-G12-specific artifacts updated before source edits; shared state files intentionally not edited by this worker. |
| git diff --check | passed | No whitespace errors in the combined remote diff. |
| npm test -- test/reservations.service.spec.ts --runInBand | passed | 1 suite, 2 WH-G12 automatic expiry tests passed. |
| npm run build | passed | Nest build completed. |
| npm test -- --runInBand | failed | Latest combined run: WH-G12 test passed; one concurrent WH-G11-owned outbox replay expectation fails in `test/stock-events.service.spec.ts`. |

## Artifact Under Validation

WH-G12-T1 automatic reservation expiry through a protected batch endpoint and Kubernetes CronJob.

## Invariant Evidence

Warehouse remains stock and reservation authority. Automatic expiry uses the existing transaction path that updates stock, reservation status, movement evidence, stock events, and mutation metrics. The CronJob has explicit Kubernetes visibility and no hidden in-process mutation loop is introduced.

## Passed Criteria

- Added protected `POST /api/reservations/expire-due`.
- Added a batch service path that finds active due reservations and calls the existing `expireReservation` lifecycle transition.
- Added fixed worker audit context: actor `warehouse-reservation-expiry-cron`, reason `RESERVATION_TTL_EXPIRED`.
- Added `k8s/reservation-expiry-cronjob.yaml` and deploy-manifest inclusion.
- Added runbook instructions for checking and manually triggering the CronJob.
- Added focused tests for successful due expiry and per-reservation failure reporting.

## Integration Risk

Full-suite validation is currently blocked by other concurrent worker changes in stock outbox replay tests. WH-G12 did not edit those files.

## Deployment

Not approved and not performed.


## Deployment Evidence

- Deployed on 2026-06-15 as part of integrated WH-G10+ wave.
- Commit: `fab5bee`.
- Image: `localhost:5000/warehouse-microservice:fab5bee`.
- Validation: deployment script completed successfully; production `/api/health`, `/api/ready`, `/admin`, and manual reservation-expiry CronJob smoke passed.
