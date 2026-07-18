# CP-WH-G11-OUTBOX - Context Package

Warehouse already performs stock row and movement writes in TypeORM transactions, but RabbitMQ publishes were attempted after commit through the live channel. If RabbitMQ was unavailable or the process crashed after commit, event intent could be lost.

The outbox implementation adds a durable `stock_event_outbox` table. Mutation transactions enqueue `stock.updated` and threshold events in that table. The event service replays pending or retry-due failed rows to RabbitMQ and updates row status after each attempt. Health/readiness expose outbox status counts separately from RabbitMQ connectivity.

Constraints: no production deployment, no production stock mutation, no retention deletion, preserve Catalog/Auth/Orders ownership boundaries.
