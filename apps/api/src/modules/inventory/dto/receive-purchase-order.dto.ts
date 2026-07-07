import { Type } from 'class-transformer';
import { ArrayMinSize, IsInt, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class ReceiveItemDto {
  @IsUUID()
  itemId: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  receivedQty: number;
}

export class ReceivePurchaseOrderDto {
  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDto)
  @ArrayMinSize(1)
  items: ReceiveItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
