import { Body, Controller, Post } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { SupplierStockReconciliationDto } from './dto/supplier-stock-reconciliation.dto';
import { SupplierReconciliationService } from './supplier-reconciliation.service';

@Controller('supplier-reconciliations')
export class SupplierReconciliationController {
  constructor(
    private readonly supplierReconciliationService: SupplierReconciliationService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  async reconcile(@Body() body: SupplierStockReconciliationDto) {
    this.logger.log('POST /api/supplier-reconciliations', 'SupplierReconciliationController');
    const reconciliation = await this.supplierReconciliationService.reconcile(body);
    return { success: true, data: reconciliation };
  }
}
