# VAL-WH-G11-OUTBOX - Validation Report

Metadata:
- id: VAL-WH-G11-OUTBOX
- status: deployed
- goal_id: WH-G11-OUTBOX
- task_ids: WH-G11-OUTBOX-T1
- created: 2026-06-13
- last_updated: 2026-06-13

## Validation Commands

- `npm test -- --runInBand`: passed, 8 test suites and 50 tests.
- `npm run build`: passed.
- `git diff --check`: passed with no whitespace errors.

## Coverage Notes

- Stock mutation tests assert outbox rows are saved inside the transaction path and replay is triggered after commit.
- Stock event service tests cover successful replay, RabbitMQ-unavailable retry state, and health-visible outbox counts.
- Production mutation smoke tests were not run because production stock mutation and deployment were not approved.

## Deployment

Not approved. Migration execution and production deploy were not run.

## Residual Risks

- `stock_event_outbox` migration must be run before deploying this code to production.
- Published-row retention cleanup is documented but not implemented; owner must approve a retention window and cleanup mechanism.
- RabbitMQ delivery is at-least-once; consumers should deduplicate by `eventId` / AMQP `messageId`.


## Deployment Evidence

- Deployed on 2026-06-15 as part of integrated WH-G10+ wave.
- Commit: `fab5bee`.
- Image: `localhost:5000/warehouse-microservice:fab5bee`.
- Validation: deployment script completed successfully; production `/api/health`, `/api/ready`, `/admin`, and manual reservation-expiry CronJob smoke passed.
