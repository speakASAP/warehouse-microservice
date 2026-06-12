# Agents: warehouse-microservice


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
4. `AGENTS.md`
5. `TASKS.md`
6. `STATE.json`

Rules:

- Do not edit `BUSINESS.md`.
- Do not create authoritative `GOALS.md`, `SPEC.md`, or `PLAN.md` entries without owner approval.
- Use the goal IDs from `docs/orchestrator/warehouse-intent-plan.md` and `TASKS.md` until owner-approved goals exist.
- Work on the earliest unfinished goal unless the owner explicitly selects another.
- Do not code before the relevant task has a `goal_id`, acceptance criteria, and validation path.
- AI or agents must never adjust production stock without explicit owner-approved task context.
- Prefer read-only sub-agents for ecosystem mapping and validation. Code-editing workers must have disjoint file ownership and must not revert other agents' or human changes.

## Active Agents
<!-- Coordinator-maintained -->
None.
