import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AllegroShipmentStatusSnapshot, FulfillmentProviderSnapshotCorrelation } from './fulfillment-provider-status-snapshot-adapter.service';
import {
  FulfillmentProviderShipmentCorrelation,
  FulfillmentProviderShipmentCorrelationStatus,
} from './fulfillment-provider-shipment-correlation.entity';

export interface RegisterProviderShipmentCorrelationCommand {
  provider: string;
  sourceChannel: string;
  centralOrderId: string;
  fulfillmentOrderId: string;
  accountIdHash?: string;
  externalOrderIdHash: string;
  shipmentIdHash?: string;
  waybillIdHash?: string;
  sourceReferenceHash?: string;
  status?: FulfillmentProviderShipmentCorrelationStatus;
  reasonCode: string;
  actor: string;
}

interface NormalizedProviderShipmentCorrelation {
  provider: string;
  sourceChannel: string;
  centralOrderId: string;
  fulfillmentOrderId: string;
  accountIdHash?: string;
  externalOrderIdHash: string;
  shipmentIdHash?: string;
  waybillIdHash?: string;
  sourceReferenceHash: string;
  status: FulfillmentProviderShipmentCorrelationStatus;
  reasonCode: string;
  actor: string;
}

const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/;

@Injectable()
export class FulfillmentProviderShipmentCorrelationService {
  constructor(
    @InjectRepository(FulfillmentProviderShipmentCorrelation)
    private readonly correlationRepository: Repository<FulfillmentProviderShipmentCorrelation>,
  ) {}

  async registerCorrelation(
    command: RegisterProviderShipmentCorrelationCommand,
  ): Promise<FulfillmentProviderShipmentCorrelation> {
    const normalized = this.normalizeCommand(command);
    const existing = await this.correlationRepository.findOne({
      where: {
        provider: normalized.provider,
        sourceChannel: normalized.sourceChannel,
        sourceReferenceHash: normalized.sourceReferenceHash,
        status: 'active',
      },
    });

    if (existing) {
      if (
        existing.centralOrderId === normalized.centralOrderId &&
        existing.fulfillmentOrderId === normalized.fulfillmentOrderId
      ) {
        return existing;
      }
      throw new ConflictException('Provider shipment correlation already resolves to a different fulfillment order');
    }

    const correlation = this.correlationRepository.create({
      provider: normalized.provider,
      sourceChannel: normalized.sourceChannel,
      centralOrderId: normalized.centralOrderId,
      fulfillmentOrderId: normalized.fulfillmentOrderId,
      accountIdHash: normalized.accountIdHash,
      externalOrderIdHash: normalized.externalOrderIdHash,
      shipmentIdHash: normalized.shipmentIdHash,
      waybillIdHash: normalized.waybillIdHash,
      sourceReferenceHash: normalized.sourceReferenceHash,
      status: normalized.status,
      reasonCode: normalized.reasonCode,
      createdBy: normalized.actor,
    });
    return this.correlationRepository.save(correlation);
  }

  async resolveAllegroShipmentSnapshot(
    snapshot: AllegroShipmentStatusSnapshot,
  ): Promise<FulfillmentProviderSnapshotCorrelation> {
    this.assertAllegroSnapshotIdentity(snapshot);
    const sourceReferenceHash = this.hashSnapshotIdentity(
      snapshot.accountId,
      snapshot.order.externalOrderId,
      snapshot.shipment.shipmentId,
      snapshot.shipment.waybillHash,
    );
    const matches = await this.correlationRepository.find({
      where: {
        provider: 'allegro',
        sourceChannel: 'shipment-status-snapshot',
        sourceReferenceHash,
        status: 'active',
      },
      take: 2,
    });

    if (matches.length === 0) {
      throw new NotFoundException('Provider shipment correlation not found');
    }
    if (matches.length > 1) {
      throw new ConflictException('Provider shipment correlation is ambiguous');
    }

    return {
      centralOrderId: matches[0].centralOrderId,
      fulfillmentOrderId: matches[0].fulfillmentOrderId,
    };
  }

  buildAllegroSourceReferenceHash(snapshot: AllegroShipmentStatusSnapshot): string {
    this.assertAllegroSnapshotIdentity(snapshot);
    return this.hashSnapshotIdentity(
      snapshot.accountId,
      snapshot.order.externalOrderId,
      snapshot.shipment.shipmentId,
      snapshot.shipment.waybillHash,
    );
  }

  private normalizeCommand(command: RegisterProviderShipmentCorrelationCommand): NormalizedProviderShipmentCorrelation {
    const provider = this.normalizeRequiredString(command.provider, 'provider');
    const sourceChannel = this.normalizeRequiredString(command.sourceChannel, 'sourceChannel');
    const accountIdHash = this.normalizeOptionalHash(command.accountIdHash, 'accountIdHash');
    const externalOrderIdHash = this.normalizeRequiredHash(command.externalOrderIdHash, 'externalOrderIdHash');
    const shipmentIdHash = this.normalizeOptionalHash(command.shipmentIdHash, 'shipmentIdHash');
    const waybillIdHash = this.normalizeOptionalHash(command.waybillIdHash, 'waybillIdHash');
    return {
      provider,
      sourceChannel,
      centralOrderId: this.normalizeRequiredString(command.centralOrderId, 'centralOrderId'),
      fulfillmentOrderId: this.normalizeRequiredString(command.fulfillmentOrderId, 'fulfillmentOrderId'),
      accountIdHash,
      externalOrderIdHash,
      shipmentIdHash,
      waybillIdHash,
      sourceReferenceHash: this.normalizeOptionalHash(command.sourceReferenceHash, 'sourceReferenceHash')
        || this.hashSnapshotIdentity(accountIdHash, externalOrderIdHash, shipmentIdHash, waybillIdHash),
      status: command.status || 'active',
      reasonCode: this.normalizeRequiredString(command.reasonCode, 'reasonCode'),
      actor: this.normalizeRequiredString(command.actor, 'actor'),
    };
  }

  private assertAllegroSnapshotIdentity(snapshot: AllegroShipmentStatusSnapshot): void {
    if (!snapshot || snapshot.contract !== 'allegro.shipment_status_snapshot.v1' || snapshot.channel !== 'allegro') {
      throw new BadRequestException('Unsupported Allegro shipment snapshot correlation contract');
    }
    this.normalizeRequiredHash(snapshot.accountId, 'snapshot.accountId');
    this.normalizeRequiredHash(snapshot.order?.externalOrderId, 'snapshot.order.externalOrderId');
    this.normalizeOptionalHash(snapshot.shipment?.shipmentId, 'snapshot.shipment.shipmentId');
    this.normalizeOptionalHash(snapshot.shipment?.waybillHash, 'snapshot.shipment.waybillHash');
  }

  private hashSnapshotIdentity(
    accountIdHash: string | undefined,
    externalOrderIdHash: string,
    shipmentIdHash?: string | null,
    waybillIdHash?: string | null,
  ): string {
    return `sha256:${createHash('sha256')
      .update([
        accountIdHash || 'sha256:unknown-account',
        externalOrderIdHash,
        shipmentIdHash || 'sha256:unknown-shipment',
        waybillIdHash || 'sha256:unknown-waybill',
      ].join('|'))
      .digest('hex')}`;
  }

  private normalizeRequiredHash(value: string | undefined | null, fieldName: string): string {
    const normalized = this.normalizeRequiredString(value || undefined, fieldName);
    if (!HASH_PATTERN.test(normalized)) {
      throw new BadRequestException(`${fieldName} must be a sha256 hash`);
    }
    return normalized;
  }

  private normalizeOptionalHash(value: string | undefined | null, fieldName: string): string | undefined {
    if (value === undefined || value === null || value.trim().length === 0) return undefined;
    return this.normalizeRequiredHash(value, fieldName);
  }

  private normalizeRequiredString(value: string | undefined, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException(`${fieldName} is required`);
    }
    return value.trim();
  }
}
