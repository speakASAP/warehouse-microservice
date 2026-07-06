export type BusinessHealthStatus = 'healthy' | 'warn' | 'blocked' | 'unknown';

export interface BusinessHealthAssertion {
  id: string;
  status: BusinessHealthStatus;
  statement: string;
  sourceEvidence: string[];
  aggregationMeaning: string;
}

export interface BusinessHealthEvidence {
  source: 'static-source-contract';
  endpoint: string;
  checkedSourceFiles: string[];
  runtimeDataQueried: false;
  productionDbQueried: false;
  liveSyntheticMutationAuthorized: false;
  validation: {
    command: string;
    expectedResult: string;
    checkedAssertions: number;
  };
}

export interface MutationBoundary {
  mutatesWarehouse: false;
  allowedInThisLane: string[];
  forbiddenInThisLane: string[];
  requiredBeforeLiveMutation: string[];
}

export interface StockAuthorityBusinessHealthEnvelope {
  contractId: 'warehouse.stock_authority_business_health.v1';
  businessHealthContract: 'stock-order-marketplace-business-health.v1';
  service: 'warehouse-microservice';
  endpoint: '/api/business-health/stock-authority';
  generatedAt: string;
  mutatesWarehouse: false;
  status: BusinessHealthStatus;
  assertions: BusinessHealthAssertion[];
  evidence: BusinessHealthEvidence;
  blockers: string[];
  nextAction: string;
  mutationBoundary: MutationBoundary;
}
