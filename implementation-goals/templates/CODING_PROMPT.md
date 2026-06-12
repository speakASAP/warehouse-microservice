# PROMPT-WH-GX: Coding Prompt Title

```yaml
id: PROMPT-WH-GX
status: draft
owner: warehouse-owner
created: YYYY-MM-DD
last_updated: YYYY-MM-DD
completeness_level: skeletal
upstream:
  - docs/intent-preservation/context-packages/CP-WH-GX.md
  - docs/intent-preservation/execution-plans/EP-WH-GX.md
downstream:
  - docs/intent-preservation/validation-reports/VAL-WH-GX.md
related_adrs: []
```

## Task Summary

State the implementation task.

## Execution Plan Link

Use `docs/intent-preservation/execution-plans/EP-WH-GX.md`.

## Required Context

List documents and files the agent must read before edits.

## Allowed Changes

- path or module

## Forbidden Changes

- protected file or behavior

## Implementation Instructions

1. Run and record the pre-coding gate.
2. Keep changes inside the execution-plan file scope.
3. Implement the task.
4. Add or update tests.
5. Run validation commands.
6. Update validation report and state files.

## Acceptance Criteria

- criterion

## Validation Commands

```bash
command
```

## Expected Output

Report files changed, behavior changed, validation results, risks, and next command.
