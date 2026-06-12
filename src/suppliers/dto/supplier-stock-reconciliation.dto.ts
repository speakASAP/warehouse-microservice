import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class SupplierStockReconciliationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  supplierId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  warehouseId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  productId: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  externalReference: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  actor: string;

  @IsOptional()
  @IsDateString()
  observedAt?: string;
}
