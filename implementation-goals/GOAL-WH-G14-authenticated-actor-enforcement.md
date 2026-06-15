# GOAL-WH-G14-AUTH - Authenticated Actor Enforcement

Metadata:
- id: WH-G14-AUTH
- source_delegation_goal: WH-G14 Authenticated Actor Enforcement
- status: source-implemented
- owner: warehouse-owner
- created: 2026-06-13
- last_updated: 2026-06-13
- completeness_level: complete

## Numbering Note

[MISSING: orchestrator numbering reconciliation] The delegation names this work WH-G14, but the remote repository already contains completed WH-G14 product-logistics evidence. This artifact uses `WH-G14-AUTH` to preserve the delegated intent without rewriting completed WH-G14 history.

## Intent

Derive mutation actors from verified Auth JWT/service identity context so request bodies cannot impersonate another service or operator in stock movement evidence.

## Scope

- Preserve Auth as identity, JWT, and RBAC owner.
- Preserve Warehouse as stock mutation and movement evidence owner.
- Derive actor values in Warehouse controllers from `request.user` attached by `JwtRolesGuard`.
- Keep body `actor` accepted only as deprecated client input; it must not control mutation evidence.
- No production stock mutation and no deployment.

## Acceptance Criteria

- Stock mutation endpoints pass derived actor to `StockService`.
- Reservation lifecycle endpoints pass derived actor to `ReservationsService`/`StockService`.
- Supplier reconciliation passes derived actor to `SupplierReconciliationService`.
- Tests prove spoofed body actor values are ignored.
- `npm test -- --runInBand`, `npm run build`, and `git diff --check` pass.
