# WH-G1 - Deployment And Truthful Health

Status: done.

## Objective

Make Warehouse safe to rebuild and redeploy before changing domain behavior.

## Current Evidence

- Dockerfile package installation was fixed for `node:24-slim`.
- Deploy script health check was corrected to `/api/health`.
- `/api/health` and `/api/ready` report database and RabbitMQ readiness separately.

## Acceptance Criteria

- Docker image builds from a valid base/package-manager combination.
- Deploy script checks the actual health path.
- Readiness exposes RabbitMQ failure instead of reporting full readiness.
- Production `/api/health` remains available after rollout.

## Validation

Completed in prior cycle. Preserve evidence in `docs/IMPLEMENTATION_STATE.md` and `docs/orchestrator/warehouse-intent-plan.md`.

