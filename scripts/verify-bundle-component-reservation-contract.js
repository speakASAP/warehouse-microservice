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
const approvalPacket = read('docs/contracts/goal24-warehouse-cleanup-approval-packet.md');

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
  'Orders/Payments provider-success, provider-cancel, refund, and post-fulfillment cancellation event contract',
  'Paid Bundle Cleanup Operation Matrix',
  'Reserved-only `active` hold, no stock decrement',
  'Approved Warehouse operation',
  'use Warehouse `release` for reserved-only component lines before fulfillment',
  'use Warehouse `cancel` for fulfilled/stock-decremented component lines only when the approved rollback event is order/provider cancellation',
  'use Warehouse `return` for fulfilled/stock-decremented component lines only when the approved rollback event is a return workflow',
  'use line-by-line mixed cleanup for partial failures',
  '[RESOLVED/NARROWED: Warehouse owner-approved cleanup operation for reserved-only, fulfilled/stock-decremented, and partially failed bundle component-line states]',
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
  '[MISSING: approved Warehouse stock hold/release window and max quantity]',
  'Paid Bundle Cleanup Semantics Refresh',
  'Reserved-only active hold before fulfillment',
  'Fulfilled/stock-decremented cancellation rollback',
  'Fulfilled/stock-decremented return workflow',
  'Mixed active and fulfilled partial failure',
  '[RESOLVED/NARROWED: owner-approved Warehouse stock decrement/fulfillment rollback criteria for paid bundle smoke at source-policy level; live stock window and max quantity remain missing]',
  '[RESOLVED/NARROWED: Warehouse owner-approved cleanup operation for reserved-only, fulfilled/stock-decremented, and partially failed bundle component-line states]',
];
for (const marker of validationMarkers) {
  assertIncludes(validation, marker, `validation marker is missing: ${marker}`);
}


const approvalPacketMarkers = [
  'WH-G24-WAREHOUSE-CLEANUP-APPROVAL-PACKET',
  '[MISSING: owner-approved Warehouse stock hold/release window and max quantity]',
  '[MISSING: owner-approved post-fulfillment cancellation/return workflow that maps a Payments refund or correction to Orders and Warehouse without inferring stock effects]',
  'A refund alone is not inventory-return evidence',
  'Do not fulfill Warehouse reservations unless Orders receives a Payments-owned completed status through the approved `orders.payment-status.v1` path.',
  'Do not release fulfilled reservations. Use `release` only for active holds before stock decrement.',
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
  '[MISSING: owner-approved Warehouse stock hold/release window and max quantity]` remains unresolved',
  '[MISSING: owner-approved post-fulfillment cancellation/return workflow that maps a Payments refund or correction to Orders and Warehouse without inferring stock effects]` remains unresolved',
  'It grants no runtime permission.',
];
for (const marker of cleanupRefreshMarkers) {
  assertIncludes(validation, marker, `cleanup refresh marker is missing: ${marker}`);
}

console.log('catalog.bundle.v1 Warehouse component-line rollback boundary verified');
