import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateAddressDto {
  @ApiPropertyOptional({ example: 'Home', default: 'Home' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @MaxLength(100)
  recipientName: string;

  @ApiProperty({ example: '+8801700000000' })
  @IsString()
  @MaxLength(20)
  phone: string;

  @ApiProperty({ example: '123 Fashion Street' })
  @IsString()
  @MaxLength(200)
  addressLine1: string;

  @ApiPropertyOptional({ example: 'Apt 4B' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine2?: string;

  @ApiProperty({ example: 'Dhaka' })
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: 'Dhaka Division' })
  @IsString()
  @MaxLength(100)
  state: string;

  @ApiProperty({ example: '1207' })
  @IsString()
  @MaxLength(20)
  postalCode: string;

  @ApiPropertyOptional({ example: 'BD', default: 'BD' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
