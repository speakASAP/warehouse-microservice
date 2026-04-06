# Business: warehouse-microservice
>
> ⚠️ IMMUTABLE BY AI.

## Goal

Real-time stock tracking across own warehouses and supplier dropship. Publishes stock events via RabbitMQ.

## Constraints

- Stock adjustments must be logged with reason code
- AI must never adjust stock without explicit task approval
- Negative stock is not allowed (enforce at service level)

## Consumers

flipflop-service, allegro-service, aukro-service, bazos-service, heureka-service.

## SLA

- Port: 3201 (<http://warehouse-microservice:3201>)
- Production: <https://warehouse.statex.cz>
- Event: `stock.updated` → RabbitMQ
