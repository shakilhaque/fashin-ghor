import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsBoolean, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { emptyStringToUndefined } from '../../../common/utils/transform.util';

export class CreateBrandDto {
  @ApiProperty({ example: 'LuxeMode Originals' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'luxemode-originals', description: 'Auto-generated from name if omitted' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @ApiPropertyOptional({ example: 'https://cdn.luxemode.com/brands/logo.png' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'Premium in-house fashion label' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'BD' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;

  @ApiPropertyOptional({ example: 'https://luxemode.com' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

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
