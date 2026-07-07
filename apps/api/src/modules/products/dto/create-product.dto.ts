import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  MaxLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Gender } from '@prisma/client';
import { emptyStringToUndefined } from '../../../common/utils/transform.util';
import { ProductImageInputDto } from './product-image-input.dto';
import { ProductVariantInputDto } from './product-variant-input.dto';
import { ProductDimensionsDto } from './product-dimensions.dto';

export class CreateProductDto {
  @ApiProperty({ example: 'SHIRT-001' })
  @IsString()
  @MaxLength(100)
  sku: string;

  @ApiPropertyOptional({ example: '8901234567890' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  barcode?: string;

  @ApiProperty({ example: 'Classic Oxford Shirt' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'classic-oxford-shirt', description: 'Auto-generated from name if omitted' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(220)
  slug?: string;

  @ApiProperty({ example: 'A timeless oxford shirt crafted from premium cotton.' })
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional()
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: 'Summer' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  season?: string;

  @ApiPropertyOptional({ example: '100% Cotton' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  material?: string;

  @ApiPropertyOptional({ type: [String], example: ['shirt', 'formal', 'cotton'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @ApiProperty({ example: 49.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Original price shown struck-through when discounted' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  comparePrice?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  vat?: number;

  @ApiPropertyOptional({ default: 0, description: 'Base stock for products without variants' })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDigital?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isBundle?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({ type: ProductDimensionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductDimensionsDto)
  dimensions?: ProductDimensionsDto;

  @ApiPropertyOptional()
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(160)
  metaTitle?: string;

  @ApiPropertyOptional()
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(320)
  metaDesc?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metaKeywords?: string[];

  @ApiPropertyOptional({ type: [ProductImageInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageInputDto)
  images?: ProductImageInputDto[];

  @ApiPropertyOptional({ type: [ProductVariantInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantInputDto)
  variants?: ProductVariantInputDto[];
}
