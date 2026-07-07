import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsBoolean, IsInt, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { emptyStringToUndefined } from '../../../common/utils/transform.util';

export class CreateCategoryDto {
  @ApiProperty({ example: "Men's Fashion" })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'mens-fashion', description: 'Auto-generated from name if omitted' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @ApiPropertyOptional({ example: 'Shop the latest in menswear' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://cdn.luxemode.com/categories/mens.jpg' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    description: 'Parent category id. Omit to leave unchanged on update; pass null to clear it.',
  })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  parentId?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

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
}
