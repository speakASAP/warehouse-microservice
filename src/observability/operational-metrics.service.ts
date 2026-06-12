import { Injectable } from '@nestjs/common';

type MutationStatus = 'none' | 'success' | 'failure';

export interface StockMutationMetric {
  status: MutationStatus;
  operation?: string;
  productId?: string;
  warehouseId?: string;
  actor?: string;
  reasonCode?: string;
  reference?: string;
  error?: string;
  at?: string;
}

@Injectable()
export class OperationalMetricsService {
  private mutationAttempts = 0;
  private mutationFailures = 0;
  private lastMutation: StockMutationMetric = { status: 'none' };

  recordMutationSuccess(metric: Omit<StockMutationMetric, 'status' | 'at'>) {
    this.mutationAttempts += 1;
    this.lastMutation = {
      ...metric,
      status: 'success',
      at: new Date().toISOString(),
    };
  }

  recordMutationFailure(metric: Omit<StockMutationMetric, 'status' | 'at'>) {
    this.mutationAttempts += 1;
    this.mutationFailures += 1;
    this.lastMutation = {
      ...metric,
      status: 'failure',
      at: new Date().toISOString(),
    };
  }

  getMutationStatus() {
    return {
      status: this.lastMutation.status,
      attempts: this.mutationAttempts,
      failures: this.mutationFailures,
      last: this.lastMutation,
    };
  }
}
