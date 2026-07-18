# Validation Debt Ledger

## Purpose

Record known validation failures or process gaps that are not caused by the current task, so agents can separate existing repo debt from real regressions.

## Rules

- This ledger does not excuse current-task failures.
- Every entry needs an owner, scope, and unblock condition.
- Do not include secrets, tokens, raw production data, customer identifiers, or private evidence.
- If a failure starts affecting the current task, promote it from debt to blocker.

## Entries

| ID | Date | Command | Failure Summary | Scope | Owner | Blocks Current Task? | Unblock Condition | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VD-001 | 2026-06-14 | orchestration collection | Historical WH-G10-WH-G15 numbering already exists, while newer approved parallel wave reused WH-G10/WH-G11/WH-G14 labels. Suffixed IDs are used for new artifacts to avoid overwriting completed evidence. | repo-wide process | orchestrator | no | Owner accepts suffixed IDs or schedules numbering normalization docs-only pass. | `docs/orchestrator/GOALS.md` |
| VD-002 | 2026-06-14 | WH-G13 collection | Supplier conflict operations source existed without dedicated IPS artifacts; orchestrator reconstructed WH-G13-CONFLICTS artifacts from source diff and validation evidence. | WH-G13-CONFLICTS process | orchestrator | no | Dedicated artifacts now exist; future workers must create IPS artifacts before source edits. | `docs/12_validation/VAL-WH-G13-CONFLICTS.md` |

## Current-Task Decision Checklist

- Does the failing command touch files changed by this task?
- Does the failure mention this task ID, goal ID, or changed module?
- Is the failure already listed above with `Blocks Current Task? = no`?
- Did the failure exist before this task started?
- Is the validation command required by the current task acceptance criteria?

## Agent Reporting Format

```text
Validation debt check:
- Command:
- Result:
- Matched ledger entry:
- Current-task impact:
- Next action:
```

Next step: Keep entries current whenever validation failures or process gaps are classified as out of scope.
