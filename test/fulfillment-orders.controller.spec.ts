import 'reflect-metadata';
import { FulfillmentOrdersController } from '../src/fulfillment/fulfillment-orders.controller';

describe('FulfillmentOrdersController', () => {
  function createController() {
    const fulfillmentOrdersService = {
      findByOrder: jest.fn(async () => ({
        id: '11111111-1111-4111-8111-111111111111',
        orderId: 'order-1',
      })),
    };
    const providerShipmentCorrelationService = {
      registerCorrelation: jest.fn(async (command) => ({
        id: 'correlation-1',
        ...command,
      })),
    };
    const logger = { log: jest.fn() };
    const controller = new FulfillmentOrdersController(
      fulfillmentOrdersService as any,
      providerShipmentCorrelationService as any,
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
});
