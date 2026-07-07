import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BannerType, Prisma } from '@prisma/client';

@Injectable()
export class BannersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActive() {
    const now = new Date();
    return this.prisma.promoBanner.findMany({
      where: {
        isActive: true,
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
      },
      orderBy: [{ type: 'asc' }, { position: 'asc' }],
    });
  }

  findAll() {
    return this.prisma.promoBanner.findMany({ orderBy: [{ type: 'asc' }, { position: 'asc' }] });
  }

  findById(id: string) {
    return this.prisma.promoBanner.findUnique({ where: { id } });
  }

  create(data: Prisma.PromoBannerCreateInput) {
    return this.prisma.promoBanner.create({ data });
  }

  update(id: string, data: Prisma.PromoBannerUpdateInput) {
    return this.prisma.promoBanner.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.promoBanner.delete({ where: { id } });
  }

  async reorder(items: { id: string; position: number; type: BannerType }[]) {
    await Promise.all(
      items.map(({ id, position, type }) =>
        this.prisma.promoBanner.update({ where: { id }, data: { position, type } }),
      ),
    );
  }
}
