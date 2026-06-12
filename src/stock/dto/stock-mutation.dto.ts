import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

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
}

export class UnreserveStockDto extends ReserveStockDto {}
