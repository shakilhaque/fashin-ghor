import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Gender, Product, ProductVariant } from '@prisma/client';
import { ProductsService } from './products.service';
import { ProductsRepository, ProductWithRelations } from './products.repository';
import { CategoriesService } from '../categories/categories.service';
import { BrandsService } from '../brands/brands.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: jest.Mocked<ProductsRepository>;
  let categoriesService: jest.Mocked<CategoriesService>;
  let brandsService: jest.Mocked<BrandsService>;

  const makeProduct = (overrides: Partial<Product> = {}): Product => ({
    id: 'prod-1',
    sku: 'SHIRT-001',
    barcode: null,
    name: 'Classic Shirt',
    slug: 'classic-shirt',
    description: 'A shirt',
    brandId: null,
    categoryId: null,
    gender: null,
    season: null,
    material: null,
    tags: [],
    costPrice: 0,
    price: 49.99,
    comparePrice: null,
    discount: 0,
    vat: 0,
    stock: 0,
    isFeatured: false,
    isDigital: false,
    isBundle: false,
    isActive: true,
    weight: null,
    dimensions: null,
    metaTitle: null,
    metaDesc: null,
    metaKeywords: [],
    jsonLd: null,
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const makeVariant = (overrides: Partial<ProductVariant> = {}): ProductVariant => ({
    id: 'var-1',
    productId: 'prod-1',
    sku: 'SHIRT-001-BLK-M',
    color: 'Black',
    size: 'M',
    stock: 10,
    price: null,
    imageUrl: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const makeProductWithRelations = (overrides: Partial<ProductWithRelations> = {}): ProductWithRelations =>
    ({
      ...makeProduct(),
      images: [],
      variants: [],
      brand: null,
      category: null,
      ...overrides,
    }) as ProductWithRelations;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: ProductsRepository,
          useValue: {
            findMany: jest.fn(),
            count: jest.fn(),
            findBySlug: jest.fn(),
            findById: jest.fn(),
            findBySku: jest.fn(),
            findByBarcode: jest.fn(),
            findVariantBySku: jest.fn(),
            findVariantsByProduct: jest.fn(),
            countOrderItems: jest.fn(),
            create: jest.fn(),
            updateBase: jest.fn(),
            delete: jest.fn(),
            replaceImages: jest.fn(),
            syncVariants: jest.fn(),
          },
        },
        {
          provide: CategoriesService,
          useValue: { getByIdOrThrow: jest.fn() },
        },
        {
          provide: BrandsService,
          useValue: { getByIdOrThrow: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(ProductsService);
    repository = module.get(ProductsRepository);
    categoriesService = module.get(CategoriesService);
    brandsService = module.get(BrandsService);
  });

  describe('create', () => {
    it('throws ConflictException when the SKU is already taken', async () => {
      repository.findBySku.mockResolvedValue(makeProduct());
      await expect(
        service.create({ sku: 'SHIRT-001', name: 'New Shirt', description: 'desc', price: 10 }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when the barcode is already taken', async () => {
      repository.findBySku.mockResolvedValue(null);
      repository.findByBarcode.mockResolvedValue(makeProduct());
      await expect(
        service.create({
          sku: 'NEW-SKU',
          name: 'New Shirt',
          description: 'desc',
          price: 10,
          barcode: '12345',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when the brand does not exist', async () => {
      repository.findBySku.mockResolvedValue(null);
      brandsService.getByIdOrThrow.mockRejectedValue(new NotFoundException('Brand not found'));

      await expect(
        service.create({
          sku: 'NEW-SKU',
          name: 'New Shirt',
          description: 'desc',
          price: 10,
          brandId: 'missing-brand',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the category does not exist', async () => {
      repository.findBySku.mockResolvedValue(null);
      categoriesService.getByIdOrThrow.mockRejectedValue(new NotFoundException('Category not found'));

      await expect(
        service.create({
          sku: 'NEW-SKU',
          name: 'New Shirt',
          description: 'desc',
          price: 10,
          categoryId: 'missing-category',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects duplicate variant SKUs within the same request', async () => {
      repository.findBySku.mockResolvedValue(null);
      repository.findBySlug.mockResolvedValue(null);

      await expect(
        service.create({
          sku: 'NEW-SKU',
          name: 'New Shirt',
          description: 'desc',
          price: 10,
          variants: [
            { sku: 'VAR-1', stock: 1 },
            { sku: 'VAR-1', stock: 2 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a variant SKU already used by another product', async () => {
      repository.findBySku.mockResolvedValue(null);
      repository.findBySlug.mockResolvedValue(null);
      repository.findVariantBySku.mockResolvedValue(makeVariant());

      await expect(
        service.create({
          sku: 'NEW-SKU',
          name: 'New Shirt',
          description: 'desc',
          price: 10,
          variants: [{ sku: 'SHIRT-001-BLK-M', stock: 1 }],
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('auto-generates a unique slug and creates the product', async () => {
      repository.findBySku.mockResolvedValue(null);
      repository.findBySlug.mockResolvedValueOnce(makeProductWithRelations({ slug: 'new-shirt' })); // collision
      repository.findBySlug.mockResolvedValueOnce(null); // new-shirt-2 free
      repository.create.mockResolvedValue(makeProductWithRelations({ slug: 'new-shirt-2' }));

      await service.create({ sku: 'NEW-SKU', name: 'New Shirt', description: 'desc', price: 10 });

      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ slug: 'new-shirt-2' }));
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the product does not exist', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.update('missing', { name: 'X' })).rejects.toThrow(NotFoundException);
    });

    it('rejects a variant id that does not belong to this product', async () => {
      repository.findById.mockResolvedValue(makeProductWithRelations({ variants: [makeVariant()] }));

      await expect(
        service.update('prod-1', { variants: [{ id: 'not-mine', sku: 'X' }] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('syncs variants: deletes missing, updates existing, creates new', async () => {
      const existingVariant = makeVariant({ id: 'var-1', sku: 'SHIRT-001-BLK-M' });
      repository.findById.mockResolvedValue(
        makeProductWithRelations({ variants: [existingVariant] }),
      );
      repository.findVariantBySku.mockResolvedValue(null);
      repository.updateBase.mockResolvedValue(makeProductWithRelations());

      await service.update('prod-1', {
        variants: [
          { id: 'var-1', sku: 'SHIRT-001-BLK-M-UPDATED', stock: 5 },
          { sku: 'SHIRT-001-BLK-L', stock: 3 },
        ],
      });

      expect(repository.syncVariants).toHaveBeenCalledWith(
        [],
        [expect.objectContaining({ id: 'var-1' })],
        [expect.objectContaining({ sku: 'SHIRT-001-BLK-L' })],
      );
    });

    it('deletes variants omitted from the update payload', async () => {
      const v1 = makeVariant({ id: 'var-1' });
      const v2 = makeVariant({ id: 'var-2', sku: 'SHIRT-001-BLK-L' });
      repository.findById.mockResolvedValue(makeProductWithRelations({ variants: [v1, v2] }));
      repository.findVariantBySku.mockResolvedValue(null);
      repository.updateBase.mockResolvedValue(makeProductWithRelations());

      await service.update('prod-1', { variants: [{ id: 'var-1', sku: v1.sku, stock: 1 }] });

      expect(repository.syncVariants).toHaveBeenCalledWith(
        ['var-2'],
        [expect.objectContaining({ id: 'var-1' })],
        [],
      );
    });
  });

  describe('remove', () => {
    it('throws BadRequestException when the product has existing orders', async () => {
      repository.findById.mockResolvedValue(makeProductWithRelations());
      repository.countOrderItems.mockResolvedValue(2);
      await expect(service.remove('prod-1')).rejects.toThrow(BadRequestException);
    });

    it('deletes a product with no orders', async () => {
      repository.findById.mockResolvedValue(makeProductWithRelations());
      repository.countOrderItems.mockResolvedValue(0);
      repository.delete.mockResolvedValue(makeProduct());

      await service.remove('prod-1');
      expect(repository.delete).toHaveBeenCalledWith('prod-1');
    });
  });

  describe('listPublic', () => {
    it('always scopes the query to active products', async () => {
      repository.findMany.mockResolvedValue([]);
      repository.count.mockResolvedValue(0);

      await service.listPublic({ page: 1, limit: 20, gender: Gender.MEN });

      expect(repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isActive: true, gender: Gender.MEN }) }),
      );
    });
  });
});
