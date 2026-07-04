const fs = require('fs');
const assert = require('assert/strict');

function read(path) { return fs.readFileSync(path, 'utf8'); }
function requireIncludes(source, needle, label) { assert.ok(source.includes(needle), `${label} missing: ${needle}`); }

const marker = '[RESOLVED/NARROWED: owner-approved Warehouse no-mutation acknowledgement for Goal 24 centralOrderHash 04d7d08c82a07853 accepts the selected read-only lookup state with two expired component reservation rows and zero active/fulfilled/cancelled/released/returned rows; Warehouse cleanup operation matrix is no-op for release/fulfill/cancel/return/expire, and no Warehouse mutation is required for this selected unpaid cancellation path]';
const report = read('reports/validation/VAL-GOAL-24-warehouse-no-mutation-ack-2026-07-04.md');
const state = read('docs/IMPLEMENTATION_STATE.md');
const status = read('docs/orchestrator/STATUS.md');

for (const [label, source] of [['report', report], ['state', state], ['status', status]]) {
  requireIncludes(source, marker, `${label} no-mutation marker`);
}

for (const required of [
  'release: `false`, because activeCount is `0`',
  'fulfill: `false`, because the selected payment/order remains unpaid/pending',
  'cancel: `false`, because active/fulfilled counts are `0`',
  'return: `false`, because delivered/customer-received or inventory-return evidence is absent',
  'expire: `false`, because rows are already expired',
  'sideEffectsHandled.warehouse=true',
  'warehouse_mutation: false',
  'warehouse_cleanup: false',
  'orders_route_invocation: false',
  'raw_ids_printed: false',
]) requireIncludes(report, required, `report evidence ${required}`);

console.log('Goal 24 Warehouse no-mutation acknowledgement verified');
