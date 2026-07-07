import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Category } from '@prisma/client';
import { CategoriesService } from './categories.service';
import { CategoriesRepository } from './categories.repository';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: jest.Mocked<CategoriesRepository>;

  const makeCategory = (overrides: Partial<Category>): Category => ({
    id: 'cat-1',
    name: 'Category',
    slug: 'category',
    description: null,
    imageUrl: null,
    parentId: null,
    isActive: true,
    sortOrder: 0,
    metaTitle: null,
    metaDesc: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: CategoriesRepository,
          useValue: {
            findAllActive: jest.fn(),
            findAll: jest.fn(),
            findBySlug: jest.fn(),
            findById: jest.fn(),
            countChildren: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(CategoriesService);
    repository = module.get(CategoriesRepository);
  });

  describe('getTree', () => {
    it('nests children under their parent', async () => {
      const root = makeCategory({ id: 'root', parentId: null });
      const child = makeCategory({ id: 'child', parentId: 'root' });
      const grandchild = makeCategory({ id: 'grandchild', parentId: 'child' });
      repository.findAllActive.mockResolvedValue([root, child, grandchild]);

      const tree = await service.getTree();

      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe('root');
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children[0].id).toBe('child');
      expect(tree[0].children[0].children[0].id).toBe('grandchild');
    });
  });

  describe('getBySlug', () => {
    it('throws NotFoundException when the category does not exist', async () => {
      repository.findBySlug.mockResolvedValue(null);
      await expect(service.getBySlug('missing')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the category is inactive', async () => {
      repository.findBySlug.mockResolvedValue(makeCategory({ isActive: false }));
      await expect(service.getBySlug('category')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('throws NotFoundException when the parent does not exist', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(
        service.create({ name: 'New Category', parentId: 'missing-parent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('auto-generates a unique slug when none is provided', async () => {
      repository.findBySlug.mockResolvedValueOnce(makeCategory({ slug: 'shoes' })); // collision
      repository.findBySlug.mockResolvedValueOnce(null); // shoes-2 is free
      repository.create.mockResolvedValue(makeCategory({ slug: 'shoes-2' }));

      await service.create({ name: 'Shoes' });

      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ slug: 'shoes-2' }));
    });

    it('rejects an explicit slug that is already taken', async () => {
      repository.findBySlug.mockResolvedValue(makeCategory({ id: 'other', slug: 'shoes' }));
      await expect(service.create({ name: 'Shoes', slug: 'shoes' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('rejects setting a category as its own parent', async () => {
      repository.findById.mockResolvedValue(makeCategory({ id: 'cat-1', parentId: null }));
      await expect(service.update('cat-1', { parentId: 'cat-1' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects setting a descendant as the parent', async () => {
      const root = makeCategory({ id: 'root', parentId: null });
      const child = makeCategory({ id: 'child', parentId: 'root' });
      repository.findById.mockImplementation((id) =>
        Promise.resolve([root, child].find((c) => c.id === id) ?? null),
      );
      repository.findAll.mockResolvedValue([root, child]);

      await expect(service.update('root', { parentId: 'child' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('allows clearing the parent', async () => {
      const child = makeCategory({ id: 'child', parentId: 'root' });
      repository.findById.mockResolvedValue(child);
      repository.update.mockResolvedValue({ ...child, parentId: null });

      await service.update('child', { parentId: null });

      expect(repository.update).toHaveBeenCalledWith(
        'child',
        expect.objectContaining({ parent: { disconnect: true } }),
      );
    });
  });

  describe('remove', () => {
    it('throws BadRequestException when the category has children', async () => {
      repository.findById.mockResolvedValue(makeCategory({}));
      repository.countChildren.mockResolvedValue(2);
      await expect(service.remove('cat-1')).rejects.toThrow(BadRequestException);
    });

    it('deletes a leaf category', async () => {
      repository.findById.mockResolvedValue(makeCategory({}));
      repository.countChildren.mockResolvedValue(0);
      repository.delete.mockResolvedValue(makeCategory({}));

      await service.remove('cat-1');
      expect(repository.delete).toHaveBeenCalledWith('cat-1');
    });
  });
});
