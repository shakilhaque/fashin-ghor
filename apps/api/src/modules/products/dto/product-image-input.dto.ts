import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsInt, Min, MaxLength } from 'class-validator';

export class ProductImageInputDto {
  @ApiProperty({ example: 'https://cdn.luxemode.com/products/shirt-1.jpg' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ example: 'Front view of the shirt' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  altText?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
