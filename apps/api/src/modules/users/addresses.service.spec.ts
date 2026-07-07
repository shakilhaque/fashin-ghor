import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { AddressesRepository } from './addresses.repository';

describe('AddressesService', () => {
  let service: AddressesService;
  let repository: jest.Mocked<AddressesRepository>;

  const baseAddress = {
    id: 'addr-1',
    userId: 'user-1',
    label: 'Home',
    recipientName: 'Jane Doe',
    phone: '+8801700000000',
    addressLine1: '123 Fashion Street',
    addressLine2: null,
    city: 'Dhaka',
    state: 'Dhaka Division',
    postalCode: '1207',
    country: 'BD',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressesService,
        {
          provide: AddressesRepository,
          useValue: {
            findManyByUser: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            unsetDefaultForUser: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AddressesService);
    repository = module.get(AddressesRepository);
  });

  describe('create', () => {
    it('makes the first address default automatically', async () => {
      repository.findManyByUser.mockResolvedValue([]);
      repository.create.mockResolvedValue(baseAddress);

      await service.create('user-1', {
        recipientName: 'Jane Doe',
        phone: '+8801700000000',
        addressLine1: '123 Fashion Street',
        city: 'Dhaka',
        state: 'Dhaka Division',
        postalCode: '1207',
      });

      expect(repository.unsetDefaultForUser).toHaveBeenCalledWith('user-1');
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ isDefault: true }),
      );
    });

    it('does not force-default a second address unless requested', async () => {
      repository.findManyByUser.mockResolvedValue([baseAddress]);
      repository.create.mockResolvedValue({ ...baseAddress, id: 'addr-2', isDefault: false });

      await service.create('user-1', {
        recipientName: 'Jane Doe',
        phone: '+8801700000000',
        addressLine1: '456 Other Street',
        city: 'Dhaka',
        state: 'Dhaka Division',
        postalCode: '1207',
      });

      expect(repository.unsetDefaultForUser).not.toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ isDefault: false }),
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the address does not exist', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.update('user-1', 'missing', {})).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when the address belongs to another user', async () => {
      repository.findById.mockResolvedValue({ ...baseAddress, userId: 'other-user' });
      await expect(service.update('user-1', 'addr-1', {})).rejects.toThrow(ForbiddenException);
    });

    it('unsets other defaults when this address becomes the default', async () => {
      repository.findById.mockResolvedValue({ ...baseAddress, isDefault: false });
      repository.update.mockResolvedValue({ ...baseAddress, isDefault: true });

      await service.update('user-1', 'addr-1', { isDefault: true });

      expect(repository.unsetDefaultForUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('remove', () => {
    it('throws ForbiddenException when removing another user\'s address', async () => {
      repository.findById.mockResolvedValue({ ...baseAddress, userId: 'other-user' });
      await expect(service.remove('user-1', 'addr-1')).rejects.toThrow(ForbiddenException);
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('deletes an owned address', async () => {
      repository.findById.mockResolvedValue(baseAddress);
      repository.delete.mockResolvedValue(baseAddress);

      await service.remove('user-1', 'addr-1');
      expect(repository.delete).toHaveBeenCalledWith('addr-1');
    });
  });
});
