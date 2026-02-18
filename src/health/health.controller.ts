import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { Public } from '../auth/roles.decorator';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get('health')
  getHealth() {
    return this.healthService.getHealth();
  }

  @Public()
  @Get('ready')
  getReady() {
    return { ready: true };
  }
}

