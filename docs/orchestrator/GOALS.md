# Warehouse Goals

Authoritative goal sequence for Warehouse implementation.

## Foundation Sequence

1. WH-G1 - Deployment and truthful health. Status: done.
2. WH-G2 - RabbitMQ stock events. Status: done.
3. WH-G3 - Stock mutation invariants. Status: done.
4. WH-G4 - Reservation lifecycle. Status: done.
5. WH-G5 - Catalog and availability contracts. Status: done.
6. WH-G6 - Supplier reconciliation. Status: done.
7. WH-G7 - Production observability and operations. Status: done.
8. WH-G8 - Committed database migration discipline. Status: done.
9. WH-G9 - Production warehouse admin console. Status: done.

Detailed execution files live in `implementation-goals/`.

## Historical Source Goals

The repository also contains completed source goals WH-G10 through WH-G15 in `docs/IMPLEMENTATION_STATE.md`:

- WH-G10 - Landing page and authenticated admin entry. Status: done/deployed.
- WH-G11 - Stock origin visibility. Status: done/source-validated.
- WH-G12 - Inventory topology read model. Status: done/source-validated.
- WH-G13 - Admin inventory topology visibility. Status: done/source-validated.
- WH-G14 - Product logistics route read model. Status: done/source-validated.
- WH-G15 - Batch product logistics contract. Status: done/source-validated.

## Owner-Approved Parallel Wave Collected 2026-06-14

Owner approved the following candidate goals for parallel start on 2026-06-13. The worker outputs are committed and deployed in image `localhost:5000/warehouse-microservice:fab5bee`.

| Goal | Status | Evidence | Notes |
| --- | --- | --- | --- |
| WH-G10-CATALOG - Catalog identity validation | deployed | `docs/intent-preservation/validation-reports/VAL-WH-G10-CATALOG.md` | Read-only reconciliation endpoint/report. |
| WH-G11-OUTBOX - Transactional stock event outbox | deployed | `docs/intent-preservation/validation-reports/VAL-WH-G11-OUTBOX.md` | Requires migration before deployment. |
| WH-G12 - Automatic reservation expiry | deployed | `docs/intent-preservation/validation-reports/VAL-WH-G12.md` | Adds protected batch endpoint and Kubernetes CronJob. |
| WH-G13-CONFLICTS - Supplier conflict operations | deployed | `docs/intent-preservation/validation-reports/VAL-WH-G13-CONFLICTS.md` | Added during collection because prior WH-G13 artifacts described older admin topology work. |
| WH-G14-AUTH - Authenticated actor enforcement | deployed | `docs/intent-preservation/validation-reports/VAL-WH-G14-AUTH.md` | Uses suffixed ID to avoid overwriting completed WH-G14 product-logistics evidence. |

## Current Integration Validation

- `git diff --check`: passed on 2026-06-14.
- `npm test -- --runInBand`: passed on 2026-06-14, 8 suites / 50 tests.
- `npm run build`: passed on 2026-06-14.

## Parallel Goal Rules

Future goals must be classified before execution:

- `ready_parallel`: can start in its own session with disjoint write ownership and no unfinished dependency.
- `blocked`: cannot start because approval, source context, contract clarity, environment access, or validation evidence is missing.
- `sequential_dependency`: must wait for another goal or integration point.
- `validation_only`: can run in parallel because it reads state or executes checks without changing source.

Every new goal file must include blockers, dependencies, write ownership, validation ownership, and integration notes so multiple agents can work without conflicting edits.

## Next Goal Processing Rule

Next coding is blocked until the owner approves a new source-only goal and the IPS pre-coding gate is completed before edits.
