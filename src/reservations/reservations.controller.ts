import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { getAuthenticatedMutationActor } from '../auth/authenticated-actor';
import { ReservationsService } from './reservations.service';
import { LoggerService } from '../logger/logger.service';
import { ExpireDueReservationsDto, ReservationLifecycleDto, ReserveStockDto, UnreserveStockDto } from '../stock/dto/stock-mutation.dto';
import { Roles } from '../auth/roles.decorator';
import { WAREHOUSE_READ_ROLES, WAREHOUSE_WRITE_ROLES, WAREHOUSE_MAINTENANCE_ROLES } from '../auth/roles.constants';

@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly logger: LoggerService,
  ) {}

  @Roles(...WAREHOUSE_READ_ROLES)
  @Get()
  async findActive() {
    this.logger.log('GET /api/reservations', 'ReservationsController');
    const reservations = await this.reservationsService.findActive();
    return { success: true, data: reservations };
  }

  @Roles(...WAREHOUSE_READ_ROLES)
  @Get('order/:orderId')
  async findByOrder(@Param('orderId') orderId: string) {
    this.logger.log(`GET /api/reservations/order/${orderId}`, 'ReservationsController');
    const reservations = await this.reservationsService.findByOrder(orderId);
    return { success: true, data: reservations };
  }

  @Roles(...WAREHOUSE_READ_ROLES)
  @Get('product/:productId')
  async findByProduct(@Param('productId') productId: string) {
    this.logger.log(`GET /api/reservations/product/${productId}`, 'ReservationsController');
    const reservations = await this.reservationsService.findByProduct(productId);
    return { success: true, data: reservations };
  }

  @Roles(...WAREHOUSE_WRITE_ROLES)
  @Post('reserve')
  async reserve(@Body() body: ReserveStockDto, @Req() request: Request) {
    this.logger.log('POST /api/reservations/reserve', 'ReservationsController');
    const stock = await this.reservationsService.reserve({ ...body, actor: getAuthenticatedMutationActor(request) });
    return { success: true, data: stock };
  }

  @Roles(...WAREHOUSE_WRITE_ROLES)
  @Post('release')
  async release(@Body() body: UnreserveStockDto, @Req() request: Request) {
    this.logger.log('POST /api/reservations/release', 'ReservationsController');
    const stock = await this.reservationsService.release({ ...body, actor: getAuthenticatedMutationActor(request) });
    return { success: true, data: stock };
  }

  @Roles(...WAREHOUSE_WRITE_ROLES)
  @Post('fulfill')
  async fulfill(@Body() body: ReservationLifecycleDto, @Req() request: Request) {
    this.logger.log('POST /api/reservations/fulfill', 'ReservationsController');
    const stock = await this.reservationsService.fulfill({ ...body, actor: getAuthenticatedMutationActor(request) });
    return { success: true, data: stock };
  }

  @Roles(...WAREHOUSE_WRITE_ROLES)
  @Post('cancel')
  async cancel(@Body() body: ReservationLifecycleDto, @Req() request: Request) {
    this.logger.log('POST /api/reservations/cancel', 'ReservationsController');
    const stock = await this.reservationsService.cancel({ ...body, actor: getAuthenticatedMutationActor(request) });
    return { success: true, data: stock };
  }

  @Roles(...WAREHOUSE_WRITE_ROLES)
  @Post('expire')
  async expire(@Body() body: ReservationLifecycleDto, @Req() request: Request) {
    this.logger.log('POST /api/reservations/expire', 'ReservationsController');
    const stock = await this.reservationsService.expire({ ...body, actor: getAuthenticatedMutationActor(request) });
    return { success: true, data: stock };
  }

  @Roles(...WAREHOUSE_MAINTENANCE_ROLES)
  @Post('expire-due')
  async expireDue(@Body() body: ExpireDueReservationsDto) {
    this.logger.log('POST /api/reservations/expire-due', 'ReservationsController');
    const summary = await this.reservationsService.expireDueReservations(body);
    return { success: summary.failed === 0, data: summary };
  }

  @Roles(...WAREHOUSE_WRITE_ROLES)
  @Post('return')
  async returnReservation(@Body() body: ReservationLifecycleDto, @Req() request: Request) {
    this.logger.log('POST /api/reservations/return', 'ReservationsController');
    const stock = await this.reservationsService.returnReservation({ ...body, actor: getAuthenticatedMutationActor(request) });
    return { success: true, data: stock };
  }
}
