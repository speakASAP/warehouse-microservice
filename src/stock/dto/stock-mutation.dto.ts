import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class StockMutationAuditDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  reasonCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  actor: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reference?: string;
}

export class BaseStockMutationDto extends StockMutationAuditDto {
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

export class ReservationLifecycleDto extends StockMutationAuditDto {
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
