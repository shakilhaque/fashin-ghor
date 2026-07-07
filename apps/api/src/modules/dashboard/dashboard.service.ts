import { Injectable } from '@nestjs/common';
import { UserRole, ReviewStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      revenueToday,
      revenueWeek,
      revenueMonth,
      revenueTotal,
      orderCounts,
      totalCustomers,
      newCustomersToday,
      newCustomersWeek,
      newCustomersMonth,
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      pendingReviews,
      recentOrders,
      topSelling,
      salesChart,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: { paymentStatus: 'PAID', createdAt: { gte: todayStart } },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: { paymentStatus: 'PAID', createdAt: { gte: weekStart } },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: { paymentStatus: 'PAID', createdAt: { gte: monthStart } },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { total: true },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.user.count({ where: { role: UserRole.CUSTOMER } }),
      this.prisma.user.count({ where: { role: UserRole.CUSTOMER, createdAt: { gte: todayStart } } }),
      this.prisma.user.count({ where: { role: UserRole.CUSTOMER, createdAt: { gte: weekStart } } }),
      this.prisma.user.count({ where: { role: UserRole.CUSTOMER, createdAt: { gte: monthStart } } }),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.product.count({ where: { isActive: true, stock: { gt: 0, lte: 10 } } }),
      this.prisma.product.count({ where: { isActive: true, stock: 0 } }),
      this.prisma.review.count({ where: { status: ReviewStatus.PENDING } }),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId', 'productName'],
        where: {
          order: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        },
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      this.buildSalesChart(7),
    ]);

    const counts: Record<string, number> = {};
    for (const row of orderCounts) {
      counts[row.status] = row._count.id;
    }

    return {
      revenue: {
        today: revenueToday._sum.total ?? 0,
        week: revenueWeek._sum.total ?? 0,
        month: revenueMonth._sum.total ?? 0,
        total: revenueTotal._sum.total ?? 0,
      },
      orders: {
        total: Object.values(counts).reduce((a, b) => a + b, 0),
        counts,
        pending: counts['PENDING'] ?? 0,
      },
      customers: {
        total: totalCustomers,
        newToday: newCustomersToday,
        newThisWeek: newCustomersWeek,
        newThisMonth: newCustomersMonth,
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
      },
      pendingReviews,
      recentOrders,
      topSelling: topSelling.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantitySold: item._sum.quantity ?? 0,
        revenue: item._sum.totalPrice ?? 0,
      })),
      salesChart,
    };
  }

  private async buildSalesChart(days: number) {
    const results: { date: string; revenue: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const agg = await this.prisma.order.aggregate({
        where: { paymentStatus: 'PAID', createdAt: { gte: dayStart, lt: dayEnd } },
        _sum: { total: true },
      });

      results.push({
        date: dayStart.toISOString().split('T')[0],
        revenue: agg._sum.total ?? 0,
      });
    }

    return results;
  }
}
