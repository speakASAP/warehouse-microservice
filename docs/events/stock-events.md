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
