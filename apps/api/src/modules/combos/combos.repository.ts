import { Injectable } from '@nestjs/common';
import { Combo, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const detailInclude = {
  items: {
    orderBy: { position: 'asc' as const },
    include: {
      product: {
        include: { images: { orderBy: { position: 'asc' as const }, take: 1 } },
      },
    },
  },
} satisfies Prisma.ComboInclude;

export type ComboWithItems = Prisma.ComboGetPayload<{ include: typeof detailInclude }>;

@Injectable()
export class CombosRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActive(): Promise<ComboWithItems[]> {
    return this.prisma.combo.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: detailInclude,
    });
  }

  findAll(): Promise<ComboWithItems[]> {
    return this.prisma.combo.findMany({ orderBy: { createdAt: 'desc' }, include: detailInclude });
  }

  findById(id: string): Promise<ComboWithItems | null> {
    return this.prisma.combo.findUnique({ where: { id }, include: detailInclude });
  }

  findBySlug(slug: string): Promise<ComboWithItems | null> {
    return this.prisma.combo.findUnique({ where: { slug }, include: detailInclude });
  }

  async create(
    data: Prisma.ComboCreateInput,
    items: { productId: string; quantity: number }[],
  ): Promise<ComboWithItems> {
    const combo = await this.prisma.combo.create({
      data: {
        ...data,
        items: {
          create: items.map((item, index) => ({
            productId: item.productId,
            quantity: item.quantity,
            position: index,
          })),
        },
      },
      include: detailInclude,
    });
    return combo;
  }

  async update(
    id: string,
    data: Prisma.ComboUpdateInput,
    items?: { productId: string; quantity: number }[],
  ): Promise<ComboWithItems> {
    const operations: Prisma.PrismaPromise<unknown>[] = [
      this.prisma.combo.update({ where: { id }, data }),
    ];

    if (items) {
      operations.push(this.prisma.comboItem.deleteMany({ where: { comboId: id } }));
      operations.push(
        this.prisma.comboItem.createMany({
          data: items.map((item, index) => ({
            comboId: id,
            productId: item.productId,
            quantity: item.quantity,
            position: index,
          })),
        }),
      );
    }

    await this.prisma.$transaction(operations);
    return (await this.findById(id)) as ComboWithItems;
  }

  delete(id: string): Promise<Combo> {
    return this.prisma.combo.delete({ where: { id } });
  }
}
