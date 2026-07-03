# 2026-07-03 - Orders Allegro Source-Reference Preservation Integrated

Intent chain:

- Vision: Warehouse adapter work must join Allegro-origin fulfillment updates through central Orders and fulfilled Warehouse reservations, not raw Allegro payloads.
- Goal Impact: the Orders source-reference preservation gate moved from missing to executable verifier evidence.
- System: Orders owns central order id, channel, external checkout reference, paid handoff, and fulfilled reservation lookup; Warehouse owns fulfillment orders and reservation ids; Allegro owns raw checkout/provider payloads.
- Feature: Orders source-reference preservation evidence for Allegro Warehouse handoff joins.
- Task: integrate Orders commit `3c9526b` into Warehouse mapping state.
- Execution Plan: documentation-only Warehouse update; do not implement runtime adapter, DB schema, migration, deploy, live provider call, or stock/order mutation.
- Coding Prompt: no raw checkout-form ids beyond synthetic fixtures, buyer fields, addresses, raw payloads, tracking values, tokens, or provider response bodies.
- Code: Orders `3c9526b test: verify allegro fulfillment source references`; Warehouse docs checkpoint in this commit.
- Validation: Orders `npm run build`, `npm run verify:order-fulfillment-handoff`, pre-commit, Warehouse `git diff --check`.

Evidence:

- Orders verifier builds a synthetic central order with `channel=allegro` and a synthetic external checkout reference.
- The Warehouse handoff payload preserves central `orderId`, `channel=allegro`, `orderNumber/reference` from `externalOrderId`, and line `orderItemId`, `reservationId`, `productId`, `warehouseId`, and quantity.
- The verifier rejects payload leakage markers: `rawData`, `trackingNumber`, `waybill`, `buyerEmail`, `buyerLogin`, and `providerPayload`.

Remaining gates:

- `[PROVEN: Orders source-reference preservation for synthetic Allegro Warehouse fulfillment handoff payloads in orders-microservice commit 3c9526b.]`
- `[MISSING: live Allegro-origin central order with fulfilled reservations for runtime Warehouse handoff join smoke.]`
- `[MISSING: approved durable Warehouse adapter ledger for checkout-form status observations.]`
- `[MISSING: approved timestamp ordering/replay semantics for Allegro updatedAt, local observation time, and Warehouse transition occurredAt.]`
- `[MISSING: owner approval before any Warehouse runtime adapter, src/** mutation, migration, deploy, or production fulfillment-row mutation.]`

Next action:

- Decide durable Warehouse adapter ledger ownership and timestamp/replay policy before runtime adapter implementation.

# 2026-07-03 - Allegro Checkout Fulfillment Enum Fixtures Integrated

Intent chain:

- Vision: Warehouse must only consume Allegro checkout-form status evidence after the source enum shapes are known and sensitive fields remain excluded.
- Goal Impact: the sanitized Allegro fixture gate moved from missing to landed, narrowing future Warehouse adapter work to source-reference, ledger, timestamp/replay, and owner-approval gates.
- System: Allegro owns checkout-form polling and fixture evidence; Warehouse owns mapping and future fulfillment transition validation; Orders owns central lifecycle and paid handoff.
- Feature: Allegro checkout-form fulfillment enum fixture integration.
- Task: integrate Allegro commit `fc94b5d` into Warehouse mapping state.
- Execution Plan: documentation-only; do not implement runtime adapter, DB schema, migration, deploy, live provider call, or stock/order mutation.
- Coding Prompt: no raw checkout-form ids, buyer fields, addresses, raw payloads, tracking values, tokens, or provider response bodies.
- Code: Allegro `fc94b5d docs: record checkout fulfillment fixtures`; Warehouse docs checkpoint in this commit.
- Validation: Allegro sanitized probe, Allegro pre-commit, Warehouse `git diff --check`.

Evidence:

- Allegro sampled 117 local projected checkout-form rows from the live `allegro-service` runtime.
- Observed checkout `status`: `READY_FOR_PROCESSING=103`, `CANCELLED=14`.
- Observed `paymentStatus`: `PAID=112`, `[NULL]=5`.
- Observed `fulfillmentStatus`: `PICKED_UP=61`, `SENT=32`, `CANCELLED=22`, `RETURNED=2`.
- `trackingNumberPresent=0`, `rawShipmentFieldsPresent=0`, and `ordersWithForwardedCentralId=0`.
- Timestamp shapes are ISO-like for local `orderDate`/`updatedAt` and raw `updatedAt`; raw `createdAt` is absent in sampled rows.

Remaining gates:

- `[LANDED: sanitized Allegro checkout-form fulfillment enum fixtures in allegro commit fc94b5d.]`
- `[MISSING: Orders source-reference preservation evidence proving Allegro-origin central orders preserve source evidence and fulfilled reservation ids for Warehouse joins.]`
- `[MISSING: approved durable Warehouse adapter ledger for checkout-form status observations.]`
- `[MISSING: approved timestamp ordering/replay semantics for Allegro updatedAt, local observation time, and Warehouse transition occurredAt.]`
- `[MISSING: owner approval before any Warehouse runtime adapter, src/** mutation, migration, deploy, or production fulfillment-row mutation.]`

Next action:

- Verify Orders source-reference preservation for Allegro-origin Warehouse handoff joins.

# 2026-07-03 - Allegro Checkout Fulfillment Status Mapping Contract

Intent chain:

- Vision: Warehouse keeps the bounded fulfillment state for pick, pack, dispatch, and post-handoff delivery while Allegro remains the provider/source owner.
- Goal Impact: Allegro checkout-form status and fulfillment hints now have a Warehouse-facing provisional mapping that narrows future adapter requirements without allowing runtime mutations.
- System: Allegro owns checkout-form polling, raw provider evidence, and status interpretation; Orders owns central lifecycle/payment handoff; Warehouse owns stock, reservations, fulfillment-order transitions, and dispatch status authority.
- Feature: provisional Allegro checkout-form fulfillment status mapping for Warehouse.
- Task: document which Allegro checkout-form/payment/fulfillment values may inform Warehouse status, which domains must not map, required join keys, idempotency gates, rejection rules, and parallel follow-ups.
- Execution Plan: documentation-only; no runtime adapter, DB schema, migration, deployment, live provider call, secret read, or stock/order mutation.
- Coding Prompt: remote-only on Alfares, Warehouse `docs/**` and coordinator state only, no `src/**`.
- Code: `docs/contracts/allegro-checkout-fulfillment-status-mapping.md`, state/status docs, `TASKS.md`, and `STATE.json`.
- Validation: `git diff --check`; `npm run check:hosted-auth`.

Evidence:

- Mapping explicitly separates checkout-form/order readiness from carrier movement.
- Payment `PAID` is only a paid-handoff eligibility signal; it is not a Warehouse status transition.
- Checkout-form `READY_FOR_PROCESSING` and not-started fulfillment values are only `requested` candidates after Orders has a central order id, fulfilled reservation ids, and a valid Warehouse handoff payload.
- Seller fulfillment `SENT` is only a `handed_to_delivery` candidate and must not be treated as `in_delivery`.
- Delivery-like checkout-form values must not bypass the Warehouse post-handoff transition graph; carrier movement stays in the separate sanitized shipment snapshot contract.
- Explicit non-mappings reject `AllegroOrder.trackingNumber`, raw checkout-form payloads, shipment-management payloads, carrier tracking payloads, One Fulfillment stock/status, and convenience item fields as Warehouse write keys.
- Runtime remains blocked until approved join keys, durable adapter ledger, sanitized enum fixtures, timestamp semantics, retry/dead-letter policy, and owner approval exist.

Remaining gates:

- `[MISSING: sanitized checkout-form fulfillment.status fixture set and approved enum/class list.]`
- `[MISSING: approved Orders-to-Warehouse handoff contract proving Allegro-origin central orders preserve source evidence and fulfilled reservation ids for Warehouse joins.]`
- `[MISSING: approved durable Warehouse adapter ledger for checkout-form status observations.]`
- `[MISSING: approved timestamp ordering/replay semantics for Allegro updatedAt, local observation time, and Warehouse transition occurredAt.]`
- `[MISSING: owner approval before any Warehouse runtime adapter, src/** mutation, migration, deploy, or production fulfillment-row mutation.]`

Next action:

- Collect sanitized Allegro checkout-form fulfillment enum fixtures and Orders source-reference preservation evidence before any Warehouse runtime adapter implementation.

# 2026-07-03 - Worker H Allegro Shipment Snapshot Consumer Contract

Intent chain:

- Vision: customers and operators should see accurate post-handoff delivery progress without Orders or Warehouse storing raw Allegro shipment payloads, tracking numbers, tracking URLs, credentials, or customer data.
- Goal Impact: Allegro-origin orders now have a Warehouse-owned documentation contract for consuming read-only shipment status snapshots once runtime gates are approved.
- System: Allegro owns provider reads and `allegro.shipment_status_snapshot.v1`; Warehouse owns fulfillment status validation, transition enforcement, and future consumer/ledger decisions; Orders owns lifecycle projection through the existing Warehouse callback.
- Feature: bounded Warehouse consumer contract for read-only Allegro shipment status snapshots after `handed_to_delivery`.
- Task: document accepted snapshot envelope, status mapping, idempotency/ledger expectations, redaction policy, rejection rules, Orders callback role, and exact runtime gates.
- Execution Plan: docs-only; do not implement runtime consumer code, DB migrations, secrets, deploy changes, live calls, or Allegro/Orders edits.
- Coding Prompt: remote-only on Alfares, Warehouse `docs/**` only, no `src/**`.
- Code: `docs/contracts/fulfillment-provider-status-intake-contract.md`, `docs/contracts/fulfillment-handoff-contract.md`, `docs/intent-preservation/validation-reports/VAL-WH-ALLEGRO-SNAPSHOT-CONSUMER.md`, state/status docs.
- Validation: `git diff --check`; safe static checker `npm run check:hosted-auth`.

Evidence:

- Read-only source inspection confirmed Warehouse status transition graph and `reference`/`statusReference` path in `src/fulfillment/**`.
- The contract records Allegro commit `e626e5c` as the upstream source-only verifier for `allegro.shipment_status_snapshot.v1`.
- Snapshot intake is constrained to hashed account/order/shipment/waybill identities, bounded source-read status/reason, `packageCount`, `latestStatus`, `latestStatusAt`, and `trackingUpdatedAt`.
- The contract rejects raw provider payloads, tracking numbers/URLs, credentials, customer/contact/address fields, labels, documents, and raw marketplace shipment/package objects.
- Remaining gates include `[MISSING: Warehouse consumer/runtime adapter for read-only shipment snapshots]`, `[MISSING: approved Warehouse shipment snapshot ledger or adapter-owned durable idempotency store]`, and `[MISSING: approved correlation source between Allegro hashed order/shipment/waybill identity and exactly one Warehouse fulfillment order]`.

# 2026-06-29 - TASK-STOCK-004 Catalog Service Principal Receiver Coverage

Change: added focused Warehouse regression coverage for the Auth-compatible Catalog-to-Warehouse service principal. The guard spec now proves an Auth `/auth/validate` response with `serviceName=service=clientId=catalog-microservice`, `authMethod=auth-service-jwt`, and role `internal:warehouse-microservice:admin` passes the default Warehouse guard and attaches `serviceActor`; the actor spec proves Warehouse mutation actor derivation becomes `service:catalog-microservice`.

Validation evidence: `npm test -- --runInBand test/jwt-roles.guard.spec.ts test/authenticated-actor.spec.ts` passed `2` suites / `16` tests; `npm run build` passed; `git diff --check` passed.

Boundary decision: source tests only. No Auth helper execution, token issuance, Vault/Kubernetes secret mutation, Warehouse import, stock mutation, reservation, deployment, or live credential read was performed.

Next action: keep runtime provisioning approval-gated; after the Auth-owned Catalog Warehouse token is mounted, rerun Catalog stock credential wiring and acceptance gates.

# Warehouse Orchestrator Status

## 2026-07-03 - Allegro Fulfillment Provider Status Intake Contract

Intent chain:

- Vision: customers and operators should see accurate post-handoff delivery progress without Orders or Warehouse becoming raw courier-payload stores.
- Goal Impact: Allegro-origin orders can later advance delivery lifecycle status through Warehouse's bounded fulfillment status authority.
- System: Allegro/provider owner owns raw shipment APIs, credentials, provider payloads, and adapter dedupe; Warehouse owns fulfillment-order status; Orders owns lifecycle projection/events.
- Feature: bounded Warehouse intake contract for provider shipment status updates after `handed_to_delivery`.
- Task: define accepted payload, allowed transitions, idempotency/statusReference semantics, sensitive-field rejection, and blockers for Worker E.
- Execution Plan: documentation-only until Allegro source payloads, mapping, fixtures, and sensitive-data policy are approved; do not add fake provider code.
- Coding Prompt: remote-only, Warehouse docs/status files only, no Orders/Allegro edits, no deploys, no migrations, no secrets, no raw tracking persistence.
- Code: `docs/contracts/fulfillment-provider-status-intake-contract.md` plus fulfillment handoff contract link.
- Validation: read-only inspection of Warehouse fulfillment model/API, read-only Orders callback DTO/lifecycle mapping, and `git diff --check`.

Evidence:

- Warehouse model already has `handed_to_delivery`, `in_delivery`, `delivered`, `not_delivered`, `returned`, and `statusReference`.
- Current transition guard permits `handed_to_delivery -> in_delivery/returned`, `in_delivery -> delivered/not_delivered/returned`, and return from terminal delivery statuses.
- Orders callback accepts bounded Warehouse status metadata only and maps `in_delivery -> in_delivery`, `delivered -> received`, and `not_delivered -> not_received`.
- New contract rejects tracking numbers/URLs, raw provider payloads, credentials/tokens, customer address/contact data, label/document references, and marketplace shipment/package objects.
- Implementation remains blocked on `[MISSING: Worker E Allegro shipment status source contract]`, `[MISSING: Allegro-to-Warehouse status mapping]`, and `[MISSING: provider adapter durable idempotency store or Warehouse provider-status event ledger decision]`.

## 2026-07-03 - Fulfillment Delivery Status Source For Orders

Intent chain:

- Vision: Warehouse fulfillment progress should become the bounded source for post-handoff delivery lifecycle stages while Orders remains the customer-visible lifecycle authority.
- Goal Impact: Warehouse can now advance fulfillment orders from requested through pick/pack/delivery stages and notify Orders so marketplace cabinets receive updated lifecycle projections.
- System: Warehouse owns fulfillment-order operational status; Orders owns order lifecycle read models/events; delivery-provider integration remains future work unless a concrete provider is approved.
- Feature: protected `POST /api/fulfillment-orders/order/:orderId/status` with ordered status transitions and best-effort Orders sync.
- Task: extend fulfillment order statuses, enforce transition order, call Orders internal `PUT /api/orders/:id/warehouse-fulfillment-status`, and validate callback payload.
- Execution Plan: do not add a fake courier provider; represent Warehouse operational stages first and leave provider-specific tracking as a separate adapter.
- Coding Prompt: no secret logging, no customer payload dumps, no stock mutation in status transitions, preserve fulfilled-reservation handoff rules.
- Code: fulfillment entity/DTO/controller/service, config `ORDERS_SERVICE_URL`, focused fulfillment service tests.
- Validation: `npm run build`, `npm test -- --runInBand test/fulfillment-orders.service.spec.ts`, and `git diff --check` passed.

Evidence:

- Allowed progress statuses are `collecting`, `forming`, `formed`, `handed_to_delivery`, `in_delivery`, `delivered`, and `not_delivered`.
- Transition order is guarded: `requested -> collecting -> forming -> formed -> handed_to_delivery -> in_delivery -> delivered/not_delivered`, with explicit cancel/return paths preserved.
- Warehouse sends bounded status payloads to Orders with `x-service-name=warehouse-microservice` and the runtime service token; token values are never logged or documented.
- Tests cover successful status advance plus Orders callback headers/payload, invalid jump rejection, and existing cancel/return behavior.

Runtime evidence:

- Deployed Warehouse image `localhost:5000/warehouse-microservice:65e53c6`; deploy completed migrations, rollout, and in-pod health with database and RabbitMQ `up`.
- Runtime env check confirmed `ORDERS_SERVICE_URL=http://orders-microservice.statex-apps.svc.cluster.local:3203` and a service token are present without printing token values.
- Deployed Orders image `localhost:5000/orders-microservice:7bcfadd` first so the internal status callback endpoint and Warehouse token mapping were live.
- Live smoke order `94ce9a4b-7c6a-4625-85c7-8d1b13228b2d` advanced fulfillment order `6ada14af-20f8-4928-9a37-94a331d97be2` from `requested` to `collecting` through `POST /api/fulfillment-orders/order/:orderId/status`.
- Orders persisted `warehouseHandoff.fulfillmentOrderHandoff.warehouseStatus=collecting` and logged `order.warehouse_fulfillment_status.update` with `resultingStatus=warehouse_collecting`.
- Notifications Orders-events health after the smoke showed `received=2`, `sent=2`, `failed=0`, proving the Orders lifecycle event reached the notification pipeline.
- Provider-specific tracking/courier adapter remains `[MISSING: approved delivery provider contract]`; this lane intentionally uses Warehouse-owned operational fulfillment statuses only.

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
