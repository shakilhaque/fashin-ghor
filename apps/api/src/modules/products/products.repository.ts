import { Injectable } from '@nestjs/common';
import { Prisma, Product, ProductVariant } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const detailInclude = {
  images: { orderBy: { position: 'asc' as const } },
  variants: { orderBy: { createdAt: 'asc' as const } },
  brand: true,
  category: true,
} satisfies Prisma.ProductInclude;

export type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof detailInclude }>;

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(params: {
    where: Prisma.ProductWhereInput;
    skip: number;
    take: number;
    orderBy: Prisma.ProductOrderByWithRelationInput;
  }): Promise<ProductWithRelations[]> {
    return this.prisma.product.findMany({ ...params, include: detailInclude });
  }

  count(where: Prisma.ProductWhereInput): Promise<number> {
    return this.prisma.product.count({ where });
  }

  findBySlug(slug: string): Promise<ProductWithRelations | null> {
    return this.prisma.product.findUnique({ where: { slug }, include: detailInclude });
  }

  findById(id: string): Promise<ProductWithRelations | null> {
    return this.prisma.product.findUnique({ where: { id }, include: detailInclude });
  }

  findBySku(sku: string): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { sku } });
  }

  findByBarcode(barcode: string): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { barcode } });
  }

  findVariantBySku(sku: string): Promise<ProductVariant | null> {
    return this.prisma.productVariant.findUnique({ where: { sku } });
  }

  findVariantsByProduct(productId: string): Promise<ProductVariant[]> {
    return this.prisma.productVariant.findMany({ where: { productId } });
  }

  countOrderItems(productId: string): Promise<number> {
    return this.prisma.orderItem.count({ where: { productId } });
  }

  create(data: Prisma.ProductCreateInput): Promise<ProductWithRelations> {
    return this.prisma.product.create({ data, include: detailInclude });
  }

  updateBase(id: string, data: Prisma.ProductUpdateInput): Promise<ProductWithRelations> {
    return this.prisma.product.update({ where: { id }, data, include: detailInclude });
  }

  delete(id: string): Promise<Product> {
    return this.prisma.product.delete({ where: { id } });
  }

  async replaceImages(
    productId: string,
    images: { url: string; altText?: string; position?: number }[],
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.productImage.deleteMany({ where: { productId } }),
      this.prisma.productImage.createMany({
        data: images.map((image, index) => ({
          productId,
          url: image.url,
          altText: image.altText,
          position: image.position ?? index,
        })),
      }),
    ]);
  }

  async syncVariants(
    idsToDelete: string[],
    toUpdate: { id: string; data: Prisma.ProductVariantUpdateInput }[],
    toCreate: Prisma.ProductVariantCreateManyInput[],
  ): Promise<void> {
    const operations: Prisma.PrismaPromise<unknown>[] = [];

    if (idsToDelete.length > 0) {
      operations.push(this.prisma.productVariant.deleteMany({ where: { id: { in: idsToDelete } } }));
    }
    for (const { id, data } of toUpdate) {
      operations.push(this.prisma.productVariant.update({ where: { id }, data }));
    }
    if (toCreate.length > 0) {
      operations.push(this.prisma.productVariant.createMany({ data: toCreate }));
    }

    if (operations.length > 0) {
      await this.prisma.$transaction(operations);
    }
  }
}
