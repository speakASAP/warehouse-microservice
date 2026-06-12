# WH-G9 - Production Warehouse Admin Console

Status: done.

## Objective

Give warehouse operators a deployed admin console for the production stock authority without bypassing the existing auth/RBAC boundary.

## Current Evidence

- `/admin` serves the warehouse admin console from production.
- Console includes supplier reconciliation and operations status.
- Static admin assets are included in the production Docker image.
- Protected mutation APIs still require bearer authentication.

## Acceptance Criteria

- `/admin` serves the production warehouse admin console.
- The console shows health, readiness, RabbitMQ, operation counters, warehouses, reservations, stock, movements, stock actions, reservation lifecycle actions, and supplier reconciliation.
- Authenticated API calls still require a bearer token.
- Unauthenticated mutation attempts are blocked client-side before protected endpoints are used.
- Static admin assets are included in the production Docker image.
- Browser smoke checks pass without console warnings.

## Validation

Completed in prior cycle:

```text
node --check public/admin/app.js
npm test -- --runInBand
npm run build
production /api/health
production /admin HTTP 200
unauthenticated supplier reconciliation API 401
browser smoke checks with no console warnings
```

