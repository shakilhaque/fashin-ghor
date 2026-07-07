import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

export class ProductImageResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() url: string;
  @ApiProperty({ nullable: true }) altText: string | null;
  @ApiProperty() position: number;
}

export class ProductVariantResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() sku: string;
  @ApiProperty({ nullable: true }) color: string | null;
  @ApiProperty({ nullable: true }) size: string | null;
  @ApiProperty() stock: number;
  @ApiProperty({ nullable: true }) price: number | null;
  @ApiProperty({ nullable: true }) imageUrl: string | null;
}

export class ProductResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() sku: string;
  @ApiProperty() name: string;
  @ApiProperty() slug: string;
  @ApiProperty() description: string;
  @ApiProperty({ enum: Gender, nullable: true }) gender: Gender | null;
  @ApiProperty() price: number;
  @ApiProperty({ nullable: true }) comparePrice: number | null;
  @ApiProperty() discount: number;
  @ApiProperty() stock: number;
  @ApiProperty() isFeatured: boolean;
  @ApiProperty() isActive: boolean;
  @ApiProperty({ type: [ProductImageResponseDto] }) images: ProductImageResponseDto[];
  @ApiProperty({ type: [ProductVariantResponseDto] }) variants: ProductVariantResponseDto[];
}
