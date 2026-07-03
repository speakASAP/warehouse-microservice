import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { StockMutationAuditDto } from '../../stock/dto/stock-mutation.dto';
import { FulfillmentOrderStatus } from '../fulfillment-order.entity';

export class FulfillmentDeliveryAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  street: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  postalCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2)
  country: string;
}

export class FulfillmentCustomerContactDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;
}

export class FulfillmentOrderItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  orderItemId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  reservationId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  productId: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  warehouseId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateFulfillmentOrderDto extends StockMutationAuditDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  orderId: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  orderNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  channel?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  shippingMethod: string;

  @ValidateNested()
  @Type(() => FulfillmentDeliveryAddressDto)
  deliveryAddress: FulfillmentDeliveryAddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FulfillmentCustomerContactDto)
  customerContact?: FulfillmentCustomerContactDto;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => FulfillmentOrderItemDto)
  items: FulfillmentOrderItemDto[];
}

export class FulfillmentOrderTransitionDto extends StockMutationAuditDto {}

export const FULFILLMENT_ORDER_PROGRESS_STATUSES: FulfillmentOrderStatus[] = [
  'collecting',
  'forming',
  'formed',
  'handed_to_delivery',
  'in_delivery',
  'delivered',
  'not_delivered',
  'returned',
];

export class FulfillmentOrderStatusTransitionDto extends StockMutationAuditDto {
  @IsIn(FULFILLMENT_ORDER_PROGRESS_STATUSES)
  status: Extract<FulfillmentOrderStatus, 'collecting' | 'forming' | 'formed' | 'handed_to_delivery' | 'in_delivery' | 'delivered' | 'not_delivered' | 'returned'>;
}

export const INTERNAL_DELIVERY_STATUS_CLASSES = [
  'IN_DELIVERY',
  'DELIVERED',
  'NOT_DELIVERED',
  'RETURNED',
  'UNKNOWN',
] as const;

export type InternalDeliveryStatusClass = typeof INTERNAL_DELIVERY_STATUS_CLASSES[number];

export class InternalDeliveryStatusUpdateDto extends StockMutationAuditDto {
  @IsIn(INTERNAL_DELIVERY_STATUS_CLASSES)
  statusClass: InternalDeliveryStatusClass;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  deliveryReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  idempotencyKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  observedAt?: string;
}

export class ProviderShipmentCorrelationDto extends StockMutationAuditDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  provider: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sourceChannel: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  accountIdHash?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  externalOrderIdHash: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  shipmentIdHash?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  waybillIdHash?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sourceReferenceHash?: string;
}
