import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { LoggerService } from '../logger/logger.service';
import { ReservationLifecycleDto, ReserveStockDto, UnreserveStockDto } from '../stock/dto/stock-mutation.dto';

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
  async reserve(@Body() body: ReserveStockDto) {
    this.logger.log('POST /api/reservations/reserve', 'ReservationsController');
    const stock = await this.reservationsService.reserve(body);
    return { success: true, data: stock };
  }

  @Post('release')
  async release(@Body() body: UnreserveStockDto) {
    this.logger.log('POST /api/reservations/release', 'ReservationsController');
    const stock = await this.reservationsService.release(body);
    return { success: true, data: stock };
  }

  @Post('fulfill')
  async fulfill(@Body() body: ReservationLifecycleDto) {
    this.logger.log('POST /api/reservations/fulfill', 'ReservationsController');
    const stock = await this.reservationsService.fulfill(body);
    return { success: true, data: stock };
  }

  @Post('cancel')
  async cancel(@Body() body: ReservationLifecycleDto) {
    this.logger.log('POST /api/reservations/cancel', 'ReservationsController');
    const stock = await this.reservationsService.cancel(body);
    return { success: true, data: stock };
  }

  @Post('expire')
  async expire(@Body() body: ReservationLifecycleDto) {
    this.logger.log('POST /api/reservations/expire', 'ReservationsController');
    const stock = await this.reservationsService.expire(body);
    return { success: true, data: stock };
  }

  @Post('return')
  async returnReservation(@Body() body: ReservationLifecycleDto) {
    this.logger.log('POST /api/reservations/return', 'ReservationsController');
    const stock = await this.reservationsService.returnReservation(body);
    return { success: true, data: stock };
  }
}
