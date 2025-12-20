import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { StockMovement } from './stock-movement.entity';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class MovementsService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly movementRepository: Repository<StockMovement>,
    private readonly logger: LoggerService,
  ) {}

  async findByProduct(productId: string, limit = 50): Promise<StockMovement[]> {
    return this.movementRepository.find({
      where: { productId },
      relations: ['fromWarehouse', 'toWarehouse'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByWarehouse(warehouseId: string, limit = 50): Promise<StockMovement[]> {
    return this.movementRepository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.fromWarehouse', 'fromWarehouse')
      .leftJoinAndSelect('m.toWarehouse', 'toWarehouse')
      .where('m.fromWarehouseId = :warehouseId OR m.toWarehouseId = :warehouseId', { warehouseId })
      .orderBy('m.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<StockMovement[]> {
    return this.movementRepository.find({
      where: { createdAt: Between(startDate, endDate) },
      relations: ['fromWarehouse', 'toWarehouse'],
      order: { createdAt: 'DESC' },
    });
  }
}

