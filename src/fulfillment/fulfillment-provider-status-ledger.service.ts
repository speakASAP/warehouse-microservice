import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FulfillmentProviderStatusDecision,
  FulfillmentProviderStatusObservation,
} from './fulfillment-provider-status-observation.entity';
import { FulfillmentOrderStatus } from './fulfillment-order.entity';

export interface ProviderStatusObservationCommand {
  idempotencyKey: string;
  contentHash: string;
  provider: string;
  sourceChannel: string;
  centralOrderId: string;
  fulfillmentOrderId?: string;
  sourceReferenceHash: string;
  normalizedWarehouseStatus?: FulfillmentOrderStatus | 'noop';
  sourceStatusClass: string;
  statusObservedAt?: string | Date;
  sourceUpdatedAt?: string | Date;
  observedAt?: string | Date;
  decision?: FulfillmentProviderStatusDecision;
  rejectionReason?: string;
  sourceMetadata?: Record<string, unknown>;
}

interface NormalizedProviderStatusObservation {
  idempotencyKey: string;
  contentHash: string;
  provider: string;
  sourceChannel: string;
  centralOrderId: string;
  fulfillmentOrderId?: string;
  sourceReferenceHash: string;
  normalizedWarehouseStatus?: FulfillmentOrderStatus | 'noop';
  sourceStatusClass: string;
  statusObservedAt?: Date;
  sourceUpdatedAt?: Date;
  observedAt: Date;
  decision: FulfillmentProviderStatusDecision;
  rejectionReason?: string;
  sourceMetadata?: Record<string, unknown>;
}

const FORBIDDEN_METADATA_KEYS = [
  'rawdata',
  'rawpayload',
  'providerpayload',
  'trackingnumber',
  'trackingurl',
  'waybill',
  'buyeremail',
  'buyerlogin',
  'credential',
  'token',
  'customercontact',
  'deliveryaddress',
  'label',
  'document',
  'packagebody',
  'carrierobject',
];

@Injectable()
export class FulfillmentProviderStatusLedgerService {
  constructor(
    @InjectRepository(FulfillmentProviderStatusObservation)
    private readonly observationRepository: Repository<FulfillmentProviderStatusObservation>,
  ) {}

  async recordObservation(
    command: ProviderStatusObservationCommand,
  ): Promise<FulfillmentProviderStatusObservation> {
    const normalized = this.normalizeCommand(command);
    this.assertSanitizedMetadata(normalized.sourceMetadata);

    const existingExact = await this.observationRepository.findOne({
      where: {
        idempotencyKey: normalized.idempotencyKey,
        contentHash: normalized.contentHash,
      },
    });

    if (existingExact) {
      existingExact.decision = existingExact.decision === 'conflict' ? 'conflict' : 'duplicate';
      existingExact.lastSeenAt = normalized.observedAt;
      existingExact.attemptCount = (existingExact.attemptCount || 1) + 1;
      return this.observationRepository.save(existingExact);
    }

    const existingForKey = await this.observationRepository.findOne({
      where: { idempotencyKey: normalized.idempotencyKey },
      order: { createdAt: 'DESC' },
    });

    if (existingForKey && existingForKey.contentHash !== normalized.contentHash) {
      return this.saveObservation({
        ...normalized,
        decision: 'conflict',
        rejectionReason: 'IDEMPOTENCY_CONTENT_CONFLICT',
      });
    }

    const latestSourceObservation = await this.observationRepository.findOne({
      where: {
        provider: normalized.provider,
        sourceChannel: normalized.sourceChannel,
        centralOrderId: normalized.centralOrderId,
        sourceReferenceHash: normalized.sourceReferenceHash,
        sourceStatusClass: normalized.sourceStatusClass,
      },
      order: { sourceUpdatedAt: 'DESC' },
    });

    if (
      latestSourceObservation?.sourceUpdatedAt &&
      normalized.sourceUpdatedAt &&
      normalized.sourceUpdatedAt < latestSourceObservation.sourceUpdatedAt
    ) {
      return this.saveObservation({
        ...normalized,
        decision: 'rejected',
        rejectionReason: 'STALE_SOURCE_UPDATE',
      });
    }

    if (this.hasFutureTimestamp(normalized)) {
      return this.saveObservation({
        ...normalized,
        decision: 'rejected',
        rejectionReason: 'FUTURE_SOURCE_TIMESTAMP',
      });
    }

    return this.saveObservation(normalized);
  }

  private saveObservation(
    normalized: NormalizedProviderStatusObservation,
  ): Promise<FulfillmentProviderStatusObservation> {
    const now = normalized.observedAt;
    const observation = this.observationRepository.create({
      idempotencyKey: normalized.idempotencyKey,
      contentHash: normalized.contentHash,
      provider: normalized.provider,
      sourceChannel: normalized.sourceChannel,
      centralOrderId: normalized.centralOrderId,
      fulfillmentOrderId: normalized.fulfillmentOrderId,
      sourceReferenceHash: normalized.sourceReferenceHash,
      normalizedWarehouseStatus: normalized.normalizedWarehouseStatus,
      sourceStatusClass: normalized.sourceStatusClass,
      statusObservedAt: normalized.statusObservedAt,
      sourceUpdatedAt: normalized.sourceUpdatedAt,
      observedAt: normalized.observedAt,
      decision: normalized.decision,
      rejectionReason: normalized.rejectionReason,
      sourceMetadata: normalized.sourceMetadata,
      firstSeenAt: now,
      lastSeenAt: now,
      attemptCount: 1,
    });
    return this.observationRepository.save(observation);
  }

  private normalizeCommand(command: ProviderStatusObservationCommand): NormalizedProviderStatusObservation {
    const observedAt = this.parseOptionalDate(command.observedAt, 'observedAt') || new Date();
    return {
      idempotencyKey: this.normalizeRequiredString(command.idempotencyKey, 'idempotencyKey'),
      contentHash: this.normalizeRequiredString(command.contentHash, 'contentHash'),
      provider: this.normalizeRequiredString(command.provider, 'provider'),
      sourceChannel: this.normalizeRequiredString(command.sourceChannel, 'sourceChannel'),
      centralOrderId: this.normalizeRequiredString(command.centralOrderId, 'centralOrderId'),
      fulfillmentOrderId: this.normalizeOptionalString(command.fulfillmentOrderId),
      sourceReferenceHash: this.normalizeRequiredString(command.sourceReferenceHash, 'sourceReferenceHash'),
      normalizedWarehouseStatus: command.normalizedWarehouseStatus,
      sourceStatusClass: this.normalizeRequiredString(command.sourceStatusClass, 'sourceStatusClass'),
      statusObservedAt: this.parseOptionalDate(command.statusObservedAt, 'statusObservedAt'),
      sourceUpdatedAt: this.parseOptionalDate(command.sourceUpdatedAt, 'sourceUpdatedAt'),
      observedAt,
      decision: command.decision || 'accepted',
      rejectionReason: this.normalizeOptionalString(command.rejectionReason),
      sourceMetadata: command.sourceMetadata,
    };
  }

  private hasFutureTimestamp(normalized: NormalizedProviderStatusObservation): boolean {
    const now = Date.now();
    return [normalized.statusObservedAt, normalized.sourceUpdatedAt]
      .filter((value): value is Date => value instanceof Date)
      .some((value) => value.getTime() > now);
  }

  private assertSanitizedMetadata(value: unknown, path = 'sourceMetadata'): void {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((entry, index) => this.assertSanitizedMetadata(entry, `${path}[${index}]`));
      return;
    }
    if (typeof value !== 'object') return;

    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      const normalizedKey = key.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (FORBIDDEN_METADATA_KEYS.includes(normalizedKey)) {
        throw new BadRequestException(`${path}.${key} is not allowed in provider status metadata`);
      }
      this.assertSanitizedMetadata(entry, `${path}.${key}`);
    }
  }

  private parseOptionalDate(value: string | Date | undefined, fieldName: string): Date | undefined {
    if (value === undefined || value === null) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid timestamp`);
    }
    return date;
  }

  private normalizeRequiredString(value: string | undefined, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException(`${fieldName} is required`);
    }
    return value.trim();
  }

  private normalizeOptionalString(value: string | undefined): string | undefined {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
}
