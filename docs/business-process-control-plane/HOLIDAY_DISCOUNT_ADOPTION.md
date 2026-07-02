# BPCP Holiday Discount Adoption

Status: service-local adoption contract
Date: 2026-07-02
Service: `warehouse-microservice`
Central contract pack: `statex-ecosystem/docs/business-process-control-plane/`

## Role

Availability fact provider for upsell eligibility and stock-safe recommendations.

## Responsibilities

- Provide availability facts if the upsell policy needs stock-aware recommendations.
- Keep warehouse fulfillment and stock ownership separate from discount policy.

## Required interfaces

- Availability facts or existing stock read contract.
- Optional `availableForUpsell` projection.

## Boundaries

- This service must not become the global owner of BPCP process definitions.
- This service must fail closed on invalid or unknown BPCP process versions.
- This service must keep existing domain ownership and invariants.
- This service must expose or document dry-run behavior before live execution.
- This service must not overwrite existing service contracts without an
  explicit integration owner and validation owner.

## Holiday Discount pilot expectations

- Recognize `holiday-discount-2026` only through versioned BPCP contracts.
- Preserve `processId`, `processVersion`, and `policyId` in every relevant
  decision, event, snapshot, log, or rendered experience.
- Support rollback by respecting BPCP pause and retired states.
- Keep process display and process execution separate where applicable.

## Blockers and unknowns

- [MISSING: whether Holiday Discount upsell needs live stock facts]
- [MISSING: current warehouse dirty implementation lane must not be overwritten]

## Validation evidence required before implementation is accepted

- Upsell fixture excludes unavailable stock.
- Existing warehouse validation for active lane remains separate.

## Parallel handoff

This adoption doc is safe for a focused service owner to implement in parallel
after the central BPCP schemas are accepted. The service owner must not edit
shared BPCP schemas directly; schema changes go through the BPCP integration
owner.
