import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
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

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  actor?: string;

  @IsOptional()
  @IsDateString()
  observedAt?: string;
}

export class SupplierReconciliationQueryDto {
  @IsOptional()
  @IsIn(['applied', 'conflict'])
  status?: 'applied' | 'conflict';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  supplierId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  warehouseId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  productId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  externalReference?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  reviewed?: boolean;

  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;
}

export class SupplierConflictReviewDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  actor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  operatorNote?: string;
}
