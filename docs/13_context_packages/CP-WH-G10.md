# CP-WH-G10 - Context Package

## Relevant Intent

Warehouse is the stock and availability authority. Auth owns login, JWT, RBAC, and service identity. Operators need safe production workflows without bypassing authorization.

## Current Implementation

- `/admin` is served as a static admin console.
- Existing admin API calls use a manually pasted bearer token.
- `JwtRolesGuard` protects APIs with default roles `global:superadmin` and `internal:warehouse-microservice:admin`.
- Auth JSON endpoints are `POST /auth/login` and `POST /auth/register`, returning `accessToken`, `refreshToken`, and `user`.

## Constraints

- Do not mint tokens in warehouse.
- Do not weaken server-side guards.
- Do not mutate production stock.
- Keep secrets and entered credentials out of logs and docs.
- Do not deploy without explicit owner approval.

## Files In Scope

- Static public frontend files.
- Minimal Nest route wiring for root landing page.
- WH-G10 IPS documentation and state evidence.
