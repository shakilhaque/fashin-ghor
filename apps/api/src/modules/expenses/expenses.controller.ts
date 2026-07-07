import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExpenseCategory, UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

const ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER] as const;

@ApiTags('Expenses')
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Roles(...ADMIN_ROLES)
  @Get()
  @ApiOperation({ summary: 'List expenses (admin)' })
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: ExpenseCategory,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const result = await this.expensesService.list({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      category,
      from,
      to,
    });
    return { message: 'Expenses retrieved', data: result };
  }

  @Roles(...ADMIN_ROLES)
  @Get('summary/monthly')
  @ApiOperation({ summary: 'Monthly expense summary (admin)' })
  async monthlySummary() {
    const summary = await this.expensesService.monthlySummary();
    return { message: 'Summary retrieved', data: { summary } };
  }

  @Roles(...ADMIN_ROLES)
  @Post()
  @ApiOperation({ summary: 'Create an expense (admin)' })
  async create(@Body() dto: CreateExpenseDto, @CurrentUser() user: AuthenticatedUser) {
    const expense = await this.expensesService.create(dto, user.id);
    return { message: 'Expense created', data: { expense } };
  }

  @Roles(...ADMIN_ROLES)
  @Patch(':id')
  @ApiOperation({ summary: 'Update an expense (admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    const expense = await this.expensesService.update(id, dto);
    return { message: 'Expense updated', data: { expense } };
  }

  @Roles(...ADMIN_ROLES)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an expense (admin)' })
  async remove(@Param('id') id: string) {
    await this.expensesService.remove(id);
    return { message: 'Expense deleted' };
  }
}
