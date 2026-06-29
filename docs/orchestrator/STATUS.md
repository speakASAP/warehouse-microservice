# Warehouse Orchestrator Status

Last updated: 2026-06-15.

Current state:

- WH-G1 through WH-G9 are complete and preserve the original warehouse foundation sequence.
- Previously completed source goals WH-G10 through WH-G15 remain recorded in `docs/IMPLEMENTATION_STATE.md`.
- Owner-approved parallel wave WH-G10-CATALOG, WH-G11-OUTBOX, WH-G12, WH-G13-CONFLICTS, and WH-G14-AUTH has been collected, committed, and deployed.
- Source validation passed before deploy on 2026-06-15: `git diff --check`, `npm test -- --runInBand` (8 suites / 50 tests), and `npm run build`.
- Deployment passed on 2026-06-15 with image `localhost:5000/warehouse-microservice:fab5bee`.
- Natural scheduled reservation-expiry CronJob monitoring passed on 2026-06-15: last three scheduled jobs completed with `success:true`, `examined=0`, `expired=0`, and `failed=0`.
- Process debt: WH-G13 supplier-conflict operations code existed without dedicated IPS artifacts; artifacts were added during collection on 2026-06-14.
- Numbering debt: the repository already has completed historical WH-G10 through WH-G15 goals, so the new approved parallel wave uses suffixed IDs where needed to avoid overwriting completed evidence.

Deployment evidence:

- First deploy attempt applied migrations but reused old dirty-tree image tag `d1d7a6f`; the service stayed on older code and the new reservation-expiry CronJob returned 404. The integrated wave was then found committed as `fab5bee`.
- Cleanup removed failed job pods from the first attempt.
- Second deploy with `fab5bee` passed preflight, build, push, manifest apply, RabbitMQ wait, migration check, rollout, and in-pod health check.
- Production smoke passed: `https://warehouse.alfares.cz/api/health` 200, `https://warehouse.alfares.cz/api/ready` 200, and `https://warehouse.alfares.cz/admin` 200.
- Manual CronJob smoke passed: `warehouse-reservation-expiry-manual` completed with `expired=0`, `failed=0`.

What is left from the current plan:

1. Define the next owner-approved source goal with full IPS artifacts before coding.

Next command:

```text
WAREHOUSE ORCHESTRATOR: define next goal
```
# 2026-06-29 - TASK-STOCK-004 Warehouse Stock Authority Verifier Deployed

Result: added and deployed a read-only live Warehouse verifier at `warehouse-microservice@8a66b27` (`fix: ignore historical job pods in Warehouse deploy preflight`, following `adf5569 test: add Warehouse stock authority verifier`). The verifier queries Warehouse DB state directly for configured product IDs, checks stock-row invariants, optional expected totals, latest movement evidence, stock event outbox evidence, and active reservation totals. It does not call mutation endpoints or change stock.

Validation evidence before deploy: `git diff --check`, `bash -n scripts/deploy.sh`, `node --check scripts/verify-stock-authority-live.js`, and `npm run build` passed. A pre-deploy in-pod verifier run with the 9 current Allegro-authoritative product IDs and expected totals passed with `checkedProductCount=9`, `failedProductCount=0`, `totalQuantity=496`, `totalReserved=0`, `totalAvailable=496`, outbox status `published`, and movement reason `ALLEGRO_OFFER_STOCK_IMPORT`.

Deployment evidence: `./scripts/deploy.sh` initially exposed pre-existing failed reservation-expiry Job pods blocking preflight; the deploy script now ignores historical Failed/Completed Job pods while still checking active Running/Pending unhealthy pods. Retry built and pushed image `localhost:5000/warehouse-microservice:8a66b27` with digest `sha256:6b5370d939d6f89b3e1c9fb7457da5396657aaf038c9924504e50175848d938a`, ran migrations with no pending migrations, rolled out successfully, and health returned database and RabbitMQ `up`.

Post-deploy verifier evidence: packaged `npm run verify:stock-authority-live` inside the running `8a66b27` pod passed for all 9 product IDs with expected totals `124`, `87`, `50`, `25`, `110`, `60`, `10`, `3`, and `27`. Summary: `mutatesWarehouse=false`, `checkedProductCount=9`, `failedProductCount=0`, `totalQuantity=496`, `totalReserved=0`, `totalAvailable=496`, `expectedTotalsChecked=9`, outbox statuses `published`, movement reasons `ALLEGRO_OFFER_STOCK_IMPORT`, and no product issues.

Boundary decision: no Warehouse stock import, stock mutation, reservation, order ingestion, channel draft, publish, queue, confirmation, or external marketplace mutation was run. Complete physical stock beyond the 9 current Allegro-authoritative products remains gated on `[MISSING: owner-approved BizBox/current physical stock export]`, `[MISSING: owner confirmation that stock:minimumRequiredLevel:* fields are authoritative physical stock for Warehouse]`, or `[MISSING: correctly authorized additional seller account exposing additional current full offers]`.

Next action: after a complete owner-approved physical stock source is available, rerun this verifier with accepted expected totals as the Warehouse-side acceptance gate.
