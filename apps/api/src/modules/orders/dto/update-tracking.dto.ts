import { IsOptional, IsString } from 'class-validator';

export class UpdateTrackingDto {
  @IsString()
  trackingNumber: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
