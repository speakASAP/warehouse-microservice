# Stock Events Contract

Warehouse publishes stock availability events to RabbitMQ exchange `stock.events`.

## Broker

- Kubernetes service: `rabbitmq.statex-apps.svc.cluster.local`
- AMQP URL used by warehouse: `amqp://guest:guest@rabbitmq:5672`
- Exchange: `stock.events`
- Exchange type: `topic`
- Delivery: persistent messages

## Events

### `stock.updated`

Published after any stock quantity or reservation change.

```json
{
  "type": "stock.updated",
  "productId": "catalog-product-id",
  "warehouseId": "warehouse-id",
  "quantity": 10,
  "available": 7,
  "timestamp": "2026-06-12T06:30:00.000Z"
}
```

### `stock.low`

Published when available stock is greater than zero and less than or equal to the stock row threshold.

```json
{
  "type": "stock.low",
  "productId": "catalog-product-id",
  "warehouseId": "warehouse-id",
  "available": 3,
  "threshold": 5,
  "timestamp": "2026-06-12T06:30:00.000Z"
}
```

### `stock.out`

Published when available stock reaches zero or below.

```json
{
  "type": "stock.out",
  "productId": "catalog-product-id",
  "warehouseId": "warehouse-id",
  "timestamp": "2026-06-12T06:30:00.000Z"
}
```

## Validation

Warehouse validates each payload before publish:

- `type` must match the RabbitMQ routing key.
- `productId`, `warehouseId`, and `timestamp` are required.
- `timestamp` must be ISO-8601 parseable.
- `stock.updated` requires finite numeric `quantity` and `available`.
- `stock.low` requires finite numeric `available` and `threshold`.


## Transactional Outbox

Stock mutations persist stock event intents in `stock_event_outbox` in the same database transaction as the stock row, reservation row when applicable, and stock movement evidence. RabbitMQ publishing happens after commit by replaying due outbox rows.

### Outbox Schema

Committed migration: `src/migrations/1781300000000-StockEventOutbox.ts`.

Core fields:

- `eventId`: stable UUID included in the RabbitMQ payload and AMQP `messageId` for consumer deduplication.
- `type` / `routingKey`: one of `stock.updated`, `stock.low`, or `stock.out`.
- `productId`, `warehouseId`: indexed operational filters for replay inspection.
- `payload`: validated JSONB event payload.
- `status`: `pending`, `publishing`, `published`, or `failed`.
- `attempts`, `maxAttempts`, `nextAttemptAt`, `lastError`, `publishedAt`: retry and operator visibility fields.

### Retry Defaults

Runtime defaults are intentionally conservative and can be tuned by environment variable:

- `STOCK_EVENT_OUTBOX_BATCH_SIZE=25`
- `STOCK_EVENT_OUTBOX_REPLAY_INTERVAL_MS=60000`
- `STOCK_EVENT_OUTBOX_RETRY_DELAY_MS=30000`
- `STOCK_EVENT_OUTBOX_MAX_ATTEMPTS=12`

On startup and after successful stock mutations, Warehouse replays due `pending` or retry-due `failed` rows. Failed rows remain visible with `lastError` and a future `nextAttemptAt` until `maxAttempts` is reached.

### Replay Safety

RabbitMQ delivery remains at-least-once. Consumers should deduplicate on `eventId`/AMQP `messageId`. A crash after database commit but before RabbitMQ publish leaves a `pending` row that is replayed on service startup, timer tick, or the next stock mutation.

### Retention

No automatic deletion is performed in this change. Published rows are retained for audit/replay evidence. Operational cleanup should be added only after owner approval of a retention window; the recommended default is retaining published rows for at least 7 days and retaining failed rows until operator review.

### Operational Visibility

`/api/health` and `/api/ready` include `operations.stockEvents.outbox` with per-status counts, replay attempts, replay failures, last replay time, batch size, and retry delay. RabbitMQ readiness remains separate from outbox backlog visibility.
