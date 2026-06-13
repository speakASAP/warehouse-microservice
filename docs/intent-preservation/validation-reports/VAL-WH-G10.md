# VAL-WH-G10 - Validation Report

```yaml
id: VAL-WH-G10
status: passed
goal_id: WH-G10
task_ids:
  - WH-G10-T1
created: 2026-06-13
last_updated: 2026-06-13
```

## Evidence

| Command | Status | Notes |
| --- | --- | --- |
| `node --check public/admin/app.js` | passed | Admin auth gate syntax. |
| `node --check public/landing.js` | passed | Landing interaction syntax. |
| `npm run build` | passed | Nest build completed after frontend/route changes. |
| `npm test -- --runInBand` | passed | 2 suites, 18 tests passed. |
| Playwright fallback against `http://127.0.0.1:4173/` | passed | Captured landing desktop/mobile and admin auth screenshots from staged static files. |

## Visual Evidence

- Concept reference: `/Users/Sergej.Stasok/.codex/generated_images/019ebf48-f31c-7e73-93d4-ff954e3583c2/ig_06a9e068aeeb2cd7016a2cdfcb9fe88191ab455be62e8321f2.png`
- Generated hero asset: `public/warehouse-operations.png`
- Landing desktop screenshot: `/private/tmp/warehouse-g10/landing-desktop.png`
- Landing mobile screenshot: `/private/tmp/warehouse-g10/landing-mobile.png`
- Admin auth screenshot: `/private/tmp/warehouse-g10/admin-auth-desktop.png`

## Sensitive Data

No secrets are added. Credentials are submitted by users directly to Auth from browser forms and are not logged by warehouse frontend code. The browser stores the returned Auth access token for API authorization, matching the prior token-based admin usage but replacing manual paste with Auth login/register.

## Contract Impact

No warehouse API schema changes. Frontend consumes Auth `POST /auth/login` and `POST /auth/register` response contract and sends `Authorization: Bearer <accessToken>` to existing warehouse APIs.

## Gate Result

Passed. `/admin` starts at an Auth login/register gate; `#adminShell` remains hidden unless the Auth JWT role list includes `global:superadmin` or `internal:warehouse-microservice:admin`. Server-side `JwtRolesGuard` remains authoritative for protected APIs.

## Deviations

No deployment was performed because production deployment requires explicit owner approval in the current session.

## Deployment Evidence

Deployed on 2026-06-13 with ./scripts/deploy.sh. Image tag: localhost:5000/warehouse-microservice:a99e270. Initial deployment completed successfully in 99.04s. A second same-image deployment was accidentally triggered while recording evidence; it also completed deploy phases successfully in 36.69s, then the documentation command failed after deploy due to shell quoting. Migration jobs completed with no pending migrations. Rollout succeeded. Production health returned healthy with database and RabbitMQ up. Production smoke checks passed: root landing page HTTP 200, admin page HTTP 200, warehouse hero image HTTP 200, API health healthy, and unauthenticated API warehouses returned 401.
