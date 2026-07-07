import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let authRepository: jest.Mocked<AuthRepository>;
  let mailService: jest.Mocked<MailService>;

  const baseUser = {
    id: 'user-1',
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: null,
    passwordHash: '',
    role: UserRole.CUSTOMER,
    avatar: null,
    isEmailVerified: false,
    isPhoneVerified: false,
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findByPhone: jest.fn(),
            findById: jest.fn(),
            createCustomer: jest.fn(),
            updatePassword: jest.fn(),
            markEmailVerified: jest.fn(),
            updateLastLogin: jest.fn(),
          },
        },
        {
          provide: AuthRepository,
          useValue: {
            createRefreshToken: jest.fn(),
            findRefreshToken: jest.fn(),
            revokeRefreshToken: jest.fn(),
            revokeAllRefreshTokensForUser: jest.fn(),
            createOtp: jest.fn(),
            invalidateActiveOtps: jest.fn(),
            findLatestActiveOtp: jest.fn(),
            markOtpUsed: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: { sendOtpEmail: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((_key: string, fallback?: unknown) => fallback),
            getOrThrow: jest.fn(() => 'test-secret'),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
    authRepository = module.get(AuthRepository);
    mailService = module.get(MailService);
  });

  describe('register', () => {
    it('throws ConflictException when email is already taken', async () => {
      usersService.findByEmail.mockResolvedValue(baseUser);

      await expect(
        service.register({ name: 'Jane', email: baseUser.email, password: 'Passw0rd!' }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when phone is already taken', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByPhone.mockResolvedValue(baseUser);

      await expect(
        service.register({
          name: 'Jane',
          email: 'new@example.com',
          password: 'Passw0rd!',
          phone: '+8801700000000',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates a user, issues an OTP, and returns tokens', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByPhone.mockResolvedValue(null);
      usersService.createCustomer.mockResolvedValue(baseUser);
      authRepository.invalidateActiveOtps.mockResolvedValue({ count: 0 });
      authRepository.createOtp.mockResolvedValue({} as never);
      authRepository.createRefreshToken.mockResolvedValue({} as never);

      const result = await service.register({
        name: 'Jane',
        email: baseUser.email,
        password: 'Passw0rd!',
      });

      expect(usersService.createCustomer).toHaveBeenCalled();
      expect(mailService.sendOtpEmail).toHaveBeenCalledWith(
        baseUser.email,
        expect.any(String),
        'email_verify',
      );
      expect(result.tokens.accessToken).toBe('signed.jwt.token');
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });

  describe('validateUser', () => {
    it('throws UnauthorizedException for an unknown email', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(service.validateUser('nobody@example.com', 'whatever')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException for a wrong password', async () => {
      const hash = await bcrypt.hash('correct-password', 4);
      usersService.findByEmail.mockResolvedValue({ ...baseUser, passwordHash: hash });

      await expect(service.validateUser(baseUser.email, 'wrong-password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('returns the user when the password matches', async () => {
      const hash = await bcrypt.hash('correct-password', 4);
      usersService.findByEmail.mockResolvedValue({ ...baseUser, passwordHash: hash });

      const result = await service.validateUser(baseUser.email, 'correct-password');
      expect(result.email).toBe(baseUser.email);
    });
  });

  describe('refreshTokens', () => {
    it('throws when the stored token is revoked', async () => {
      authRepository.findRefreshToken.mockResolvedValue({
        id: 'rt-1',
        token: 'old-token',
        userId: baseUser.id,
        isRevoked: true,
        expiresAt: new Date(Date.now() + 10000),
        createdAt: new Date(),
      });

      await expect(service.refreshTokens('old-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws when the stored token has expired', async () => {
      authRepository.findRefreshToken.mockResolvedValue({
        id: 'rt-1',
        token: 'old-token',
        userId: baseUser.id,
        isRevoked: false,
        expiresAt: new Date(Date.now() - 10000),
        createdAt: new Date(),
      });

      await expect(service.refreshTokens('old-token')).rejects.toThrow(UnauthorizedException);
    });

    it('rotates the token: revokes the old one and issues a new pair', async () => {
      authRepository.findRefreshToken.mockResolvedValue({
        id: 'rt-1',
        token: 'old-token',
        userId: baseUser.id,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 10000),
        createdAt: new Date(),
      });
      usersService.findById.mockResolvedValue(baseUser);
      authRepository.createRefreshToken.mockResolvedValue({} as never);

      const tokens = await service.refreshTokens('old-token');

      expect(authRepository.revokeRefreshToken).toHaveBeenCalledWith('rt-1');
      expect(tokens.accessToken).toBe('signed.jwt.token');
    });
  });

  describe('resetPassword', () => {
    it('throws BadRequestException when no active OTP matches', async () => {
      usersService.findByEmail.mockResolvedValue(baseUser);
      authRepository.findLatestActiveOtp.mockResolvedValue(null);

      await expect(
        service.resetPassword({ email: baseUser.email, otp: '123456', newPassword: 'NewPass1!' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('updates the password and revokes existing sessions when the OTP matches', async () => {
      const hashedOtp = await bcrypt.hash('123456', 4);
      usersService.findByEmail.mockResolvedValue(baseUser);
      authRepository.findLatestActiveOtp.mockResolvedValue({
        id: 'otp-1',
        userId: baseUser.id,
        code: hashedOtp,
        type: 'forgot_password',
        expiresAt: new Date(Date.now() + 10000),
        isUsed: false,
        createdAt: new Date(),
      });

      await service.resetPassword({
        email: baseUser.email,
        otp: '123456',
        newPassword: 'NewPass1!',
      });

      expect(authRepository.markOtpUsed).toHaveBeenCalledWith('otp-1');
      expect(usersService.updatePassword).toHaveBeenCalledWith(baseUser.id, expect.any(String));
      expect(authRepository.revokeAllRefreshTokensForUser).toHaveBeenCalledWith(baseUser.id);
    });
  });
});
