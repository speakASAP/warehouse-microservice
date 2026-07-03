import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  FulfillmentProviderStatusLedgerService,
  ProviderStatusObservationCommand,
} from './fulfillment-provider-status-ledger.service';
import { FulfillmentProviderStatusObservation } from './fulfillment-provider-status-observation.entity';
import { FulfillmentOrderStatus } from './fulfillment-order.entity';

export type AllegroShipmentSnapshotStatus =
  | 'PENDING'
  | 'IN_TRANSIT'
  | 'RELEASED_FOR_DELIVERY'
  | 'AVAILABLE_FOR_PICKUP'
  | 'NOTICE_LEFT'
  | 'ISSUE'
  | 'DELIVERED'
  | 'RETURNED'
  | 'UNKNOWN';

export type AllegroShipmentSourceReadStatus = 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';

export interface AllegroShipmentStatusSnapshot {
  contract: 'allegro.shipment_status_snapshot.v1';
  source: 'allegro-service';
  channel: 'allegro';
  accountId: string;
  order: {
    localOrderId: string | null;
    externalOrderId: string;
    centralOrderId: string | null;
  };
  shipment: {
    shipmentId: string | null;
    carrierId: string | null;
    waybillHash: string | null;
    packageCount: number;
    latestStatus: AllegroShipmentSnapshotStatus;
    latestStatusAt: string | null;
    trackingUpdatedAt: string | null;
  };
  sourceRead: {
    shipmentsEndpoint: '/order/checkout-forms/{id}/shipments';
    trackingEndpoint: '/order/carriers/{carrierId}/tracking';
    shipmentManagementEndpoint: '/shipment-management/shipments/{shipmentId}' | 'not_used';
    readAt: string;
    status: AllegroShipmentSourceReadStatus;
    reason: string | null;
  };
  idempotencyKey: string;
}

export interface FulfillmentProviderSnapshotCorrelation {
  centralOrderId: string;
  fulfillmentOrderId: string;
}

const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/;
const FORBIDDEN_SNAPSHOT_KEYS = [
  'rawdata',
  'rawpayload',
  'providerpayload',
  'trackingnumber',
  'trackingurl',
  'waybill',
  'buyeremail',
  'buyerlogin',
  'credential',
  'token',
  'customercontact',
  'deliveryaddress',
  'label',
  'document',
  'address',
  'phone',
  'email',
  'receiver',
  'sender',
];

@Injectable()
export class FulfillmentProviderStatusSnapshotAdapterService {
  constructor(
    private readonly ledgerService: FulfillmentProviderStatusLedgerService,
  ) {}

  async recordAllegroShipmentSnapshot(
    snapshot: AllegroShipmentStatusSnapshot,
    correlation: FulfillmentProviderSnapshotCorrelation,
  ): Promise<FulfillmentProviderStatusObservation> {
    const command = this.toAllegroObservationCommand(snapshot, correlation);
    return this.ledgerService.recordObservation(command);
  }

  toAllegroObservationCommand(
    snapshot: AllegroShipmentStatusSnapshot,
    correlation: FulfillmentProviderSnapshotCorrelation,
  ): ProviderStatusObservationCommand {
    this.assertSupportedAllegroSnapshot(snapshot);
    const centralOrderId = this.normalizeRequiredString(correlation?.centralOrderId, 'correlation.centralOrderId');
    const fulfillmentOrderId = this.normalizeRequiredString(correlation?.fulfillmentOrderId, 'correlation.fulfillmentOrderId');

    const normalizedWarehouseStatus = this.mapAllegroStatus(snapshot);
    const sourceReferenceHash = this.hashComposite([
      snapshot.accountId,
      snapshot.order.externalOrderId,
      snapshot.shipment.shipmentId || 'sha256:unknown-shipment',
      snapshot.shipment.waybillHash || 'sha256:unknown-waybill',
    ]);
    const idempotencyKey = [
      'wh-provider-status-ledger:v1',
      snapshot.contract,
      snapshot.idempotencyKey,
      snapshot.shipment.latestStatus,
      snapshot.shipment.latestStatusAt || 'no-status-time',
      snapshot.shipment.trackingUpdatedAt || 'no-tracking-update',
    ].join(':');

    return {
      idempotencyKey,
      contentHash: this.hashStableJson(snapshot),
      provider: 'allegro',
      sourceChannel: 'shipment-status-snapshot',
      centralOrderId,
      fulfillmentOrderId,
      sourceReferenceHash,
      normalizedWarehouseStatus,
      sourceStatusClass: snapshot.shipment.latestStatus,
      statusObservedAt: snapshot.shipment.latestStatusAt || undefined,
      sourceUpdatedAt: snapshot.shipment.trackingUpdatedAt || snapshot.sourceRead.readAt,
      observedAt: snapshot.sourceRead.readAt,
      decision: snapshot.sourceRead.status === 'AVAILABLE' ? 'accepted' : 'noop',
      rejectionReason: snapshot.sourceRead.status === 'AVAILABLE' ? undefined : `SOURCE_READ_${snapshot.sourceRead.status}`,
      sourceMetadata: {
        contract: snapshot.contract,
        accountIdHash: snapshot.accountId,
        externalOrderIdHash: snapshot.order.externalOrderId,
        shipmentIdHash: snapshot.shipment.shipmentId,
        waybillIdHash: snapshot.shipment.waybillHash,
        carrierId: snapshot.shipment.carrierId,
        packageCount: snapshot.shipment.packageCount,
        sourceReadStatus: snapshot.sourceRead.status,
        sourceReadReason: snapshot.sourceRead.reason,
      },
    };
  }

  private mapAllegroStatus(snapshot: AllegroShipmentStatusSnapshot): FulfillmentOrderStatus | 'noop' {
    if (snapshot.sourceRead.status !== 'AVAILABLE') {
      return 'noop';
    }

    const mapping: Record<AllegroShipmentSnapshotStatus, FulfillmentOrderStatus | 'noop'> = {
      PENDING: 'noop',
      UNKNOWN: 'noop',
      IN_TRANSIT: 'in_delivery',
      RELEASED_FOR_DELIVERY: 'in_delivery',
      AVAILABLE_FOR_PICKUP: 'in_delivery',
      NOTICE_LEFT: 'in_delivery',
      ISSUE: 'not_delivered',
      DELIVERED: 'delivered',
      RETURNED: 'returned',
    };
    return mapping[snapshot.shipment.latestStatus] || 'noop';
  }

  private assertSupportedAllegroSnapshot(snapshot: AllegroShipmentStatusSnapshot): void {
    if (!snapshot || typeof snapshot !== 'object') {
      throw new BadRequestException('snapshot is required');
    }
    this.assertSanitizedSnapshot(snapshot);
    this.assertEqual(snapshot.contract, 'allegro.shipment_status_snapshot.v1', 'contract');
    this.assertEqual(snapshot.source, 'allegro-service', 'source');
    this.assertEqual(snapshot.channel, 'allegro', 'channel');
    this.assertHash(snapshot.accountId, 'accountId');
    this.assertHash(snapshot.order?.externalOrderId, 'order.externalOrderId');

    if (snapshot.shipment?.shipmentId) {
      this.assertHash(snapshot.shipment.shipmentId, 'shipment.shipmentId');
    }
    if (snapshot.shipment?.waybillHash) {
      this.assertHash(snapshot.shipment.waybillHash, 'shipment.waybillHash');
    }
    if (!Number.isInteger(snapshot.shipment?.packageCount) || snapshot.shipment.packageCount < 0) {
      throw new BadRequestException('shipment.packageCount must be a non-negative integer');
    }
    this.assertTimestamp(snapshot.sourceRead?.readAt, 'sourceRead.readAt');
    if (snapshot.shipment.latestStatusAt) {
      this.assertTimestamp(snapshot.shipment.latestStatusAt, 'shipment.latestStatusAt');
    }
    if (snapshot.shipment.trackingUpdatedAt) {
      this.assertTimestamp(snapshot.shipment.trackingUpdatedAt, 'shipment.trackingUpdatedAt');
    }
    if (!['AVAILABLE', 'PARTIAL', 'UNAVAILABLE'].includes(snapshot.sourceRead?.status)) {
      throw new BadRequestException('sourceRead.status is not supported');
    }
  }

  private assertSanitizedSnapshot(value: unknown, path = 'snapshot'): void {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((entry, index) => this.assertSanitizedSnapshot(entry, `${path}[${index}]`));
      return;
    }
    if (typeof value !== 'object') return;

    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      const normalizedKey = key.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (FORBIDDEN_SNAPSHOT_KEYS.includes(normalizedKey)) {
        throw new BadRequestException(`${path}.${key} is not allowed in Allegro shipment snapshots`);
      }
      this.assertSanitizedSnapshot(entry, `${path}.${key}`);
    }
  }

  private assertEqual(value: string | undefined, expected: string, fieldName: string): void {
    if (value !== expected) {
      throw new BadRequestException(`${fieldName} must be ${expected}`);
    }
  }

  private assertHash(value: string | undefined | null, fieldName: string): void {
    if (typeof value !== 'string' || !HASH_PATTERN.test(value)) {
      throw new BadRequestException(`${fieldName} must be a sha256 hash`);
    }
  }

  private assertTimestamp(value: string | undefined | null, fieldName: string): void {
    if (typeof value !== 'string' || Number.isNaN(new Date(value).getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid timestamp`);
    }
  }

  private normalizeRequiredString(value: string | undefined, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException(`${fieldName} is required`);
    }
    return value.trim();
  }

  private hashComposite(parts: string[]): string {
    return `sha256:${createHash('sha256').update(parts.join('|')).digest('hex')}`;
  }

  private hashStableJson(value: unknown): string {
    return `sha256:${createHash('sha256').update(this.stableJson(value)).digest('hex')}`;
  }

  private stableJson(value: unknown): string {
    if (Array.isArray(value)) {
      return `[${value.map((entry) => this.stableJson(entry)).join(',')}]`;
    }
    if (value && typeof value === 'object') {
      return `{${Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => `${JSON.stringify(key)}:${this.stableJson(entry)}`)
        .join(',')}}`;
    }
    return JSON.stringify(value);
  }
}
