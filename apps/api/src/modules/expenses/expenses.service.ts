import { Injectable, NotFoundException } from '@nestjs/common';
import { ExpenseCategory } from '@prisma/client';
import { ExpensesRepository } from './expenses.repository';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly repo: ExpensesRepository) {}

  async list(opts: {
    page?: number;
    limit?: number;
    category?: ExpenseCategory;
    from?: string;
    to?: string;
  }) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const [expenses, total, agg] = await this.repo.findAll({
      page,
      limit,
      category: opts.category,
      from: opts.from ? new Date(opts.from) : undefined,
      to: opts.to ? new Date(opts.to) : undefined,
    });
    return {
      expenses,
      total,
      totalAmount: agg._sum.amount ?? 0,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getByIdOrThrow(id: string) {
    const expense = await this.repo.findById(id);
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  create(dto: CreateExpenseDto, userId: string) {
    return this.repo.create({
      title: dto.title,
      amount: dto.amount,
      category: dto.category,
      description: dto.description,
      receiptUrl: dto.receiptUrl,
      date: dto.date ? new Date(dto.date) : undefined,
      createdBy: userId,
    });
  }

  async update(id: string, dto: UpdateExpenseDto) {
    await this.getByIdOrThrow(id);
    return this.repo.update(id, {
      title: dto.title,
      amount: dto.amount,
      category: dto.category,
      description: dto.description !== undefined ? (dto.description ?? null) : undefined,
      receiptUrl: dto.receiptUrl !== undefined ? (dto.receiptUrl ?? null) : undefined,
      date: dto.date ? new Date(dto.date) : undefined,
    });
  }

  async remove(id: string) {
    await this.getByIdOrThrow(id);
    await this.repo.delete(id);
  }

  monthlySummary() {
    return this.repo.monthlySummary();
  }
}
