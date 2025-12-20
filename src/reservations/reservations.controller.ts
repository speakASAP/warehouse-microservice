import { Controller, Get, Param } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { LoggerService } from '../logger/logger.service';

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
}

