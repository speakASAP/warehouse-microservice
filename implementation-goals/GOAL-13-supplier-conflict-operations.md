# GOAL-13 - Supplier Conflict Operations

Metadata:
- id: WH-G13-CONFLICTS
- source_delegation_goal: WH-G13 Supplier Conflict Operations
- status: source-integrated-no-deploy
- owner: warehouse-owner
- created: 2026-06-14
- last_updated: 2026-06-14
- completeness_level: complete

## Numbering Note

[MISSING: original worker IPS artifact] The current remote code contains supplier conflict operations work, but the existing `WH-G13` IPS task and validation report describe older admin inventory topology work. This suffixed goal preserves the supplier-conflict intent without rewriting completed WH-G13 history.

## Objective

Expose supplier reconciliation conflicts to operators and allow conflicts to be marked reviewed with operator notes, while preserving Warehouse as the stock and supplier reconciliation evidence owner.

## Goal Impact

Supplier conflicts become operationally visible and reviewable without silently modifying stock truth, supplier truth, or historical reconciliation evidence.

## Invariants

- Warehouse owns stock quantities, reservations, movements, and supplier reconciliation evidence.
- Supplier feeds remain external input; Warehouse records applied or conflicting reconciliation outcomes.
- Conflict review is operational metadata, not a stock mutation.
- Production deployment and migration execution require explicit owner approval.

## Acceptance Criteria

- Operators can list supplier reconciliation records with filters for status, supplier, warehouse, product, external reference, reviewed state, date range, and limit.
- Operators can review conflict reconciliation records and store optional notes.
- Conflict review cannot mark non-conflict records as reviewed.
- Schema changes are represented in committed migrations before deployment.
- Tests and build pass before handoff.

## Non-Goals

- No production deployment without owner approval.
- No automatic conflict resolution or supplier-stock mutation.
- No customer-facing conflict exposure.
