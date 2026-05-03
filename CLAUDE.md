# CLAUDE.md (warehouse-microservice)

→ Ecosystem: [../shared/CLAUDE.md](../shared/CLAUDE.md) | Reading order: `BUSINESS.md` → `SYSTEM.md` → `AGENTS.md` → `TASKS.md` → `STATE.json`

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
