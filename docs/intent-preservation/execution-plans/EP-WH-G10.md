# EP-WH-G10 - Landing Page And Authenticated Admin Entry

```yaml
id: EP-WH-G10
status: draft-work
goal_id: WH-G10
task_ids:
  - WH-G10-T1
created: 2026-06-13
```

## Scope

- `src/main.ts`
- `public/index.html`
- `public/landing.css`
- `public/landing.js`
- `public/admin/index.html`
- `public/admin/app.js`
- `public/admin/style.css`
- IPS/state documents for WH-G10 evidence.

## Plan

1. Serve a public root landing page from `public/index.html`.
2. Add landing page styling and light interaction for sign-in/register navigation.
3. Add an admin authentication gate with login and registration forms using Auth `/auth/login` and `/auth/register`.
4. Decode returned JWT role claims client-side only for UI gating; keep server authorization unchanged.
5. Hide admin workspace until `global:superadmin` or `internal:warehouse-microservice:admin` is present.
6. Update state and validation evidence after checks.

## Invariants

- Auth owns credentials, JWT, RBAC, and service identity.
- Warehouse APIs remain protected by `JwtRolesGuard`.
- No production stock mutation is performed.
- No deployment without explicit owner approval.

## Validation Commands

```text
node --check public/admin/app.js
node --check public/landing.js
npm run build
```
