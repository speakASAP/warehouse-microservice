import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from './warehouse.entity';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class WarehousesService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    private readonly logger: LoggerService,
  ) {}

  async findAll(): Promise<Warehouse[]> {
    return this.warehouseRepository.find({
      where: { isActive: true },
      order: { priority: 'DESC', name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findOne({ where: { id } });
    if (!warehouse) {
      throw new NotFoundException(`Warehouse ${id} not found`);
    }
    return warehouse;
  }

  async create(data: Partial<Warehouse>): Promise<Warehouse> {
    this.logger.log(`Creating warehouse: ${data.name}`, 'WarehousesService');
    const warehouse = this.warehouseRepository.create(data);
    return this.warehouseRepository.save(warehouse);
  }

  async update(id: string, data: Partial<Warehouse>): Promise<Warehouse> {
    const warehouse = await this.findOne(id);
    Object.assign(warehouse, data);
    return this.warehouseRepository.save(warehouse);
  }

  async remove(id: string): Promise<void> {
    const warehouse = await this.findOne(id);
    warehouse.isActive = false;
    await this.warehouseRepository.save(warehouse);
  }
}

