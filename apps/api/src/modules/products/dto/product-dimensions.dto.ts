import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class ProductDimensionsDto {
  @ApiProperty({ example: 30 })
  @IsNumber()
  @Min(0)
  width: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(0)
  height: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(0)
  depth: number;
}
