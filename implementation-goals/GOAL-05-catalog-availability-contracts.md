# WH-G5 - Catalog And Availability Contracts

Status: ready after WH-G3.

## Objective

Make product identity and availability consistent across Catalog, Warehouse, FlipFlop, and channel services.

## Intent Link

Catalog owns product identity and sellable content. Warehouse stock rows reference catalog product IDs and expose availability to storefront and channels.

## Scope

- Decide between live catalog identity validation and a trusted ingestion/reconciliation path based on current service contracts.
- Document service-to-service auth requirements for stock reads and writes.
- Add or document a batch availability endpoint for product lists.
- Provide contract examples for FlipFlop and channel consumers.
- Add a smoke plan proving a catalog product can be matched to Warehouse availability.

## Non-Goals

- Do not move product ownership into Warehouse.
- Do not make unauthenticated stock endpoints public.
- Do not implement channel-specific publication logic.

## Acceptance Criteria

- Product ID validation or trusted ingestion path is explicit.
- Batch availability is available or planned with exact request/response contract.
- Contract examples include auth expectations.
- FlipFlop can avoid N+1 unauthenticated availability calls.

## Validation

Validate with contract tests or documented curl examples, depending on implementation scope.

