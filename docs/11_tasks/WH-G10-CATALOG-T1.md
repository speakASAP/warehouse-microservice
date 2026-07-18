# WH-G10-CATALOG-T1 - Catalog Product Identity Reconciliation

```yaml
id: WH-G10-CATALOG-T1
status: active
goal_id: WH-G10-CATALOG-IDENTITY-VALIDATION
owner: warehouse-owner
created: 2026-06-13
sensitive_data: no-secrets-read-only-product-identifiers-and-stock-quantities
contract_schema_impact: additive-protected-read-only-warehouse-reconciliation-endpoint
replay_determinism_impact: read-only-report-no-stock-mutation
operational_gates:
  - pre-coding
  - validation
```

## Upstream Traceability

- `docs/orchestrator/warehouse-intent-plan.md`
- `docs/governance/PROJECT_INVARIANTS.md`
- `docs/12_validation/PRE_CODING_GATE.md`
- `docs/contracts/availability-contracts.md`
- Delegated owner approval for Catalog Identity Validation on 2026-06-13.

## Goal Impact

Warehouse stock rows must not silently drift from Catalog product truth. Live stock-write validation is not selected because the Catalog service-token and failure-mode contract is not approved. This task adds a first-class reconciliation report that checks Warehouse `productId` values against Catalog product identity reads and surfaces unknown IDs for operator repair.

## Acceptance Criteria

- Protected read-only endpoint reports Warehouse product IDs that Catalog rejects as unknown.
- Report separates true unknown IDs from Catalog dependency outages.
- Report can scan current Warehouse stock product IDs or a caller-supplied product list.
- No stock, reservation, supplier, movement, event, schema, or deployment change occurs.
- Availability contract documents the report and the live-validation blocker.

## Validation Path

- Focused Jest coverage for known, unknown, and Catalog-unavailable cases.
- Full Jest test suite.
- Nest build.
- `git diff --check`.
