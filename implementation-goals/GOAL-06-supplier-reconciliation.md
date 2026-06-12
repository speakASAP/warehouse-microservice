# WH-G6 - Supplier Dropship Reconciliation

Status: ready after WH-G5.

## Objective

Make Warehouse the central point for own and supplier stock availability.

## Intent Link

Supplier dropship stock must enter Warehouse through a trusted, idempotent reconciliation flow while preserving stock history.

## Scope

- Define supplier reconciliation request and persistence contract.
- Model dropship warehouses/locations distinctly from own warehouses.
- Record reconciliation evidence without deleting history.
- Detect conflicts between supplier availability and reserved/committed stock.
- Surface reconciliation failures to operators.

## Non-Goals

- Do not implement supplier-specific scraping/import logic.
- Do not bypass catalog product identity rules.
- Do not rewrite movement history.

## Acceptance Criteria

- Supplier stock updates are idempotent.
- Reconciliation records movement/reference evidence.
- Conflicts are detected and visible.
- Tests cover repeated supplier updates and conflict handling.

## Validation

Run focused supplier reconciliation tests plus build.

