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

function requireNotRegex(source, pattern, label) {
  if (pattern.test(source)) {
    throw new Error(`${label} contains forbidden pattern: ${pattern}`);
  }
}

const handoff = read('docs/orchestrator/2026-07-06-warehouse-business-health-handoff.md');
const invariants = read('docs/governance/PROJECT_INVARIANTS.md');
const traceability = read('docs/intent-preservation/TRACEABILITY_MATRIX.md');
const appModule = read('src/app.module.ts');
const businessHealthModule = read('src/business-health/business-health.module.ts');
const businessHealthController = read('src/business-health/business-health.controller.ts');
const businessHealthService = read('src/business-health/business-health.service.ts');
const businessHealthTypes = read('src/business-health/business-health.types.ts');
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
  'Validation -> `npm run verify:business-health-stock-authority-contract`; `npm run build`; `git diff --check`.',
]) {
  requireIncludes(handoff, marker, 'business-health handoff');
}

const assertionIds = [
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
];

for (const assertionId of assertionIds) {
  requireIncludes(handoff, assertionId, 'atomic assertion');
  requireIncludes(businessHealthService, assertionId, 'business-health endpoint assertion');
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
  "import { BusinessHealthModule } from './business-health/business-health.module';",
  'BusinessHealthModule,',
]) {
  requireIncludes(appModule, marker, 'app module business-health wiring');
}

for (const marker of [
  'export class BusinessHealthModule',
  'BusinessHealthController',
  'BusinessHealthService',
]) {
  requireIncludes(businessHealthModule, marker, 'business-health module');
}

for (const marker of [
  "@Controller('business-health')",
  '@Public()',
  "@Get('stock-authority')",
  'getStockAuthorityEnvelope()',
]) {
  requireIncludes(businessHealthController, marker, 'business-health controller');
}

for (const marker of [
  'StockAuthorityBusinessHealthEnvelope',
  "contractId: 'warehouse.stock_authority_business_health.v1'",
  "businessHealthContract: 'stock-order-marketplace-business-health.v1'",
  "endpoint: '/api/business-health/stock-authority'",
  'mutatesWarehouse: false',
  'runtimeDataQueried: false',
  'productionDbQueried: false',
  'liveSyntheticMutationAuthorized: false',
  'mutationBoundary',
]) {
  requireIncludes(businessHealthTypes, marker, 'business-health types');
}

for (const marker of [
  "const CONTRACT_ID = 'warehouse.stock_authority_business_health.v1' as const;",
  "const BUSINESS_HEALTH_CONTRACT = 'stock-order-marketplace-business-health.v1' as const;",
  "const ENDPOINT = '/api/business-health/stock-authority' as const;",
  'generatedAt: new Date().toISOString()',
  'mutatesWarehouse: false',
  "status: 'blocked'",
  "source: 'static-source-contract'",
  'runtimeDataQueried: false',
  'productionDbQueried: false',
  'liveSyntheticMutationAuthorized: false',
  'Keep live synthetic Warehouse mutation blocked',
  '[MISSING: approved actor, reasonCode, reference/idempotency policy, max quantity, hold/release window, and rollback/no-rollback expectation]',
  '[UNKNOWN: concurrent production stock changes between readback and proposed mutation unless protected by an approved runtime packet]',
]) {
  requireIncludes(businessHealthService, marker, 'business-health service envelope');
}

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

const endpointSources = {
  'src/business-health/business-health.module.ts': businessHealthModule,
  'src/business-health/business-health.controller.ts': businessHealthController,
  'src/business-health/business-health.service.ts': businessHealthService,
  'src/business-health/business-health.types.ts': businessHealthTypes,
};

const forbiddenEndpointCodePatterns = [
  /@Post\s*\(/,
  /@Put\s*\(/,
  /@Patch\s*\(/,
  /@Delete\s*\(/,
  /TypeOrmModule/,
  /InjectRepository/,
  /DataSource/,
  /Repository\s*</,
  /createQueryBuilder\s*\(/,
  /\.query\s*\(/,
  /\.save\s*\(/,
  /\.insert\s*\(/,
  /\.update\s*\(/,
  /\.delete\s*\(/,
  /setStock\s*\(/,
  /reserveStock\s*\(/,
  /unreserveStock\s*\(/,
  /fulfillReservation\s*\(/,
  /cancelReservation\s*\(/,
  /expireReservation\s*\(/,
  /returnReservation\s*\(/,
  /incrementStock\s*\(/,
  /decrementStock\s*\(/,
  /scripts\/deploy\.sh/,
  /kubectl/,
  /migration:run/,
];

for (const [relativePath, source] of Object.entries(endpointSources)) {
  for (const pattern of forbiddenEndpointCodePatterns) {
    requireNotRegex(source, pattern, relativePath);
  }
}

const summary = {
  contract: 'warehouse.stock_authority_business_health.v1',
  businessHealthContract: 'stock-order-marketplace-business-health.v1',
  endpoint: '/api/business-health/stock-authority',
  mutatesWarehouse: false,
  checkedFiles: [
    'src/business-health/business-health.module.ts',
    'src/business-health/business-health.controller.ts',
    'src/business-health/business-health.service.ts',
    'src/business-health/business-health.types.ts',
    'src/app.module.ts',
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
  checkedAssertions: assertionIds.length,
  forbiddenEndpointCodePatternsChecked: forbiddenEndpointCodePatterns.length,
};

console.log(JSON.stringify(summary, null, 2));
