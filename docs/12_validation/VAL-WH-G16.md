# VAL-WH-G16 - Paid Fulfillment Handoff Validation

```yaml
id: VAL-WH-G16
status: validated
owner: warehouse-fulfillment-owner
created: 2026-07-02
last_updated: 2026-09-05
completeness_level: validated
upstream:
  - docs/14_prompts/PROMPT-WH-G16.md
downstream: []
related_adrs: []
```

## Artifact Validated

WH-G16 paid fulfillment handoff source and documentation.

## Validation Scope

Source-level unit tests, build, and diff hygiene. **Update (2026-09-05): deployment and migration executed with owner approval; live verification added below.**

## Evidence

- Pre-deploy migration readiness hardening passed: `npm run build` now uses full non-incremental TypeScript emit; `node -e "require('./dist/src/database/typeorm-data-source.js')"` loaded the production TypeORM data source; `npm test -- --runInBand test/fulfillment-orders.service.spec.ts` passed 1 suite / 6 tests; `git diff --check` passed.
- Live read-only DB checks found `warehouse_migrations` rows for `InitialWarehouseSchema1781200000000`, `StockEventOutbox1781300000000`, and `AddSupplierConflictReviewMetadata1781400000000`; `fulfillment_orders` and `fulfillment_order_lines` are absent, so `CreateFulfillmentOrders1781500000000` remains pending.
- `npm test -- --runInBand` passed: 10 suites, 69 tests.
- `npm run build` passed.
- `git diff --check` passed with no output.
- No deployment, push, live DB mutation, production stock payload, or public landing edit was performed.

## Gate Evidence

Pre-coding gate completed with documented risk: Docs RAG was unavailable because `JWT_TOKEN` was not set. Repository-local docs, W1 plan, and read-only Orders contract evidence were used.

## Invariant Evidence

Warehouse stock mutation remains in reservation lifecycle endpoints. Fulfillment handoff records dispatch data only after fulfilled reservation ids are supplied.

## Sensitive-Data Scan Evidence

Validation output must not include raw production customer data. Test fixtures use synthetic addresses and example-domain contact data only.

## Replay And Determinism Evidence

Tests cover fulfilled-reservation requirement, missing reservation id rejection, equivalent idempotent replay, non-equivalent conflict, and explicit cancel/return handoff states. Existing reservation fulfillment replay now has focused coverage and does not deduct stock again.

## Passed Criteria

- Current `fulfill` behavior was confirmed as stock finalization only.
- New fulfillment handoff requires reservation ids and fulfilled reservation state.
- Handoff stores delivery address, shipping method, order item ids, SKU/title snapshots, warehouse ids, quantities, and allowed contact fields.
- Cancel and return paths are explicit on the handoff record.
- Stock mutation remains bound to reservation lifecycle endpoints.

## Failed Criteria

None.

## Deviations

None planned.

## Recommendation

Closed. Owner approved WH-G16 deployment and migration on 2026-09-05 (Option A: deploy now, integrate Orders, document). Deployed via `./scripts/deploy.sh`; migration job reported no pending migrations (`CreateFulfillmentOrders` had already applied to the production DB ahead of this deploy, alongside earlier merged fulfillment module code). Post-deploy verification: new pod healthy, `POST /api/fulfillment-orders` returns 401 unauthenticated (route live, guarded). Orders-microservice's pre-existing `OrderFulfillmentHandoffClient` (already merged and feature-flagged on in production via `WAREHOUSE_RESERVATION_ENABLED=true`) was confirmed to hold the correct `internal:orders-microservice:service` role (member of `FULFILLMENT_WRITE_ROLES`) and required no new integration code; its verify script had a latent bug (mocked `logger.warn` instead of the real `logger.error` call) that prevented this path from ever being exercised, fixed and passing in orders-microservice commit `a560071`, then deployed to production and confirmed healthy.
