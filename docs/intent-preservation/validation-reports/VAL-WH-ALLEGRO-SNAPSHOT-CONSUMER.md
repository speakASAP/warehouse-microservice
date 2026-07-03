# VAL-WH-ALLEGRO-SNAPSHOT-CONSUMER - Allegro Shipment Snapshot Consumer Contract Validation

```yaml
id: VAL-WH-ALLEGRO-SNAPSHOT-CONSUMER
status: validated
owner: warehouse-fulfillment-owner
created: 2026-07-03
last_updated: 2026-07-03
completeness_level: docs-only-validated
upstream:
  - docs/contracts/fulfillment-provider-status-intake-contract.md
  - docs/contracts/fulfillment-handoff-contract.md
  - allegro-service commit e626e5c source-only snapshot verifier
downstream:
  - docs/orchestrator/STATUS.md
  - docs/IMPLEMENTATION_STATE.md
related_adrs: []
```

## Artifact Validated

Documentation-only Warehouse consumer contract for Allegro read-only shipment status snapshots after Warehouse fulfillment reaches `handed_to_delivery`.

## Intent Compliance Report

- Vision: delivery progress becomes visible without raw Allegro/provider data landing in Warehouse or Orders.
- Goal Impact: Orders lifecycle goal now has a bounded Warehouse consumer contract and exact runtime gates for the previously missing adapter.
- System: Allegro remains provider/source owner; Warehouse remains fulfillment status owner; Orders remains lifecycle projection owner.
- Feature: `allegro.shipment_status_snapshot.v1` intake contract for Warehouse docs only.
- Task: document snapshot envelope, mapping, idempotency, redaction, rejection, callback role, and gates.
- Execution Plan: no runtime implementation, no migrations, no deploy, no live calls.
- Coding Prompt: remote-only, Warehouse `docs/**` only.
- Code: documentation changes only.
- Validation: diff hygiene and safe static repo checker.

## Evidence

- Read-only source inspection covered `src/fulfillment/fulfillment-order.entity.ts`, `src/fulfillment/fulfillment-orders.service.ts`, and `src/fulfillment/dto/fulfillment-order.dto.ts`.
- Existing status guard supports only the documented post-handoff transitions.
- Existing callback to Orders uses bounded Warehouse status metadata and does not require Allegro raw fields.
- Contract explicitly rejects raw provider payloads, tracking numbers/URLs, credentials, customer/contact/address fields, labels/documents, and raw marketplace shipment/package objects.
- Contract records the runtime gaps instead of inventing adapter, ledger, correlation, or fixture behavior.

## Validation Commands

| Command | Result | Notes |
| --- | --- | --- |
| `git diff --check` | passed | No whitespace errors. |
| `npm run check:hosted-auth` | passed | Safe static checker discovered in repo; not shipment-specific, but confirms no unrelated hosted Auth regression. |

## Remaining Gates

- `[MISSING: Warehouse consumer/runtime adapter for read-only shipment snapshots]`
- `[MISSING: approved Warehouse shipment snapshot ledger or adapter-owned durable idempotency store]`
- `[MISSING: approved correlation source between Allegro hashed order/shipment/waybill identity and exactly one Warehouse fulfillment order]`
- `[MISSING: approved Allegro latestStatus to Warehouse status mapping fixture set for in-delivery, delivered, not-delivered, returned, and no-op classes]`
- `[MISSING: Orders lifecycle callback verification after Warehouse consumer implementation, proving no Allegro snapshot hashes/raw fields enter Orders events]`

## Recommendation

Do not implement runtime Warehouse consumer code until the missing gates above are assigned as an owner-approved implementation task.
