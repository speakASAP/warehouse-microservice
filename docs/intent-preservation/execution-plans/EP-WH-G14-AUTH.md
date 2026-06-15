# EP-WH-G14-AUTH - Authenticated Actor Enforcement

Metadata:
- id: EP-WH-G14-AUTH
- status: source-implemented
- goal_id: WH-G14-AUTH
- task_ids:
  - WH-G14-AUTH-T1
- created: 2026-06-13
- last_updated: 2026-06-13

## Scope

Allowed files:
- `src/auth/authenticated-actor.ts`
- `src/auth/jwt-roles.guard.ts`
- `src/stock/dto/stock-mutation.dto.ts`
- `src/stock/stock.controller.ts`
- `src/reservations/reservations.controller.ts`
- `src/suppliers/dto/supplier-stock-reconciliation.dto.ts`
- `src/suppliers/supplier-reconciliation.controller.ts`
- `test/authenticated-actor.spec.ts`
- WH-G14-AUTH IPS artifacts only.

Forbidden files:
- Shared orchestrator state files unless the orchestrator/integration owner updates them.
- Production manifests and deploy scripts.
- Stock persistence semantics outside actor context wiring.

## Plan

1. Preserve safe Auth JWT fields in `request.user` after local JWT verification.
2. Add a single actor derivation helper for mutation controllers.
3. Make body actor optional/deprecated in mutation DTOs.
4. Pass derived actor from stock, reservation, and supplier reconciliation controllers.
5. Add focused tests proving spoofed body actor values are ignored.
6. Run unit tests, build, and diff check.

## Parallel Execution

| Workstream | Status | Owner | Files | Dependency | Validation |
| --- | --- | --- | --- | --- | --- |
| Auth actor helper | ready now | WH-G14 worker | `src/auth/*`, focused test | Auth JWT contract docs/source | Jest auth actor tests |
| Mutation controller wiring | ready now after helper | WH-G14 worker | stock/reservation/supplier controllers and DTOs | Helper shape | Jest controller assertions |
| Integration validation | final integration | WH-G14 worker | no extra source files | Source edits complete | `npm test -- --runInBand`, `npm run build`, `git diff --check` |

## Gate Evidence

- Git status before edit: remote `main...origin/main`, clean.
- Auth contract source: `auth-microservice/docs/UNIFIED_AUTH_CONTRACT.md` and `docs/CONSUMER_JWT_VALIDATION_STANDARD.md`.
- DocsRAG attempt: blocked because Auth pod lacks `curl`; no token was printed.
- Gate result: pass-with-documented-risk because service identity claim naming is not standardized; helper supports current Auth subject claims plus safe future service identity claim names.
