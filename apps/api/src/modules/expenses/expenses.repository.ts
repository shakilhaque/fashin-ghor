import { Injectable } from '@nestjs/common';
import { ExpenseCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExpensesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(opts: { page: number; limit: number; category?: ExpenseCategory; from?: Date; to?: Date }) {
    const where = {
      category: opts.category,
      date: {
        gte: opts.from,
        lte: opts.to,
      },
    };
    const skip = (opts.page - 1) * opts.limit;

    return Promise.all([
      this.prisma.expense.findMany({ where, skip, take: opts.limit, orderBy: { date: 'desc' } }),
      this.prisma.expense.count({ where }),
      this.prisma.expense.aggregate({ where, _sum: { amount: true } }),
    ]);
  }

  findById(id: string) {
    return this.prisma.expense.findUnique({ where: { id } });
  }

  create(data: {
    title: string;
    amount: number;
    category?: ExpenseCategory;
    description?: string;
    receiptUrl?: string;
    date?: Date;
    createdBy?: string;
  }) {
    return this.prisma.expense.create({ data });
  }

  update(id: string, data: {
    title?: string;
    amount?: number;
    category?: ExpenseCategory;
    description?: string | null;
    receiptUrl?: string | null;
    date?: Date;
  }) {
    return this.prisma.expense.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.expense.delete({ where: { id } });
  }

  monthlySummary() {
    return this.prisma.$queryRaw<{ month: string; total: number }[]>`
      SELECT
        TO_CHAR(date, 'YYYY-MM') AS month,
        SUM(amount)::float        AS total
      FROM expenses
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `;
  }
}
