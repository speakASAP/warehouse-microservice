# WH-G8 - Committed Database Migration Discipline

Status: done.

## Objective

Make Warehouse schema changes repeatable, reviewable, and deployable without manual production database drift.

## Current Evidence

- Shared TypeORM data source exists.
- Migration npm scripts exist.
- Kubernetes migration Job template exists.
- Deploy runs migrations with production service environment.
- Baseline migration `InitialWarehouseSchema1781200000000` is applied in production.

## Acceptance Criteria

- TypeORM migration configuration is committed and shared by app and CLI.
- Initial production schema baseline is represented as a committed migration.
- Deploy runs migrations before rollout completes.
- Migration status can be checked from the running production image.
- Tests, build, deploy, production health, and migration status checks pass.

## Validation

Completed in prior cycle:

```text
npm test -- --runInBand
npm run build
production migration Job
production /api/health
running pod migration:show:prod
```

