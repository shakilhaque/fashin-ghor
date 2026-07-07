import { IsOptional, IsString } from 'class-validator';

export class CheckoutSummaryDto {
  @IsString()
  shippingRateId: string;

  @IsOptional()
  @IsString()
  couponCode?: string;
}
