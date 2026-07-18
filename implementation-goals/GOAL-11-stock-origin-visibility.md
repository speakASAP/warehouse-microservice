# GOAL-11 - Stock Origin Visibility Across Catalog, Warehouse, And Suppliers

Metadata:
- id: WH-G11
- status: active
- owner: warehouse-owner
- created: 2026-06-13
- last_updated: 2026-06-13
- completeness_level: complete
- upstream: BUSINESS.md, SYSTEM.md, docs/orchestrator/warehouse-intent-plan.md, docs/12_validation/TRACEABILITY_MATRIX.md, catalog-microservice docs/IMPLEMENTATION_STATE.md, suppliers-microservice docs/IMPLEMENTATION_STATE.md
- downstream: docs/11_tasks/WH-G11-T1.md, docs/21_execution_plans/EP-WH-G11-T1.md

## Intent

Make stock origin visible across the commerce ecosystem without moving ownership between services. Catalog remains product truth, Warehouse remains stock truth, and Suppliers remains supplier-import orchestration. Operators and downstream services must be able to answer whether a sellable catalog product is available from Alfares-owned physical stock, supplier/dropship virtual stock, or both.

## Big-Picture Architecture

| Capability | Owning service | Integration contract |
| --- | --- | --- |
| Product identity, SKU, sellable content, pricing, categories, media, readiness | Catalog | Catalog product APIs and projection APIs. |
| Physical warehouses, supplier/dropship warehouses, stock quantities, reservations, movements, availability | Warehouse | Warehouse stock, warehouse directory, supplier reconciliation, and batch availability APIs. |
| Supplier identity, credential references, import jobs, mappings, payload validation, idempotency | Suppliers | Supplier import jobs that validate payloads before downstream writes. |

## Target Flow

1. Catalog product exists first and provides the product ID used by Warehouse stock rows.
2. Warehouse stores one or more stock rows for that catalog product in warehouses typed as own, supplier, or dropship.
3. Supplier import jobs validate supplier payloads and only then call Warehouse supplier reconciliation for supplier/dropship stock updates.
4. Catalog availability/projection endpoints call Warehouse batch availability and expose Warehouse-sourced origin details to consumers.
5. FlipFlop/channel/order flows use Catalog for product truth and Warehouse for availability, reservation, and fulfillment decisions.

## Implementation Slices

1. WH-G11-T1: Add warehouse origin metadata to Warehouse batch availability rows. Status: done in Warehouse source.
2. CAT-G10: Propagate Warehouse origin metadata through Catalog availability and FlipFlop projection contracts.
3. SUP-G7: Add an approved, idempotent Suppliers-to-Warehouse reconciliation client for validated stock candidates.
4. WH-G12: Add an operator inventory topology/read model for local warehouses, supplier warehouses, and catalog product availability by origin.
5. E2E-G1: Add cross-service smoke checks proving one catalog product has local stock, supplier stock, and clear origin reporting.

## Non-Goals

- Do not store stock quantities in Catalog.
- Do not store supplier credentials in Warehouse or Catalog.
- Do not create production stock mutations without explicit owner-approved task context.
- Do not let Suppliers write Catalog or Warehouse before payload, category, product, and stock validation passes.
- Do not change Auth ownership of JWT, RBAC, or service identity.

## Acceptance Criteria

- Batch availability includes enough Warehouse-owned metadata to distinguish physical/local stock from supplier/dropship stock.
- Existing availability consumers remain compatible.
- Supplier warehouse rows expose supplier linkage without exposing supplier credentials.
- Follow-up Catalog and Suppliers tasks are documented as separate owner-approved implementation slices.
