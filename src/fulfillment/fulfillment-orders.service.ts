import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { LoggerService } from '../logger/logger.service';
import { StockReservation } from '../reservations/stock-reservation.entity';
import { CreateFulfillmentOrderDto, FulfillmentOrderItemDto, FulfillmentOrderStatusTransitionDto, FulfillmentOrderTransitionDto, InternalDeliveryStatusClass, InternalDeliveryStatusUpdateDto } from './dto/fulfillment-order.dto';
import { FulfillmentOrderLine } from './fulfillment-order-line.entity';
import {
  FulfillmentCustomerContact,
  FulfillmentDeliveryAddress,
  FulfillmentOrder,
  FulfillmentOrderStatus,
} from './fulfillment-order.entity';
import { FulfillmentProviderStatusLedgerService } from './fulfillment-provider-status-ledger.service';

interface FulfillmentOrderCommand extends CreateFulfillmentOrderDto {
  actor?: string;
}

interface FulfillmentTransitionCommand extends FulfillmentOrderTransitionDto {
  actor?: string;
}

interface FulfillmentStatusTransitionCommand extends FulfillmentOrderStatusTransitionDto {
  actor?: string;
}

interface InternalDeliveryStatusCommand extends InternalDeliveryStatusUpdateDto {
  actor?: string;
}

interface NormalizedFulfillmentOrder {
  orderId: string;
  orderNumber?: string;
  channel?: string;
  shippingMethod: string;
  deliveryAddress: FulfillmentDeliveryAddress;
  customerContact?: FulfillmentCustomerContact;
  items: NormalizedFulfillmentItem[];
  reasonCode: string;
  actor: string;
  reference?: string;
}

interface NormalizedFulfillmentItem {
  orderItemId: string;
  reservationId: string;
  productId: string;
  sku?: string;
  title: string;
  warehouseId: string;
  quantity: number;
}

@Injectable()
export class FulfillmentOrdersService {
  constructor(
    @InjectRepository(FulfillmentOrder)
    private readonly fulfillmentOrderRepository: Repository<FulfillmentOrder>,
    private readonly dataSource: DataSource,
    private readonly logger: LoggerService,
    private readonly providerStatusLedgerService: FulfillmentProviderStatusLedgerService,
  ) {}

  async findByOrder(orderId: string): Promise<FulfillmentOrder> {
    const order = await this.fulfillmentOrderRepository.findOne({
      where: { orderId },
      relations: ['lines'],
    });

    if (!order) {
      throw new NotFoundException(`Fulfillment order not found for order ${orderId}`);
    }

    return order;
  }

  async createHandoff(body: FulfillmentOrderCommand): Promise<FulfillmentOrder> {
    const normalized = this.normalizeCreateCommand(body);
    return this.dataSource.transaction(async (manager) => {
      const orderRepository = manager.getRepository(FulfillmentOrder);
      const lineRepository = manager.getRepository(FulfillmentOrderLine);
      const existing = await orderRepository.findOne({
        where: { orderId: normalized.orderId },
        relations: ['lines'],
      });

      if (existing) {
        if (this.isEquivalentHandoff(existing, normalized)) {
          return existing;
        }
        throw new ConflictException(`Fulfillment order already exists for order ${normalized.orderId}`);
      }

      await this.assertReservationsReady(manager, normalized);
      await this.assertReservationIdsUnused(lineRepository, normalized.items.map((item) => item.reservationId));

      const order = orderRepository.create({
        orderId: normalized.orderId,
        orderNumber: normalized.orderNumber,
        channel: normalized.channel,
        status: 'requested',
        shippingMethod: normalized.shippingMethod,
        deliveryAddress: normalized.deliveryAddress,
        customerContact: normalized.customerContact,
        reasonCode: normalized.reasonCode,
        requestedBy: normalized.actor,
        reference: normalized.reference,
        lines: normalized.items.map((item) => lineRepository.create({
          orderItemId: item.orderItemId,
          reservationId: item.reservationId,
          productId: item.productId,
          sku: item.sku,
          title: item.title,
          warehouseId: item.warehouseId,
          quantity: item.quantity,
        })),
      });

      const saved = await orderRepository.save(order);
      this.logger.log(
        `fulfillment_order status=requested orderId=${normalized.orderId} lines=${normalized.items.length}`,
        'FulfillmentOrdersService',
      );
      return saved;
    });
  }

  async updateStatus(orderId: string, body: FulfillmentStatusTransitionCommand): Promise<FulfillmentOrder> {
    this.validateRequiredString(body.reasonCode, 'reasonCode');
    this.validateRequiredString(body.actor, 'actor');
    const saved = await this.dataSource.transaction(async (manager) => {
      const orderRepository = manager.getRepository(FulfillmentOrder);
      const order = await orderRepository.findOne({
        where: { orderId },
        relations: ['lines'],
      });

      if (!order) {
        throw new NotFoundException(`Fulfillment order not found for order ${orderId}`);
      }

      if (order.status === body.status) {
        return order;
      }

      this.assertStatusTransition(order.status, body.status);
      order.status = body.status;
      order.statusReasonCode = body.reasonCode;
      order.statusActor = body.actor;
      order.statusReference = body.reference;
      return orderRepository.save(order);
    });

    await this.notifyOrdersStatus(saved, body);
    return saved;
  }

  async recordInternalDeliveryStatus(orderId: string, body: InternalDeliveryStatusCommand): Promise<{
    observation: unknown;
    fulfillmentOrder: FulfillmentOrder | null;
    statusMutationApplied: boolean;
  }> {
    this.validateRequiredString(body.actor, 'actor');
    this.validateRequiredString(body.reasonCode, 'reasonCode');
    const order = await this.findByOrder(orderId);
    const observedAt = this.normalizeObservedAt(body.observedAt);
    const normalizedWarehouseStatus = this.mapInternalDeliveryStatus(body.statusClass);
    const idempotencyKey = this.normalizeOptionalString(body.idempotencyKey)
      || [
        'warehouse-internal-delivery:v1',
        order.orderId,
        body.statusClass,
        observedAt,
        this.normalizeOptionalString(body.deliveryReference) || 'no-reference',
      ].join(':');
    const sourceReferenceHash = this.hashStableJson({
      orderId: order.orderId,
      fulfillmentOrderId: order.id,
      deliveryReference: this.normalizeOptionalString(body.deliveryReference),
    });
    const observation = await this.providerStatusLedgerService.recordObservation({
      idempotencyKey,
      contentHash: this.hashStableJson({
        orderId: order.orderId,
        fulfillmentOrderId: order.id,
        statusClass: body.statusClass,
        observedAt,
        deliveryReference: this.normalizeOptionalString(body.deliveryReference),
      }),
      provider: 'warehouse-internal-delivery',
      sourceChannel: 'internal-delivery-status',
      centralOrderId: order.orderId,
      fulfillmentOrderId: order.id,
      sourceReferenceHash,
      normalizedWarehouseStatus,
      sourceStatusClass: body.statusClass,
      statusObservedAt: observedAt,
      sourceUpdatedAt: observedAt,
      observedAt,
      decision: normalizedWarehouseStatus === 'noop' ? 'noop' : 'accepted',
      rejectionReason: normalizedWarehouseStatus === 'noop' ? 'INTERNAL_DELIVERY_STATUS_NOOP' : undefined,
      sourceMetadata: {
        contract: 'warehouse.internal_delivery_status.v1',
        statusClass: body.statusClass,
        deliveryReference: this.normalizeOptionalString(body.deliveryReference),
      },
    });
    let fulfillmentOrder: FulfillmentOrder | null = null;
    if (observation.decision === 'accepted' && normalizedWarehouseStatus !== 'noop') {
      fulfillmentOrder = await this.updateStatus(orderId, {
        status: normalizedWarehouseStatus,
        reasonCode: body.reasonCode,
        actor: body.actor,
        reference: this.normalizeOptionalString(body.deliveryReference) || idempotencyKey.slice(0, 200),
      });
    }
    return {
      observation,
      fulfillmentOrder,
      statusMutationApplied: Boolean(fulfillmentOrder),
    };
  }

  async cancel(orderId: string, body: FulfillmentTransitionCommand): Promise<FulfillmentOrder> {
    return this.transition(orderId, 'cancelled', body);
  }

  async returnOrder(orderId: string, body: FulfillmentTransitionCommand): Promise<FulfillmentOrder> {
    return this.transition(orderId, 'returned', body);
  }

  private assertStatusTransition(current: FulfillmentOrderStatus, next: FulfillmentOrderStatus): void {
    const allowed: Record<FulfillmentOrderStatus, FulfillmentOrderStatus[]> = {
      requested: ['collecting', 'cancelled', 'returned'],
      collecting: ['forming', 'cancelled', 'returned'],
      forming: ['formed', 'cancelled', 'returned'],
      formed: ['handed_to_delivery', 'cancelled', 'returned'],
      handed_to_delivery: ['in_delivery', 'returned'],
      in_delivery: ['delivered', 'not_delivered', 'returned'],
      delivered: ['returned'],
      not_delivered: ['returned'],
      cancelled: [],
      returned: [],
    };
    if (!allowed[current]?.includes(next)) {
      throw new BadRequestException(`Invalid fulfillment order transition: ${current} -> ${next}`);
    }
  }

  private mapInternalDeliveryStatus(statusClass: InternalDeliveryStatusClass): FulfillmentStatusTransitionCommand['status'] | 'noop' {
    const mapping: Record<InternalDeliveryStatusClass, FulfillmentStatusTransitionCommand['status'] | 'noop'> = {
      IN_DELIVERY: 'in_delivery',
      DELIVERED: 'delivered',
      NOT_DELIVERED: 'not_delivered',
      RETURNED: 'returned',
      UNKNOWN: 'noop',
    };
    return mapping[statusClass] || 'noop';
  }

  private normalizeObservedAt(value?: string): string {
    if (!value) {
      return new Date().toISOString();
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('observedAt must be a valid timestamp');
    }
    return parsed.toISOString();
  }

  private async notifyOrdersStatus(
    order: FulfillmentOrder,
    body: FulfillmentStatusTransitionCommand,
  ): Promise<void> {
    const baseUrl = (process.env.ORDERS_SERVICE_URL || '').replace(/\/$/, '');
    const token = process.env.ORDERS_SERVICE_TOKEN || process.env.JWT_TOKEN;
    if (!baseUrl || !token) {
      this.logger.warn('orders fulfillment status sync skipped: missing Orders URL or token', 'FulfillmentOrdersService');
      return;
    }

    try {
      await axios.put(
        `${baseUrl}/api/orders/${encodeURIComponent(order.orderId)}/warehouse-fulfillment-status`,
        {
          status: order.status,
          reasonCode: body.reasonCode,
          actor: body.actor,
          reference: body.reference,
          fulfillmentOrderId: order.id,
          occurredAt: new Date().toISOString(),
        },
        {
          timeout: 5000,
          headers: {
            'x-service-name': 'warehouse-microservice',
            'x-internal-service-token': token.trim(),
          },
        },
      );
    } catch {
      this.logger.warn('orders fulfillment status sync failed', 'FulfillmentOrdersService');
    }
  }

  private async transition(
    orderId: string,
    status: Extract<FulfillmentOrderStatus, 'cancelled' | 'returned'>,
    body: FulfillmentTransitionCommand,
  ): Promise<FulfillmentOrder> {
    this.validateRequiredString(body.reasonCode, 'reasonCode');
    this.validateRequiredString(body.actor, 'actor');

    return this.dataSource.transaction(async (manager) => {
      const orderRepository = manager.getRepository(FulfillmentOrder);
      const order = await orderRepository.findOne({
        where: { orderId },
        relations: ['lines'],
      });

      if (!order) {
        throw new NotFoundException(`Fulfillment order not found for order ${orderId}`);
      }

      if (order.status === status) {
        return order;
      }

      if (order.status !== 'requested') {
        throw new BadRequestException(`Fulfillment order ${orderId} is already ${order.status}`);
      }

      order.status = status;
      order.statusReasonCode = body.reasonCode;
      order.statusActor = body.actor;
      order.statusReference = body.reference;
      if (status === 'cancelled') {
        order.cancelledAt = new Date();
      } else {
        order.returnedAt = new Date();
      }

      return orderRepository.save(order);
    });
  }

  private async assertReservationsReady(manager: EntityManager, normalized: NormalizedFulfillmentOrder): Promise<void> {
    const reservationRepository = manager.getRepository(StockReservation);
    const reservationIds = normalized.items.map((item) => item.reservationId);
    const reservations = await reservationRepository.find({
      where: { id: In(reservationIds) },
    } as any);
    const reservationsById = new Map(reservations.map((reservation) => [reservation.id, reservation]));

    for (const item of normalized.items) {
      const reservation = reservationsById.get(item.reservationId);
      if (!reservation) {
        throw new BadRequestException(`Reservation ${item.reservationId} was not found for fulfillment handoff`);
      }

      if (reservation.orderId !== normalized.orderId) {
        throw new BadRequestException(`Reservation ${item.reservationId} does not belong to order ${normalized.orderId}`);
      }

      if (reservation.status !== 'fulfilled') {
        throw new BadRequestException(`Reservation ${item.reservationId} must be fulfilled before warehouse handoff`);
      }

      if (reservation.productId !== item.productId || reservation.warehouseId !== item.warehouseId) {
        throw new BadRequestException(`Reservation ${item.reservationId} does not match the fulfillment line product and warehouse`);
      }

      if (reservation.quantity !== item.quantity) {
        throw new BadRequestException(`Reservation ${item.reservationId} quantity does not match the fulfillment line`);
      }
    }
  }

  private async assertReservationIdsUnused(
    lineRepository: Repository<FulfillmentOrderLine>,
    reservationIds: string[],
  ): Promise<void> {
    const existingLine = await lineRepository.findOne({
      where: { reservationId: In(reservationIds) },
    } as any);

    if (existingLine) {
      throw new ConflictException(`Reservation ${existingLine.reservationId} is already attached to a fulfillment order`);
    }
  }

  private normalizeCreateCommand(body: FulfillmentOrderCommand): NormalizedFulfillmentOrder {
    this.validateRequiredString(body.orderId, 'orderId');
    this.validateRequiredString(body.shippingMethod, 'shippingMethod');
    this.validateRequiredString(body.reasonCode, 'reasonCode');
    this.validateRequiredString(body.actor, 'actor');

    if (!body.deliveryAddress) {
      throw new BadRequestException('deliveryAddress is required');
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw new BadRequestException('items must contain at least one fulfillment line');
    }

    const items = body.items.map((item, index) => this.normalizeItem(item, index));
    this.assertNoDuplicateReservationIds(items);

    return {
      orderId: body.orderId.trim(),
      orderNumber: this.normalizeOptionalString(body.orderNumber),
      channel: this.normalizeOptionalString(body.channel),
      shippingMethod: body.shippingMethod.trim(),
      deliveryAddress: {
        name: this.normalizeOptionalString(body.deliveryAddress.name),
        street: this.normalizeRequiredNestedString(body.deliveryAddress.street, 'deliveryAddress.street'),
        city: this.normalizeRequiredNestedString(body.deliveryAddress.city, 'deliveryAddress.city'),
        postalCode: this.normalizeRequiredNestedString(body.deliveryAddress.postalCode, 'deliveryAddress.postalCode'),
        country: this.normalizeRequiredNestedString(body.deliveryAddress.country, 'deliveryAddress.country'),
      },
      customerContact: body.customerContact ? {
        name: this.normalizeOptionalString(body.customerContact.name),
        email: this.normalizeOptionalString(body.customerContact.email),
        phone: this.normalizeOptionalString(body.customerContact.phone),
      } : undefined,
      items,
      reasonCode: body.reasonCode.trim(),
      actor: body.actor.trim(),
      reference: this.normalizeOptionalString(body.reference),
    };
  }

  private normalizeItem(item: FulfillmentOrderItemDto, index: number): NormalizedFulfillmentItem {
    if (!item) {
      throw new BadRequestException(`items[${index}] is required`);
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new BadRequestException(`items[${index}].quantity must be a positive integer`);
    }

    return {
      orderItemId: this.normalizeRequiredNestedString(item.orderItemId, `items[${index}].orderItemId`),
      reservationId: this.normalizeRequiredNestedString(item.reservationId, `items[${index}].reservationId`),
      productId: this.normalizeRequiredNestedString(item.productId, `items[${index}].productId`),
      sku: this.normalizeOptionalString(item.sku),
      title: this.normalizeRequiredNestedString(item.title, `items[${index}].title`),
      warehouseId: this.normalizeRequiredNestedString(item.warehouseId, `items[${index}].warehouseId`),
      quantity: item.quantity,
    };
  }

  private assertNoDuplicateReservationIds(items: NormalizedFulfillmentItem[]): void {
    const seen = new Set<string>();
    for (const item of items) {
      if (seen.has(item.reservationId)) {
        throw new BadRequestException(`Duplicate reservationId ${item.reservationId} in fulfillment handoff`);
      }
      seen.add(item.reservationId);
    }
  }

  private isEquivalentHandoff(existing: FulfillmentOrder, normalized: NormalizedFulfillmentOrder): boolean {
    return JSON.stringify(this.toComparable(existing)) === JSON.stringify({
      orderId: normalized.orderId,
      orderNumber: normalized.orderNumber ?? null,
      channel: normalized.channel ?? null,
      shippingMethod: normalized.shippingMethod,
      deliveryAddress: this.compactObject(normalized.deliveryAddress),
      customerContact: normalized.customerContact ? this.compactObject(normalized.customerContact) : null,
      items: this.sortItems(normalized.items),
    });
  }

  private toComparable(existing: FulfillmentOrder): Record<string, unknown> {
    return {
      orderId: existing.orderId,
      orderNumber: existing.orderNumber ?? null,
      channel: existing.channel ?? null,
      shippingMethod: existing.shippingMethod,
      deliveryAddress: this.compactObject(existing.deliveryAddress),
      customerContact: existing.customerContact ? this.compactObject(existing.customerContact) : null,
      items: this.sortItems((existing.lines || []).map((line) => ({
        orderItemId: line.orderItemId,
        reservationId: line.reservationId,
        productId: line.productId,
        sku: line.sku,
        title: line.title,
        warehouseId: line.warehouseId,
        quantity: line.quantity,
      }))),
    };
  }

  private sortItems(items: NormalizedFulfillmentItem[]): NormalizedFulfillmentItem[] {
    return [...items]
      .map((item) => ({
        orderItemId: item.orderItemId,
        reservationId: item.reservationId,
        productId: item.productId,
        sku: item.sku ?? null,
        title: item.title,
        warehouseId: item.warehouseId,
        quantity: item.quantity,
      } as any))
      .sort((left, right) => left.reservationId.localeCompare(right.reservationId));
  }

  private compactObject(value: object): Record<string, unknown> {
    return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
  }

  private normalizeRequiredNestedString(value: string | undefined, fieldName: string): string {
    this.validateRequiredString(value, fieldName);
    return value.trim();
  }

  private validateRequiredString(value: string | undefined, fieldName: string): void {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException(`${fieldName} is required`);
    }
  }

  private normalizeOptionalString(value: string | undefined | null): string | undefined {
    if (typeof value !== 'string') return undefined;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  private hashStableJson(value: unknown): string {
    return `sha256:${createHash('sha256').update(JSON.stringify(value)).digest('hex')}`;
  }
}
