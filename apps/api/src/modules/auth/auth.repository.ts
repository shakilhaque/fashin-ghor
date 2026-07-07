import { Injectable } from '@nestjs/common';
import { Otp, RefreshToken } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  createRefreshToken(data: {
    userId: string;
    token: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({ data });
  }

  findRefreshToken(token: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({ where: { token } });
  }

  revokeRefreshToken(id: string): Promise<RefreshToken> {
    return this.prisma.refreshToken.update({ where: { id }, data: { isRevoked: true } });
  }

  revokeAllRefreshTokensForUser(userId: string): Promise<{ count: number }> {
    return this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  createOtp(data: {
    userId: string;
    code: string;
    type: string;
    expiresAt: Date;
  }): Promise<Otp> {
    return this.prisma.otp.create({ data });
  }

  invalidateActiveOtps(userId: string, type: string): Promise<{ count: number }> {
    return this.prisma.otp.updateMany({
      where: { userId, type, isUsed: false },
      data: { isUsed: true },
    });
  }

  findLatestActiveOtp(userId: string, type: string): Promise<Otp | null> {
    return this.prisma.otp.findFirst({
      where: { userId, type, isUsed: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  markOtpUsed(id: string): Promise<Otp> {
    return this.prisma.otp.update({ where: { id }, data: { isUsed: true } });
  }
}
