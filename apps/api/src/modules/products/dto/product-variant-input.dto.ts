import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsInt, IsNumber, Min, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { emptyStringToUndefined } from '../../../common/utils/transform.util';

export class ProductVariantInputDto {
  @ApiPropertyOptional({ description: 'Provide to update an existing variant; omit to create a new one' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'SHIRT-001-BLK-M' })
  @IsString()
  @MaxLength(100)
  sku: string;

  @ApiPropertyOptional({ example: 'Black' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @ApiPropertyOptional({ example: 'M' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  size?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ description: 'Overrides the base product price for this variant' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional()
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}
