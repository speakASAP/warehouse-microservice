# EP-WH-GX: Execution Plan Title

```yaml
id: EP-WH-GX
status: draft
source_task:
  - docs/intent-preservation/tasks/WH-GX-T1.md
owner: warehouse-owner
created: YYYY-MM-DD
last_updated: YYYY-MM-DD
completeness_level: skeletal
```

## Metadata

Goal:

Lifecycle state:

## Upstream Traceability

- Original intent:
- Invariants:
- Goal brief:
- Tasks:
- Current state:

## Goal Impact

Explain how this work preserves or advances the original warehouse intent.

## Project Invariants

List applicable invariants from `docs/governance/PROJECT_INVARIANTS.md` and how the plan preserves each one.

## Sensitive-Data Handling

Classify data used by the task and state how prompts, tests, examples, logs, screenshots, and reports avoid secrets and raw production data.

## Contract Validation Plan

State request/response/event/schema impact and how it will be validated.

## Replay/Determinism Plan

State idempotency, retry, transaction, ordering, or deterministic validation expectations.

## Scope

Define exact implementation scope.

## Non-Goals

Define what must not be changed.

## Files To Inspect

- path

## Files To Create

- path or `none expected`

## Files To Modify

- path

## Files That Must Not Be Modified

- path

## Implementation Steps

1. Complete the pre-coding gate.
2. Inspect source files.
3. Implement bounded changes.
4. Add or update tests.
5. Run validation.
6. Update state and reports.

## Test Plan

Describe focused tests.

## Validation Plan

List validation commands.

## Gate Commands

```bash
git status --short --branch
./scripts/next_goal.sh
```

## Documentation Updates

List docs that must be updated before completion.

## Rollback Plan

Describe how to revert only this task safely.

## Agent Handoff Prompt

Provide the coding-agent prompt.

## Completion Checklist

- [ ] Pre-coding gate evidence recorded
- [ ] Implementation complete
- [ ] Tests complete
- [ ] Validation evidence collected
- [ ] Documentation updated
- [ ] Deviations documented
