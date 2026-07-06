import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/roles.decorator';
import { BusinessHealthService } from './business-health.service';

@Controller('business-health')
export class BusinessHealthController {
  constructor(private readonly businessHealthService: BusinessHealthService) {}

  @Public()
  @Get('stock-authority')
  getStockAuthority() {
    return this.businessHealthService.getStockAuthorityEnvelope();
  }
}
