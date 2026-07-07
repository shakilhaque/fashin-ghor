import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type AnalyticsPeriod = '7d' | '30d' | '90d' | '1y';

const PERIOD_DAYS: Record<AnalyticsPeriod, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
const PERIOD_GRAN: Record<AnalyticsPeriod, string> = { '7d': 'day', '30d': 'day', '90d': 'week', '1y': 'month' };

function pct(curr: number, prev: number): number | null {
  return prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(period: AnalyticsPeriod) {
    const days = PERIOD_DAYS[period];
    const granularity = PERIOD_GRAN[period];
    // Safe: granularity is always 'day', 'week', or 'month'
    const gran = Prisma.raw(`'${granularity}'`);

    const from = new Date();
    from.setDate(from.getDate() - days);

    const prevFrom = new Date(from);
    prevFrom.setDate(prevFrom.getDate() - days);

    const [
      currAgg,
      prevAgg,
      currCustomers,
      prevCustomers,
      revenueTrend,
      customerTrend,
      topProducts,
      categoryRevenue,
      paymentMix,
      ordersByStatus,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: { paymentStatus: 'PAID', createdAt: { gte: from } },
        _sum: { total: true },
        _count: { id: true },
      }),
      this.prisma.order.aggregate({
        where: { paymentStatus: 'PAID', createdAt: { gte: prevFrom, lt: from } },
        _sum: { total: true },
        _count: { id: true },
      }),
      this.prisma.user.count({
        where: { role: UserRole.CUSTOMER, createdAt: { gte: from } },
      }),
      this.prisma.user.count({
        where: { role: UserRole.CUSTOMER, createdAt: { gte: prevFrom, lt: from } },
      }),

      // Daily/weekly/monthly revenue trend
      this.prisma.$queryRaw<{ date: Date; revenue: number }[]>(
        Prisma.sql`
          SELECT DATE_TRUNC(${gran}, "createdAt") AS date,
                 COALESCE(SUM(total), 0)::float    AS revenue
          FROM orders
          WHERE "paymentStatus" = 'PAID'
            AND "createdAt" >= ${from}
          GROUP BY 1
          ORDER BY 1
        `,
      ),

      // Daily/weekly/monthly new customer trend
      this.prisma.$queryRaw<{ date: Date; count: number }[]>(
        Prisma.sql`
          SELECT DATE_TRUNC(${gran}, "createdAt") AS date,
                 COUNT(*)::int                   AS count
          FROM users
          WHERE role = 'CUSTOMER'
            AND "createdAt" >= ${from}
          GROUP BY 1
          ORDER BY 1
        `,
      ),

      // Top 8 products by revenue
      this.prisma.orderItem.groupBy({
        by: ['productId', 'productName'],
        where: { order: { createdAt: { gte: from } } },
        _sum: { totalPrice: true, quantity: true },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: 8,
      }),

      // Revenue by category
      this.prisma.$queryRaw<{ name: string; revenue: number }[]>(
        Prisma.sql`
          SELECT COALESCE(c.name, 'Uncategorized') AS name,
                 COALESCE(SUM(oi."totalPrice"), 0)::float AS revenue
          FROM order_items oi
          JOIN products p ON oi."productId" = p.id
          LEFT JOIN categories c ON p."categoryId" = c.id
          WHERE oi."orderId" IN (
            SELECT id FROM orders WHERE "createdAt" >= ${from}
          )
          GROUP BY COALESCE(c.name, 'Uncategorized')
          ORDER BY revenue DESC
          LIMIT 8
        `,
      ),

      // Payment method breakdown
      this.prisma.order.groupBy({
        by: ['paymentMethod'],
        where: { createdAt: { gte: from } },
        _count: { id: true },
        _sum: { total: true },
      }),

      // Orders by status
      this.prisma.order.groupBy({
        by: ['status'],
        where: { createdAt: { gte: from } },
        _count: { id: true },
      }),
    ]);

    const revenue = currAgg._sum.total ?? 0;
    const prevRevenue = prevAgg._sum.total ?? 0;
    const orders = currAgg._count.id;
    const prevOrders = prevAgg._count.id;
    const aov = orders > 0 ? Math.round((revenue / orders) * 100) / 100 : 0;
    const prevAov =
      prevOrders > 0 ? Math.round(((prevAgg._sum.total ?? 0) / prevOrders) * 100) / 100 : 0;

    return {
      period,
      kpis: {
        revenue,
        revenueChange: pct(revenue, prevRevenue),
        orders,
        ordersChange: pct(orders, prevOrders),
        aov,
        aovChange: pct(aov, prevAov),
        newCustomers: currCustomers,
        newCustomersChange: pct(currCustomers, prevCustomers),
      },
      revenueTrend: revenueTrend.map((r) => ({
        date: r.date.toISOString().split('T')[0],
        revenue: r.revenue,
      })),
      customerTrend: customerTrend.map((r) => ({
        date: r.date.toISOString().split('T')[0],
        count: r.count,
      })),
      topProducts: topProducts.map((p) => ({
        name: p.productName,
        revenue: p._sum.totalPrice ?? 0,
        quantity: p._sum.quantity ?? 0,
      })),
      categoryRevenue: categoryRevenue.map((c) => ({
        name: c.name,
        revenue: c.revenue,
      })),
      paymentMix: paymentMix.map((p) => ({
        method: p.paymentMethod,
        count: p._count.id,
        revenue: p._sum.total ?? 0,
      })),
      ordersByStatus: ordersByStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
    };
  }
}
