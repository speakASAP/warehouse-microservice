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
Health: degraded - HTTP health is up, but RabbitMQ event publishing is not currently reachable from the pod.

## Known Issues
<!-- AI-maintained -->
- RabbitMQ connection fails in production logs: `getaddrinfo ENOTFOUND host.k3s.internal`.
- No RabbitMQ service or pod was visible in Kubernetes during the 2026-06-12 inspection.
- `scripts/deploy.sh` checks `http://localhost:3201/health`, while the app serves `http://localhost:3201/api/health`.
- `Dockerfile` uses Debian `node:24-slim` with Alpine `apk add`.
- Stock mutation request bodies use inline TypeScript types, so the configured `ValidationPipe` cannot enforce DTO validation.
- Reservation reads exist, but reserve/unreserve writes do not maintain `stock_reservations` rows.
