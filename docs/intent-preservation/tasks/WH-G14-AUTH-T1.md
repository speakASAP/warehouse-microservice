# WH-G14-AUTH-T1 - Derive Mutation Actor From Verified Auth Context

Metadata:
- id: WH-G14-AUTH-T1
- goal_id: WH-G14-AUTH
- source_delegation_goal: WH-G14 Authenticated Actor Enforcement
- status: source-implemented
- created: 2026-06-13
- last_updated: 2026-06-13
- completeness_level: complete

## Task

Route all Warehouse stock-affecting HTTP mutation contexts through a server-derived actor based on verified JWT/service identity claims attached by `JwtRolesGuard`.

## Goal Impact

Prevents a caller from writing `actor: orders-microservice` or another service/operator name in the request body and having that value persisted as stock movement evidence.

## Upstream Traceability

- Vision: Warehouse is the stock and availability authority.
- System: Auth owns login, JWT, RBAC, and service identity.
- Invariants: 3, 6, 7, 11, 12.
- Delegation: WH-G14 Authenticated Actor Enforcement.

## Sensitive Data Classification

Internal auth metadata only. No JWTs, secrets, token bodies, passwords, or production user data may be printed or persisted in docs/tests. Actor derivation stores `auth:<type>:<sub>` for users to avoid persisting email addresses in movement evidence.

## Contract Impact

Body `actor` is deprecated as an authoritative input and optional in DTO validation. Existing clients that still send it are not rejected, but Warehouse ignores it for mutation evidence.

## Replay And Determinism Impact

Mutation replay remains driven by existing idempotency/reference rules. Actor derivation is deterministic for a verified token payload: service identity claims produce `service:<name>`, otherwise Auth subject claims produce `auth:<type>:<sub>`.

## Validation

- `npm test -- --runInBand`
- `npm run build`
- `git diff --check`
