# WH-G7 - Production Observability And Operations

Status: ready after WH-G4 and WH-G6.

## Objective

Make operators able to trust Warehouse in production.

## Intent Link

Warehouse owns stock truth. Operators need logs, metrics, health, runbooks, rollback procedures, and smoke checks that prove stock mutations, reservations, and events are behaving correctly.

## Scope

- Logs include actor, product ID, warehouse ID, reason code, reference/order ID, and event result for stock changes.
- Metrics or health expose database, RabbitMQ, and mutation failure status.
- Runbook documents deploy, rollback, smoke tests, auth token testing, and event verification.
- State files reflect current goal status after each approved implementation cycle.

## Non-Goals

- Do not deploy without explicit owner approval.
- Do not add broad dashboards unless requested.
- Do not expose sensitive tokens or raw secrets in logs.

## Acceptance Criteria

- Operators can verify deploy, rollback, auth, stock mutation, reservation, and event paths.
- Smoke checks are documented or scripted.
- Secret redaction is preserved in operational output.
- `STATE.json`, `TASKS.md`, and implementation state are current.

## Validation

Run build/tests plus documented smoke checks that do not mutate production stock without approval.

