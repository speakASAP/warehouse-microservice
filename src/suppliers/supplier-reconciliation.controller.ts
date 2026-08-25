import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { getAuthenticatedMutationActor } from '../auth/authenticated-actor';
import { LoggerService } from '../logger/logger.service';
import {
  SupplierConflictReviewDto,
  SupplierReconciliationQueryDto,
  SupplierStockReconciliationDto,
} from './dto/supplier-stock-reconciliation.dto';
import { SupplierReconciliationService } from './supplier-reconciliation.service';
import { Roles } from '../auth/roles.decorator';
import { WAREHOUSE_READ_ROLES, WAREHOUSE_ADMIN_ROLES } from '../auth/roles.constants';

@Controller('supplier-reconciliations')
export class SupplierReconciliationController {
  constructor(
    private readonly supplierReconciliationService: SupplierReconciliationService,
    private readonly logger: LoggerService,
  ) {}

  @Roles(...WAREHOUSE_READ_ROLES)
  @Get()
  async list(@Query() query: SupplierReconciliationQueryDto) {
    this.logger.log('GET /api/supplier-reconciliations', 'SupplierReconciliationController');
    const reconciliations = await this.supplierReconciliationService.list(query);
    return { success: true, data: reconciliations };
  }

  @Roles(...WAREHOUSE_ADMIN_ROLES)
  @Patch(':id/review')
  async reviewConflict(@Param('id') id: string, @Body() body: SupplierConflictReviewDto) {
    this.logger.log(`PATCH /api/supplier-reconciliations/${id}/review`, 'SupplierReconciliationController');
    const reconciliation = await this.supplierReconciliationService.reviewConflict(id, body);
    return { success: true, data: reconciliation };
  }

  @Roles(...WAREHOUSE_ADMIN_ROLES)
  @Post()
  async reconcile(@Body() body: SupplierStockReconciliationDto, @Req() request: Request) {
    this.logger.log('POST /api/supplier-reconciliations', 'SupplierReconciliationController');
    const reconciliation = await this.supplierReconciliationService.reconcile({ ...body, actor: getAuthenticatedMutationActor(request) });
    return { success: true, data: reconciliation };
  }
}
