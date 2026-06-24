# AOS Auth Static Inventory - warehouse-microservice

Date: 2026-06-24
Worker: parallel Alfares Auth modernization inventory worker
Scope: static source/docs inspection only
Central standard: `/home/ssf/Documents/Github/auth-microservice/docs/HOSTED_AUTH_CONSUMER_STANDARD.md`
Legacy exclusion: legacy `speakasap-portal` was not inspected or touched.

## IPS Chain

- Vision: align warehouse-microservice with Auth-hosted consumer behavior while preserving Warehouse as stock and availability authority.
- Goal Impact: move admin login/register behavior toward hosted Auth, validate human bearer tokens through central Auth, preserve protected stock/reservation boundaries, and keep service identity behavior separate.
- System: commerce/backend service `warehouse-microservice`; provider standard is hosted Auth UI plus server-side token validation for human sessions.
- Feature: Auth-hosted admin entry, JWT/RBAC enforcement, Auth-derived mutation actor evidence, and service identity boundaries.
- Task: inventory current Auth surfaces without secrets, stock rows, production logs, deploy, backfill, smoke, or legacy portal access.
- Execution Plan: compare static surfaces to the central standard, split admin UI/session, backend validation, actor/service identity, and validation lanes.
- Coding Prompt: migrate Warehouse human bearer-token validation from local JwtService/JWT_SECRET verification to central Auth `POST /auth/validate`, preserve existing role checks and machine/runtime identity claims, update static evidence, and do not deploy.
- Code: `src/auth/jwt-roles.guard.ts`, `src/auth/auth.module.ts`, `test/jwt-roles.guard.spec.ts`, `scripts/check-hosted-auth-contract.js`, and this inventory updated for backend Auth validate compliance.
- Validation: focused guard specs, hosted Auth static checker, build, and diff checks are required after the backend Auth validate slice.

## Static Commands Used

- `git status --short --branch`
- `rg -n "." docs/HOSTED_AUTH_CONSUMER_STANDARD.md` in `auth-microservice`
- `rg --files src docs` with `.env`, secret-name, `node_modules`, `build`, and `dist` exclusions
- `rg -n -i "auth|jwt|token|login|register|guard|passport|bearer|cookie|localStorage|session|validate|role|permission" src docs` with the same exclusions
- Focused `rg` over `src/auth`, WH-G10 admin Auth docs, WH-G14-AUTH actor enforcement docs, Warehouse intent docs, and operations runbook references

## 2026-06-24 Admin Hosted Auth Slice

Status: implemented first Warehouse admin hosted Auth slice after this inventory.

- `public/admin/index.html` now exposes hosted Auth login/register buttons instead of email/password forms.
- `public/admin/app.js` now redirects to `https://auth.alfares.cz/login` or `/register` with `client_id=warehouse-microservice`, absolute `return_url=/admin`, and generated `state`.
- The admin app now consumes `#access_token`, validates returned `state`, stores the access token in `sessionStorage` as transitional browser storage, strips the fragment with `window.history.replaceState`, and rejects mismatched callback state.
- Legacy `localStorage` access/refresh token writes were removed; existing legacy values are removed after hosted callback.
- `scripts/check-hosted-auth-contract.js` verifies the hosted Auth markers, lack of local credential forms, fragment/state handling, transitional `sessionStorage`, and central-standard documentation markers.
- Backend `JwtRolesGuard`, stock/reservation/supplier logic, DB schema, migrations, secrets, deployment files, live smokes, and legacy `speakasap-portal` were not changed in the admin hosted Auth slice.

## 2026-06-24 Backend Auth Validate Slice

Status: implemented by backend auth worker after the admin hosted Auth slice.

- `src/auth/jwt-roles.guard.ts` now sends user bearer tokens to central Auth `POST /auth/validate` with `{ token }`.
- `AUTH_SERVICE_URL` configures the Auth base URL; Kubernetes-safe default is `http://auth-microservice:3370`.
- Auth responses must include `{ valid: true, user: { id/sub/email/roles } }`; the guard preserves the full role list and maps `id` to `request.user.sub` when `sub` is absent.
- Existing role semantics are preserved: missing/invalid bearer tokens fail with `UnauthorizedException`, validated tokens without required roles fail with `ForbiddenException`, and default roles remain `global:superadmin` or `internal:warehouse-microservice:admin`.
- Machine/runtime identity behavior remains separate from human login behavior: Auth-returned `service`, `serviceName`, `clientId`, and `client_id` fields are still attached to `request.user` for the existing mutation actor helper.
- Local user-token verification debt is removed from the guard/module: `JwtService`, `jwtService.verify`, `JWT_SECRET`, and `JwtModule` are no longer used for guard/module bearer validation.
- Auth validation errors, timeouts, and non-valid responses fail closed as `UnauthorizedException`; the guard does not log or print bearer tokens.
- `test/jwt-roles.guard.spec.ts` covers public bypass, missing bearer token, central Auth call shape, full role preservation, Auth id fallback, service identity preservation, wrong-role 403, non-valid responses, and Auth errors/timeouts.
- `scripts/check-hosted-auth-contract.js` now asserts the central Auth validation contract and rejects local JWT verification symbols in the guard/module.
- No secrets, `.env` values, live DB, production logs, deploy files, stock/reservation/supplier business logic, runtime smoke, or legacy `speakasap-portal` surfaces were inspected or changed.

## 2026-06-24 Warehouse Auth-Validated Service Actor Slice

Status: completed bounded receiving-side service identity slice; no service-token values, stock mutation, reservation mutation, supplier mutation, deploy, secret, DB, live smoke, backfill, or legacy `speakasap-portal` access.

IPS chain:
- Vision: Warehouse should receive service callers as explicit machine actors while Auth centralizes token validation and human identity.
- Goal Impact: Auth-validated service JWTs from Orders/Catalog-style callers now attach `request.serviceActor` instead of only preserving service claims on `request.user`.
- System: Warehouse global Auth roles guard and mutation actor helper boundary.
- Feature: explicit service actor annotation for Auth-validated service tokens.
- Task: when Auth `/auth/validate` returns service identity fields, attach a service actor with `type=service` and `authMethod=auth-validate`.
- Execution Plan: guard/type/spec/checker/docs only; preserve role enforcement, Auth `/auth/validate` call shape, service claim variants, and no runtime token reads.
- Coding Prompt: use Auth response fields `serviceName`, `service`, `clientId`, and `client_id` as receiving-side service identity signals; attach `request.serviceActor`; do not add static service-token bypasses; do not log token values.
- Code: `src/auth/jwt-roles.guard.ts`, `src/auth/authenticated-actor.ts`, `test/jwt-roles.guard.spec.ts`, `scripts/check-hosted-auth-contract.js`, and this inventory.
- Validation: pending rerun after source copy-back.

Evidence:
- Human Auth users do not get `request.serviceActor`.
- Auth-validated service tokens with service identity fields set `request.serviceActor` with `type=service` and `authMethod=auth-validate`.
- Existing mutation actor derivation continues to prefer service identity claims and returns `service:<serviceName>`.
- No static service-token bypass was added; Warehouse remains a receiver of Auth-validated bearer tokens for this lane.

Remaining implementation debt:

- [MISSING: decision on BFF HTTP-only cookie vs documented transitional browser token storage].
- Removed: local-JWT validation debt is removed by the Backend Auth Validate Slice; Warehouse now calls central Auth `POST /auth/validate` for bearer-token validation instead of local `JwtService`/`JWT_SECRET` verification.
- [MISSING: runtime allowlist verification for the Warehouse callback origin].

## Auth Surfaces Found

- Login/register UI: WH-G10 originally had admin forms using Auth `/auth/login` and `/auth/register`; the 2026-06-24 slice replaced them with hosted Auth login/register redirects.
- Auth API/proxy routes: no local Warehouse `/api/auth/login` or `/api/auth/register` proxy was found in scanned `src/auth`; docs refer to frontend calls to Auth endpoints.
- Token storage: the 2026-06-24 slice stores hosted Auth fragment access tokens in `sessionStorage` as transitional browser storage and removes legacy `localStorage` access/refresh token writes.
- Backend guards/validation: `src/auth/jwt-roles.guard.ts` validates bearer tokens server-side with central Auth `POST /auth/validate`, enforces existing roles, and attaches safe user/service claims to `request.user`.
- Actor derivation: `src/auth/authenticated-actor.ts` derives mutation actors from verified request user/service claims and fails closed if authenticated context or subject is missing.
- Protected route policy: Warehouse docs state global JWT/RBAC protection with public `/api/health` and `/api/ready`; protected routes require `global:superadmin` or `internal:warehouse-microservice:admin` by default.
- Service identity: Warehouse guard preserves `serviceName`, `service`, and `clientId`/`client_id` claims; WH-G14-AUTH notes the final ecosystem service-JWT claim name is still unknown.

## Comparison To Hosted Auth Consumer Standard

- Consumer entry points: partially complete. Warehouse admin now redirects to Auth-hosted `/login` or `/register` with `client_id=warehouse-microservice`, `return_url`, and `state`.
- Callback handoff: partially complete. `/admin` consumes URL-fragment tokens, validates returned state, strips the fragment, and opens the existing guarded admin shell. A dedicated `/auth/callback` route is still not implemented.
- Session model: transitional/debt. Browser token storage now uses `sessionStorage` instead of `localStorage`; the preferred BFF HTTP-only cookie model is still missing.
- Backend token validation: complete/source-integrated for this slice. Warehouse calls Auth `POST /auth/validate` with `{ token }`, fails closed on invalid/error responses, and no longer wires `JwtModule`, `JwtService`, or `JWT_SECRET` for guard/module user-token verification.
- Forbidden local credential model: admin credential forms were removed from the consumer UI in the 2026-06-24 slice.
- Logout: [MISSING: centralized or local logout surface in scanned source/docs].
- Service tokens: separate boundary. Service identity claim naming remains [UNKNOWN] and should be handled separately from human hosted login migration.

## Implementation-Ready Workstreams

| Workstream | Status | Owner role | Scope | Allowed files | Forbidden files | Expected output | Dependencies | Validation candidates | Handoff notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| WH-A Admin hosted Auth redirect | ready now | admin UI owner | replace consumer credential forms with Auth-hosted login/register redirects | admin frontend/source docs if approved | stock logic, env/secrets, deploy files, DB migrations | `client_id=warehouse-microservice`, callback URL, opaque state generation | [MISSING: Warehouse callback origin] | static marker check; browser check only if later approved | preserve admin shell and server guard behavior |
| WH-B Callback/session adapter | dependency-gated | session owner | parse Auth fragment, validate state, strip fragment, route back to admin | [MISSING: callback route/static file] | raw token logging, production stock data | compliant callback/session behavior | WH-A redirect contract | unit/browser tests for state mismatch and fragment clearing | document transitional browser token storage if BFF not available |
| WH-C JWT validation standardization | done/source-integrated | backend auth owner | migrate bearer validation to Auth `POST /auth/validate` | `src/auth/jwt-roles.guard.ts`, `src/auth/auth.module.ts`, `test/jwt-roles.guard.spec.ts`, `scripts/check-hosted-auth-contract.js`, this inventory | runtime JWT values/live tokens, stock logic, deploy files, DB migrations | central Auth validation, standard-compliant 401/403, full role preservation, service identity claim preservation | none for source validation; runtime Auth behavior remains [UNKNOWN] | `test/jwt-roles.guard.spec.ts`, static checker, build, diff checks | local-JWT validation debt is removed; no deploy performed |
| WH-D Service identity claim contract | ready now | service identity owner | resolve serviceName/service/clientId claim policy | `src/auth/*`, tests/docs if approved | service token values, K8s Secret data | explicit service identity contract and helper behavior | [UNKNOWN: final ecosystem service-JWT claim name] | actor-helper tests with placeholder claims | coordinate with Auth integration owner |
| WH-E Mutation actor regression guard | ready now | stock auth owner | ensure hosted Auth changes do not reintroduce body-actor trust | auth helper/controller tests if approved | stock persistence semantics unless explicitly scoped | spoofed body actor remains ignored | WH-C/WH-D shape | focused actor tests; no production stock mutation | keep Warehouse as stock authority |
| WH-F Final integration | final integration | integration owner | merge admin/session/backend/service lanes | approved files only | all forbidden files above | final IPS validation record | WH-A through WH-E | build/test/diff checks; deploy evidence only if later authorized | merge order: WH-C/WH-D auth tests, WH-E actor guard, WH-A UI, WH-B callback, WH-F integration |


## Backend Auth Validate Validation Evidence

- PASS: `npm test -- --runInBand test/jwt-roles.guard.spec.ts` -> 1 test suite passed, 8 tests passed.
- PASS: `npm run check:hosted-auth` -> hosted Auth static contract check passed, including central Auth validate assertions and local JWT verification rejections.
- PASS: `npm run build` -> `nest build` completed successfully.
- PASS: `git diff --check -- src/auth/jwt-roles.guard.ts src/auth/auth.module.ts test/jwt-roles.guard.spec.ts scripts/check-hosted-auth-contract.js docs/orchestrator/2026-06-24-aos-auth-static-inventory.md` -> no whitespace errors.

## Blockers And Unknowns

- [MISSING: Warehouse hosted Auth callback URL and allowed production origin].
- [MISSING: decision on BFF HTTP-only cookie vs documented transitional browser token storage].
- Resolved for receiving-side compatibility: Auth-validated service actors preserve `serviceName`, `service`, `clientId`, and `client_id`; new canonical claim should prefer `serviceName`.
- [UNKNOWN: runtime Auth behavior; runtime checks were forbidden for this worker].

## Validation Candidates

- Static: marker check that admin credential forms are removed or documented as transitional pending hosted callback.
- Unit/browser: hosted Auth redirect parameters, state generation/validation, fragment parsing, fragment stripping, token clear/logout.
- Guard: missing token, Auth `/auth/validate` invalid/error responses, wrong role, admin role, full role preservation, service identity claim variants.
- Actor: mutation actor derives only from verified request context and ignores spoofed body actor.
- Sensitive-output: scan docs/tests for raw bearer tokens, JWTs, passwords, stock rows, supplier records, customer/order data, or secrets.
- Diff: `git diff --check -- docs/orchestrator/2026-06-24-aos-auth-static-inventory.md` for this inventory change.
