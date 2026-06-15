# CP-WH-G14-AUTH - Context Package

## Objective

Implement authenticated actor enforcement for Warehouse mutations so body `actor` values cannot impersonate another service.

## Required Context

- Warehouse `JwtRolesGuard` verifies Auth JWTs locally using Auth-sourced `JWT_SECRET` and preserves roles.
- Auth JWT contract currently includes `sub`, `email`, `type`, `roles`, optional `auth_method`, and standard JWT fields.
- Auth remains the identity/RBAC owner. Warehouse remains the stock evidence owner.
- Static service tokens/API keys must not be treated as Auth user identity.

## Implementation Notes

- Derive actor from verified `request.user`, not from request body.
- Prefer service identity when a verified service claim exists; otherwise use Auth subject.
- Avoid email in stored actor evidence; use `auth:<type>:<sub>`.
- Keep existing mutation service methods unchanged where possible.

## Risks

- [UNKNOWN: final ecosystem service-JWT claim name]. Current Auth contract does not define a standard `serviceName` JWT claim. The helper supports `serviceName`, `service`, and `clientId` if Auth adds one later.
- Existing clients may still send body `actor`; it is accepted but ignored for evidence.
