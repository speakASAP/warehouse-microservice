# WH-G2 - RabbitMQ Stock Events

Status: done.

## Objective

Restore reliable stock event publishing so channel services can react to Warehouse as the availability authority.

## Current Evidence

- RabbitMQ was provisioned in Kubernetes as `service/rabbitmq` and `statefulset/rabbitmq`.
- Warehouse connects to `amqp://guest:guest@rabbitmq:5672`.
- Production health reports RabbitMQ `up`.
- `stock.events` exchange exists, type `topic`, durable `true`.

## Acceptance Criteria

- RabbitMQ is reachable from Warehouse in production.
- Stock event payloads are documented and validated.
- Broken event publishing is observable through health/readiness or logs.
- A smoke path can prove event exchange availability.

## Validation

Completed in prior cycle. Preserve evidence in `docs/IMPLEMENTATION_STATE.md` and `docs/orchestrator/warehouse-intent-plan.md`.

