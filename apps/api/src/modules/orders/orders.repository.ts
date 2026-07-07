import { Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ListOrdersDto } from './dto/list-orders.dto';

const orderInclude = {
  user: { select: { id: true, name: true, email: true, phone: true } },
  address: true,
  items: true,
  statusHistory: { orderBy: { createdAt: 'desc' as const } },
  payments: { orderBy: { createdAt: 'desc' as const } },
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(dto: ListOrdersDto) {
    const { page = 1, limit = 20, status, paymentStatus, paymentMethod, search, dateFrom, dateTo, userId } = dto;

    const where: Prisma.OrderWhereInput = {
      ...(status && { status }),
      ...(paymentStatus && { paymentStatus }),
      ...(paymentMethod && { paymentMethod }),
      ...(userId && { userId }),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom && { gte: new Date(dateFrom) }),
              ...(dateTo && { lte: new Date(dateTo) }),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search, mode: 'insensitive' as const } },
              { user: { name: { contains: search, mode: 'insensitive' as const } } },
              { user: { email: { contains: search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { take: 3 },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    return this.prisma.order.findUnique({ where: { id }, include: orderInclude });
  }

  async findByIdAndUser(id: string, userId: string) {
    return this.prisma.order.findFirst({
      where: { id, userId },
      include: orderInclude,
    });
  }

  async updateStatus(id: string, status: OrderStatus, notes?: string) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status },
        include: orderInclude,
      });
      await tx.orderStatusHistory.create({
        data: { orderId: id, status, notes },
      });
      return updated;
    });
  }

  async updateTracking(id: string, trackingNumber: string, notes?: string) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { trackingNumber },
        include: orderInclude,
      });
      if (notes) {
        await tx.orderStatusHistory.create({
          data: { orderId: id, status: updated.status, notes: `Tracking: ${trackingNumber}. ${notes}` },
        });
      }
      return updated;
    });
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus) {
    return this.prisma.order.update({
      where: { id },
      data: { paymentStatus },
      include: orderInclude,
    });
  }

  async getStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [statusCounts, revenueToday, revenueWeek, revenueMonth, revenueTotal, recentOrders] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: startOfToday }, paymentStatus: 'PAID' },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: startOfWeek }, paymentStatus: 'PAID' },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: startOfMonth }, paymentStatus: 'PAID' },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { total: true },
      }),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } }, items: { take: 1 } },
      }),
    ]);

    const counts: Record<string, number> = {};
    let total = 0;
    for (const row of statusCounts) {
      counts[row.status] = row._count._all;
      total += row._count._all;
    }

    return {
      counts: { ...counts, total },
      revenue: {
        today: revenueToday._sum.total ?? 0,
        week: revenueWeek._sum.total ?? 0,
        month: revenueMonth._sum.total ?? 0,
        total: revenueTotal._sum.total ?? 0,
      },
      recentOrders,
    };
  }

  // For customer — list own orders
  async findByUser(userId: string, page = 1, limit = 10) {
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        include: { items: { take: 3 } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);
    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
