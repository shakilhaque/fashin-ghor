import { Injectable } from '@nestjs/common';
import { Address, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AddressesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyByUser(userId: string): Promise<Address[]> {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  findById(id: string): Promise<Address | null> {
    return this.prisma.address.findUnique({ where: { id } });
  }

  create(data: Prisma.AddressCreateInput): Promise<Address> {
    return this.prisma.address.create({ data });
  }

  update(id: string, data: Prisma.AddressUpdateInput): Promise<Address> {
    return this.prisma.address.update({ where: { id }, data });
  }

  delete(id: string): Promise<Address> {
    return this.prisma.address.delete({ where: { id } });
  }

  unsetDefaultForUser(userId: string): Promise<{ count: number }> {
    return this.prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }
}
