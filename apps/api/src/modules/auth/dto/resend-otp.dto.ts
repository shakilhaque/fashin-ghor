import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn } from 'class-validator';

export class ResendOtpDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'email_verify', enum: ['email_verify', 'forgot_password'] })
  @IsIn(['email_verify', 'forgot_password'])
  type: 'email_verify' | 'forgot_password';
}
