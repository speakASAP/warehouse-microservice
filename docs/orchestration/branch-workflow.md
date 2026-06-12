# Branch And Worktree Workflow

Warehouse may be edited locally under `remote-sync` or remotely at `/home/ssf/Documents/Github/warehouse-microservice`.

## Default Rules

- Inspect current status before edits.
- Keep one goal per branch when working in the remote repository.
- Use disjoint worktrees or branches for parallel work.
- Do not merge parallel work until each branch has validation evidence.
- Do not deploy to production without explicit owner approval.

## Suggested Branch Names

```text
feature/wh-g3-stock-mutation-invariants
feature/wh-g4-reservation-lifecycle
feature/wh-g5-catalog-availability-contracts
feature/wh-g6-supplier-reconciliation
feature/wh-g7-production-observability
integration/wh-goal-merge
```

## Merge Rules

1. Read both goal files and validation reports.
2. Merge one branch at a time.
3. Preserve all accepted behavior and intent evidence.
4. Resolve conflicts by favoring explicit acceptance criteria over incidental implementation.
5. Re-run validation from every merged goal.
6. Update state files after merge.

