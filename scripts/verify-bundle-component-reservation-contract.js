const fs = require('fs');
const assert = require('assert');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

const dto = read('src/stock/dto/stock-mutation.dto.ts');
const tests = read('test/reservations.service.spec.ts');
const contract = read('docs/contracts/catalog-bundle-component-reservation-contract.md');

assert(dto.includes('BundleAggregateReservationBoundaryDto'), 'DTO boundary class is missing');
assert(dto.includes('bundleId is forbidden; reserve existing component productId lines only'), 'bundleId fail-closed validation is missing');
assert(dto.includes('bundleSku is forbidden; Warehouse does not own synthetic bundle stock'), 'bundleSku fail-closed validation is missing');
assert(dto.includes('bundleStockId is forbidden; Warehouse reserves component stock rows only'), 'bundleStockId fail-closed validation is missing');
assert(dto.includes('bundleContractVersion is forbidden; Catalog bundle evidence must not become Warehouse stock identity'), 'bundle contract-version fail-closed validation is missing');
assert(tests.includes('keeps normal component product line reservation compatible'), 'component-line compatibility test is missing');
assert(tests.includes('fails closed when a caller tries to reserve a Catalog bundle aggregate'), 'bundle aggregate rejection test is missing');
assert(contract.includes('[RESOLVED: Warehouse approval that first ecosystem bundle selling reserves component lines only]'), 'resolved blocker marker is missing');
assert(contract.includes('must not reserve `bundleId`'), 'Warehouse bundleId prohibition is missing');
assert(contract.includes('mutate live stock in validation'), 'non-mutating validation statement is missing');
assert(contract.includes('[MISSING: owner-approved paid/provider checkout smoke with stock and refund/cancel rollback plan]'), 'paid/provider smoke blocker is missing');
assert(contract.includes('paid/provider bundle checkout smoke beyond the already recorded pending-order reservation and release evidence'), 'paid/provider fail-closed boundary is missing');
assert(contract.includes('transition each active component reservation to `fulfilled`'), 'paid/provider fulfillment stock-effect boundary is missing');
assert(contract.includes('refund/cancel after fulfillment'), 'refund/cancel rollback boundary is missing');

console.log('catalog.bundle.v1 Warehouse component reservation boundary verified');
