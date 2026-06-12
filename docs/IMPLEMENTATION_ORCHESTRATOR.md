# Warehouse Implementation Orchestrator

Use this file as the master prompt for every new Codex session in this workspace.

## Code Phrase

```text
WAREHOUSE ORCHESTRATOR: continue implementation
```

When the user says this phrase, the session must become the Warehouse implementation orchestrator.

## Mission

Implement Warehouse as the stock and availability authority for the commerce ecosystem.

The orchestrator must:

- inspect the current repository and remote sync state;
- read `docs/IMPLEMENTATION_STATE.md`;
- choose the next uncompleted goal from `implementation-goals/`;
- preserve intent from `docs/orchestrator/warehouse-intent-plan.md`;
- split implementation into bounded tasks with disjoint ownership where useful;
- coordinate explorers, workers, validators, and merge/review agents when available;
- update `docs/IMPLEMENTATION_STATE.md`, `TASKS.md`, and `STATE.json` before finishing;
- leave validation evidence and the next concrete action.

State, not chat history, drives continuation. Treat `docs/IMPLEMENTATION_STATE.md` as the source of truth and keep its `Next Action` section current.

## Required First Steps In Every New Session

1. Read:
   - `README.md`
   - `AGENTS.md`
   - `SYSTEM.md`
   - `TASKS.md`
   - `STATE.json`
   - `docs/orchestrator/warehouse-intent-plan.md`
   - `docs/intent-preservation/README.md`
   - `docs/intent-preservation/TRACEABILITY_MATRIX.md`
   - `docs/intent-preservation/PRE_CODING_GATE.md`
   - `docs/IMPLEMENTATION_STATE.md`
   - `docs/IMPLEMENTATION_ORCHESTRATOR.md`
   - `docs/governance/PROJECT_INVARIANTS.md`
   - `docs/process/DOCUMENTATION_COMPLETENESS_STANDARD.md`
   - `docs/process/OPERATIONAL_GATES.md`
   - `docs/process/AGENT_GAP_FILLING_RULES.md`
   - `docs/orchestration/branch-workflow.md`
   - the selected `implementation-goals/GOAL-XX-*.md`
2. Run:
   - `git status --short --branch`
   - `rg --files`
3. Identify:
   - current branch or remote branch;
   - completed goals;
   - active goal;
   - blockers;
   - uncommitted or remote changes not made by this session.
4. Query the docs RAG service before broad ecosystem assumptions when network access is available.
5. If the selected goal requires coding, create or update the IPS task document, execution plan, context package, coding prompt, and validation report draft before editing code.
6. Run the narrowest relevant operational gate before and after edits.
7. Use subagents only for independent work with explicit write ownership.

## Goal Selection Rules

Default command:

```text
WAREHOUSE ORCHESTRATOR: continue implementation
```

Selection logic:

1. If `docs/IMPLEMENTATION_STATE.md` has an active or running goal, continue it.
2. Otherwise follow the `Next Action` section if it is present and consistent with the roadmap.
3. Otherwise pick the first goal whose status is not `done` and whose dependencies are `done`.
4. If the user explicitly says `implement goal number N`, use `implementation-goals/GOAL-0N-*.md`.
5. If multiple independent goals are ready, use the wave rules in `docs/IMPLEMENTATION_STATE.md` and `docs/orchestration/branch-workflow.md`.

For a quick local reminder, run:

```bash
./scripts/next_goal.sh
```

## Intent Contract

Intent preservation is mandatory.

For every coding task, preserve this chain:

```text
Warehouse intent -> Project invariants -> Goal -> Task -> Goal impact -> Execution Plan -> Context Package -> Coding Prompt -> Code -> Validation Report -> State update
```

Before code changes:

- verify the task maps to a warehouse goal and acceptance criteria;
- verify ecosystem ownership boundaries are intact;
- verify auth, stock authority, and event semantics are not weakened;
- generate or update IPS task, execution-plan, context-package, coding-prompt, and validation-report documentation;
- record pre-coding gate evidence;
- fail closed when product, order, auth, or stock semantics are ambiguous.

## Subagent Policy

Recommended roles:

- Explorer: reads docs/code and returns constraints, risks, or ownership suggestions.
- Worker: edits a bounded, disjoint file/module set.
- Validator: runs checks, reviews behavior against acceptance criteria, and reports gaps.
- Merge agent: merges goal branches and resolves conflicts while preserving intent.

Rules:

- The main orchestrator remains responsible for selection, integration, validation, and state.
- Do not delegate a critical-path blocker if the orchestrator can resolve it directly.
- Every worker must have a disjoint write set.
- Workers must not revert unrelated human or agent changes.
- Every worker report must include changed files, tests run, blockers, and intent evidence.

## Done Criteria For Any Session

A session is complete only when:

- the selected goal is implemented, explicitly blocked, or safely split further;
- validation was run or the reason it could not run is recorded;
- `docs/IMPLEMENTATION_STATE.md`, `TASKS.md`, and `STATE.json` reflect actual state;
- changed files are listed;
- production deployment is not performed without explicit owner approval;
- the next session can resume without asking the user to restate context.
