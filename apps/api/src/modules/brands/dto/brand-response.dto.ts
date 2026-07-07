import { ApiProperty } from '@nestjs/swagger';

export class BrandResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() slug: string;
  @ApiProperty({ nullable: true }) logoUrl: string | null;
  @ApiProperty({ nullable: true }) description: string | null;
  @ApiProperty({ nullable: true }) country: string | null;
  @ApiProperty({ nullable: true }) website: string | null;
  @ApiProperty() isActive: boolean;
}
