# System: warehouse-microservice

## Architecture

NestJS + PostgreSQL. Real-time stock events via RabbitMQ.

- Stock types: own warehouse + supplier dropship
- Reserve stock for pending orders
- Events: `stock.updated` published on all changes

## Integrations

| Dependency | URL |
|-----------|-----|
| database-server | db-server-postgres:5432 |
| logging-microservice | logging-microservice:3367 |
| RabbitMQ | stock.updated events |

## Current State
<!-- AI-maintained -->
Stage: production

## Known Issues
<!-- AI-maintained -->
- None
