import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { getAuthenticatedMutationActor } from '../auth/authenticated-actor';
import { ReservationsService } from './reservations.service';
import { LoggerService } from '../logger/logger.service';
import { ExpireDueReservationsDto, ReservationLifecycleDto, ReserveStockDto, UnreserveStockDto } from '../stock/dto/stock-mutation.dto';

@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly logger: LoggerService,
  ) {}

  @Get()
  async findActive() {
    this.logger.log('GET /api/reservations', 'ReservationsController');
    const reservations = await this.reservationsService.findActive();
    return { success: true, data: reservations };
  }

  @Get('order/:orderId')
  async findByOrder(@Param('orderId') orderId: string) {
    this.logger.log(`GET /api/reservations/order/${orderId}`, 'ReservationsController');
    const reservations = await this.reservationsService.findByOrder(orderId);
    return { success: true, data: reservations };
  }

  @Get('product/:productId')
  async findByProduct(@Param('productId') productId: string) {
    this.logger.log(`GET /api/reservations/product/${productId}`, 'ReservationsController');
    const reservations = await this.reservationsService.findByProduct(productId);
    return { success: true, data: reservations };
  }

  @Post('reserve')
  async reserve(@Body() body: ReserveStockDto, @Req() request: Request) {
    this.logger.log('POST /api/reservations/reserve', 'ReservationsController');
    const stock = await this.reservationsService.reserve({ ...body, actor: getAuthenticatedMutationActor(request) });
    return { success: true, data: stock };
  }

  @Post('release')
  async release(@Body() body: UnreserveStockDto, @Req() request: Request) {
    this.logger.log('POST /api/reservations/release', 'ReservationsController');
    const stock = await this.reservationsService.release({ ...body, actor: getAuthenticatedMutationActor(request) });
    return { success: true, data: stock };
  }

  @Post('fulfill')
  async fulfill(@Body() body: ReservationLifecycleDto, @Req() request: Request) {
    this.logger.log('POST /api/reservations/fulfill', 'ReservationsController');
    const stock = await this.reservationsService.fulfill({ ...body, actor: getAuthenticatedMutationActor(request) });
    return { success: true, data: stock };
  }

  @Post('cancel')
  async cancel(@Body() body: ReservationLifecycleDto, @Req() request: Request) {
    this.logger.log('POST /api/reservations/cancel', 'ReservationsController');
    const stock = await this.reservationsService.cancel({ ...body, actor: getAuthenticatedMutationActor(request) });
    return { success: true, data: stock };
  }

  @Post('expire')
  async expire(@Body() body: ReservationLifecycleDto, @Req() request: Request) {
    this.logger.log('POST /api/reservations/expire', 'ReservationsController');
    const stock = await this.reservationsService.expire({ ...body, actor: getAuthenticatedMutationActor(request) });
    return { success: true, data: stock };
  }

  @Post('expire-due')
  async expireDue(@Body() body: ExpireDueReservationsDto) {
    this.logger.log('POST /api/reservations/expire-due', 'ReservationsController');
    const summary = await this.reservationsService.expireDueReservations(body);
    return { success: summary.failed === 0, data: summary };
  }

  @Post('return')
  async returnReservation(@Body() body: ReservationLifecycleDto, @Req() request: Request) {
    this.logger.log('POST /api/reservations/return', 'ReservationsController');
    const stock = await this.reservationsService.returnReservation({ ...body, actor: getAuthenticatedMutationActor(request) });
    return { success: true, data: stock };
  }
}
