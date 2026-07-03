import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  Equals,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class StockMutationAuditDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  reasonCode: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  actor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reference?: string;
}

export class BundleAggregateReservationBoundaryDto extends StockMutationAuditDto {
  @ValidateIf((_body, value) => value !== undefined)
  @Equals(undefined, { message: 'bundleId is forbidden; reserve existing component productId lines only' })
  bundleId?: never;

  @ValidateIf((_body, value) => value !== undefined)
  @Equals(undefined, { message: 'bundleSku is forbidden; Warehouse does not own synthetic bundle stock in catalog.bundle.v1' })
  bundleSku?: never;

  @ValidateIf((_body, value) => value !== undefined)
  @Equals(undefined, { message: 'bundleStockId is forbidden; Warehouse reserves component stock rows only' })
  bundleStockId?: never;

  @ValidateIf((_body, value) => value !== undefined)
  @Equals(undefined, { message: 'bundleContractVersion is forbidden; Catalog bundle evidence must not become Warehouse stock identity' })
  bundleContractVersion?: never;
}

export class BaseStockMutationDto extends BundleAggregateReservationBoundaryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  productId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  warehouseId: string;
}

export class SetStockDto extends BaseStockMutationDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity: number;
}

export class PositiveStockMutationDto extends BaseStockMutationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class ReserveStockDto extends PositiveStockMutationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  orderId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  channel: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UnreserveStockDto extends ReserveStockDto {}

export class ReservationLifecycleDto extends BundleAggregateReservationBoundaryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  productId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  warehouseId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  orderId: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  channel?: string;
}

export class BatchAvailabilityDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(200, { each: true })
  productIds: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(200, { each: true })
  warehouseIds?: string[];
}

export class ExpireDueReservationsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}
