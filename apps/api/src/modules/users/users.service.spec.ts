import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;

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
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            findByEmail: jest.fn(),
            findByPhone: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    repository = module.get(UsersRepository);
  });

  describe('getByIdOrThrow', () => {
    it('throws NotFoundException when the user does not exist', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.getByIdOrThrow('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('throws BadRequestException when the new phone belongs to another user', async () => {
      repository.findById.mockResolvedValue(baseUser);
      repository.findByPhone.mockResolvedValue({ ...baseUser, id: 'other-user' });

      await expect(
        service.updateProfile('user-1', { phone: '+8801700000000' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows keeping your own phone number unchanged', async () => {
      repository.findById.mockResolvedValue(baseUser);
      repository.findByPhone.mockResolvedValue(baseUser);
      repository.update.mockResolvedValue(baseUser);

      await expect(
        service.updateProfile('user-1', { phone: '+8801700000000' }),
      ).resolves.toEqual(baseUser);
    });
  });

  describe('changePassword', () => {
    it('throws UnauthorizedException when current password is wrong', async () => {
      const hash = await bcrypt.hash('correct-password', 4);
      repository.findById.mockResolvedValue({ ...baseUser, passwordHash: hash });

      await expect(
        service.changePassword('user-1', { currentPassword: 'wrong', newPassword: 'NewPass1!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('updates the password hash when current password matches', async () => {
      const hash = await bcrypt.hash('correct-password', 4);
      repository.findById.mockResolvedValue({ ...baseUser, passwordHash: hash });
      repository.update.mockResolvedValue(baseUser);

      await service.changePassword('user-1', {
        currentPassword: 'correct-password',
        newPassword: 'NewPass1!',
      });

      expect(repository.update).toHaveBeenCalledWith('user-1', {
        passwordHash: expect.any(String),
      });
    });
  });

  describe('adminUpdateUser', () => {
    it('throws BadRequestException when an admin tries to change their own role', async () => {
      repository.findById.mockResolvedValue(baseUser);

      await expect(
        service.adminUpdateUser('user-1', { role: UserRole.ADMIN }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows an admin to update someone else', async () => {
      repository.findById.mockResolvedValue(baseUser);
      repository.update.mockResolvedValue({ ...baseUser, role: UserRole.MANAGER });

      const result = await service.adminUpdateUser('user-1', { role: UserRole.MANAGER }, 'admin-1');
      expect(result.role).toBe(UserRole.MANAGER);
    });
  });

  describe('deactivateUser', () => {
    it('throws BadRequestException when deactivating your own account', async () => {
      repository.findById.mockResolvedValue(baseUser);
      await expect(service.deactivateUser('user-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('deactivates another user', async () => {
      repository.findById.mockResolvedValue(baseUser);
      repository.update.mockResolvedValue({ ...baseUser, isActive: false });

      const result = await service.deactivateUser('user-1', 'admin-1');
      expect(result.isActive).toBe(false);
    });
  });
});
