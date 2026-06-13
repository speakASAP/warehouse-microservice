# WH-G10 - Landing Page And Authenticated Admin Entry

Status: done.

## Objective

Add a public warehouse service landing page and replace manual admin-token entry with Auth-owned login/registration flows. The warehouse admin console must remain usable only for authenticated users whose Auth JWT includes a warehouse admin role.

## Intent Mapping

- Warehouse remains the stock and availability authority.
- Auth remains owner of login, registration, JWT, and RBAC.
- Warehouse frontend may consume Auth-issued access tokens, but must not mint or alter JWTs.
- Protected warehouse APIs continue to enforce authorization server-side.

## Acceptance Criteria

- `/` serves a public landing page selling the warehouse service.
- Landing page includes clear paths to sign in, request/register access, and open the admin entry.
- `/admin` shows login and registration forms backed by `auth-microservice` before the admin workspace is visible.
- The admin workspace is hidden until an Auth-issued token is present and includes `global:superadmin` or `internal:warehouse-microservice:admin`.
- Users without warehouse admin rights see an access-denied state and cannot use admin UI actions.
- Warehouse API calls still send `Authorization: Bearer <accessToken>` and rely on the existing server guard.
- Validation covers JavaScript syntax, build, and static route smoke checks.

## Validation

Planned:

```text
node --check public/admin/app.js
node --check public/landing.js
npm run build
curl -I http://127.0.0.1:3201/
curl -I http://127.0.0.1:3201/admin
```
