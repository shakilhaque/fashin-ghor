import { CourierProvider } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class DispatchShipmentDto {
  @IsString()
  orderId: string;

  @IsEnum(CourierProvider)
  courier: CourierProvider;

  @IsOptional()
  @IsString()
  trackingNumber?: string;  // override auto-generated if needed

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
