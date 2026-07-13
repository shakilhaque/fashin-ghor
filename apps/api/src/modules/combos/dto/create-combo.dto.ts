import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { emptyStringToUndefined } from '../../../common/utils/transform.util';
import { ComboItemInputDto } from './combo-item-input.dto';

export class CreateComboDto {
  @ApiProperty({ example: 'Signature Mom-Daughter Set' })
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ description: 'Auto-generated from name if omitted' })
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(180)
  slug?: string;

  @ApiPropertyOptional()
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({ example: 1400 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 1750 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  comparePrice?: number;

  @ApiPropertyOptional({ description: 'Auto-derived from price/comparePrice if omitted' })
  @IsOptional()
  @IsNumber()
  discount?: number;

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

  @ApiProperty({ type: [ComboItemInputDto], description: 'At least 2 products that make up this combo' })
  @IsArray()
  @ArrayMinSize(2, { message: 'A combo must include at least 2 products' })
  @ValidateNested({ each: true })
  @Type(() => ComboItemInputDto)
  items: ComboItemInputDto[];
}
