import 'reflect-metadata';
import { FulfillmentOrdersController } from '../src/fulfillment/fulfillment-orders.controller';

describe('FulfillmentOrdersController', () => {
  function createController() {
    const fulfillmentOrdersService = {
      findByOrder: jest.fn(async () => ({
        id: '11111111-1111-4111-8111-111111111111',
        orderId: 'order-1',
      })),
      updateStatus: jest.fn(async () => ({
        id: '11111111-1111-4111-8111-111111111111',
        orderId: 'order-1',
        status: 'in_delivery',
      })),
      recordInternalDeliveryStatus: jest.fn(async () => ({
        observation: { id: 'internal-observation-1' },
        fulfillmentOrder: {
          id: '11111111-1111-4111-8111-111111111111',
          orderId: 'order-1',
          status: 'in_delivery',
        },
        statusMutationApplied: true,
      })),
    };
    const providerShipmentCorrelationService = {
      registerCorrelation: jest.fn(async (command) => ({
        id: 'correlation-1',
        ...command,
      })),
    };
    const providerStatusSnapshotAdapterService = {
      recordResolvedAllegroShipmentSnapshot: jest.fn(async () => ({
        id: 'observation-1',
        decision: 'accepted',
        normalizedWarehouseStatus: 'in_delivery',
        centralOrderId: 'order-1',
        idempotencyKey: 'wh-provider-status-ledger:v1:key',
      })),
    };
    const logger = { log: jest.fn() };
    const controller = new FulfillmentOrdersController(
      fulfillmentOrdersService as any,
      providerShipmentCorrelationService as any,
      providerStatusSnapshotAdapterService as any,
      logger as any,
    );
    const request = {
      user: {
        serviceName: 'allegro-service',
      },
    };
    return {
      controller,
      fulfillmentOrdersService,
      providerShipmentCorrelationService,
      providerStatusSnapshotAdapterService,
      logger,
      request,
    };
  }

  it('registers provider shipment correlation for an existing fulfillment order', async () => {
    const { controller, fulfillmentOrdersService, providerShipmentCorrelationService, request } = createController();

    const response = await controller.registerProviderShipmentCorrelation('order-1', {
      provider: 'allegro',
      sourceChannel: 'shipment-status-snapshot',
      accountIdHash: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      externalOrderIdHash: 'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      shipmentIdHash: 'sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      waybillIdHash: 'sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
      reasonCode: 'ALLEGRO_SHIPMENT_CORRELATION_APPROVED',
    }, request as any);

    expect(fulfillmentOrdersService.findByOrder).toHaveBeenCalledWith('order-1');
    expect(providerShipmentCorrelationService.registerCorrelation).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'allegro',
      sourceChannel: 'shipment-status-snapshot',
      centralOrderId: 'order-1',
      fulfillmentOrderId: '11111111-1111-4111-8111-111111111111',
      accountIdHash: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      externalOrderIdHash: 'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      shipmentIdHash: 'sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      waybillIdHash: 'sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
      reasonCode: 'ALLEGRO_SHIPMENT_CORRELATION_APPROVED',
      actor: 'service:allegro-service',
    }));
    expect(response).toEqual(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        id: 'correlation-1',
        centralOrderId: 'order-1',
      }),
    }));
  });

  it('records an Allegro shipment snapshot and applies mapped fulfillment status', async () => {
    const { controller, fulfillmentOrdersService, providerStatusSnapshotAdapterService, request } = createController();
    const snapshot = {
      contract: 'allegro.shipment_status_snapshot.v1',
      source: 'allegro-service',
      channel: 'allegro',
    };

    const response = await controller.recordAllegroShipmentStatusSnapshot(snapshot, request as any);

    expect(providerStatusSnapshotAdapterService.recordResolvedAllegroShipmentSnapshot).toHaveBeenCalledWith(snapshot);
    expect(fulfillmentOrdersService.updateStatus).toHaveBeenCalledWith('order-1', expect.objectContaining({
      status: 'in_delivery',
      reasonCode: 'ALLEGRO_SHIPMENT_STATUS_OBSERVED',
      actor: 'service:allegro-service',
    }));
    expect(response).toEqual(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ statusMutationApplied: true }),
    }));
  });

  it('records duplicate or noop Allegro shipment observations without status mutation', async () => {
    const { controller, fulfillmentOrdersService, providerStatusSnapshotAdapterService, request } = createController();
    providerStatusSnapshotAdapterService.recordResolvedAllegroShipmentSnapshot.mockResolvedValueOnce({
      id: 'observation-duplicate',
      decision: 'duplicate',
      normalizedWarehouseStatus: 'in_delivery',
      centralOrderId: 'order-1',
      idempotencyKey: 'wh-provider-status-ledger:v1:key',
    });

    const response = await controller.recordAllegroShipmentStatusSnapshot({ contract: 'allegro.shipment_status_snapshot.v1' }, request as any);

    expect(fulfillmentOrdersService.updateStatus).not.toHaveBeenCalled();
    expect(response.data.statusMutationApplied).toBe(false);
  });

  it('records internal delivery status through Warehouse-owned provider path', async () => {
    const { controller, fulfillmentOrdersService, request } = createController();

    const response = await controller.recordInternalDeliveryStatus('order-1', {
      statusClass: 'IN_DELIVERY',
      reasonCode: 'WAREHOUSE_INTERNAL_DELIVERY_OBSERVED',
      deliveryReference: 'internal-delivery-proof',
    }, request as any);

    expect(fulfillmentOrdersService.recordInternalDeliveryStatus).toHaveBeenCalledWith('order-1', expect.objectContaining({
      statusClass: 'IN_DELIVERY',
      reasonCode: 'WAREHOUSE_INTERNAL_DELIVERY_OBSERVED',
      deliveryReference: 'internal-delivery-proof',
      actor: 'service:allegro-service',
    }));
    expect(response).toEqual(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ statusMutationApplied: true }),
    }));
  });
});
