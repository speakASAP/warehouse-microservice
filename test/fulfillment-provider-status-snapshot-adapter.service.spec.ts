import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import {
  AllegroShipmentStatusSnapshot,
  FulfillmentProviderStatusSnapshotAdapterService,
} from '../src/fulfillment/fulfillment-provider-status-snapshot-adapter.service';

describe('FulfillmentProviderStatusSnapshotAdapterService', () => {
  const snapshot: AllegroShipmentStatusSnapshot = {
    contract: 'allegro.shipment_status_snapshot.v1',
    source: 'allegro-service',
    channel: 'allegro',
    accountId: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    order: {
      localOrderId: 'allegro-local-order-1',
      externalOrderId: 'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      centralOrderId: 'order-1',
    },
    shipment: {
      shipmentId: 'sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      carrierId: 'DPD',
      waybillHash: 'sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
      packageCount: 1,
      latestStatus: 'IN_TRANSIT',
      latestStatusAt: '2025-07-03T10:45:00.000Z',
      trackingUpdatedAt: '2025-07-03T10:46:00.000Z',
    },
    sourceRead: {
      shipmentsEndpoint: '/order/checkout-forms/{id}/shipments',
      trackingEndpoint: '/order/carriers/{carrierId}/tracking',
      shipmentManagementEndpoint: 'not_used',
      readAt: '2025-07-03T10:47:00.000Z',
      status: 'AVAILABLE',
      reason: null,
    },
    idempotencyKey: 'allegro.shipment-status:v1:account:order:DPD:waybill',
  };

  function createService() {
    const ledgerService = {
      recordObservation: jest.fn(async (command) => ({
        id: 'observation-1',
        ...command,
      })),
    };
    const correlationService = {
      resolveAllegroShipmentSnapshot: jest.fn(async () => ({
        centralOrderId: 'order-1',
        fulfillmentOrderId: '11111111-1111-4111-8111-111111111111',
      })),
    };
    return {
      service: new FulfillmentProviderStatusSnapshotAdapterService(ledgerService as any, correlationService as any),
      ledgerService,
      correlationService,
    };
  }

  it('maps a sanitized Allegro in-transit snapshot into a Warehouse ledger observation', async () => {
    const { service, ledgerService } = createService();

    await service.recordAllegroShipmentSnapshot(snapshot, {
      centralOrderId: 'order-1',
      fulfillmentOrderId: '11111111-1111-4111-8111-111111111111',
    });

    expect(ledgerService.recordObservation).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'allegro',
      sourceChannel: 'shipment-status-snapshot',
      centralOrderId: 'order-1',
      fulfillmentOrderId: '11111111-1111-4111-8111-111111111111',
      normalizedWarehouseStatus: 'in_delivery',
      sourceStatusClass: 'IN_TRANSIT',
      statusObservedAt: '2025-07-03T10:45:00.000Z',
      sourceUpdatedAt: '2025-07-03T10:46:00.000Z',
      observedAt: '2025-07-03T10:47:00.000Z',
      decision: 'accepted',
      rejectionReason: undefined,
      sourceMetadata: expect.objectContaining({
        accountIdHash: snapshot.accountId,
        externalOrderIdHash: snapshot.order.externalOrderId,
        shipmentIdHash: snapshot.shipment.shipmentId,
        waybillIdHash: snapshot.shipment.waybillHash,
      }),
    }));
    const command = ledgerService.recordObservation.mock.calls[0][0];
    expect(command.idempotencyKey).toContain('wh-provider-status-ledger:v1');
    expect(command.sourceReferenceHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(command.contentHash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it.each([
    ['PENDING', 'noop'],
    ['UNKNOWN', 'noop'],
    ['RELEASED_FOR_DELIVERY', 'in_delivery'],
    ['AVAILABLE_FOR_PICKUP', 'in_delivery'],
    ['NOTICE_LEFT', 'in_delivery'],
    ['ISSUE', 'not_delivered'],
    ['DELIVERED', 'delivered'],
    ['RETURNED', 'returned'],
  ] as const)('maps Allegro %s to Warehouse %s', async (latestStatus, warehouseStatus) => {
    const { service, ledgerService } = createService();

    await service.recordAllegroShipmentSnapshot({
      ...snapshot,
      shipment: {
        ...snapshot.shipment,
        latestStatus,
      },
    }, {
      centralOrderId: 'order-1',
      fulfillmentOrderId: '11111111-1111-4111-8111-111111111111',
    });

    expect(ledgerService.recordObservation).toHaveBeenCalledWith(expect.objectContaining({
      normalizedWarehouseStatus: warehouseStatus,
      sourceStatusClass: latestStatus,
    }));
  });

  it('records unavailable source reads as noop diagnostics', async () => {
    const { service, ledgerService } = createService();

    await service.recordAllegroShipmentSnapshot({
      ...snapshot,
      sourceRead: {
        ...snapshot.sourceRead,
        status: 'UNAVAILABLE',
        reason: '[MISSING: OAuth scope or account permission for shipment tracking read]',
      },
    }, {
      centralOrderId: 'order-1',
      fulfillmentOrderId: '11111111-1111-4111-8111-111111111111',
    });

    expect(ledgerService.recordObservation).toHaveBeenCalledWith(expect.objectContaining({
      normalizedWarehouseStatus: 'noop',
      decision: 'noop',
      rejectionReason: 'SOURCE_READ_UNAVAILABLE',
    }));
  });

  it('resolves snapshot correlation before recording to the ledger', async () => {
    const { service, ledgerService, correlationService } = createService();

    await service.recordResolvedAllegroShipmentSnapshot(snapshot);

    expect(correlationService.resolveAllegroShipmentSnapshot).toHaveBeenCalledWith(snapshot);
    expect(ledgerService.recordObservation).toHaveBeenCalledWith(expect.objectContaining({
      centralOrderId: 'order-1',
      fulfillmentOrderId: '11111111-1111-4111-8111-111111111111',
    }));
  });

  it('fails closed when fulfillment correlation is missing', async () => {
    const { service, ledgerService } = createService();

    await expect(service.recordAllegroShipmentSnapshot(snapshot, {
      centralOrderId: '',
      fulfillmentOrderId: '',
    })).rejects.toThrow(BadRequestException);

    expect(ledgerService.recordObservation).not.toHaveBeenCalled();
  });

  it('rejects raw tracking/provider/customer fields before ledger write', async () => {
    const { service, ledgerService } = createService();

    await expect(service.recordAllegroShipmentSnapshot({
      ...snapshot,
      shipment: {
        ...snapshot.shipment,
        trackingNumber: 'raw-tracking-number',
      } as any,
    }, {
      centralOrderId: 'order-1',
      fulfillmentOrderId: '11111111-1111-4111-8111-111111111111',
    })).rejects.toThrow(BadRequestException);

    expect(ledgerService.recordObservation).not.toHaveBeenCalled();
  });

  it('rejects raw-looking identity values', async () => {
    const { service, ledgerService } = createService();

    await expect(service.recordAllegroShipmentSnapshot({
      ...snapshot,
      order: {
        ...snapshot.order,
        externalOrderId: 'raw-allegro-order-id',
      },
    }, {
      centralOrderId: 'order-1',
      fulfillmentOrderId: '11111111-1111-4111-8111-111111111111',
    })).rejects.toThrow(BadRequestException);

    expect(ledgerService.recordObservation).not.toHaveBeenCalled();
  });
});
