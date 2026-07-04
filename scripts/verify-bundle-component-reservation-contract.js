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
const warehouseLiveTargetReadbackRuntime = read('reports/validation/VAL-GOAL-24-warehouse-live-target-readback-runtime-2026-07-04.md');
const approvalPacket = read('docs/contracts/goal24-warehouse-cleanup-approval-packet.md');
const warehouseCleanupApprovalPacket = approvalPacket;
const catalogApprovalPacket = read('/home/ssf/Documents/Github/catalog-microservice/docs/orchestrator/2026-07-03-goal24-paid-provider-smoke-approval-packet.md');
const warehouseCleanupRuntimeValuesConsumption = read('reports/validation/VAL-GOAL-24-warehouse-consume-cleanup-runtime-values-fa88917-59be11e-8bb22e2-9a7c664-2026-07-04.md');
const warehouseHistoricalBlockerCleanup = read('reports/validation/VAL-GOAL-24-warehouse-historical-blocker-cleanup-2026-07-04.md');
const warehouseOrdersNoGoCurrentHeadsConsumption = read('reports/validation/VAL-GOAL-24-warehouse-consume-live-no-go-preflight-9287e3f-cc49c08-d1eef3d-9a7c664-2026-07-04.md');
const ordersNoGoCurrentHeadsConsumption = read('/home/ssf/Documents/Github/orders-microservice/reports/validation/VAL-GOAL-24-orders-consume-goal24-source-only-current-heads-2026-07-04.md');
const paymentsLiveNoGoPreflight = read('/home/ssf/Documents/Github/payments-microservice/reports/validation/VAL-GOAL-24-live-paid-provider-no-go-preflight-2026-07-04.md');
const catalogLiveNoGoPreflightConsumption = read('/home/ssf/Documents/Github/catalog-microservice/reports/validation/VAL-GOAL-24-catalog-consume-live-no-go-preflight-cc49c08-686d49c-2026-07-04.md');
const flipflopDurableMigrationReadiness = read('/home/ssf/Documents/Github/flipflop/implementation-goals/GOAL-24-durable-bundleid-checkout-migration-readiness.md');
const warehouseCurrentPaymentsOrdersCatalogHeads = read('reports/validation/VAL-GOAL-24-warehouse-consume-current-payments-orders-catalog-heads-2026-07-04.md');
const paymentsPreSideEffectPacket = read('/home/ssf/Documents/Github/payments-microservice/docs/orchestrator/2026-07-04-goal24-pre-side-effect-runtime-execution-packet.md');
const ordersPaymentsPreSideEffectConsumption = read('/home/ssf/Documents/Github/orders-microservice/reports/validation/VAL-GOAL-24-orders-consume-payments-pre-side-effect-packet-445c4e7-2026-07-04.md');
const catalogCurrentPaymentsOrdersHeads = read('/home/ssf/Documents/Github/catalog-microservice/reports/validation/VAL-GOAL-24-catalog-consume-current-payments-orders-heads-2026-07-04.md');


const warehouseNoGoOrchestratorStatus = read('docs/orchestrator/STATUS.md');
const warehouseOrdersNoGoCurrentHeadsMarker = '[RESOLVED/NARROWED: Warehouse consumed Orders 9287e3f live no-go consumer sync, Payments cc49c08 live no-go preflight, Catalog d1eef3d no-go consumer sync, and FlipFlop 9a7c664 durable migration provider marker as source-governance inputs only; Warehouse stock/reservation effects remain hard-stopped until exact selected reservation lookup state, selected order/payment/provider hashes, Orders sideEffectsHandled acknowledgements, provider proof or unpaid acknowledgement, channel acknowledgement, and final redacted evidence exist]';
const implementationState = read('docs/IMPLEMENTATION_STATE.md');
const warehouseValidationReport = read('docs/intent-preservation/validation-reports/VAL-WH-G24-BUNDLE-COMPONENT-RESERVATION.md');
for (const [label, source] of [
  ['Warehouse Orders no-go current-head consumption report', warehouseOrdersNoGoCurrentHeadsConsumption],
  ['orchestrator status', warehouseNoGoOrchestratorStatus],
  ['implementation state', implementationState],
  ['Warehouse validation report', warehouseValidationReport],
  ['Warehouse cleanup approval packet', warehouseCleanupApprovalPacket],
]) {
  assertIncludes(source, warehouseOrdersNoGoCurrentHeadsMarker, `${label} missing Warehouse Orders no-go current-head marker`);
  assertIncludes(source, '[MISSING: exact selected Warehouse reservation lookup state for cleanup]', `${label} missing selected Warehouse lookup blocker`);
  assertIncludes(source, '[MISSING: exact Orders target order hash/state, cancellation actor, approval id, safe reason code, idempotency key, and sideEffectsHandled payment|warehouse|notification|crm|channel acknowledgements for the future smoke]', `${label} missing exact Orders runtime packet blocker`);
  assertIncludes(source, '[MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]', `${label} missing final evidence blocker`);
  assertIncludes(source, 'Warehouse must not infer reserve, release, fulfill, cancel, return, expire, restock, decrement, or reservation cleanup from Payments refund state, Orders no-go state, provider state, Auth token state, Catalog bundle identity, or channel cleanup state.', `${label} missing no stock inference boundary`);
  assertIncludes(source, 'A Payments refund alone is not Warehouse return evidence.', `${label} missing refund-not-return boundary`);
  for (const boundary of ['mutation: false', 'warehouse_reservation: false', 'warehouse_mutation: false', 'orders_route_invocation: false', 'provider_call: false', 'secret_output: false']) {
    assertIncludes(source, boundary, `${label} missing boundary ${boundary}`);
  }
}
for (const marker of [
  '[RESOLVED/NARROWED: Orders consumed Payments cc49c08 live no-go preflight, Catalog d1eef3d live no-go preflight consumption, Warehouse 686d49c blocker wording, and FlipFlop 9a7c664 durable migration provider marker as source-governance inputs only; runtime Orders route invocation and cleanup side effects remain blocked]',
  '[MISSING: exact Orders target order hash/state, cancellation actor, approval id, safe reason code, idempotency key, and sideEffectsHandled payment|warehouse|notification|crm|channel acknowledgements for the future smoke]',
  'Orders must not infer Warehouse stock effects from Payments refund state',
]) {
  assertIncludes(ordersNoGoCurrentHeadsConsumption, marker, `Orders no-go current-head consumption missing ${marker}`);
}
for (const marker of [
  'status: runtime-ready-but-side-effect-hard-stopped',
  'Decision: `block` before checkout/payment/provider side effects.',
  '[MISSING: deterministic Warehouse component reservation state for cleanup]',
  'warehouse_mutation: false',
]) {
  assertIncludes(paymentsLiveNoGoPreflight, marker, `Payments live no-go preflight missing ${marker}`);
}
for (const marker of [
  '[RESOLVED/NARROWED: Catalog consumed Payments cc49c08 live no-go preflight and Warehouse 686d49c blocker wording sync; runtime deployments are ready but paid/provider side effects remain hard-stopped until bank/refund authority, exact future smoke identities, Orders sideEffectsHandled acknowledgements, deterministic Warehouse reservation lookup state, channel acknowledgement, and final redacted evidence exist]',
  'Catalog must not infer stock reservation, release, cancel, return, expire, or fulfillment effects from Payments refund state',
]) {
  assertIncludes(catalogLiveNoGoPreflightConsumption, marker, `Catalog no-go consumption missing ${marker}`);
}
for (const marker of [
  'runtime_progression: source-rollout-enabled-paid-provider-blocked',
  '[RESOLVED/NARROWED: FlipFlop source rollout maps durable catalog.bundle.v1 bundleId into central Orders bundleEvidence without changing totals, stock identity, or provider state]',
]) {
  assertIncludes(flipflopDurableMigrationReadiness, marker, `FlipFlop durable migration readiness missing ${marker}`);
}


const goal24CurrentHeadVerifierSync = read('reports/validation/VAL-GOAL-24-current-head-verifier-sync-2026-07-04.md');
const orchestratorStatus = read('docs/orchestrator/STATUS.md');
const goal24CurrentHeadMarker = '[RESOLVED/NARROWED: Goal 24 current-head verifier sync GOAL24-CURRENT-HEADS-2026-07-04H requires Auth c389c1e, Payments 0207876 docs: sync goal24 fiobanka runtime image evidence, Catalog 0e37b4c docs: sync goal24 catalog payments runtime image evidence, FlipFlop 1113b9e docs: consume goal24 auth token proof in verifier, Orders 154c5cd docs: sync goal24 orders payments runtime image evidence, and Warehouse 0289dc2 docs: require goal24 current heads in verifier as the pre-H validation input heads; the H sync commits and later source-only status commits are validation evidence only; historical Wave A-G markers are evidence only; runtime side effects remain blocked]';
for (const [label, source] of [
  ['current-head verifier sync report', goal24CurrentHeadVerifierSync],
  ['orchestrator status', orchestratorStatus],
]) {
  if (!source.includes(goal24CurrentHeadMarker)) {
    throw new Error(label + ' missing Goal 24 current-head verifier sync marker');
  }
}

const narrowedAuthBlockers = [
  '[MISSING: fresh Auth actor-bound token generated through the Auth c389c1e no-print/no-decode/no-persist pattern for the exact guarded discount-fixture step]',
  '[MISSING: sanitized auth/admin evidence path for guarded discount-code generation using the fresh selected actor-bound token]',
];
for (const marker of narrowedAuthBlockers) {
  for (const [label, source] of [
    ['current-head verifier sync report', goal24CurrentHeadVerifierSync],
    ['orchestrator status', orchestratorStatus],
  ]) {
    assertIncludes(source, marker, label + ' missing narrowed Auth blocker: ' + marker);
  }
}

const staleAuthBlockers = [
  '[MISSING: approved token source path, such as an on-host token file path or in-memory handoff, with explicit no-print/no-decode/no-persist handling]',
  '[MISSING: confirmation that the token belongs to actor hash 4215870ba488de17 and carries app:flipflop-service:admin or global:superadmin]',
];
for (const marker of staleAuthBlockers) {
  for (const [label, source] of [
    ['current-head verifier sync report', goal24CurrentHeadVerifierSync],
    ['orchestrator status', orchestratorStatus],
  ]) {
    assert(!source.includes(marker), label + ' contains stale broad Auth blocker: ' + marker);
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
  '[RESOLVED/NARROWED: Orders/Payments completed|failed|cancelled source mapping plus Orders cancellation cleanup gate are source-defined; runtime remains blocked on exact provider proof, target order hash/state, named actor, side-effect acknowledgements, Warehouse live readback, bounded final approval, and exact selected reservation lookup state]',
  'Paid Bundle Cleanup Operation Matrix',
  'Reserved-only `active` hold, no stock decrement',
  'Approved Warehouse operation',
  'use Warehouse `release` for reserved-only component lines before fulfillment',
  'use Warehouse `cancel` for fulfilled/stock-decremented component lines only when the approved rollback event is order/provider cancellation',
  'use Warehouse `return` for fulfilled/stock-decremented component lines only when the approved rollback event is a return workflow',
  'use line-by-line mixed cleanup for partial failures',
  'timeout/expiry behavior',
  '[RESOLVED/NARROWED: Warehouse owner-approved cleanup operation for reserved-only, fulfilled/stock-decremented, return, partial component failure, and timeout component-line states; candidate max quantity is source-documented from Catalog packet, while exact selected reservation lookup state remains missing]',
  '[MISSING: exact selected Warehouse reservation lookup state for cleanup]',
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
  '[RESOLVED/NARROWED: Warehouse hold/release duration is owner-approved for the bounded Goal 24 smoke as 15 minutes source-default TTL or shorter caller-supplied expiresAt]; [RESOLVED/NARROWED: final owner approval before live Warehouse reservation mutation is bounded to one Goal 24 component-line smoke attempt with max quantity 1 per component after live readback]; [MISSING: exact selected Warehouse reservation lookup state for cleanup]',
  'Paid Bundle Cleanup Semantics Refresh',
  'Reserved-only active hold before fulfillment',
  'Fulfilled/stock-decremented cancellation rollback',
  'Fulfilled/stock-decremented return workflow',
  'Mixed active and fulfilled partial failure',
  'Reserved/Timeout Cleanup Narrowing',
  'Timeout state',
  '[RESOLVED/NARROWED: candidate target component stock rows and max component quantity are source-documented from Catalog packet]; [RESOLVED/NARROWED: live current target row readback at execution time captured through protected Warehouse API without mutation]; [RESOLVED/NARROWED: Warehouse hold/release duration is owner-approved for the bounded Goal 24 smoke as 15 minutes source-default TTL or shorter caller-supplied expiresAt]; [RESOLVED/NARROWED: final owner approval before live Warehouse reservation mutation is bounded to one Goal 24 component-line smoke attempt with max quantity 1 per component after live readback]; [MISSING: exact selected Warehouse reservation lookup state for cleanup]',
  '[RESOLVED/NARROWED: Warehouse owner-approved cleanup operation for reserved-only, fulfilled/stock-decremented, return, partial component failure, and timeout component-line states; candidate max quantity is source-documented from Catalog packet, while exact selected reservation lookup state remains missing]',
];
for (const marker of validationMarkers) {
  assertIncludes(validation, marker, `validation marker is missing: ${marker}`);
}


const approvalPacketMarkers = [
  'WH-G24-WAREHOUSE-CLEANUP-APPROVAL-PACKET',
  '[RESOLVED/NARROWED: Warehouse hold/release duration is owner-approved for the bounded Goal 24 smoke as 15 minutes source-default TTL or shorter caller-supplied expiresAt]; [RESOLVED/NARROWED: final owner approval before live Warehouse reservation mutation is bounded to one Goal 24 component-line smoke attempt with max quantity 1 per component after live readback]; [MISSING: exact selected Warehouse reservation lookup state for cleanup]',
  '[MISSING: owner-approved operation for reserved-only, fulfilled/stock-decremented, return, partial component failure, and timeout states, including max quantity and hold/release window]',
  '[MISSING: owner-approved post-fulfillment cancellation/return workflow that maps a Payments refund or correction to Orders and Warehouse without inferring stock effects]',
  'A refund alone is not inventory-return evidence',
  'Do not fulfill Warehouse reservations unless Orders receives a Payments-owned completed status through the approved `orders.payment-status.v1` path.',
  'Do not release fulfilled reservations. Use `release` only for active holds before stock decrement.',
  'Treat the 15-minute default reservation TTL as a source implementation fact only',
  'Do not call Warehouse `cancel` after fulfillment unless the approved event is order/provider cancellation or reversal',
  'Do not call Warehouse `return` after fulfillment unless the approved event is an inventory-return workflow.',
  '[MISSING: exact selected Warehouse reservation lookup state for cleanup]',
  'Agent-Ready Approval Request',
  'Merge order: Payments provider evidence, Orders correction approval, Warehouse cleanup packet, channel/canary dry-run, final integration smoke.',
];
for (const marker of approvalPacketMarkers) {
  assertIncludes(approvalPacket, marker, `approval packet marker is missing: ${marker}`);
}

const cleanupRefreshMarkers = [
  'Warehouse Cleanup Approval Packet Refresh',
  '[RESOLVED/NARROWED: Warehouse hold/release duration is owner-approved for the bounded Goal 24 smoke as 15 minutes source-default TTL or shorter caller-supplied expiresAt]; [RESOLVED/NARROWED: final owner approval before live Warehouse reservation mutation is bounded to one Goal 24 component-line smoke attempt with max quantity 1 per component after live readback]; [MISSING: exact selected Warehouse reservation lookup state for cleanup]` remains unresolved',
  '[MISSING: owner-approved post-fulfillment cancellation/return workflow that maps a Payments refund or correction to Orders and Warehouse without inferring stock effects]` remains unresolved',
  'It grants no runtime permission.',
  'Reserved/Timeout Cleanup Narrowing',
  '[RESOLVED/NARROWED: Warehouse owner-approved cleanup operation for reserved-only, fulfilled/stock-decremented, return, partial component failure, and timeout component-line states; candidate max quantity is source-documented from Catalog packet, while exact selected reservation lookup state remains missing]',
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
  '[RESOLVED/NARROWED: owner-approved Warehouse stock decrement/fulfillment rollback criteria for paid bundle smoke at source-policy level; exact selected reservation lookup state remains missing]',
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
  '[RESOLVED/NARROWED: candidate target component stock rows and max component quantity are source-documented from Catalog packet]; [RESOLVED/NARROWED: live current target row readback at execution time captured through protected Warehouse API without mutation]; [RESOLVED/NARROWED: Warehouse hold/release duration is owner-approved for the bounded Goal 24 smoke as 15 minutes source-default TTL or shorter caller-supplied expiresAt]; [RESOLVED/NARROWED: final owner approval before live Warehouse reservation mutation is bounded to one Goal 24 component-line smoke attempt with max quantity 1 per component after live readback]; [MISSING: exact selected Warehouse reservation lookup state for cleanup]',
  '[RESOLVED/NARROWED: candidate target component stock rows and max component quantity are source-documented from Catalog packet]',
  '[RESOLVED/NARROWED: live current target row readback at execution time captured through protected Warehouse API without mutation]',
  '[RESOLVED/NARROWED: Warehouse hold/release duration is owner-approved for the bounded Goal 24 smoke as 15 minutes source-default TTL or shorter caller-supplied expiresAt]; [MISSING: exact selected Warehouse reservation lookup state for cleanup]',
  '[RESOLVED/NARROWED: final owner approval before live Warehouse reservation mutation is bounded to one Goal 24 component-line smoke attempt with max quantity 1 per component after live readback]',
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
  '[RESOLVED/NARROWED: Warehouse hold/release duration is owner-approved for the bounded Goal 24 smoke as 15 minutes source-default TTL or shorter caller-supplied expiresAt]; [RESOLVED/NARROWED: final owner approval before live Warehouse reservation mutation is bounded to one Goal 24 component-line smoke attempt with max quantity 1 per component after live readback]; [MISSING: exact selected Warehouse reservation lookup state for cleanup]` remains unresolved',
  'No aggregate bundle reservation, synthetic bundle SKU stock, or aggregate bundle cleanup operation is approved.',
];
for (const marker of holdWindowPreservationMarkers) {
  assertIncludes(validation, marker, `hold-window preservation marker is missing: ${marker}`);
}

const holdWindowApproval004CommonMarkers = [
  '[RESOLVED/NARROWED: Warehouse hold/release duration is owner-approved for the bounded Goal 24 smoke as 15 minutes source-default TTL or shorter caller-supplied expiresAt]',
  '[RESOLVED/NARROWED: final owner approval before live Warehouse reservation mutation is bounded to one Goal 24 component-line smoke attempt with max quantity 1 per component after live readback]',
  '[RESOLVED/NARROWED: live current target row readback at execution time captured through protected Warehouse API without mutation]',
  '[MISSING: exact selected Warehouse reservation lookup state for cleanup]',
  '[MISSING: Payments provider proof and bank/refund authority before fulfilled cleanup]',
  '[MISSING: exact Orders target order hash/state and sideEffectsHandled acknowledgements]',
  '[MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]',
  'No aggregate bundle reservation, synthetic bundle SKU stock, or aggregate bundle cleanup operation is approved.',
];
assertIncludes(approvalPacket, 'Owner Approval Intake 004 - Bounded Warehouse Hold Window', 'approval packet missing hold-window approval 004 heading');
assertIncludes(validation, 'Owner Approval Intake 004 Warehouse Hold Window Narrowing', 'validation missing hold-window approval 004 heading');
for (const marker of holdWindowApproval004CommonMarkers) {
  assertIncludes(approvalPacket, marker, `approval packet missing hold-window approval 004 marker: ${marker}`);
  assertIncludes(validation, marker, `validation missing hold-window approval 004 marker: ${marker}`);
}
for (const [label, source] of [
  ['implementation state', read('docs/IMPLEMENTATION_STATE.md')],
  ['orchestrator status', read('docs/orchestrator/STATUS.md')],
]) {
  assertIncludes(source, '[RESOLVED/NARROWED: Warehouse hold/release duration is owner-approved for the bounded Goal 24 smoke as 15 minutes source-default TTL or shorter caller-supplied expiresAt]', `${label} missing hold-window approval 004 duration marker`);
  assertIncludes(source, '[RESOLVED/NARROWED: final owner approval before live Warehouse reservation mutation is bounded to one Goal 24 component-line smoke attempt with max quantity 1 per component after live readback]', `${label} missing hold-window approval 004 final mutation marker`);
  assertIncludes(source, '[RESOLVED/NARROWED: live current target row readback at execution time captured through protected Warehouse API without mutation]', `${label} missing live readback hard stop after approval 004`);
  assertIncludes(source, '[MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]', `${label} missing final evidence hard stop after approval 004`);
}



const cleanupRuntimeValuesMarker = '[RESOLVED/NARROWED: Warehouse consumed Catalog fa88917, Payments 59be11e, Orders 8bb22e2, and FlipFlop 9a7c664 cleanup runtime-values sync; hold duration and one-attempt final bounded reservation approval are source-defined for packet planning only, while exact selected reservation lookup state remains missing]';
for (const [label, source] of [
  ['cleanup runtime-values report', warehouseCleanupRuntimeValuesConsumption],
  ['implementation state', read('docs/IMPLEMENTATION_STATE.md')],
  ['orchestrator status', read('docs/orchestrator/STATUS.md')],
  ['warehouse cleanup approval packet', approvalPacket],
]) {
  assertIncludes(source, cleanupRuntimeValuesMarker, `${label} missing Warehouse cleanup runtime-values marker`);
  assertIncludes(source, '[MISSING: exact selected Warehouse reservation lookup state for cleanup]', `${label} missing selected Warehouse reservation lookup blocker`);
  assertIncludes(source, '[MISSING: exact selected Orders cleanup packet runtime values and sideEffectsHandled acknowledgements]', `${label} missing selected Orders runtime-values blocker`);
  assertIncludes(source, 'Warehouse must not infer stock effects from Payments refund state', `${label} missing no-refund-inference boundary`);
}
for (const boundary of [
  'mutation: false',
  'provider_call: false',
  'orders_mutation: false',
  'warehouse_mutation: false',
  'warehouse_cleanup: false',
  'db_write: false',
  'secret_output: false',
  'raw_customer_or_payment_evidence: false',
]) {
  assertIncludes(warehouseCleanupRuntimeValuesConsumption, boundary, `cleanup runtime-values report missing boundary ${boundary}`);
}

assertIncludes(warehouseHistoricalBlockerCleanup, '[RESOLVED/NARROWED: Warehouse historical verifier-read Goal 24 blocker surfaces now consume current cleanup runtime-values facts while preserving exact selected reservation lookup as missing]', 'historical blocker cleanup report missing state marker');
assertIncludes(warehouseHistoricalBlockerCleanup, '[MISSING: exact selected Warehouse reservation lookup state for cleanup]', 'historical blocker cleanup report missing selected Warehouse blocker');
assertIncludes(warehouseHistoricalBlockerCleanup, 'mutation: false', 'historical blocker cleanup report missing no-mutation boundary');

console.log('catalog.bundle.v1 Warehouse component-line rollback boundary verified');


const staleGoal24WarehouseMarkers = [
  '[MISSING: target component stock rows]',
  '[MISSING: Orders/Payments provider-success, provider-cancel, refund, and post-fulfillment cancellation event contract that maps to Warehouse fulfill/cancel/return calls]',
];
const sourceDefinedCrossServiceMappingMarker = '[RESOLVED/NARROWED: Orders/Payments completed|failed|cancelled source mapping plus Orders cancellation cleanup gate are source-defined; runtime remains blocked on exact provider proof, target order hash/state, named actor, side-effect acknowledgements, Warehouse live readback, bounded final approval, and exact selected reservation lookup state]';
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
  assertIncludes(source, '[RESOLVED/NARROWED: live current target row readback at execution time captured through protected Warehouse API without mutation]', `${label} missing resolved live target row readback marker`);
  assertIncludes(source, '[RESOLVED/NARROWED: Warehouse hold/release duration is owner-approved for the bounded Goal 24 smoke as 15 minutes source-default TTL or shorter caller-supplied expiresAt]; [MISSING: exact selected Warehouse reservation lookup state for cleanup]', `${label} missing renewed Warehouse window blocker`);
  assertIncludes(source, '[RESOLVED/NARROWED: final owner approval before live Warehouse reservation mutation is bounded to one Goal 24 component-line smoke attempt with max quantity 1 per component after live readback]', `${label} missing final bounded Warehouse approval marker`);
}

for (const [label, source] of [
  ['live target readback runtime report', warehouseLiveTargetReadbackRuntime],
  ['implementation state', read('docs/IMPLEMENTATION_STATE.md')],
  ['orchestrator status', read('docs/orchestrator/STATUS.md')],
]) {
  assertIncludes(source, '[RESOLVED/NARROWED: live current target row readback at execution time captured through protected Warehouse API without mutation]', `${label} missing live target readback runtime marker`);
  assert(source.includes('mutation=false') || source.includes('mutation: false'), `${label} missing no-mutation evidence`);
}
assertIncludes(warehouseLiveTargetReadbackRuntime, 'token_output: false', 'live target readback runtime report missing token output boundary');
assertIncludes(warehouseLiveTargetReadbackRuntime, 'secret_output: false', 'live target readback runtime report missing secret output boundary');
assertIncludes(warehouseLiveTargetReadbackRuntime, 'raw_ids_printed: false', 'live target readback runtime report missing raw id output boundary');
assertIncludes(warehouseLiveTargetReadbackRuntime, 'reserved=0', 'live target readback runtime report missing reserved count evidence');
assertIncludes(warehouseLiveTargetReadbackRuntime, '[MISSING: exact selected Warehouse reservation lookup state for cleanup]', 'live target readback runtime report must preserve selected Warehouse reservation lookup blocker');
assertIncludes(warehouseLiveTargetReadbackRuntime, '[RESOLVED/NARROWED: final owner approval before live Warehouse reservation mutation is bounded to one Goal 24 component-line smoke attempt with max quantity 1 per component after live readback]', 'live target readback runtime report must preserve final bounded approval marker');

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


const warehouseCurrentPaymentsOrdersCatalogMarker = '[RESOLVED/NARROWED: Warehouse consumed Payments 445c4e7 pre-side-effect packet, Orders 6360baa Payments pre-side-effect consumption, Catalog 1a51b61 current Payments/Orders head sync, FlipFlop 793f8ef owner-authority sync, and Auth c389c1e actor token provisioning proof as source-governance inputs only; Warehouse stock/reservation effects remain hard-stopped until exact selected reservation lookup state, exact future payment/order/provider hashes, Orders sideEffectsHandled acknowledgements, provider proof or unpaid acknowledgement, channel acknowledgement, and final redacted evidence exist]';
for (const [label, source] of [
  ['Warehouse current Payments/Orders/Catalog heads report', warehouseCurrentPaymentsOrdersCatalogHeads],
  ['orchestrator status', warehouseNoGoOrchestratorStatus],
  ['implementation state', implementationState],
  ['Warehouse validation report', warehouseValidationReport],
  ['Warehouse cleanup approval packet', warehouseCleanupApprovalPacket],
]) {
  assertIncludes(source, warehouseCurrentPaymentsOrdersCatalogMarker, `${label} missing current Payments/Orders/Catalog heads marker`);
  for (const blocker of [
    '[MISSING: current side-effect execution window owned by a separate newer integration owner thread]',
    '[MISSING: future paymentId/orderId/variableSymbolHash/providerTransactionHash for exact smoke]',
    '[MISSING: exact Orders target order hash/state, cancellation actor, approval id, safe reason code, idempotency key, and sideEffectsHandled payment|warehouse|notification|crm|channel acknowledgements for the future smoke]',
    '[MISSING: exact selected Warehouse reservation lookup state for cleanup]',
    '[MISSING: final redacted evidence path for required provider, Orders, Warehouse, and channel cleanup proof]',
  ]) {
    assertIncludes(source, blocker, `${label} missing blocker ${blocker}`);
  }
  assertIncludes(source, 'warehouse_mutation: false', `${label} missing Warehouse mutation boundary`);
  assertIncludes(source, 'provider_call: false', `${label} missing provider boundary`);
}
assertIncludes(paymentsPreSideEffectPacket, 'id: PAYMENTS-GOAL24-PRE-SIDE-EFFECT-RUNTIME-EXECUTION-PACKET', 'Payments pre-side-effect packet missing id');
assertIncludes(ordersPaymentsPreSideEffectConsumption, '[RESOLVED/NARROWED: Orders consumed Payments 445c4e7 pre-side-effect runtime execution packet as source-only provider-authenticity handoff evidence; Orders route invocation remains blocked until a separate current side-effect execution window', 'Orders Payments 445c4e7 consumption marker missing');
assertIncludes(catalogCurrentPaymentsOrdersHeads, '[RESOLVED/NARROWED: Catalog consumed Payments 445c4e7 pre-side-effect packet, Orders 6360baa Payments pre-side-effect consumption', 'Catalog current Payments/Orders heads marker missing');
