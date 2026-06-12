import { Global, Module } from '@nestjs/common';
import { OperationalMetricsService } from './operational-metrics.service';

@Global()
@Module({
  providers: [OperationalMetricsService],
  exports: [OperationalMetricsService],
})
export class ObservabilityModule {}
