# Agent Orchestration

Warehouse implementation uses one master orchestrator and bounded worker agents.

## Master Orchestrator

The orchestrator owns:

- goal selection;
- task decomposition;
- intent preservation;
- worker assignment;
- validation coordination;
- state updates;
- final session reporting.

The orchestrator must not rely on chat memory. It must resume from:

- `docs/IMPLEMENTATION_STATE.md`
- `STATE.json`
- `TASKS.md`
- `docs/orchestrator/warehouse-intent-plan.md`
- `implementation-goals/`

## Worker Roles

Explorer:

- reads docs and source;
- returns constraints, risks, and file ownership recommendations;
- does not edit code.

Worker:

- edits a bounded file set;
- follows the selected goal execution plan;
- does not revert unrelated changes.

Validator:

- runs checks;
- compares results to acceptance criteria;
- reports failures, residual risks, and evidence.

Merge reviewer:

- integrates parallel work only after the orchestrator assigns a merge path;
- preserves intent from all branches.

## Task Routing

Each task must state:

- goal ID;
- required capability;
- file ownership;
- acceptance criteria;
- validation command or evidence path;
- risk level;
- approval requirement.

Coding tasks must not start until the selected goal has an execution plan and a validation path.

## Reporting Contract

Every worker report must include:

```text
Goal:
Task:
Write ownership:
Implemented:
Not implemented:
Validation:
Risks:
Changed files:
Next action:
```

