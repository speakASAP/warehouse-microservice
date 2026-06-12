# Warehouse Big Plan

## Phase 1 - Make Production Change-Safe

- WH-G1: fix deploy reliability and truthful readiness.
- WH-G2: restore RabbitMQ event publishing.

Status: complete.

## Phase 2 - Make Stock Mutation Correct

- WH-G3: validate stock write DTOs, require reason/actor, enforce non-negative invariants, wrap stock and movement writes in transactions.

Status: complete.

## Phase 3 - Align Order And Catalog Contracts

- WH-G4: implement reservation lifecycle for cart, checkout, payment, cancellation, expiry, fulfillment, and return flows.
- WH-G5: define product identity validation and batch availability contracts for catalog, FlipFlop, and channels.

Status: complete.

## Phase 4 - Reconcile Supplier Availability

- WH-G6: implement idempotent supplier stock reconciliation and conflict surfacing.

Status: complete.

## Phase 5 - Make Operations Trustworthy

- WH-G7: add production runbook, smoke checks, logs, metrics, and state discipline.

Status: complete.

## Phase 6 - Make Schema Changes Repeatable

- WH-G8: add committed TypeORM migration workflow, baseline schema migration, migration Job template, and deploy-time migration execution.

Status: complete.

## Phase 7 - Add Production Operator Console

- WH-G9: deploy `/admin` console with health, readiness, operations, reservations, stock, movements, lifecycle actions, and supplier reconciliation.

Status: complete.

## Phase 8 - Owner-Approved Next Goal

No active implementation goal. Define the next goal only after owner approval.

Status: awaiting owner.
