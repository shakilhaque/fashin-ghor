import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Brand } from '@prisma/client';
import { BrandsService } from './brands.service';
import { BrandsRepository } from './brands.repository';

describe('BrandsService', () => {
  let service: BrandsService;
  let repository: jest.Mocked<BrandsRepository>;

  const makeBrand = (overrides: Partial<Brand>): Brand => ({
    id: 'brand-1',
    name: 'LuxeMode Originals',
    slug: 'luxemode-originals',
    logoUrl: null,
    description: null,
    country: null,
    website: null,
    isActive: true,
    metaTitle: null,
    metaDesc: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        {
          provide: BrandsRepository,
          useValue: {
            findAllActive: jest.fn(),
            findAll: jest.fn(),
            findBySlug: jest.fn(),
            findById: jest.fn(),
            countProducts: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(BrandsService);
    repository = module.get(BrandsRepository);
  });

  describe('getBySlug', () => {
    it('throws NotFoundException when the brand does not exist', async () => {
      repository.findBySlug.mockResolvedValue(null);
      await expect(service.getBySlug('missing')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the brand is inactive', async () => {
      repository.findBySlug.mockResolvedValue(makeBrand({ isActive: false }));
      await expect(service.getBySlug('luxemode-originals')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('auto-generates a unique slug when none is provided', async () => {
      repository.findBySlug.mockResolvedValueOnce(makeBrand({ slug: 'urban-thread' })); // collision
      repository.findBySlug.mockResolvedValueOnce(null); // urban-thread-2 is free
      repository.create.mockResolvedValue(makeBrand({ slug: 'urban-thread-2' }));

      await service.create({ name: 'Urban Thread' });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'urban-thread-2' }),
      );
    });

    it('rejects an explicit slug that is already taken', async () => {
      repository.findBySlug.mockResolvedValue(makeBrand({ id: 'other', slug: 'urban-thread' }));
      await expect(service.create({ name: 'Urban Thread', slug: 'urban-thread' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the brand does not exist', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.update('missing', { name: 'New Name' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects renaming the slug to one already taken by another brand', async () => {
      repository.findById.mockResolvedValue(makeBrand({}));
      repository.findBySlug.mockResolvedValue(makeBrand({ id: 'other-brand', slug: 'taken-slug' }));

      await expect(service.update('brand-1', { slug: 'taken-slug' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('throws BadRequestException when the brand still has products', async () => {
      repository.findById.mockResolvedValue(makeBrand({}));
      repository.countProducts.mockResolvedValue(3);
      await expect(service.remove('brand-1')).rejects.toThrow(BadRequestException);
    });

    it('deletes a brand with no products', async () => {
      repository.findById.mockResolvedValue(makeBrand({}));
      repository.countProducts.mockResolvedValue(0);
      repository.delete.mockResolvedValue(makeBrand({}));

      await service.remove('brand-1');
      expect(repository.delete).toHaveBeenCalledWith('brand-1');
    });
  });
});
