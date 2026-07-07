import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStoryDto {
  @ApiProperty({ example: 'Summer Collection' })
  @IsString()
  @MaxLength(100)
  title: string;

  @ApiProperty({ example: 'https://cdn.luxemode.com/stories/cover.jpg' })
  @IsString()
  coverImage: string;

  @ApiPropertyOptional({ example: 'Explore our latest arrivals' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subtitle?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0, description: 'Display order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  position?: number;

  @ApiPropertyOptional({ example: '2025-08-01T00:00:00Z', description: 'Story becomes visible at this time' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ example: '2025-08-07T23:59:59Z', description: 'Story expires at this time' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
