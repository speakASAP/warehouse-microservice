import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { getAuthenticatedMutationActor } from '../auth/authenticated-actor';
import { Roles } from '../auth/roles.decorator';
import { LoggerService } from '../logger/logger.service';
import { FulfillmentProviderShipmentCorrelationService } from './fulfillment-provider-shipment-correlation.service';
import { FulfillmentProviderStatusSnapshotAdapterService } from './fulfillment-provider-status-snapshot-adapter.service';
import { CreateFulfillmentOrderDto, FulfillmentOrderStatusTransitionDto, FulfillmentOrderTransitionDto, InternalDeliveryStatusUpdateDto, ProviderShipmentCorrelationDto } from './dto/fulfillment-order.dto';
import { FulfillmentOrdersService } from './fulfillment-orders.service';
import { WAREHOUSE_READ_ROLES, FULFILLMENT_WRITE_ROLES, ALLEGRO_FULFILLMENT_ROLES } from '../auth/roles.constants';

@Controller('fulfillment-orders')
export class FulfillmentOrdersController {
  constructor(
    private readonly fulfillmentOrdersService: FulfillmentOrdersService,
    private readonly providerShipmentCorrelationService: FulfillmentProviderShipmentCorrelationService,
    private readonly providerStatusSnapshotAdapterService: FulfillmentProviderStatusSnapshotAdapterService,
    private readonly logger: LoggerService,
  ) {}

  @Roles(...FULFILLMENT_WRITE_ROLES)
  @Post()
  async create(@Body() body: CreateFulfillmentOrderDto, @Req() request: Request) {
    this.logger.log('POST /api/fulfillment-orders', 'FulfillmentOrdersController');
    const fulfillmentOrder = await this.fulfillmentOrdersService.createHandoff({
      ...body,
      actor: getAuthenticatedMutationActor(request),
    });
    return { success: true, data: fulfillmentOrder };
  }

  @Roles(...WAREHOUSE_READ_ROLES)
  @Get('order/:orderId')
  async findByOrder(@Param('orderId') orderId: string) {
    this.logger.log(`GET /api/fulfillment-orders/order/${orderId}`, 'FulfillmentOrdersController');
    const fulfillmentOrder = await this.fulfillmentOrdersService.findByOrder(orderId);
    return { success: true, data: fulfillmentOrder };
  }

  @Post('provider-status/allegro-shipment-snapshots')
  @Roles(...ALLEGRO_FULFILLMENT_ROLES)
  async recordAllegroShipmentStatusSnapshot(
    @Body() body: any,
    @Req() request: Request,
  ) {
    this.logger.log(
      'POST /api/fulfillment-orders/provider-status/allegro-shipment-snapshots',
      'FulfillmentOrdersController',
    );
    const actor = getAuthenticatedMutationActor(request);
    const observation = await this.providerStatusSnapshotAdapterService.recordResolvedAllegroShipmentSnapshot(body);
    let fulfillmentOrder = null;
    if (observation.decision === 'accepted' && observation.normalizedWarehouseStatus && observation.normalizedWarehouseStatus !== 'noop') {
      fulfillmentOrder = await this.fulfillmentOrdersService.updateStatus(observation.centralOrderId, {
        status: observation.normalizedWarehouseStatus as any,
        reasonCode: 'ALLEGRO_SHIPMENT_STATUS_OBSERVED',
        actor,
        reference: observation.idempotencyKey.slice(0, 200),
      });
    }
    return {
      success: true,
      data: {
        observation,
        fulfillmentOrder,
        statusMutationApplied: Boolean(fulfillmentOrder),
      },
    };
  }

  @Post('order/:orderId/provider-shipment-correlations')
  @Roles(...ALLEGRO_FULFILLMENT_ROLES)
  async registerProviderShipmentCorrelation(
    @Param('orderId') orderId: string,
    @Body() body: ProviderShipmentCorrelationDto,
    @Req() request: Request,
  ) {
    this.logger.log(
      `POST /api/fulfillment-orders/order/${orderId}/provider-shipment-correlations`,
      'FulfillmentOrdersController',
    );
    const fulfillmentOrder = await this.fulfillmentOrdersService.findByOrder(orderId);
    const correlation = await this.providerShipmentCorrelationService.registerCorrelation({
      provider: body.provider,
      sourceChannel: body.sourceChannel,
      centralOrderId: fulfillmentOrder.orderId,
      fulfillmentOrderId: fulfillmentOrder.id,
      accountIdHash: body.accountIdHash,
      externalOrderIdHash: body.externalOrderIdHash,
      shipmentIdHash: body.shipmentIdHash,
      waybillIdHash: body.waybillIdHash,
      sourceReferenceHash: body.sourceReferenceHash,
      reasonCode: body.reasonCode,
      actor: getAuthenticatedMutationActor(request),
    });
    return { success: true, data: correlation };
  }

  @Roles(...FULFILLMENT_WRITE_ROLES)
  @Post('order/:orderId/status')
  async updateStatus(
    @Param('orderId') orderId: string,
    @Body() body: FulfillmentOrderStatusTransitionDto,
    @Req() request: Request,
  ) {
    this.logger.log(`POST /api/fulfillment-orders/order/${orderId}/status`, 'FulfillmentOrdersController');
    const fulfillmentOrder = await this.fulfillmentOrdersService.updateStatus(orderId, {
      ...body,
      actor: getAuthenticatedMutationActor(request),
    });
    return { success: true, data: fulfillmentOrder };
  }

  @Post('order/:orderId/internal-delivery-status')
  @Roles(...FULFILLMENT_WRITE_ROLES)
  async recordInternalDeliveryStatus(
    @Param('orderId') orderId: string,
    @Body() body: InternalDeliveryStatusUpdateDto,
    @Req() request: Request,
  ) {
    this.logger.log(`POST /api/fulfillment-orders/order/${orderId}/internal-delivery-status`, 'FulfillmentOrdersController');
    const result = await this.fulfillmentOrdersService.recordInternalDeliveryStatus(orderId, {
      ...body,
      actor: getAuthenticatedMutationActor(request),
    });
    return { success: true, data: result };
  }

  @Roles(...FULFILLMENT_WRITE_ROLES)
  @Post('order/:orderId/cancel')
  async cancel(
    @Param('orderId') orderId: string,
    @Body() body: FulfillmentOrderTransitionDto,
    @Req() request: Request,
  ) {
    this.logger.log(`POST /api/fulfillment-orders/order/${orderId}/cancel`, 'FulfillmentOrdersController');
    const fulfillmentOrder = await this.fulfillmentOrdersService.cancel(orderId, {
      ...body,
      actor: getAuthenticatedMutationActor(request),
    });
    return { success: true, data: fulfillmentOrder };
  }

  @Roles(...FULFILLMENT_WRITE_ROLES)
  @Post('order/:orderId/return')
  async returnOrder(
    @Param('orderId') orderId: string,
    @Body() body: FulfillmentOrderTransitionDto,
    @Req() request: Request,
  ) {
    this.logger.log(`POST /api/fulfillment-orders/order/${orderId}/return`, 'FulfillmentOrdersController');
    const fulfillmentOrder = await this.fulfillmentOrdersService.returnOrder(orderId, {
      ...body,
      actor: getAuthenticatedMutationActor(request),
    });
    return { success: true, data: fulfillmentOrder };
  }
}
