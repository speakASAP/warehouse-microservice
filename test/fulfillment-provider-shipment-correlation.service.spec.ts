import 'reflect-metadata';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { FulfillmentProviderShipmentCorrelationService } from '../src/fulfillment/fulfillment-provider-shipment-correlation.service';
import { AllegroShipmentStatusSnapshot } from '../src/fulfillment/fulfillment-provider-status-snapshot-adapter.service';

describe('FulfillmentProviderShipmentCorrelationService', () => {
  const snapshot: AllegroShipmentStatusSnapshot = {
    contract: 'allegro.shipment_status_snapshot.v1',
    source: 'allegro-service',
    channel: 'allegro',
    accountId: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    order: {
      localOrderId: 'local-1',
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

  function createService(options: {
    existing?: any;
    matches?: any[];
  } = {}) {
    const repository = {
      findOne: jest.fn(async () => options.existing ?? null),
      find: jest.fn(async () => options.matches ?? []),
      create: jest.fn((data) => data),
      save: jest.fn(async (data) => ({
        id: 'correlation-1',
        ...data,
      })),
    };
    return {
      service: new FulfillmentProviderShipmentCorrelationService(repository as any),
      repository,
    };
  }

  it('registers a sanitized provider shipment correlation', async () => {
    const { service, repository } = createService();
    const sourceReferenceHash = service.buildAllegroSourceReferenceHash(snapshot);

    const correlation = await service.registerCorrelation({
      provider: 'allegro',
      sourceChannel: 'shipment-status-snapshot',
      centralOrderId: 'order-1',
      fulfillmentOrderId: '11111111-1111-4111-8111-111111111111',
      accountIdHash: snapshot.accountId,
      externalOrderIdHash: snapshot.order.externalOrderId,
      shipmentIdHash: snapshot.shipment.shipmentId || undefined,
      waybillIdHash: snapshot.shipment.waybillHash || undefined,
      reasonCode: 'ALLEGRO_SHIPMENT_CORRELATION_APPROVED',
      actor: 'warehouse-microservice',
    });

    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'allegro',
      sourceChannel: 'shipment-status-snapshot',
      centralOrderId: 'order-1',
      fulfillmentOrderId: '11111111-1111-4111-8111-111111111111',
      sourceReferenceHash,
      status: 'active',
      reasonCode: 'ALLEGRO_SHIPMENT_CORRELATION_APPROVED',
      createdBy: 'warehouse-microservice',
    }));
    expect(correlation.sourceReferenceHash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it('returns the existing row for an idempotent registration replay', async () => {
    const existing = {
      id: 'existing-correlation',
      provider: 'allegro',
      sourceChannel: 'shipment-status-snapshot',
      sourceReferenceHash: 'sha256:existing',
      centralOrderId: 'order-1',
      fulfillmentOrderId: '11111111-1111-4111-8111-111111111111',
    };
    const { service, repository } = createService({ existing });

    const correlation = await service.registerCorrelation({
      provider: 'allegro',
      sourceChannel: 'shipment-status-snapshot',
      centralOrderId: 'order-1',
      fulfillmentOrderId: '11111111-1111-4111-8111-111111111111',
      externalOrderIdHash: snapshot.order.externalOrderId,
      reasonCode: 'ALLEGRO_SHIPMENT_CORRELATION_APPROVED',
      actor: 'warehouse-microservice',
    });

    expect(correlation).toBe(existing);
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects an existing hash correlation that points to another fulfillment order', async () => {
    const { service } = createService({
      existing: {
        centralOrderId: 'other-order',
        fulfillmentOrderId: '22222222-2222-4222-8222-222222222222',
      },
    });

    await expect(service.registerCorrelation({
      provider: 'allegro',
      sourceChannel: 'shipment-status-snapshot',
      centralOrderId: 'order-1',
      fulfillmentOrderId: '11111111-1111-4111-8111-111111111111',
      externalOrderIdHash: snapshot.order.externalOrderId,
      reasonCode: 'ALLEGRO_SHIPMENT_CORRELATION_APPROVED',
      actor: 'warehouse-microservice',
    })).rejects.toThrow(ConflictException);
  });

  it('resolves exactly one snapshot correlation for the adapter', async () => {
    const { service, repository } = createService({
      matches: [{
        centralOrderId: 'order-1',
        fulfillmentOrderId: '11111111-1111-4111-8111-111111111111',
      }],
    });

    const correlation = await service.resolveAllegroShipmentSnapshot(snapshot);

    expect(repository.find).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        provider: 'allegro',
        sourceChannel: 'shipment-status-snapshot',
        sourceReferenceHash: service.buildAllegroSourceReferenceHash(snapshot),
        status: 'active',
      }),
      take: 2,
    }));
    expect(correlation).toEqual({
      centralOrderId: 'order-1',
      fulfillmentOrderId: '11111111-1111-4111-8111-111111111111',
    });
  });

  it('fails closed when no correlation exists', async () => {
    const { service } = createService({ matches: [] });

    await expect(service.resolveAllegroShipmentSnapshot(snapshot)).rejects.toThrow(NotFoundException);
  });

  it('fails closed when correlation is ambiguous', async () => {
    const { service } = createService({
      matches: [
        { centralOrderId: 'order-1', fulfillmentOrderId: '11111111-1111-4111-8111-111111111111' },
        { centralOrderId: 'order-2', fulfillmentOrderId: '22222222-2222-4222-8222-222222222222' },
      ],
    });

    await expect(service.resolveAllegroShipmentSnapshot(snapshot)).rejects.toThrow(ConflictException);
  });

  it('rejects raw-looking provider identifiers', async () => {
    const { service, repository } = createService();

    await expect(service.registerCorrelation({
      provider: 'allegro',
      sourceChannel: 'shipment-status-snapshot',
      centralOrderId: 'order-1',
      fulfillmentOrderId: '11111111-1111-4111-8111-111111111111',
      externalOrderIdHash: 'raw-allegro-order-id',
      reasonCode: 'ALLEGRO_SHIPMENT_CORRELATION_APPROVED',
      actor: 'warehouse-microservice',
    })).rejects.toThrow(BadRequestException);

    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });
});
