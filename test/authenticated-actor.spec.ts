import 'reflect-metadata';
import { UnauthorizedException } from '@nestjs/common';
import { getAuthenticatedMutationActor } from '../src/auth/authenticated-actor';
import { StockController } from '../src/stock/stock.controller';
import { ReservationsController } from '../src/reservations/reservations.controller';
import { SupplierReconciliationController } from '../src/suppliers/supplier-reconciliation.controller';

describe('authenticated mutation actor enforcement', () => {
  const request = {
    user: {
      sub: 'auth-user-1',
      email: 'operator@example.com',
      type: 'staff',
      roles: ['global:superadmin'],
    },
  } as any;

  const serviceRequest = {
    user: {
      sub: 'service-subject',
      serviceName: 'orders-microservice',
      roles: ['internal:warehouse-microservice:admin'],
    },
  } as any;

  const catalogServiceRequest = {
    user: {
      sub: 'catalog-warehouse-service',
      serviceName: 'catalog-microservice',
      service: 'catalog-microservice',
      clientId: 'catalog-microservice',
      authMethod: 'auth-service-jwt',
      roles: ['internal:warehouse-microservice:admin'],
    },
  } as any;

  const logger = {
    log: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('derives a non-PII user actor from verified JWT claims', () => {
    expect(getAuthenticatedMutationActor(request)).toBe('auth:staff:auth-user-1');
  });

  it('derives service actor when a verified service identity claim is present', () => {
    expect(getAuthenticatedMutationActor(serviceRequest)).toBe('service:orders-microservice');
  });

  it('derives Catalog service actor from the approved Warehouse service-principal shape', () => {
    expect(getAuthenticatedMutationActor(catalogServiceRequest)).toBe('service:catalog-microservice');
  });

  it('fails closed when JWT verification did not attach an authenticated subject', () => {
    expect(() => getAuthenticatedMutationActor({ user: { roles: ['global:superadmin'] } } as any)).toThrow(UnauthorizedException);
  });

  it('ignores spoofed stock body actor and writes the authenticated actor', async () => {
    const stockService = { setStock: jest.fn().mockResolvedValue({ id: 'stock-1' }) };
    const catalogReconciliation = {};
    const controller = new StockController(stockService as any, logger as any, catalogReconciliation as any);

    await controller.setStock({
      productId: 'product-1',
      warehouseId: 'warehouse-1',
      quantity: 4,
      reasonCode: 'ADJUSTMENT',
      actor: 'orders-microservice',
    }, request);

    expect(stockService.setStock).toHaveBeenCalledWith('product-1', 'warehouse-1', 4, {
      reasonCode: 'ADJUSTMENT',
      actor: 'auth:staff:auth-user-1',
      reference: undefined,
    });
  });

  it('ignores spoofed reservation body actor before delegating lifecycle work', async () => {
    const reservationsService = { fulfill: jest.fn().mockResolvedValue({ id: 'stock-1' }) };
    const controller = new ReservationsController(reservationsService as any, logger as any);

    await controller.fulfill({
      productId: 'product-1',
      warehouseId: 'warehouse-1',
      orderId: 'order-1',
      reasonCode: 'PAYMENT_CONFIRMED',
      actor: 'payments-microservice',
    }, serviceRequest);

    expect(reservationsService.fulfill).toHaveBeenCalledWith(expect.objectContaining({
      actor: 'service:orders-microservice',
    }));
  });

  it('ignores spoofed supplier reconciliation actor before mutation service writes evidence', async () => {
    const supplierService = { reconcile: jest.fn().mockResolvedValue({ id: 'rec-1' }) };
    const controller = new SupplierReconciliationController(supplierService as any, logger as any);

    await controller.reconcile({
      supplierId: 'supplier-1',
      warehouseId: 'warehouse-1',
      productId: 'product-1',
      quantity: 5,
      externalReference: 'feed-1',
      actor: 'catalog-microservice',
    }, serviceRequest);

    expect(supplierService.reconcile).toHaveBeenCalledWith(expect.objectContaining({
      actor: 'service:orders-microservice',
    }));
  });
});
