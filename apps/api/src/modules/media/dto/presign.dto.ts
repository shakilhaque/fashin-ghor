import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
] as const;

const ALLOWED_FOLDERS = ['products', 'stories', 'blog', 'brands', 'banners', 'avatars', 'categories', 'combos'] as const;

export class PresignDto {
  @ApiProperty({ example: 'product-hero.jpg' })
  @IsString()
  @MaxLength(200)
  filename: string;

  @ApiProperty({ enum: ALLOWED_TYPES, example: 'image/jpeg' })
  @IsIn(ALLOWED_TYPES)
  contentType: string;

  @ApiPropertyOptional({ enum: ALLOWED_FOLDERS, default: 'products' })
  @IsOptional()
  @IsIn(ALLOWED_FOLDERS)
  folder?: string;
}
