# AOS Auth Static Inventory - warehouse-microservice

Date: 2026-06-24
Worker: parallel Alfares Auth modernization inventory worker
Scope: static source/docs inspection only
Central standard: `/home/ssf/Documents/Github/auth-microservice/docs/HOSTED_AUTH_CONSUMER_STANDARD.md`
Legacy exclusion: legacy `speakasap-portal` was not inspected or touched.

## IPS Chain

- Vision: align warehouse-microservice with Auth-hosted consumer behavior while preserving Warehouse as stock and availability authority.
- System: commerce/backend service `warehouse-microservice`; provider standard is hosted Auth UI plus server-side token validation for human sessions.
- Task: inventory current Auth surfaces without secrets, stock rows, production logs, deploy, backfill, smoke, or legacy portal access.
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
- `scripts/check-hosted-auth-contract.js` now asserts the central Auth validation contract and rejects local JWT verification symbols in the guard/module.
- No secrets, `.env` values, live DB, production logs, deploy files, stock/reservation/supplier business logic, runtime smoke, or legacy `speakasap-portal` surfaces were inspected or changed.

## Auth Surfaces Found

- Login/register UI: WH-G10 originally had admin forms using Auth `/auth/login` and `/auth/register`; the 2026-06-24 slice replaced them with hosted Auth login/register redirects.
- Auth API/proxy routes: no local Warehouse `/api/auth/login` or `/api/auth/register` proxy was found in scanned `src/auth`; docs refer to frontend calls to Auth endpoints.
- Token storage: the 2026-06-24 slice stores hosted Auth fragment access tokens in `sessionStorage` as transitional browser storage and removes legacy `localStorage` access/refresh token writes.
- Backend guards/validation: `src/auth/jwt-roles.guard.ts` validates bearer tokens server-side with central Auth `POST /auth/validate`, enforces existing roles, and attaches safe user/service claims to `request.user`.
- Actor derivation: `src/auth/authenticated-actor.ts` derives mutation actors from verified request user/service claims and fails closed if authenticated context or subject is missing.
- Protected route policy: Warehouse docs state global JWT/RBAC protection with public `/api/health` and `/api/ready`; protected routes require `global:superadmin` or `internal:warehouse-microservice:admin` by default.

## Comparison To Hosted Auth Consumer Standard

- Consumer entry points: partially complete. Warehouse admin now redirects to Auth-hosted `/login` or `/register` with `client_id=warehouse-microservice`, `return_url`, and `state`.
- Callback handoff: partially complete. `/admin` consumes URL-fragment tokens, validates returned state, strips the fragment, and opens the existing guarded admin shell. A dedicated `/auth/callback` route is still not implemented.
- Session model: transitional/debt. Browser token storage now uses `sessionStorage` instead of `localStorage`; the preferred BFF HTTP-only cookie model is still missing.
- Backend token validation: complete/source-integrated for this slice. Warehouse calls Auth `POST /auth/validate` with `{ token }`, fails closed on invalid/error responses, and no longer wires `JwtModule`, `JwtService`, or `JWT_SECRET` for guard/module user-token verification.
- Forbidden local credential model: admin credential forms were removed from the consumer UI in the 2026-06-24 slice.
- Logout: [MISSING: centralized or local logout surface in scanned source/docs].

## Implementation-Ready Workstreams

| Workstream | Status | Owner role | Scope | Allowed files | Forbidden files | Expected output | Dependencies | Validation candidates | Handoff notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| WH-A Admin hosted Auth redirect | ready now | admin UI owner | replace consumer credential forms with Auth-hosted login/register redirects | admin frontend/source docs if approved | stock logic, env/secrets, deploy files, DB migrations | `client_id=warehouse-microservice`, callback URL, opaque state generation | [MISSING: Warehouse callback origin] | static marker check; browser check only if later approved | preserve admin shell and server guard behavior |
| WH-B Callback/session adapter | dependency-gated | session owner | parse Auth fragment, validate state, strip fragment, route back to admin | [MISSING: callback route/static file] | raw token logging, production stock data | compliant callback/session behavior | WH-A redirect contract | unit/browser tests for state mismatch and fragment clearing | document transitional browser token storage if BFF not available |
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
- Actor: mutation actor derives only from verified request context and ignores spoofed body actor.
- Sensitive-output: scan docs/tests for raw bearer tokens, JWTs, passwords, stock rows, supplier records, customer/order data, or secrets.
- Diff: `git diff --check -- docs/orchestrator/2026-06-24-aos-auth-static-inventory.md` for this inventory change.
