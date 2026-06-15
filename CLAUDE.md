# Claude Instructions

Shared rules live here:

- Claude profile: `/home/ssf/.claude/CLAUDE.md`
- Shared ecosystem instructions: `/home/ssf/Documents/Github/CLAUDE.md`
- Codex profile: `/home/ssf/.codex/AGENTS.md`
- Cross-agent standard: `/home/ssf/.ai-agent-standards/CROSS_AGENT_AUTOMATION_STANDARD.md`
- Repository operations: `AGENT_OPERATIONS.md`

Read those first, then follow the repository-specific notes below and the current planning/status files.


## Repository-Specific Notes

# CLAUDE.md (warehouse-microservice)

→ Ecosystem: [../shared/CLAUDE.md](../shared/CLAUDE.md) | Reading order: `BUSINESS.md` → `SYSTEM.md` → `AGENTS.md` → `TASKS.md` → `STATE.json`

---

## Knowledge Retrieval — docs-rag-microservice (MANDATORY, query before reading files)

**Query the RAG before reading source files** — saves 2000-5000 tokens per answer.

```bash
kubectl -n statex-apps exec deployment/warehouse-microservice -- curl -s -X POST http://docs-rag-microservice:3397/retrieval/agent-context \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(cat ~/.claude/rag-token)" \
  -d '{"query": "YOUR QUESTION HERE", "maxTokens": 3000}'
```
---

## warehouse-microservice

**Purpose**: Real-time stock tracking across own warehouses and supplier dropship inventory. Publishes stock change events via RabbitMQ.  
**Port**: 3201  
**Domain**: https://warehouse.alfares.cz  
**Stack**: NestJS · PostgreSQL · RabbitMQ

### Key constraints
- Stock adjustments must always include a reason code — no unexplained mutations
- Never adjust stock without explicit task approval
- Negative stock is forbidden — enforce at service level
- Never delete stock history — audit trail is required

### Events published
- `stock.updated` → RabbitMQ (consumed by allegro-service, aukro-service, bazos-service, heureka-service)

### Consumers
flipflop-service, allegro-service, aukro-service, bazos-service, heureka-service.

**Ops**: `curl http://warehouse-microservice:3201/health` · `kubectl logs -n statex-apps -l app=warehouse-microservice -f` · `./scripts/deploy.sh`
