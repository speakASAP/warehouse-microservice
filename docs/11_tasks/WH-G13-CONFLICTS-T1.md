# WH-G13-CONFLICTS-T1 - Supplier Conflict Operations

Metadata:
- id: WH-G13-CONFLICTS-T1
- goal_id: WH-G13-CONFLICTS
- status: done
- created: 2026-06-14
- last_updated: 2026-06-14
- completeness_level: complete

## Upstream Traceability

- Goal: `implementation-goals/GOAL-13-supplier-conflict-operations.md`
- Intent: Warehouse preserves central stock and supplier reconciliation evidence while surfacing conflicts for operator review.
- Invariants: Warehouse stock authority, supplier reconciliation evidence, Auth/RBAC boundary, repeatable migrations.

## Task

Add supplier reconciliation conflict listing and review operations, including DTO validation, service filters, review metadata, migration coverage, and focused tests.

## Scope

Allowed files:
- `src/suppliers/**`
- `src/migrations/**`
- `test/supplier-reconciliation.service.spec.ts`
- relevant runbook/admin docs when needed

Forbidden files:
- unrelated stock mutation semantics except integration with authenticated actor helper already owned by WH-G14-AUTH
- production deployment scripts except deploy manifest inclusion when required by migration discipline

## Impact Classifications

- Sensitive-data classification: no secrets; supplier IDs, warehouse IDs, product IDs, external references, and operator notes are operational data.
- Contract/schema impact: additive API filters/review endpoint and additive reconciliation review columns.
- Replay/determinism impact: review is idempotent for already-reviewed conflicts except note updates; no stock quantities are changed.

## Validation

- `npm test -- --runInBand test/supplier-reconciliation.service.spec.ts`
- `npm test -- --runInBand`
- `npm run build`
- `git diff --check`
