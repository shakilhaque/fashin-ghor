import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { BannerType, BannerSize } from '@prisma/client';

export class CreateBannerDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() subtitle?: string;
  @IsOptional() @IsString() badgeText?: string;
  @IsString() imageUrl: string;
  @IsOptional() @IsString() linkUrl?: string;
  @IsOptional() @IsString() linkLabel?: string;
  @IsEnum(BannerType) type: BannerType;
  @IsOptional() @IsEnum(BannerSize) size?: BannerSize;
  @IsOptional() @IsNumber() position?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() endDate?: string;
}
