import 'reflect-metadata';
import axios from 'axios';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { StockReservation } from '../src/reservations/stock-reservation.entity';
import { FulfillmentOrderLine } from '../src/fulfillment/fulfillment-order-line.entity';
import { FulfillmentOrder } from '../src/fulfillment/fulfillment-order.entity';
import { FulfillmentOrdersService } from '../src/fulfillment/fulfillment-orders.service';

jest.mock('axios');

describe('FulfillmentOrdersService', () => {
  const fulfilledReservation: Partial<StockReservation> = {
    id: '11111111-1111-4111-8111-111111111111',
    productId: 'catalog-product-1',
    warehouseId: 'warehouse-1',
    orderId: 'order-1',
    quantity: 2,
    status: 'fulfilled',
  };

  const createPayload = {
    orderId: 'order-1',
    orderNumber: 'ORD-1',
    channel: 'flipflop',
    shippingMethod: 'carrier',
    reasonCode: 'PAYMENT_CONFIRMED',
    actor: 'orders-microservice',
    reference: 'checkout-1',
    deliveryAddress: {
      name: 'Customer Name',
      street: 'Main 1',
      city: 'Prague',
      postalCode: '11000',
      country: 'CZ',
    },
    customerContact: {
      name: 'Customer Name',
      email: 'customer@example.test',
      phone: '+420000000000',
    },
    items: [
      {
        orderItemId: 'order-item-1',
        reservationId: '11111111-1111-4111-8111-111111111111',
        productId: 'catalog-product-1',
        sku: 'SKU-1',
        title: 'Catalog Product',
        warehouseId: 'warehouse-1',
        quantity: 2,
      },
    ],
  };

  function createService(options: {
    reservations?: Partial<StockReservation>[];
    existingOrder?: any;
    existingLine?: Partial<FulfillmentOrderLine>;
  } = {}) {
    const fulfillmentOrderRepository = {
      findOne: jest.fn(async ({ where }) => {
        if (options.existingOrder && where.orderId === options.existingOrder.orderId) {
          return options.existingOrder;
        }
        return null;
      }),
      create: jest.fn((data) => data),
      save: jest.fn(async (order) => ({
        id: 'fulfillment-order-1',
        status: 'requested',
        ...order,
        lines: (order.lines || []).map((line, index) => ({
          id: `line-${index + 1}`,
          ...line,
        })),
      })),
    };
    const lineRepository = {
      findOne: jest.fn(async () => options.existingLine ?? null),
      create: jest.fn((data) => data),
    };
    const reservationRepository = {
      find: jest.fn(async () => options.reservations ?? [fulfilledReservation]),
    };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === FulfillmentOrder) return fulfillmentOrderRepository;
        if (entity === FulfillmentOrderLine) return lineRepository;
        if (entity === StockReservation) return reservationRepository;
        throw new Error('unexpected repository');
      }),
    };
    const dataSource = {
      transaction: jest.fn(async (callback) => callback(manager)),
    };
    const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const providerStatusLedgerService = {
      recordObservation: jest.fn(async (command) => ({
        id: 'provider-observation-1',
        decision: command.decision || 'accepted',
        normalizedWarehouseStatus: command.normalizedWarehouseStatus,
        centralOrderId: command.centralOrderId,
        idempotencyKey: command.idempotencyKey,
      })),
    };

    return {
      service: new FulfillmentOrdersService(fulfillmentOrderRepository as any, dataSource as any, logger as any, providerStatusLedgerService as any),
      fulfillmentOrderRepository,
      lineRepository,
      reservationRepository,
      dataSource,
      providerStatusLedgerService,
    };
  }

  it('persists a paid-order warehouse handoff with dispatch address and line items', async () => {
    const { service, fulfillmentOrderRepository } = createService();

    const order = await service.createHandoff(createPayload);

    expect(fulfillmentOrderRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      orderId: 'order-1',
      orderNumber: 'ORD-1',
      channel: 'flipflop',
      status: 'requested',
      shippingMethod: 'carrier',
      deliveryAddress: expect.objectContaining({
        street: 'Main 1',
        city: 'Prague',
        postalCode: '11000',
        country: 'CZ',
      }),
      customerContact: expect.objectContaining({
        email: 'customer@example.test',
        phone: '+420000000000',
      }),
      lines: [
        expect.objectContaining({
          orderItemId: 'order-item-1',
          reservationId: '11111111-1111-4111-8111-111111111111',
          productId: 'catalog-product-1',
          sku: 'SKU-1',
          title: 'Catalog Product',
          warehouseId: 'warehouse-1',
          quantity: 2,
        }),
      ],
    }));
    expect(order.lines).toHaveLength(1);
  });

  it('rejects a handoff line without a reservation id', async () => {
    const { service, fulfillmentOrderRepository } = createService();

    await expect(service.createHandoff({
      ...createPayload,
      items: [{ ...createPayload.items[0], reservationId: '' }],
    })).rejects.toThrow(BadRequestException);

    expect(fulfillmentOrderRepository.save).not.toHaveBeenCalled();
  });

  it('rejects handoff before the referenced reservation is fulfilled', async () => {
    const { service, fulfillmentOrderRepository } = createService({
      reservations: [{ ...fulfilledReservation, status: 'active' }],
    });

    await expect(service.createHandoff(createPayload)).rejects.toThrow('must be fulfilled');

    expect(fulfillmentOrderRepository.save).not.toHaveBeenCalled();
  });

  it('returns the existing row for an equivalent idempotent replay', async () => {
    const existingOrder = {
      id: 'fulfillment-order-1',
      orderId: 'order-1',
      orderNumber: 'ORD-1',
      channel: 'flipflop',
      status: 'requested' as const,
      shippingMethod: 'carrier',
      deliveryAddress: createPayload.deliveryAddress,
      customerContact: createPayload.customerContact,
      lines: [createPayload.items[0]],
    };
    const { service, fulfillmentOrderRepository, reservationRepository } = createService({ existingOrder });

    const order = await service.createHandoff(createPayload);

    expect(order).toBe(existingOrder);
    expect(reservationRepository.find).not.toHaveBeenCalled();
    expect(fulfillmentOrderRepository.save).not.toHaveBeenCalled();
  });

  it('rejects non-equivalent replay for the same central order id', async () => {
    const existingOrder = {
      id: 'fulfillment-order-1',
      orderId: 'order-1',
      orderNumber: 'ORD-1',
      channel: 'flipflop',
      status: 'requested' as const,
      shippingMethod: 'carrier',
      deliveryAddress: createPayload.deliveryAddress,
      customerContact: createPayload.customerContact,
      lines: [createPayload.items[0]],
    };
    const { service } = createService({ existingOrder });

    await expect(service.createHandoff({
      ...createPayload,
      shippingMethod: 'pickup',
    })).rejects.toThrow(ConflictException);
  });

  it('advances fulfillment status and syncs the bounded status to Orders', async () => {
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      ORDERS_SERVICE_URL: 'http://orders-microservice:3203',
      JWT_TOKEN: 'warehouse-token',
    };
    (axios.put as jest.Mock).mockResolvedValue({ data: { success: true } });
    const existingOrder = {
      id: 'fulfillment-order-1',
      orderId: 'order-1',
      status: 'requested' as const,
      lines: [createPayload.items[0]],
    };
    const { service, fulfillmentOrderRepository } = createService({ existingOrder });

    await service.updateStatus('order-1', {
      status: 'collecting',
      reasonCode: 'WAREHOUSE_PICK_STARTED',
      actor: 'warehouse-operator',
      reference: 'pick-1',
    });

    expect(fulfillmentOrderRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      status: 'collecting',
      statusReasonCode: 'WAREHOUSE_PICK_STARTED',
      statusActor: 'warehouse-operator',
      statusReference: 'pick-1',
    }));
    expect(axios.put).toHaveBeenCalledWith(
      'http://orders-microservice:3203/api/orders/order-1/warehouse-fulfillment-status',
      expect.objectContaining({
        status: 'collecting',
        reasonCode: 'WAREHOUSE_PICK_STARTED',
        actor: 'warehouse-operator',
        reference: 'pick-1',
        fulfillmentOrderId: 'fulfillment-order-1',
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-service-name': 'warehouse-microservice',
          'x-internal-service-token': 'warehouse-token',
        }),
      }),
    );
    process.env = originalEnv;
  });

  it('rejects invalid fulfillment status jumps', async () => {
    const existingOrder = {
      id: 'fulfillment-order-1',
      orderId: 'order-1',
      status: 'requested' as const,
      lines: [createPayload.items[0]],
    };
    const { service, fulfillmentOrderRepository } = createService({ existingOrder });

    await expect(service.updateStatus('order-1', {
      status: 'in_delivery',
      reasonCode: 'JUMP',
      actor: 'warehouse-operator',
    })).rejects.toThrow(BadRequestException);

    expect(fulfillmentOrderRepository.save).not.toHaveBeenCalled();
  });

  it('records internal delivery status in the provider ledger and advances fulfillment status', async () => {
    const existingOrder = {
      id: 'fulfillment-order-1',
      orderId: 'order-1',
      status: 'handed_to_delivery' as const,
      lines: [createPayload.items[0]],
    };
    const { service, fulfillmentOrderRepository, providerStatusLedgerService } = createService({ existingOrder });

    const result = await service.recordInternalDeliveryStatus('order-1', {
      statusClass: 'IN_DELIVERY',
      reasonCode: 'WAREHOUSE_INTERNAL_DELIVERY_OBSERVED',
      actor: 'warehouse-operator',
      deliveryReference: 'internal-delivery-proof',
      observedAt: '2026-07-03T12:00:00.000Z',
    });

    expect(providerStatusLedgerService.recordObservation).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'warehouse-internal-delivery',
      sourceChannel: 'internal-delivery-status',
      centralOrderId: 'order-1',
      fulfillmentOrderId: 'fulfillment-order-1',
      normalizedWarehouseStatus: 'in_delivery',
      sourceStatusClass: 'IN_DELIVERY',
      decision: 'accepted',
      sourceMetadata: expect.objectContaining({
        contract: 'warehouse.internal_delivery_status.v1',
        statusClass: 'IN_DELIVERY',
        deliveryReference: 'internal-delivery-proof',
      }),
    }));
    expect(fulfillmentOrderRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      status: 'in_delivery',
      statusReasonCode: 'WAREHOUSE_INTERNAL_DELIVERY_OBSERVED',
      statusActor: 'warehouse-operator',
      statusReference: 'internal-delivery-proof',
    }));
    expect(result.statusMutationApplied).toBe(true);
  });

  it('records UNKNOWN internal delivery status as a no-op observation', async () => {
    const existingOrder = {
      id: 'fulfillment-order-1',
      orderId: 'order-1',
      status: 'handed_to_delivery' as const,
      lines: [createPayload.items[0]],
    };
    const { service, fulfillmentOrderRepository, providerStatusLedgerService } = createService({ existingOrder });

    const result = await service.recordInternalDeliveryStatus('order-1', {
      statusClass: 'UNKNOWN',
      reasonCode: 'WAREHOUSE_INTERNAL_DELIVERY_OBSERVED',
      actor: 'warehouse-operator',
    });

    expect(providerStatusLedgerService.recordObservation).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'warehouse-internal-delivery',
      normalizedWarehouseStatus: 'noop',
      decision: 'noop',
    }));
    expect(fulfillmentOrderRepository.save).not.toHaveBeenCalled();
    expect(result.statusMutationApplied).toBe(false);
  });

  it('keeps cancel and return handoff states explicit without stock mutation calls', async () => {
    const existingOrder = {
      id: 'fulfillment-order-1',
      orderId: 'order-1',
      status: 'requested' as const,
      lines: [createPayload.items[0]],
    };
    const { service, fulfillmentOrderRepository } = createService({ existingOrder });

    await service.cancel('order-1', {
      reasonCode: 'ORDER_CANCELLED',
      actor: 'orders-microservice',
      reference: 'checkout-1',
    });
    expect(fulfillmentOrderRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      status: 'cancelled',
      statusReasonCode: 'ORDER_CANCELLED',
      statusActor: 'orders-microservice',
      statusReference: 'checkout-1',
      cancelledAt: expect.any(Date),
    }));

    existingOrder.status = 'requested';
    await service.returnOrder('order-1', {
      reasonCode: 'ORDER_RETURNED',
      actor: 'orders-microservice',
    });
    expect(fulfillmentOrderRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      status: 'returned',
      statusReasonCode: 'ORDER_RETURNED',
      statusActor: 'orders-microservice',
      returnedAt: expect.any(Date),
    }));
  });
});
