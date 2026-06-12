# Agents: warehouse-microservice

## One-Command Continuation

When the user says:

```text
WAREHOUSE ORCHESTRATOR: continue implementation
```

or:

```text
Continue implementation of this project.
```

act as the Warehouse implementation orchestrator.

Do not ask the user which goal is next. Determine the next action from:

```text
docs/IMPLEMENTATION_STATE.md
docs/IMPLEMENTATION_ORCHESTRATOR.md
implementation-goals/README.md
TASKS.md
STATE.json
```

Then continue from the latest checkpoint.

## Required Reading

Before implementation, branch orchestration, or launching workers, read:

```text
README.md
SYSTEM.md
docs/orchestrator/warehouse-intent-plan.md
docs/intent-preservation/README.md
docs/intent-preservation/TRACEABILITY_MATRIX.md
docs/intent-preservation/PRE_CODING_GATE.md
docs/IMPLEMENTATION_STATE.md
docs/IMPLEMENTATION_ORCHESTRATOR.md
docs/governance/PROJECT_INVARIANTS.md
docs/process/DOCUMENTATION_COMPLETENESS_STANDARD.md
docs/process/OPERATIONAL_GATES.md
docs/process/AGENT_GAP_FILLING_RULES.md
docs/AGENT_ORCHESTRATION.md
docs/orchestration/branch-workflow.md
implementation-goals/README.md
TASKS.md
STATE.json
```

For a specific goal, also read the matching file in `implementation-goals/`.

## Knowledge Retrieval (query before reading files)
Query the RAG service first to reuse indexed ecosystem context before reading raw files:

```bash
curl -s -X POST http://docs-rag-microservice.statex-apps.svc.cluster.local:3397/retrieval/agent-context \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "YOUR QUESTION HERE", "maxTokens": 3000}'
```

- Internal URL: `http://docs-rag-microservice.statex-apps.svc.cluster.local:3397`
- Public URL: `https://docs-rag.alfares.cz`
- Full guide: `docs-rag-microservice/docs/RAG_USAGE.md`

## Goal-Driven Coordination

Warehouse is a data service, but production-grade changes must still follow the ecosystem goal/task discipline.

Reading order:

1. `BUSINESS.md` (immutable by AI)
2. `SYSTEM.md`
3. `docs/orchestrator/warehouse-intent-plan.md`
4. `docs/intent-preservation/README.md`
5. `docs/intent-preservation/TRACEABILITY_MATRIX.md`
6. `docs/intent-preservation/PRE_CODING_GATE.md`
7. `docs/IMPLEMENTATION_STATE.md`
8. `docs/IMPLEMENTATION_ORCHESTRATOR.md`
9. `implementation-goals/README.md`
10. `AGENTS.md`
11. `TASKS.md`
12. `STATE.json`

Rules:

- Do not edit `BUSINESS.md`.
- Authoritative owner-approved goals now live in `docs/orchestrator/GOALS.md` and `implementation-goals/`.
- Work on the earliest unfinished goal unless the owner explicitly selects another.
- Do not code before the relevant task has a `goal_id`, acceptance criteria, and validation path.
- Do not code before the selected task has an IPS task document, execution plan, context package, coding prompt, and validation report draft.
- Preserve the chain `Intent -> Invariants -> Goal -> Task -> Execution Plan -> Context Package -> Coding Prompt -> Code -> Validation Report -> State Update`.
- AI or agents must never adjust production stock without explicit owner-approved task context.
- Prefer read-only sub-agents for ecosystem mapping and validation. Code-editing workers must have disjoint file ownership and must not revert other agents' or human changes.
- The master orchestrator owns goal selection, task splitting, worker coordination, validation, and state updates.
- Update `docs/IMPLEMENTATION_STATE.md`, `TASKS.md`, and `STATE.json` before ending an implementation session.
- Production deployment requires explicit owner approval in the current session.

## Active Agents
<!-- Coordinator-maintained -->
None.
