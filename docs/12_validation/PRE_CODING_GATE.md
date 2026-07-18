# Warehouse Pre-Coding Gate

```yaml
id: WH-IPS-PRE-CODING-GATE
status: draft
owner: warehouse-owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
upstream:
  - docs/INTENT_PRESERVATION_README.md
  - docs/process/OPERATIONAL_GATES.md
  - docs/governance/PROJECT_INVARIANTS.md
downstream:
  - docs/21_execution_plans/
  - docs/12_validation/
related_adrs: []
```

## Purpose

This gate prevents coding from starting from vague intent. It must be completed for every warehouse implementation task before source files are edited.

## Required Inputs

- selected goal from `implementation-goals/`;
- task document from `docs/11_tasks/`;
- current implementation state from `docs/IMPLEMENTATION_STATE.md`;
- current task backlog from `TASKS.md`;
- project invariants from `docs/governance/PROJECT_INVARIANTS.md`;
- current git and remote working-tree status;
- relevant source files listed by the execution plan.

## Blocking Checks

Coding is blocked when any of these checks fail:

- no selected goal;
- selected goal does not map to the preserved warehouse intent;
- task has no upstream traceability;
- task has no goal impact statement;
- project invariant impact is missing;
- sensitive-data classification is missing;
- contract/schema impact is missing;
- replay, idempotency, or determinism impact is missing for state-changing work;
- execution plan is missing;
- context package is missing;
- coding prompt is missing;
- validation commands are not listed;
- owner approval is missing for production stock mutation or deployment;
- a required upstream ownership boundary is ambiguous.

## Required Evidence

Record this evidence in the task or validation report:

```text
Gate:
Date:
Goal:
Task:
Repository root:
Git status:
Remote status:
Execution plan:
Context package:
Coding prompt:
Invariants checked:
Sensitive-data classification:
Contract/schema impact:
Replay/determinism impact:
Validation commands:
Result:
```

## Warehouse-Specific Checks

For stock mutation work, verify before coding:

- no production stock payload will be sent without owner approval;
- DTO or runtime validation is planned for all changed request bodies;
- actor and reason code are required for all changed stock writes;
- stock update and movement evidence are covered by transaction planning;
- tests cover invalid negative state and insufficient stock;
- reservation lifecycle changes are excluded unless the selected goal is WH-G4.

For event work, verify before coding:

- RabbitMQ readiness and health behavior remain observable;
- event schema changes have contract validation;
- failed publishing cannot be silently reported as healthy.

For availability or catalog integration work, verify before coding:

- catalog remains product identity owner;
- warehouse remains stock truth;
- service-to-service auth is documented.

## Gate Result Policy

- `pass`: coding may start inside the execution-plan file scope.
- `pass-with-documented-risk`: coding may start only when the risk does not alter behavior or ownership boundaries.
- `fail`: coding must not start. Fill missing docs, split the task, or ask the owner.
