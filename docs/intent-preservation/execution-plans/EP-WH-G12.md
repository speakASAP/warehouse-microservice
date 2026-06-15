# EP-WH-G12 - Automatic Reservation Expiry

Metadata:
- id: EP-WH-G12
- goal_id: WH-G12
- task_ids: WH-G12-T1
- status: active
- created: 2026-06-13
- last_updated: 2026-06-13

## Upstream Traceability

- Intent: `docs/orchestrator/warehouse-intent-plan.md`
- Invariants: `docs/governance/PROJECT_INVARIANTS.md`
- Candidate goal: `docs/orchestrator/WH-G10-CANDIDATES.md`
- Task: `docs/intent-preservation/tasks/WH-G12-T1.md`
- Context package: `docs/intent-preservation/context-packages/CP-WH-G12.md`
- Coding prompt: `docs/intent-preservation/coding-prompts/PROMPT-WH-G12.md`

## Strategy

Use an explicit Kubernetes CronJob that calls a protected batch-expiry endpoint. This is safer than an in-process timer because production mutation scheduling stays visible in Kubernetes, can be suspended, has job history, and is deployment-controlled.

## Scope

- Add a DTO for batch expiry options.
- Add `POST /api/reservations/expire-due`.
- Add `ReservationsService.expireDueReservations`.
- Reuse `StockService.expireReservation` for every mutation.
- Add `k8s/reservation-expiry-cronjob.yaml`.
- Include the CronJob manifest in deploy application without deploying it in this worker.
- Add focused tests and runbook notes.

## Non-Goals

- Do not deploy.
- Do not mutate production stock/reservations during validation.
- Do not change reservation schema.
- Do not replace manual lifecycle endpoints.
- Do not edit shared orchestrator state files in this worker.

## Parallel Execution

| Workstream | Status | Owner | Files | Dependencies | Validation |
| --- | --- | --- | --- | --- | --- |
| WH-G12 endpoint/service | ready now | WH-G12 worker | `src/reservations/*`, DTO file, reservation tests | Existing WH-G4 lifecycle methods | Jest reservation tests |
| WH-G12 CronJob/runbook | ready now | WH-G12 worker | `k8s/reservation-expiry-cronjob.yaml`, `scripts/deploy.sh`, runbook | Endpoint contract | Build and diff check |
| Final validation | final integration | WH-G12 worker | none | Both workstreams | `npm test -- --runInBand`, `npm run build`, `git diff --check` |

Shared files/contracts: reservation lifecycle endpoint contract, deploy manifest list. Integration owner: WH-G12 worker. Validation owner: WH-G12 worker. Merge order: service endpoint, tests, CronJob manifest, runbook/docs.

## Pre-Coding Gate Evidence

Gate: Warehouse pre-coding gate
Date: 2026-06-13
Goal: WH-G12 Automatic Reservation Expiry
Task: WH-G12-T1
Repository root: `/home/ssf/Documents/Github/warehouse-microservice`
Git status: clean on `main...origin/main` before edits
Remote status: edited directly in remote repository after staging narrow patches under `/private/tmp`
Execution plan: `docs/intent-preservation/execution-plans/EP-WH-G12.md`
Context package: `docs/intent-preservation/context-packages/CP-WH-G12.md`
Coding prompt: `docs/intent-preservation/coding-prompts/PROMPT-WH-G12.md`
Invariants checked: 1, 6, 7, 8, 9, 10, 11, 12
Sensitive-data classification: internal operational metadata, no secrets or production payloads
Contract/schema impact: additive protected endpoint and CronJob manifest, no schema change
Replay/determinism impact: CronJob retries call idempotent lifecycle transition per reservation
Validation commands: `npm test -- --runInBand`, `npm run build`, `git diff --check`
Result: pass-with-documented-risk because shared state files are intentionally not updated by this worker

## Validation Plan

```bash
npm test -- --runInBand
npm run build
git diff --check
```

No production HTTP mutation smoke is approved for this worker.
