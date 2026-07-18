# Warehouse Implementation Goals

This directory contains executable goal briefs for separate orchestrated sessions.

Use the master command:

```text
WAREHOUSE ORCHESTRATOR: continue implementation
```

To print the current checkpoint:

```bash
./scripts/next_goal.sh
```

## Goals

1. `GOAL-01-deployment-health.md` - deploy reliability and truthful health/readiness.
2. `GOAL-02-rabbitmq-stock-events.md` - RabbitMQ service, broker reachability, event contract.
3. `GOAL-03-stock-mutation-invariants.md` - DTOs, reason/actor, transactions, non-negative invariants.
4. `GOAL-04-reservation-lifecycle.md` - reservation rows and checkout/payment lifecycle.
5. `GOAL-05-catalog-availability-contracts.md` - catalog identity and batch availability contracts.
6. `GOAL-06-supplier-reconciliation.md` - supplier dropship reconciliation.
7. `GOAL-07-production-observability.md` - logs, metrics, runbook, smoke checks.
8. `GOAL-08-database-migration-discipline.md` - TypeORM migrations and deploy-time migration execution.
9. `GOAL-09-production-admin-console.md` - production admin console for operators.
10. `GOAL-10-landing-auth-admin-gate.md` - public landing and authenticated admin gate.
11. `GOAL-11-stock-origin-visibility.md` - availability origin metadata.
12. `GOAL-12-inventory-topology-read-model.md` - operator inventory topology read model.
13. `GOAL-13-admin-inventory-topology.md` - admin console topology visibility.
14. `GOAL-14-product-logistics-route-read-model.md` - product logistics route read model.
15. `GOAL-15-batch-logistics-contract.md` - batch product logistics contract.
16. `GOAL-16-fulfillment-handoff.md` - paid order fulfillment handoff and pick-ticket contract.

## Safe Sequence

```text
WH-G1 -> WH-G2 -> WH-G3 -> WH-G4 + WH-G5 -> WH-G6 -> WH-G7 -> WH-G8 -> WH-G9
```

WH-G1 through WH-G9 are complete in the remote production repository. Future goals require owner approval and a new goal file before coding.

## Required Workflow For Every Goal

1. Read `AGENTS.md`, `SYSTEM.md`, `TASKS.md`, `STATE.json`, `docs/IMPLEMENTATION_STATE.md`, `docs/IMPLEMENTATION_ORCHESTRATOR.md`, and the selected goal file.
2. Run status checks before editing.
3. Create or update the IPS task document, execution plan, context package, coding prompt, and validation report draft under the numbered `docs/NN_*` layers.
4. Complete the pre-coding gate before source edits.
5. Keep implementation inside selected goal scope.
6. Use subagents only when file ownership is disjoint.
7. Run the narrowest relevant validation.
8. Produce an intent compliance report.
9. Update `docs/IMPLEMENTATION_STATE.md`, `TASKS.md`, and `STATE.json`.
