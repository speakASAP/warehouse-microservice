import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class WarehouseDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['own', 'supplier', 'dropship'])
  type: string;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string | null;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z]{2}$/, { message: 'country must be a 2-letter code' })
  @MaxLength(2)
  country?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  contactEmail?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactPhone?: string | null;

  @IsOptional()
  @IsString()
  supplierId?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}

export class UpdateWarehouseDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsIn(['own', 'supplier', 'dropship'])
  type?: string;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string | null;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z]{2}$/, { message: 'country must be a 2-letter code' })
  @MaxLength(2)
  country?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  contactEmail?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactPhone?: string | null;

  @IsOptional()
  @IsString()
  supplierId?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}

export class BatchWarehouseLogisticsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(200, { each: true })
  productIds: string[];
}
