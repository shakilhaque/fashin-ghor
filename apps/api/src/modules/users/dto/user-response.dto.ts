import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() email: string;
  @ApiProperty({ nullable: true }) phone: string | null;
  @ApiProperty({ nullable: true }) avatar: string | null;
  @ApiProperty({ enum: UserRole }) role: UserRole;
  @ApiProperty() isEmailVerified: boolean;
  @ApiProperty() isPhoneVerified: boolean;
  @ApiProperty() isActive: boolean;
  @ApiProperty({ nullable: true }) lastLoginAt: Date | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class AddressResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() label: string;
  @ApiProperty() recipientName: string;
  @ApiProperty() phone: string;
  @ApiProperty() addressLine1: string;
  @ApiProperty({ nullable: true }) addressLine2: string | null;
  @ApiProperty() city: string;
  @ApiProperty() state: string;
  @ApiProperty() postalCode: string;
  @ApiProperty() country: string;
  @ApiProperty() isDefault: boolean;
}
