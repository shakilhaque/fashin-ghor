import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProductsRepository, ProductWithRelations } from './products.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { ProductVariantInputDto } from './dto/product-variant-input.dto';
import { slugify } from '../../common/utils/slugify.util';
import { CategoriesService } from '../categories/categories.service';
import { BrandsService } from '../brands/brands.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly categoriesService: CategoriesService,
    private readonly brandsService: BrandsService,
  ) {}

  async listPublic(query: ProductQueryDto): Promise<{ data: ProductWithRelations[]; total: number }> {
    const where = this.buildWhere(query, { activeOnly: true });
    return this.paginate(where, query);
  }

  async listAdmin(query: ProductQueryDto): Promise<{ data: ProductWithRelations[]; total: number }> {
    const where = this.buildWhere(query, { activeOnly: false });
    return this.paginate(where, query);
  }

  async getBestSellers(limit: number): Promise<ProductWithRelations[]> {
    const rankedIds = await this.productsRepository.findTopSellingIds(limit);
    const ranked = rankedIds.length > 0 ? await this.productsRepository.findManyByIds(rankedIds) : [];
    // Preserve sales-rank order — findMany's `id: { in }` does not guarantee it.
    const byId = new Map(ranked.map((p) => [p.id, p]));
    const ordered = rankedIds.map((id) => byId.get(id)).filter((p): p is ProductWithRelations => Boolean(p));

    if (ordered.length < limit) {
      const fallback = await this.productsRepository.findFallbackActive(
        limit - ordered.length,
        ordered.map((p) => p.id),
      );
      ordered.push(...fallback);
    }

    return ordered;
  }

  async getBySlug(slug: string): Promise<ProductWithRelations> {
    const product = await this.productsRepository.findBySlug(slug);
    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async getByIdOrThrow(id: string): Promise<ProductWithRelations> {
    const product = await this.productsRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async create(dto: CreateProductDto): Promise<ProductWithRelations> {
    await this.assertSkuAvailable(dto.sku);
    if (dto.barcode) {
      await this.assertBarcodeAvailable(dto.barcode);
    }
    if (dto.brandId) {
      await this.brandsService.getByIdOrThrow(dto.brandId);
    }
    if (dto.categoryId) {
      await this.categoriesService.getByIdOrThrow(dto.categoryId);
    }

    const slug = dto.slug ? await this.assertSlugAvailable(dto.slug) : await this.generateUniqueSlug(dto.name);

    if (dto.variants?.length) {
      await this.assertVariantSkusAvailable(dto.variants);
    }

    const data: Prisma.ProductCreateInput = {
      sku: dto.sku,
      barcode: dto.barcode,
      name: dto.name,
      slug,
      description: dto.description,
      brand: dto.brandId ? { connect: { id: dto.brandId } } : undefined,
      category: dto.categoryId ? { connect: { id: dto.categoryId } } : undefined,
      gender: dto.gender,
      season: dto.season,
      material: dto.material,
      tags: dto.tags ?? [],
      costPrice: dto.costPrice,
      price: dto.price,
      comparePrice: dto.comparePrice,
      discount: dto.discount,
      vat: dto.vat,
      stock: dto.stock,
      isFeatured: dto.isFeatured,
      isDigital: dto.isDigital,
      isBundle: dto.isBundle,
      isActive: dto.isActive,
      weight: dto.weight,
      dimensions: dto.dimensions as unknown as Prisma.InputJsonValue,
      metaTitle: dto.metaTitle,
      metaDesc: dto.metaDesc,
      metaKeywords: dto.metaKeywords ?? [],
      images: dto.images?.length
        ? { create: dto.images.map((image, index) => ({ ...image, position: image.position ?? index })) }
        : undefined,
      variants: dto.variants?.length
        ? {
            create: dto.variants.map((variant) => ({
              sku: variant.sku,
              color: variant.color,
              size: variant.size,
              stock: variant.stock ?? 0,
              price: variant.price,
              imageUrl: variant.imageUrl,
            })),
          }
        : undefined,
    };

    return this.productsRepository.create(data);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductWithRelations> {
    const existing = await this.getByIdOrThrow(id);

    if (dto.sku && dto.sku !== existing.sku) {
      await this.assertSkuAvailable(dto.sku);
    }
    if (dto.barcode && dto.barcode !== existing.barcode) {
      await this.assertBarcodeAvailable(dto.barcode);
    }
    if (dto.brandId !== undefined && dto.brandId !== existing.brandId && dto.brandId) {
      await this.brandsService.getByIdOrThrow(dto.brandId);
    }
    if (dto.categoryId !== undefined && dto.categoryId !== existing.categoryId && dto.categoryId) {
      await this.categoriesService.getByIdOrThrow(dto.categoryId);
    }

    let slug = existing.slug;
    if (dto.slug && dto.slug !== existing.slug) {
      slug = await this.assertSlugAvailable(dto.slug, id);
    }

    if (dto.variants) {
      await this.syncVariants(id, existing, dto.variants);
    }
    if (dto.images) {
      await this.productsRepository.replaceImages(id, dto.images);
    }

    return this.productsRepository.updateBase(id, {
      sku: dto.sku,
      barcode: dto.barcode,
      name: dto.name,
      slug,
      description: dto.description,
      brand:
        dto.brandId !== undefined
          ? dto.brandId
            ? { connect: { id: dto.brandId } }
            : { disconnect: true }
          : undefined,
      category:
        dto.categoryId !== undefined
          ? dto.categoryId
            ? { connect: { id: dto.categoryId } }
            : { disconnect: true }
          : undefined,
      gender: dto.gender,
      season: dto.season,
      material: dto.material,
      tags: dto.tags,
      costPrice: dto.costPrice,
      price: dto.price,
      comparePrice: dto.comparePrice,
      discount: dto.discount,
      vat: dto.vat,
      stock: dto.stock,
      isFeatured: dto.isFeatured,
      isDigital: dto.isDigital,
      isBundle: dto.isBundle,
      isActive: dto.isActive,
      weight: dto.weight,
      dimensions: dto.dimensions !== undefined ? (dto.dimensions as unknown as Prisma.InputJsonValue) : undefined,
      metaTitle: dto.metaTitle,
      metaDesc: dto.metaDesc,
      metaKeywords: dto.metaKeywords,
    });
  }

  async remove(id: string): Promise<void> {
    await this.getByIdOrThrow(id);

    const orderItemCount = await this.productsRepository.countOrderItems(id);
    if (orderItemCount > 0) {
      throw new BadRequestException(
        'This product has existing orders and cannot be deleted. Deactivate it instead.',
      );
    }

    await this.productsRepository.delete(id);
  }

  private async paginate(
    where: Prisma.ProductWhereInput,
    query: ProductQueryDto,
  ): Promise<{ data: ProductWithRelations[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortField = query.sortBy === 'rating' ? 'createdAt' : (query.sortBy ?? 'createdAt');
    const orderBy: Prisma.ProductOrderByWithRelationInput = { [sortField]: query.sortOrder ?? 'desc' };

    const [data, total] = await Promise.all([
      this.productsRepository.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy }),
      this.productsRepository.count(where),
    ]);

    return { data, total };
  }

  private buildWhere(query: ProductQueryDto, { activeOnly }: { activeOnly: boolean }): Prisma.ProductWhereInput {
    return {
      ...(activeOnly && { isActive: true }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { sku: { contains: query.search, mode: 'insensitive' as const } },
          { description: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
      ...(query.categorySlug && { category: { slug: query.categorySlug } }),
      ...(query.brandSlug && { brand: { slug: query.brandSlug } }),
      ...(query.gender && { gender: query.gender }),
      ...(query.isFeatured !== undefined && { isFeatured: query.isFeatured === 'true' }),
      ...(query.isOnSale === 'true' && { discount: { gt: 0 } }),
      ...((query.minPrice || query.maxPrice) && {
        price: {
          ...(query.minPrice && { gte: Number(query.minPrice) }),
          ...(query.maxPrice && { lte: Number(query.maxPrice) }),
        },
      }),
    };
  }

  private async syncVariants(
    productId: string,
    existing: ProductWithRelations,
    variants: ProductVariantInputDto[],
  ): Promise<void> {
    const existingIds = new Set(existing.variants.map((v) => v.id));
    const invalidIds = variants.filter((v) => v.id && !existingIds.has(v.id));
    if (invalidIds.length > 0) {
      throw new BadRequestException('One or more variant ids do not belong to this product');
    }

    await this.assertVariantSkusAvailable(variants);

    const incomingIds = new Set(variants.filter((v) => v.id).map((v) => v.id as string));
    const idsToDelete = [...existingIds].filter((id) => !incomingIds.has(id));

    const toUpdate = variants
      .filter((v): v is ProductVariantInputDto & { id: string } => Boolean(v.id))
      .map((v) => ({
        id: v.id,
        data: {
          sku: v.sku,
          color: v.color,
          size: v.size,
          stock: v.stock ?? 0,
          price: v.price,
          imageUrl: v.imageUrl,
        } satisfies Prisma.ProductVariantUpdateInput,
      }));

    const toCreate = variants
      .filter((v) => !v.id)
      .map((v) => ({
        productId,
        sku: v.sku,
        color: v.color,
        size: v.size,
        stock: v.stock ?? 0,
        price: v.price,
        imageUrl: v.imageUrl,
      } satisfies Prisma.ProductVariantCreateManyInput));

    await this.productsRepository.syncVariants(idsToDelete, toUpdate, toCreate);
  }

  private async assertVariantSkusAvailable(variants: ProductVariantInputDto[]): Promise<void> {
    const skus = variants.map((v) => v.sku);
    const duplicateInPayload = skus.find((sku, index) => skus.indexOf(sku) !== index);
    if (duplicateInPayload) {
      throw new BadRequestException(`Duplicate variant SKU in request: ${duplicateInPayload}`);
    }

    for (const variant of variants) {
      const existing = await this.productsRepository.findVariantBySku(variant.sku);
      if (existing && existing.id !== variant.id) {
        throw new ConflictException(`Variant SKU already in use: ${variant.sku}`);
      }
    }
  }

  private async assertSkuAvailable(sku: string): Promise<void> {
    const existing = await this.productsRepository.findBySku(sku);
    if (existing) {
      throw new ConflictException('This SKU is already in use');
    }
  }

  private async assertBarcodeAvailable(barcode: string): Promise<void> {
    const existing = await this.productsRepository.findByBarcode(barcode);
    if (existing) {
      throw new ConflictException('This barcode is already in use');
    }
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name);
    let candidate = base;
    let counter = 2;

    while (await this.productsRepository.findBySlug(candidate)) {
      candidate = `${base}-${counter}`;
      counter += 1;
    }

    return candidate;
  }

  private async assertSlugAvailable(slug: string, excludeId?: string): Promise<string> {
    const normalized = slugify(slug);
    const existing = await this.productsRepository.findBySlug(normalized);
    if (existing && existing.id !== excludeId) {
      throw new BadRequestException('This slug is already in use');
    }
    return normalized;
  }
}
