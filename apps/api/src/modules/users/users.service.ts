import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { User, UserRole, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findByPhone(phone);
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  async getByIdOrThrow(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  createCustomer(input: {
    name: string;
    email: string;
    passwordHash: string;
    phone?: string;
  }): Promise<User> {
    return this.usersRepository.create({
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      phone: input.phone,
      role: UserRole.CUSTOMER,
    });
  }

  updatePassword(id: string, passwordHash: string): Promise<User> {
    return this.usersRepository.update(id, { passwordHash });
  }

  markEmailVerified(id: string): Promise<User> {
    return this.usersRepository.update(id, { isEmailVerified: true });
  }

  updateLastLogin(id: string): Promise<User> {
    return this.usersRepository.update(id, { lastLoginAt: new Date() });
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<User> {
    await this.getByIdOrThrow(id);

    if (dto.phone) {
      const existingPhone = await this.usersRepository.findByPhone(dto.phone);
      if (existingPhone && existingPhone.id !== id) {
        throw new BadRequestException('This phone number is already in use');
      }
    }

    return this.usersRepository.update(id, {
      name: dto.name,
      phone: dto.phone,
      avatar: dto.avatar,
    });
  }

  async changePassword(id: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.getByIdOrThrow(id);

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.usersRepository.update(id, { passwordHash });
  }

  async listUsers(query: UserQueryDto): Promise<{ data: User[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.UserWhereInput = {
      ...(query.role && { role: query.role }),
      ...(query.isActive !== undefined && { isActive: query.isActive === 'true' }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.usersRepository.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.usersRepository.count(where),
    ]);

    return { data, total };
  }

  async adminUpdateUser(id: string, dto: AdminUpdateUserDto, requesterId: string): Promise<User> {
    await this.getByIdOrThrow(id);

    if (id === requesterId && (dto.role !== undefined || dto.isActive !== undefined)) {
      throw new BadRequestException('You cannot change your own role or active status');
    }

    return this.usersRepository.update(id, {
      name: dto.name,
      phone: dto.phone,
      role: dto.role,
      isActive: dto.isActive,
    });
  }

  async deactivateUser(id: string, requesterId: string): Promise<User> {
    await this.getByIdOrThrow(id);

    if (id === requesterId) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    return this.usersRepository.update(id, { isActive: false });
  }
}
