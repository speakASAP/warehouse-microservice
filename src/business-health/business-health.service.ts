import { Injectable } from '@nestjs/common';
import {
  BusinessHealthAssertion,
  StockAuthorityBusinessHealthEnvelope,
} from './business-health.types';

const CONTRACT_ID = 'warehouse.stock_authority_business_health.v1' as const;
const BUSINESS_HEALTH_CONTRACT = 'stock-order-marketplace-business-health.v1' as const;
const ENDPOINT = '/api/business-health/stock-authority' as const;

const ASSERTIONS: BusinessHealthAssertion[] = [
  {
    id: 'warehouse.stock_authority',
    status: 'warn',
    statement: 'Warehouse is the stock and availability authority for quantity, reserved, and available.',
    sourceEvidence: [
      'docs/governance/PROJECT_INVARIANTS.md',
      'src/stock/stock.service.ts',
    ],
    aggregationMeaning: 'Aggregator must fail closed when Warehouse authority evidence is missing or inconsistent.',
  },
  {
    id: 'warehouse.availability_equation',
    status: 'warn',
    statement: 'Warehouse source enforces available = quantity - reserved and rejects negative stock states.',
    sourceEvidence: [
      'src/stock/stock.entity.ts',
      'src/stock/stock.service.ts#assertValidStockState',
    ],
    aggregationMeaning: 'Product/channel sellability cannot be healthy when the Warehouse equation fails.',
  },
  {
    id: 'warehouse.mutation_context',
    status: 'blocked',
    statement: 'Stock mutations require actor/service identity, reason code, and reference/idempotency context.',
    sourceEvidence: [
      'src/stock/stock.service.ts#validateMutationContext',
      'src/reservations/reservations.controller.ts#getAuthenticatedMutationActor',
    ],
    aggregationMeaning: 'Live synthetic mutation remains blocked until an owner-approved runtime packet exists.',
  },
  {
    id: 'warehouse.reserve_active_hold',
    status: 'warn',
    statement: 'Reserve creates or updates active holds and protects reserved stock until release, expiry, fulfillment, cancel, or return.',
    sourceEvidence: [
      'src/stock/stock.service.ts#reserveStock',
      'src/reservations/stock-reservation.entity.ts',
    ],
    aggregationMeaning: 'Active reservation health is separate from fulfilled stock deduction.',
  },
  {
    id: 'warehouse.release_active_hold',
    status: 'warn',
    statement: 'Release operates on active reservations, restores availability, and is idempotent for completed release state.',
    sourceEvidence: [
      'src/stock/stock.service.ts#unreserveStock',
      'src/reservations/reservations.controller.ts',
    ],
    aggregationMeaning: 'Failed release blocks abandoned-order or failed-payment cleanup readiness.',
  },
  {
    id: 'warehouse.expire_due_hold',
    status: 'warn',
    statement: 'Expiry releases due active reservations through a bounded batch summary with per-row failure evidence.',
    sourceEvidence: [
      'src/reservations/reservations.service.ts#expireDueReservations',
      'src/stock/stock.service.ts#expireReservation',
    ],
    aggregationMeaning: 'Expiry health contributes examined, expired, failed, and cutoff evidence.',
  },
  {
    id: 'warehouse.fulfill_reserved_stock',
    status: 'warn',
    statement: 'Fulfillment consumes an active reservation, decrements reserved and quantity, and records movement/events.',
    sourceEvidence: [
      'src/stock/stock.service.ts#fulfillReservation',
      'docs/contracts/fulfillment-handoff-contract.md',
    ],
    aggregationMeaning: 'Paid order stock effect is healthy only after Warehouse fulfillment succeeds.',
  },
  {
    id: 'warehouse.cancel_or_return_fulfilled_stock',
    status: 'blocked',
    statement: 'Cancel and return stock effects need approved business event and provider/payment context before live proof.',
    sourceEvidence: [
      'src/stock/stock.service.ts#cancelReservation',
      'src/stock/stock.service.ts#returnReservation',
      'docs/contracts/fulfillment-handoff-contract.md',
    ],
    aggregationMeaning: 'Post-fulfillment correction cannot be inferred from Orders or Payments alone.',
  },
  {
    id: 'warehouse.stock_movement_evidence',
    status: 'warn',
    statement: 'Effective stock mutations record append-only movement evidence with type, quantity, reason, actor, and reference.',
    sourceEvidence: [
      'src/stock/stock.service.ts#recordMovement',
      'src/movements/stock-movement.entity.ts',
    ],
    aggregationMeaning: 'Full readiness needs movement evidence or an explicit movement-missing blocker.',
  },
  {
    id: 'warehouse.stock_event_observability',
    status: 'warn',
    statement: 'Effective stock mutations enqueue stock event outbox rows and expose publish/replay status through health paths.',
    sourceEvidence: [
      'src/stock/stock.service.ts#enqueueStockEvents',
      'src/stock/stock-events.service.ts',
    ],
    aggregationMeaning: 'Channel/marketplace health degrades when stock state exists but event evidence is missing or failing.',
  },
  {
    id: 'warehouse.fulfillment_handoff',
    status: 'warn',
    statement: 'Fulfillment handoff is operational pick/pack/dispatch evidence and does not replace reservation stock effects.',
    sourceEvidence: [
      'docs/contracts/fulfillment-handoff-contract.md',
      'src/fulfillment',
    ],
    aggregationMeaning: 'Aggregation must separate fulfillment status from stock lifecycle effects.',
  },
];

const BLOCKERS = [
  '[MISSING: final integration owner approval before any live Warehouse reservation, fulfillment, decrement, cancel, return, expire, release, or stock adjustment smoke]',
  '[MISSING: exact target product/warehouse/order/reservation lookup state captured through an approved read-only Warehouse path immediately before mutation]',
  '[MISSING: approved actor, reasonCode, reference/idempotency policy, max quantity, hold/release window, and rollback/no-rollback expectation]',
  '[MISSING: Orders lifecycle packet proving intended order state and side-effect acknowledgements before Warehouse stock effect]',
  '[MISSING: Payments/provider proof before fulfilled cancellation, refund-like correction, or returned stock effect]',
  '[MISSING: redacted evidence path for provider, Orders, Warehouse, and channel readback after mutation]',
  '[UNKNOWN: concurrent production stock changes between readback and proposed mutation unless protected by an approved runtime packet]',
];

@Injectable()
export class BusinessHealthService {
  getStockAuthorityEnvelope(): StockAuthorityBusinessHealthEnvelope {
    return {
      contractId: CONTRACT_ID,
      businessHealthContract: BUSINESS_HEALTH_CONTRACT,
      service: 'warehouse-microservice',
      endpoint: ENDPOINT,
      generatedAt: new Date().toISOString(),
      mutatesWarehouse: false,
      status: 'blocked',
      assertions: ASSERTIONS,
      evidence: {
        source: 'static-source-contract',
        endpoint: ENDPOINT,
        checkedSourceFiles: [
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
        runtimeDataQueried: false,
        productionDbQueried: false,
        liveSyntheticMutationAuthorized: false,
        validation: {
          command: 'npm run verify:business-health-stock-authority-contract',
          expectedResult: 'passes source-only marker checks without DB, deploy, or Warehouse mutation calls',
          checkedAssertions: ASSERTIONS.length,
        },
      },
      blockers: BLOCKERS,
      nextAction: 'Keep live synthetic Warehouse mutation blocked until the owner-approved runtime packet resolves every blocker.',
      mutationBoundary: {
        mutatesWarehouse: false,
        allowedInThisLane: [
          'publish static source evidence envelope',
          'preserve Warehouse stock authority assertions',
          'report missing runtime facts as blockers',
        ],
        forbiddenInThisLane: [
          'create, reserve, release, fulfill, expire, cancel, return, decrement, increment, or set production stock',
          'query production stock, reservation, movement, outbox, provider, payment, or order rows from this endpoint',
          'deploy or change migrations, Kubernetes manifests, or generated dist artifacts',
        ],
        requiredBeforeLiveMutation: BLOCKERS,
      },
    };
  }
}
