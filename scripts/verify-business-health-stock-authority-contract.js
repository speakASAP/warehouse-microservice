#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function requireIncludes(source, needle, label) {
  if (!source.includes(needle)) {
    throw new Error(`${label} missing marker: ${needle}`);
  }
}

function requireRegex(source, pattern, label) {
  if (!pattern.test(source)) {
    throw new Error(`${label} missing pattern: ${pattern}`);
  }
}

const handoff = read('docs/orchestrator/2026-07-06-warehouse-business-health-handoff.md');
const invariants = read('docs/governance/PROJECT_INVARIANTS.md');
const traceability = read('docs/intent-preservation/TRACEABILITY_MATRIX.md');
const stockService = read('src/stock/stock.service.ts');
const reservationsService = read('src/reservations/reservations.service.ts');
const reservationEntity = read('src/reservations/stock-reservation.entity.ts');
const reservationController = read('src/reservations/reservations.controller.ts');
const fulfillmentContract = read('docs/contracts/fulfillment-handoff-contract.md');
const liveVerifier = read('scripts/verify-stock-authority-live.js');

for (const marker of [
  'business_health_contract: stock-order-marketplace-business-health.v1',
  'warehouse.stock_authority_business_health.v1',
  '## Intent Preservation Chain',
  '## Atomic Assertions Warehouse Owns',
  '## Evidence Fields To Expose',
  '## Live Synthetic Mutation Blockers',
  '## Parallel Execution Section',
  '[MISSING: final integration owner approval before any live Warehouse reservation, fulfillment, decrement, cancel, return, expire, release, or stock adjustment smoke]',
  'Validation -> `npm run verify:business-health-stock-authority-contract`; `git diff --check`.',
]) {
  requireIncludes(handoff, marker, 'business-health handoff');
}

for (const assertionId of [
  'warehouse.stock_authority',
  'warehouse.availability_equation',
  'warehouse.mutation_context',
  'warehouse.reserve_active_hold',
  'warehouse.release_active_hold',
  'warehouse.expire_due_hold',
  'warehouse.fulfill_reserved_stock',
  'warehouse.cancel_or_return_fulfilled_stock',
  'warehouse.stock_movement_evidence',
  'warehouse.stock_event_observability',
  'warehouse.fulfillment_handoff',
]) {
  requireIncludes(handoff, assertionId, 'atomic assertion');
}

for (const field of [
  '`quantity`',
  '`reserved`',
  '`available`',
  '`availabilityEquationOk`',
  '`activeReservationCount`',
  '`activeReservedQuantity`',
  '`latestMovementType`',
  '`movementEvidencePresent`',
  '`outboxStatusCounts`',
  '`stockEventEvidencePresent`',
  '`blockers`',
  '`validation`',
]) {
  requireIncludes(handoff, field, 'evidence field');
}

for (const marker of [
  'Warehouse is the stock and availability authority.',
  'Stock movement history is append-only business evidence.',
  'Negative quantity, reserved, or available stock states are invalid.',
  'Reservation, fulfillment, cancellation, expiry, return, and supplier reconciliation flows must be idempotent.',
  'Stock events must be observable. A broken event path must not masquerade as full readiness.',
]) {
  requireIncludes(invariants, marker, 'project invariant');
}

requireIncludes(traceability, 'Warehouse must be stock and availability authority.', 'traceability matrix');
requireIncludes(traceability, 'Checkout/payment/cancel/return must preserve stock state.', 'traceability matrix');
requireIncludes(traceability, 'Operators must trust health, events, deploy, and rollback evidence.', 'traceability matrix');

for (const marker of [
  'reserveStock(',
  'unreserveStock(',
  'fulfillReservation(',
  'cancelReservation(',
  'expireReservation(',
  'returnReservation(',
  'assertValidStockState',
  'validateMutationContext',
  'recordMovement',
  'enqueueStockEvents',
  'buildStockEventOutboxRows',
  'DEFAULT_RESERVATION_TTL_MS = 15 * 60 * 1000',
]) {
  requireIncludes(stockService, marker, 'stock service source');
}

for (const marker of [
  "ReservationStatus = 'active' | 'released' | 'fulfilled' | 'cancelled' | 'expired' | 'returned'",
  "@Entity('stock_reservations')",
  'expiresAt',
]) {
  requireIncludes(reservationEntity, marker, 'reservation entity source');
}

for (const marker of [
  'expireDueReservations',
  'RESERVATION_TTL_EXPIRED',
  'warehouse-reservation-expiry-cron',
]) {
  requireIncludes(reservationsService, marker, 'reservation service source');
}

for (const marker of [
  "@Post('reserve')",
  "@Post('release')",
  "@Post('fulfill')",
  "@Post('cancel')",
  "@Post('expire')",
  "@Post('expire-due')",
  "@Post('return')",
  'getAuthenticatedMutationActor',
]) {
  requireIncludes(reservationController, marker, 'reservation controller source');
}

for (const marker of [
  'POST /api/fulfillment-orders',
  'The cancel and return handoff endpoints do not mutate stock.',
  'Stock effects remain explicit through existing reservation lifecycle endpoints:',
]) {
  requireIncludes(fulfillmentContract, marker, 'fulfillment handoff contract');
}

for (const marker of [
  "contract: 'warehouse-stock-authority-live.v1'",
  'mutatesWarehouse: false',
  'activeReservations',
  'missing movement evidence',
  'missing outbox evidence',
]) {
  requireIncludes(liveVerifier, marker, 'stock authority live verifier');
}

requireRegex(stockService, /available\s*=\s*stock\.quantity\s*-\s*stock\.reserved/g, 'availability equation source');
requireRegex(stockService, /stock\.quantity < 0 \|\| stock\.reserved < 0 \|\| stock\.available < 0/, 'negative stock guard source');
requireRegex(stockService, /stock\.reserved > stock\.quantity/, 'reserved over quantity guard source');

const summary = {
  contract: 'warehouse.stock_authority_business_health.v1',
  businessHealthContract: 'stock-order-marketplace-business-health.v1',
  mutatesWarehouse: false,
  checkedFiles: [
    'docs/orchestrator/2026-07-06-warehouse-business-health-handoff.md',
    'docs/governance/PROJECT_INVARIANTS.md',
    'docs/intent-preservation/TRACEABILITY_MATRIX.md',
    'src/stock/stock.service.ts',
    'src/reservations/reservations.service.ts',
    'src/reservations/stock-reservation.entity.ts',
    'src/reservations/reservations.controller.ts',
    'docs/contracts/fulfillment-handoff-contract.md',
    'scripts/verify-stock-authority-live.js',
  ],
  checkedAssertions: 11,
};

console.log(JSON.stringify(summary, null, 2));
