import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { getAuthenticatedMutationActor } from '../auth/authenticated-actor';
import { LoggerService } from '../logger/logger.service';
import { CreateFulfillmentOrderDto, FulfillmentOrderTransitionDto } from './dto/fulfillment-order.dto';
import { FulfillmentOrdersService } from './fulfillment-orders.service';

@Controller('fulfillment-orders')
export class FulfillmentOrdersController {
  constructor(
    private readonly fulfillmentOrdersService: FulfillmentOrdersService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  async create(@Body() body: CreateFulfillmentOrderDto, @Req() request: Request) {
    this.logger.log('POST /api/fulfillment-orders', 'FulfillmentOrdersController');
    const fulfillmentOrder = await this.fulfillmentOrdersService.createHandoff({
      ...body,
      actor: getAuthenticatedMutationActor(request),
    });
    return { success: true, data: fulfillmentOrder };
  }

  @Get('order/:orderId')
  async findByOrder(@Param('orderId') orderId: string) {
    this.logger.log(`GET /api/fulfillment-orders/order/${orderId}`, 'FulfillmentOrdersController');
    const fulfillmentOrder = await this.fulfillmentOrdersService.findByOrder(orderId);
    return { success: true, data: fulfillmentOrder };
  }

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
