import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsBooleanString, IsNumberString, IsIn } from 'class-validator';
import { Gender } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ProductQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by name, SKU, or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandSlug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  minPrice?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  maxPrice?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: 'true' })
  @IsOptional()
  @IsBooleanString()
  isFeatured?: string;

  @ApiPropertyOptional({ example: 'true', description: 'Filter to products with an active discount' })
  @IsOptional()
  @IsBooleanString()
  isOnSale?: string;

  @ApiPropertyOptional({ example: 'true', description: 'Filter to bundle/combo products' })
  @IsOptional()
  @IsBooleanString()
  isBundle?: string;

  @ApiPropertyOptional({ enum: ['price', 'createdAt', 'name', 'rating'], default: 'createdAt' })
  @IsOptional()
  @IsIn(['price', 'createdAt', 'name', 'rating'])
  sortBy?: 'price' | 'createdAt' | 'name' | 'rating';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
