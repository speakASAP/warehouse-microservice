const fs = require('fs');
const assert = require('assert/strict');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}
function requireIncludes(source, needle, label) {
  assert.ok(source.includes(needle), `${label} missing: ${needle}`);
}

const marker = '[RESOLVED/NARROWED: Warehouse selected reservation lookup state is resolved for Goal 24 centralOrderHash 04d7d08c82a07853 as two component reservation rows, both expired, zero active/fulfilled/cancelled/released/returned rows, component quantities 1 and 1, and warehouseHash 797d678626149afa40b76b5ba48971350bc526727553da7e62846f238b711bea; no Warehouse mutation occurred]';
const report = read('reports/validation/VAL-GOAL-24-selected-reservation-lookup-2026-07-04.md');
const state = read('docs/IMPLEMENTATION_STATE.md');
const status = read('docs/orchestrator/STATUS.md');

for (const [label, source] of [['report', report], ['state', state], ['status', status]]) {
  requireIncludes(source, marker, `${label} selected reservation lookup marker`);
}

for (const required of [
  'reservationLookupCount: `2`',
  'expiredCount: `2`',
  'activeCount: `0`',
  'fulfilledCount: `0`',
  'cancelledCount: `0`',
  'releasedCount: `0`',
  'returnedCount: `0`',
  'channel: `flipflop`',
  'release=false because activeCount=0',
  'fulfill=false because selected payment remains unpaid/processing',
  'cancel=false because active/fulfilled counts are 0',
  'return=false because no delivered/customer-received evidence exists',
  '[MISSING: Orders-owned sideEffectsHandled.warehouse acknowledgement for centralOrderHash 04d7d08c82a07853]',
  'warehouse_mutation: false',
  'warehouse_cleanup: false',
  'raw_ids_printed: false',
]) requireIncludes(report + '\n' + state + '\n' + status, required, `selected reservation evidence ${required}`);

console.log('Goal 24 selected reservation lookup verified');
