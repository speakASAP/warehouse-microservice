# Warehouse Intent Preservation System

```yaml
id: WH-IPS-README
status: draft
owner: warehouse-owner
created: 2026-06-12
last_updated: 2026-06-12
completeness_level: complete
upstream:
  - docs/orchestrator/warehouse-intent-plan.md
  - docs/governance/PROJECT_INVARIANTS.md
downstream:
  - docs/12_validation/TRACEABILITY_MATRIX.md
  - docs/12_validation/PRE_CODING_GATE.md
related_adrs: []
```

## Purpose

This folder adapts the company Intent Preservation System to `warehouse-microservice`.

The goal is to keep the original warehouse intent visible from business objective through coding prompt, validation evidence, and state update. Coding must not start until the selected task has traceability, declared invariants, sensitive-data handling, contract impact, an execution plan, a context package, a coding prompt, and named validation gates.

## Source Of Truth

The protected project intent is preserved in:

- `docs/orchestrator/warehouse-intent-plan.md`
- `docs/governance/PROJECT_INVARIANTS.md`
- `AGENTS.md`
- `SYSTEM.md`
- `TASKS.md`
- `STATE.json`
- `docs/IMPLEMENTATION_STATE.md`
- `implementation-goals/`

`BUSINESS.md`, `GOALS.md`, `SPEC.md`, and `PLAN.md` are not present in this local sync. Agents must not invent them as authoritative documents. If the owner later adds them, this IPS overlay must link to those files as upstream sources.

## Warehouse IPS Chain

Every coding cycle must preserve this chain:

```text
Warehouse intent
  -> Project invariants
  -> Goal
  -> Task
  -> Goal impact
  -> Execution plan
  -> Context package
  -> Coding prompt
  -> Code changes
  -> Validation report
  -> Implementation state update
```

## Immutable Intent Rules

Agents must not change these rules without owner approval:

- Warehouse is the stock and availability authority.
- Catalog owns product identity and sellable product content.
- Auth owns login, JWT, RBAC, and service identity.
- Orders owns order state; warehouse owns stock effects.
- Movement history is append-only business evidence.
- Stock mutations require authorization, actor/service identity, and reason code.
- Negative quantity, reserved, or available stock states are invalid.
- Event failures must be observable and must not look ready.
- Production stock must never be mutated by an agent without explicit owner-approved task context.
- Production deployment requires explicit owner approval in the current session.

## Required Artifacts Before Coding

For each implementation task, create or update:

- task document under `docs/11_tasks/`;
- execution plan under `docs/21_execution_plans/`;
- context package under `docs/13_context_packages/`;
- coding prompt under `docs/14_prompts/`;
- validation report draft under `docs/12_validation/`.

These documents may be `draft` before coding, but they must be meaningful and traceable. Do not use vague placeholders. If information cannot be derived, use `[MISSING: ...]` or `[UNKNOWN: ...]` and block coding until resolved when the missing item affects behavior.

## Completion Requirements

Before ending a coding session:

- validation evidence must be recorded in the validation report;
- `docs/IMPLEMENTATION_STATE.md` must reflect the goal state;
- `TASKS.md` must reflect completed or blocked task state;
- `STATE.json` must reflect current machine-readable state;
- deviations from the execution plan must be listed;
- the next command must be concrete.
