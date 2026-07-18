# WH-G10-T1 - Public Landing And Authenticated Warehouse Admin Entry

```yaml
id: WH-G10-T1
status: active
goal_id: WH-G10
owner: warehouse-owner
created: 2026-06-13
sensitive_data: credentials-entered-by-user-not-logged-or-persisted-except-access-token-local-storage
contract_schema_impact: frontend-consumes-auth-login-register-jwt-contract-no-warehouse-api-schema-change
replay_determinism_impact: none-static-frontend-auth-state-only
operational_gates:
  - pre-coding
  - deployment-readiness
```

## Upstream Traceability

- `docs/orchestrator/warehouse-intent-plan.md`
- `docs/governance/PROJECT_INVARIANTS.md`
- `docs/12_validation/TRACEABILITY_MATRIX.md`
- `implementation-goals/GOAL-10-landing-auth-admin-gate.md`
- `auth-microservice/docs/UNIFIED_AUTH_CONTRACT.md`

## Goal Impact

Creates a public commercial entry point for the warehouse service and removes unauthenticated admin workspace exposure in the browser while preserving Auth as the identity/RBAC authority.

## Acceptance Criteria

- Public `/` landing page exists and communicates warehouse value.
- Login and registration forms call Auth JSON endpoints.
- Admin workspace is hidden until token role check passes.
- Non-admin authenticated users cannot access admin panels/actions in the UI.
- Existing protected warehouse API calls still rely on bearer auth and server-side role enforcement.

## Validation Path

- Static JS syntax checks.
- Nest build.
- Local smoke checks for `/` and `/admin` once the service starts.
- No production deployment without explicit owner approval.
