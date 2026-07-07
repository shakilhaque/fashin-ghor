import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { toSafeUser, SafeUser } from '../users/users.mapper';
import { MailService } from '../mail/mail.service';
import { AuthRepository } from './auth.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { AuthTokens } from './interfaces/auth-tokens.interface';
import { generateOtpCode } from './utils/otp.util';
import { parseDurationMs } from './utils/duration.util';

const BCRYPT_ROUNDS = 12;
const OTP_TYPE_EMAIL_VERIFY = 'email_verify';
const OTP_TYPE_FORGOT_PASSWORD = 'forgot_password';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly authRepository: AuthRepository,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    if (dto.phone) {
      const existingPhone = await this.usersService.findByPhone(dto.phone);
      if (existingPhone) {
        throw new ConflictException('An account with this phone number already exists');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.usersService.createCustomer({
      name: dto.name,
      email: dto.email,
      passwordHash,
      phone: dto.phone,
    });

    await this.issueOtp(user, OTP_TYPE_EMAIL_VERIFY);

    const tokens = await this.generateTokens(user);
    return { user: toSafeUser(user), tokens };
  }

  async getProfile(userId: string): Promise<SafeUser> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return toSafeUser(user);
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return user;
  }

  async login(dto: LoginDto): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const user = await this.validateUser(dto.email, dto.password);
    await this.usersService.updateLastLogin(user.id);
    const tokens = await this.generateTokens(user);
    return { user: toSafeUser(user), tokens };
  }

  async refreshTokens(oldRefreshToken: string): Promise<AuthTokens> {
    const stored = await this.authRepository.findRefreshToken(oldRefreshToken);
    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(stored.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.authRepository.revokeRefreshToken(stored.id);
    return this.generateTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    const stored = await this.authRepository.findRefreshToken(refreshToken);
    if (stored && !stored.isRevoked) {
      await this.authRepository.revokeRefreshToken(stored.id);
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    // Always succeed to avoid leaking which emails are registered.
    if (!user) return;
    await this.issueOtp(user, OTP_TYPE_FORGOT_PASSWORD);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.consumeOtp(user.id, OTP_TYPE_FORGOT_PASSWORD, dto.otp);

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.usersService.updatePassword(user.id, passwordHash);
    await this.authRepository.revokeAllRefreshTokensForUser(user.id);
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new BadRequestException('Invalid verification code');
    }
    await this.consumeOtp(user.id, OTP_TYPE_EMAIL_VERIFY, dto.otp);
    await this.usersService.markEmailVerified(user.id);
  }

  async resendOtp(dto: ResendOtpDto): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) return;
    await this.issueOtp(user, dto.type);
  }

  private async issueOtp(user: User, type: string): Promise<void> {
    await this.authRepository.invalidateActiveOtps(user.id, type);

    const otpLength = this.config.get<number>('OTP_LENGTH', 6);
    const otpExpiresInSec = this.config.get<number>('OTP_EXPIRES_IN', 300);
    const code = generateOtpCode(otpLength);

    await this.authRepository.createOtp({
      userId: user.id,
      code: await bcrypt.hash(code, BCRYPT_ROUNDS),
      type,
      expiresAt: new Date(Date.now() + otpExpiresInSec * 1000),
    });

    await this.mailService.sendOtpEmail(
      user.email,
      code,
      type === OTP_TYPE_EMAIL_VERIFY ? OTP_TYPE_EMAIL_VERIFY : OTP_TYPE_FORGOT_PASSWORD,
    );
  }

  private async consumeOtp(userId: string, type: string, code: string): Promise<void> {
    const otp = await this.authRepository.findLatestActiveOtp(userId, type);
    if (!otp) {
      throw new BadRequestException('Invalid or expired verification code');
    }
    const isMatch = await bcrypt.compare(code, otp.code);
    if (!isMatch) {
      throw new BadRequestException('Invalid or expired verification code');
    }
    await this.authRepository.markOtpUsed(otp.id);
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
    });

    const refreshExpiresIn = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpiresIn,
    });

    await this.authRepository.createRefreshToken({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + parseDurationMs(refreshExpiresIn)),
    });

    return { accessToken, refreshToken };
  }
}
