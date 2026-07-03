import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { FulfillmentProviderStatusLedgerService } from '../src/fulfillment/fulfillment-provider-status-ledger.service';

describe('FulfillmentProviderStatusLedgerService', () => {
  const baseCommand = {
    idempotencyKey: 'wh-provider-status-ledger:v1:allegro:checkout:order-hash:sent:2025-07-03T10:00:00Z',
    contentHash: 'content-hash-1',
    provider: 'allegro',
    sourceChannel: 'checkout-form',
    centralOrderId: 'order-1',
    fulfillmentOrderId: '11111111-1111-4111-8111-111111111111',
    sourceReferenceHash: 'checkout-hash-1',
    normalizedWarehouseStatus: 'handed_to_delivery' as const,
    sourceStatusClass: 'SENT',
    statusObservedAt: '2025-07-03T10:00:00.000Z',
    sourceUpdatedAt: '2025-07-03T10:00:00.000Z',
    observedAt: '2025-07-03T10:00:05.000Z',
    sourceMetadata: {
      packageCount: 1,
      source: 'sanitized-fixture',
    },
  };

  function createService(options: {
    exact?: any;
    existingForKey?: any;
    latestSource?: any;
  } = {}) {
    const repository = {
      findOne: jest.fn(async ({ where }) => {
        if (where.idempotencyKey && where.contentHash) return options.exact ?? null;
        if (where.idempotencyKey) return options.existingForKey ?? null;
        if (where.provider && where.sourceChannel) return options.latestSource ?? null;
        return null;
      }),
      create: jest.fn((data) => data),
      save: jest.fn(async (observation) => ({
        id: 'observation-1',
        ...observation,
      })),
    };

    return {
      service: new FulfillmentProviderStatusLedgerService(repository as any),
      repository,
    };
  }

  it('records a sanitized accepted provider status observation', async () => {
    const { service, repository } = createService();

    const observation = await service.recordObservation(baseCommand);

    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
      idempotencyKey: baseCommand.idempotencyKey,
      contentHash: 'content-hash-1',
      provider: 'allegro',
      sourceChannel: 'checkout-form',
      centralOrderId: 'order-1',
      normalizedWarehouseStatus: 'handed_to_delivery',
      decision: 'accepted',
      rejectionReason: undefined,
      attemptCount: 1,
    }));
    expect(observation.sourceMetadata).toEqual({
      packageCount: 1,
      source: 'sanitized-fixture',
    });
  });

  it('deduplicates exact idempotency key and content hash replays', async () => {
    const existing = {
      id: 'existing-observation',
      idempotencyKey: baseCommand.idempotencyKey,
      contentHash: baseCommand.contentHash,
      decision: 'accepted',
      attemptCount: 1,
      lastSeenAt: new Date('2025-07-03T10:00:05.000Z'),
    };
    const { service, repository } = createService({ exact: existing });

    const observation = await service.recordObservation({
      ...baseCommand,
      observedAt: '2025-07-03T10:01:00.000Z',
    });

    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
      id: 'existing-observation',
      decision: 'duplicate',
      attemptCount: 2,
      lastSeenAt: new Date('2025-07-03T10:01:00.000Z'),
    }));
    expect(observation.decision).toBe('duplicate');
  });

  it('records a conflict for same idempotency key with different content hash', async () => {
    const { service, repository } = createService({
      existingForKey: {
        idempotencyKey: baseCommand.idempotencyKey,
        contentHash: 'other-content-hash',
      },
    });

    const observation = await service.recordObservation(baseCommand);

    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
      decision: 'conflict',
      rejectionReason: 'IDEMPOTENCY_CONTENT_CONFLICT',
    }));
    expect(observation.decision).toBe('conflict');
  });

  it('rejects raw provider, tracking, or customer metadata before persistence', async () => {
    const { service, repository } = createService();

    await expect(service.recordObservation({
      ...baseCommand,
      sourceMetadata: {
        trackingNumber: 'raw-tracking-number',
      },
    })).rejects.toThrow(BadRequestException);

    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('records future source timestamps as rejected observations', async () => {
    const { service, repository } = createService();
    const future = new Date(Date.now() + 60_000).toISOString();

    const observation = await service.recordObservation({
      ...baseCommand,
      sourceUpdatedAt: future,
    });

    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
      decision: 'rejected',
      rejectionReason: 'FUTURE_SOURCE_TIMESTAMP',
    }));
    expect(observation.decision).toBe('rejected');
  });

  it('records stale source updates as rejected observations', async () => {
    const { service, repository } = createService({
      latestSource: {
        sourceUpdatedAt: new Date('2025-07-03T11:00:00.000Z'),
      },
    });

    const observation = await service.recordObservation(baseCommand);

    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
      decision: 'rejected',
      rejectionReason: 'STALE_SOURCE_UPDATE',
    }));
    expect(observation.decision).toBe('rejected');
  });
});
