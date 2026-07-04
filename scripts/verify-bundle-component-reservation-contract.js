const fs = require('fs');
const assert = require('assert');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function assertIncludes(source, marker, message) {
  assert(source.includes(marker), message);
}

const dto = read('src/stock/dto/stock-mutation.dto.ts');
const reservationTests = read('test/reservations.service.spec.ts');
const stockTests = read('test/stock.service.spec.ts');
const stockService = read('src/stock/stock.service.ts');
const contract = read('docs/contracts/catalog-bundle-component-reservation-contract.md');
const validation = read('docs/intent-preservation/validation-reports/VAL-WH-G24-BUNDLE-COMPONENT-RESERVATION.md');
const warehouseLiveTargetReadbackWordingSync = read('reports/validation/VAL-GOAL-24-warehouse-live-target-readback-wording-sync-2026-07-04.md');
const approvalPacket = read('docs/contracts/goal24-warehouse-cleanup-approval-packet.md');
const catalogApprovalPacket = read('/home/ssf/Documents/Github/catalog-microservice/docs/orchestrator/2026-07-03-goal24-paid-provider-smoke-approval-packet.md');

const goal24CurrentHeadVerifierSync = read('reports/validation/VAL-GOAL-24-current-head-verifier-sync-2026-07-04.md');
const orchestratorStatus = read('docs/orchestrator/STATUS.md');
const goal24CurrentHeadMarker = '[RESOLVED/NARROWED: Goal 24 current-head verifier sync GOAL24-CURRENT-HEADS-2026-07-04H requires Auth 2faf719 docs: complete goal10 customer data wallet rollout, Payments 0207876 docs: sync goal24 fiobanka runtime image evidence, Catalog 0e37b4c docs: sync goal24 catalog payments runtime image evidence, FlipFlop 490913a docs: clean goal24 owner wording, Orders 154c5cd docs: sync goal24 orders payments runtime image evidence, and Warehouse 0289dc2 docs: require goal24 current heads in verifier as the current post-merge validation heads; historical Wave A-G markers are evidence only; runtime side effects remain blocked]';
for (const [label, source] of [
  ['current-head verifier sync report', goal24CurrentHeadVerifierSync],
  ['orchestrator status', orchestratorStatus],
]) {
  if (!source.includes(goal24CurrentHeadMarker)) {
    throw new Error(label + ' missing Goal 24 current-head verifier sync marker');
  }
}

assertIncludes(dto, 'BundleAggregateReservationBoundaryDto', 'DTO boundary class is missing');
assertIncludes(dto, 'bundleId is forbidden; reserve existing component productId lines only', 'bundleId fail-closed validation is missing');
assertIncludes(dto, 'bundleSku is forbidden; Warehouse does not own synthetic bundle stock', 'bundleSku fail-closed validation is missing');
assertIncludes(dto, 'bundleStockId is forbidden; Warehouse reserves component stock rows only', 'bundleStockId fail-closed validation is missing');
assertIncludes(dto, 'bundleContractVersion is forbidden; Catalog bundle evidence must not become Warehouse stock identity', 'bundle contract-version fail-closed validation is missing');
assertIncludes(reservationTests, 'keeps normal component product line reservation compatible', 'component-line compatibility test is missing');
assertIncludes(reservationTests, 'fails closed when a caller tries to reserve a Catalog bundle aggregate', 'bundle aggregate rejection test is missing');

const stockLifecycleEvidence = [
  ['reserve hold test', 'creates a reservation row and increases reserved stock on checkout hold'],
  ['release test', 'releases reserved stock on payment failure'],
  ['fulfill/decrement test', 'deducts stock and clears the hold on payment success'],
  ['fulfill replay test', 'does not deduct stock again when a fulfillment webhook is replayed'],
  ['expiry release test', 'expires a timed-out reservation and releases reserved stock'],
  ['post-fulfillment cancel restock test', 'restocks a fulfilled reservation when an order cancellation is reversed'],
  ['return restock test', 'restocks inventory for a fulfilled reservation return'],
];
for (const [label, marker] of stockLifecycleEvidence) {
  assertIncludes(stockTests, marker, `${label} is missing`);
}

const stockServiceEvidence = [
  ['reserve stock effect', 'stock.reserved += reserveDelta'],
  ['release stock effect', 'stock.reserved -= quantity'],
  ['fulfill reserved decrement', 'stock.reserved -= quantity'],
  ['fulfill quantity decrement', 'stock.quantity -= quantity'],
  ['cancel active release branch', "const wasActive = reservation.status === 'active'"],
  ['cancel fulfilled restock branch', 'stock.quantity += quantity'],
  ['return fulfilled restock', 'async returnReservation'],
  ['return quantity increment', 'stock.quantity += quantity'],
  ['idempotent transition guard', 'assertIdempotentReservationTransition'],
];
for (const [label, marker] of stockServiceEvidence) {
  assertIncludes(stockService, marker, `${label} source evidence is missing`);
}

const contractMarkers = [
  '[RESOLVED: Warehouse approval that first ecosystem bundle selling reserves component lines only]',
  '[RESOLVED: Warehouse source evidence for component-line stock hold/release/fulfill/cancel/return mapping]',
  'Component-Line Stock Effect Evidence',
  'must not reserve `bundleId`',
  'mutate live stock in validation',
  '[MISSING: owner-approved paid/provider checkout smoke with stock and refund/cancel rollback plan]',
  'paid/provider bundle checkout smoke beyond the already recorded pending-order reservation and release evidence',
  'transition each active component reservation to `fulfilled`',
  'refund/cancel after fulfillment',
  '[RESOLVED/NARROWED: Orders/Payments completed|failed|cancelled source mapping plus Orders cancellation cleanup gate are source-defined; runtime remains blocked on exact provider proof, target order hash/state, named actor, side-effect acknowledgements, live Warehouse readback, and final mutation approval]',
  'Paid Bundle Cleanup Operation Matrix',
  'Reserved-only `active` hold, no stock decrement',
  'Approved Warehouse operation',
  'use Warehouse `release` for reserved-only component lines before fulfillment',
  'use Warehouse `cancel` for fulfilled/stock-decremented component lines only when the approved rollback event is order/provider cancellation',
  'use Warehouse `return` for fulfilled/stock-decremented component lines only when the approved rollback event is a return workflow',
  'use line-by-line mixed cleanup for partial failures',
  'timeout/expiry behavior',
  '[RESOLVED/NARROWED: Warehouse owner-approved cleanup operation for reserved-only, fulfilled/stock-decremented, return, partial component failure, and timeout component-line states; candidate max quantity is source-documented from Catalog packet, while live current row readback, renewed hold/release duration, and final mutation approval remain missing]',
  '[MISSING: deterministic Warehouse component reservation state for cleanup]',
];
for (const marker of contractMarkers) {
  assertIncludes(contract, marker, `contract marker is missing: ${marker}`);
}

const validationMarkers = [
  'Component-Line Rollback Evidence Refresh',
  'Hold: `StockService.reserveStock`',
  'Release: `StockService.unreserveStock`',
  'Fulfill/decrement: `StockService.fulfillReservation`',
  'Cancel after fulfillment: `StockService.cancelReservation`',
  'Return after fulfillment: `StockService.returnReservation`',
  '[MISSING: renewed owner-approved execution window and Warehouse hold/release duration]; [MISSING: final owner approval before any live Warehouse reservation/cleanup mutation]',
  'Paid Bundle Cleanup Semantics Refresh',
  'Reserved-only active hold before fulfillment',
  'Fulfilled/stock-decremented cancellation rollback',
  'Fulfilled/stock-decremented return workflow',
  'Mixed active and fulfilled partial failure',
  'Reserved/Timeout Cleanup Narrowing',
  'Timeout state',
  '[RESOLVED/NARROWED: candidate target component stock rows and max component quantity are source-documented from Catalog packet]; [MISSING: live current target row readback at execution time]; [MISSING: renewed owner-approved execution window and Warehouse hold/release duration]; [MISSING: final owner approval before any live Warehouse reservation/cleanup mutation]',
  '[RESOLVED/NARROWED: Warehouse owner-approved cleanup operation for reserved-only, fulfilled/stock-decremented, return, partial component failure, and timeout component-line states; candidate max quantity is source-documented from Catalog packet, while live current row readback, renewed hold/release duration, and final mutation approval remain missing]',
];
for (const marker of validationMarkers) {
  assertIncludes(validation, marker, `validation marker is missing: ${marker}`);
}


const approvalPacketMarkers = [
  'WH-G24-WAREHOUSE-CLEANUP-APPROVAL-PACKET',
  '[MISSING: renewed owner-approved execution window and Warehouse hold/release duration]; [MISSING: final owner approval before any live Warehouse reservation/cleanup mutation]',
  '[MISSING: owner-approved operation for reserved-only, fulfilled/stock-decremented, return, partial component failure, and timeout states, including max quantity and hold/release window]',
  '[MISSING: owner-approved post-fulfillment cancellation/return workflow that maps a Payments refund or correction to Orders and Warehouse without inferring stock effects]',
  'A refund alone is not inventory-return evidence',
  'Do not fulfill Warehouse reservations unless Orders receives a Payments-owned completed status through the approved `orders.payment-status.v1` path.',
  'Do not release fulfilled reservations. Use `release` only for active holds before stock decrement.',
  'Treat the 15-minute default reservation TTL as a source implementation fact only',
  'Do not call Warehouse `cancel` after fulfillment unless the approved event is order/provider cancellation or reversal',
  'Do not call Warehouse `return` after fulfillment unless the approved event is an inventory-return workflow.',
  '[MISSING: deterministic Warehouse component reservation state for cleanup]',
  'Agent-Ready Approval Request',
  'Merge order: Payments provider evidence, Orders correction approval, Warehouse cleanup packet, channel/canary dry-run, final integration smoke.',
];
for (const marker of approvalPacketMarkers) {
  assertIncludes(approvalPacket, marker, `approval packet marker is missing: ${marker}`);
}

const cleanupRefreshMarkers = [
  'Warehouse Cleanup Approval Packet Refresh',
  '[MISSING: renewed owner-approved execution window and Warehouse hold/release duration]; [MISSING: final owner approval before any live Warehouse reservation/cleanup mutation]` remains unresolved',
  '[MISSING: owner-approved post-fulfillment cancellation/return workflow that maps a Payments refund or correction to Orders and Warehouse without inferring stock effects]` remains unresolved',
  'It grants no runtime permission.',
  'Reserved/Timeout Cleanup Narrowing',
  '[RESOLVED/NARROWED: Warehouse owner-approved cleanup operation for reserved-only, fulfilled/stock-decremented, return, partial component failure, and timeout component-line states; candidate max quantity is source-documented from Catalog packet, while live current row readback, renewed hold/release duration, and final mutation approval remain missing]',
];
for (const marker of cleanupRefreshMarkers) {
  assertIncludes(validation, marker, `cleanup refresh marker is missing: ${marker}`);
}


const deterministicCleanupMarkers = [
  ['contract deterministic cleanup packet', contract, 'Deterministic Cleanup Packet'],
  ['contract deterministic lookup path', contract, 'GET /api/reservations/order/:orderId'],
  ['contract deterministic lookup keys', contract, 'orderId + channel + productId + warehouseId + quantity'],
  ['contract deterministic result', contract, '[RESOLVED/NARROWED: deterministic Warehouse component-line cleanup packet for reserved-only, fulfilled, cancel, return, partial failure, and timeout states]'],
  ['approval deterministic cleanup packet', approvalPacket, 'Deterministic Component-Line Cleanup Packet'],
  ['approval current status field', approvalPacket, 'currentReservationStatus'],
  ['approval cleanup operation field', approvalPacket, 'approvedCleanupOperation'],
  ['validation deterministic cleanup lane', validation, 'Deterministic Cleanup Packet Lane'],
  ['validation required packet keys', validation, 'Required packet keys'],
];
for (const [label, source, marker] of deterministicCleanupMarkers) {
  assertIncludes(source, marker, `${label} marker is missing`);
}


const staleBlockerMarkers = [
  '[MISSING: approved Warehouse stock hold/release window and max quantity]',
  '[MISSING: owner-approved Warehouse stock hold/release window and max quantity]',
  '[RESOLVED/NARROWED: owner-approved Warehouse stock decrement/fulfillment rollback criteria for paid bundle smoke at source-policy level; live stock window and max quantity remain missing]',
];
for (const marker of staleBlockerMarkers) {
  for (const [label, source] of [
    ['contract', contract],
    ['validation report', validation],
    ['approval packet', approvalPacket],
  ]) {
    assert(!source.includes(marker), `${label} contains weaker non-owner-approved blocker marker: ${marker}`);
  }
}


const catalogTargetFactMarkers = [
  '[RESOLVED/NARROWED: candidate target component stock rows and max component quantity are source-documented from Catalog packet]; [MISSING: live current target row readback at execution time]; [MISSING: renewed owner-approved execution window and Warehouse hold/release duration]; [MISSING: final owner approval before any live Warehouse reservation/cleanup mutation]',
  '[RESOLVED/NARROWED: candidate target component stock rows and max component quantity are source-documented from Catalog packet]',
  '[MISSING: live current target row readback at execution time]',
  '[MISSING: renewed owner-approved execution window and Warehouse hold/release duration]',
  '[MISSING: final owner approval before any live Warehouse reservation/cleanup mutation]',
  '919be990-1c76-4f9c-b100-829281c6a709',
  'ce4a51aa-2d12-4ab7-a965-7a36609d01fc',
  'dbc51dde-fc66-4511-b178-f929183f4647',
  'c0de0000-0000-4000-8000-000000000013',
  'max hold quantity `1` per component',
  'Catalog Candidate Target Facts Reconcile',
];
for (const marker of catalogTargetFactMarkers) {
  assertIncludes(approvalPacket, marker, `approval packet missing Catalog target fact marker: ${marker}`);
  assertIncludes(validation, marker, `validation missing Catalog target fact marker: ${marker}`);
}
for (const marker of [
  'targetBundleId',
  '`919be990-1c76-4f9c-b100-829281c6a709`',
  '`ce4a51aa-2d12-4ab7-a965-7a36609d01fc` qty `1`',
  '`dbc51dde-fc66-4511-b178-f929183f4647` qty `1`',
  'Warehouse `c0de0000-0000-4000-8000-000000000013`',
  'max hold qty `1` per component',
]) {
  assertIncludes(catalogApprovalPacket, marker, `Catalog approval packet missing source target fact: ${marker}`);
}

const holdWindowPreservationMarkers = [
  'Warehouse Hold Window Blocker Preservation Refresh',
  '[MISSING: renewed owner-approved execution window and Warehouse hold/release duration]; [MISSING: final owner approval before any live Warehouse reservation/cleanup mutation]` remains unresolved',
  'No aggregate bundle reservation, synthetic bundle SKU stock, or aggregate bundle cleanup operation is approved.',
];
for (const marker of holdWindowPreservationMarkers) {
  assertIncludes(validation, marker, `hold-window preservation marker is missing: ${marker}`);
}

console.log('catalog.bundle.v1 Warehouse component-line rollback boundary verified');


const staleGoal24WarehouseMarkers = [
  '[MISSING: target component stock rows]',
  '[MISSING: Orders/Payments provider-success, provider-cancel, refund, and post-fulfillment cancellation event contract that maps to Warehouse fulfill/cancel/return calls]',
];
const sourceDefinedCrossServiceMappingMarker = '[RESOLVED/NARROWED: Orders/Payments completed|failed|cancelled source mapping plus Orders cancellation cleanup gate are source-defined; runtime remains blocked on exact provider proof, target order hash/state, named actor, side-effect acknowledgements, live Warehouse readback, and final mutation approval]';
for (const [label, source] of [
  ['approval packet', approvalPacket],
  ['validation report', validation],
  ['component reservation contract', contract],
  ['implementation state', read('docs/IMPLEMENTATION_STATE.md')],
  ['orchestrator status', read('docs/orchestrator/STATUS.md')],
  ['live target readback wording sync report', warehouseLiveTargetReadbackWordingSync],
  ['implementation state', read('docs/IMPLEMENTATION_STATE.md')],
  ['orchestrator status', read('docs/orchestrator/STATUS.md')],
]) {
  assertIncludes(source, '[RESOLVED/NARROWED: candidate target component stock rows and max component quantity are source-documented from Catalog packet]', `${label} missing candidate target facts marker`);
  assertIncludes(source, '[MISSING: live current target row readback at execution time]', `${label} missing live target row readback blocker`);
  assertIncludes(source, '[MISSING: renewed owner-approved execution window and Warehouse hold/release duration]', `${label} missing renewed Warehouse window blocker`);
  assertIncludes(source, '[MISSING: final owner approval before any live Warehouse reservation/cleanup mutation]', `${label} missing final Warehouse mutation approval blocker`);
}
for (const [label, source] of [
  ['validation report', validation],
  ['component reservation contract', contract],
  ['orchestrator status', read('docs/orchestrator/STATUS.md')],
]) {
  assertIncludes(source, sourceDefinedCrossServiceMappingMarker, `${label} missing source-defined cross-service mapping marker`);
}
for (const [label, source] of [
  ['approval packet', approvalPacket],
  ['validation report', validation],
  ['component reservation contract', contract],
  ['orchestrator status', read('docs/orchestrator/STATUS.md')],
]) {
  for (const marker of staleGoal24WarehouseMarkers) {
    assert(!source.includes(marker), `${label} still contains stale Warehouse marker ${marker}`);
  }
}
for (const boundary of [
  'mutation: false',
  'live_checkout_executed: false',
  'payment_creation: false',
  'provider_call: false',
  'orders_mutation: false',
  'warehouse_mutation: false',
  'warehouse_reservation: false',
  'warehouse_cleanup: false',
  'deployment: false',
  'migration: false',
  'db_write: false',
  'db_read: false',
  'secret_output: false',
  'token_output: false',
  'raw_customer_or_payment_evidence: false',
]) {
  assertIncludes(warehouseLiveTargetReadbackWordingSync, boundary, `live target readback wording sync boundary ${boundary}`);
}
